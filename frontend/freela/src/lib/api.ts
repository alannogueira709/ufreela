import axios, {
  AxiosError,
  type AxiosHeaders,
  type AxiosRequestConfig,
} from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const CSRF_COOKIE_NAME = "csrftoken";
const CSRF_HEADER_NAME = "X-CSRFToken";
const MUTATING_METHODS = new Set(["post", "put", "patch", "delete"]);

let csrfBootstrapPromise: Promise<string> | null = null;

function hasCsrfFailure(error: AxiosError) {
  const payload = error.response?.data;

  if (typeof payload === "string") {
    return payload.includes("CSRF");
  }

  if (payload && typeof payload === "object") {
    for (const value of Object.values(payload as Record<string, unknown>)) {
      if (typeof value === "string" && value.includes("CSRF")) {
        return true;
      }
    }
  }

  return false;
}

function getCookie(name: string) {
  if (typeof document === "undefined") {
    return "";
  }

  const cookies = document.cookie.split("; ");

  for (const cookie of cookies) {
    if (cookie.startsWith(`${name}=`)) {
      return decodeURIComponent(cookie.slice(name.length + 1));
    }
  }

  return "";
}

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== "undefined" && value instanceof FormData;
}

function setRequestHeader(
  config: AxiosRequestConfig,
  headerName: string,
  value: string
) {
  if (!config.headers) {
    config.headers = {};
  }

  if (typeof (config.headers as AxiosHeaders).set === "function") {
    (config.headers as AxiosHeaders).set(headerName, value);
    return;
  }

  (config.headers as Record<string, string>)[headerName] = value;
}

export function getCsrfToken() {
  return getCookie(CSRF_COOKIE_NAME);
}

export async function ensureCsrfToken(forceRefresh = false) {
  const existingToken = getCsrfToken();

  if (existingToken && !forceRefresh) {
    return existingToken;
  }

  if (!csrfBootstrapPromise || forceRefresh) {
    csrfBootstrapPromise = axios
      .get<{ message: string }>(`${API_BASE_URL}/auth/csrf/`, {
        withCredentials: true,
      })
      .then(() => getCsrfToken())
      .finally(() => {
        csrfBootstrapPromise = null;
      });
  }

  return csrfBootstrapPromise;
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use(async (config) => {
  const method = config.method?.toLowerCase();
  const isMutatingRequest = method ? MUTATING_METHODS.has(method) : false;

  if (isMutatingRequest) {
    const csrfToken = await ensureCsrfToken();

    if (csrfToken) {
      setRequestHeader(config, CSRF_HEADER_NAME, csrfToken);
    }
  }

  if (!isFormData(config.data)) {
    setRequestHeader(config, "Content-Type", "application/json");
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (
      error.response?.status === 403 &&
      !(originalRequest as AxiosRequestConfig & { _csrfRetry?: boolean })._csrfRetry &&
      hasCsrfFailure(error)
    ) {
      (originalRequest as AxiosRequestConfig & { _csrfRetry?: boolean })._csrfRetry = true;
      await ensureCsrfToken(true);
      return api(originalRequest);
    }

    if (
      error.response?.status === 401 &&
      !(originalRequest as AxiosRequestConfig & { _retry?: boolean })._retry
    ) {
      (originalRequest as AxiosRequestConfig & { _retry?: boolean })._retry = true;

      try {
        const csrfToken = await ensureCsrfToken();

        await axios.post(
          `${API_BASE_URL}/auth/token/refresh/`,
          {},
          {
            withCredentials: true,
            headers: csrfToken
              ? {
                  [CSRF_HEADER_NAME]: csrfToken,
                }
              : undefined,
          }
        );

        return api(originalRequest);
      } catch (refreshError) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("unauthorized"));
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
