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

  // Header que indica requisicao AJAX. O backend exige esse header em
  // requisicoes mutating como protecao adicional contra CSRF.
  setRequestHeader(config, "X-Requested-With", "XMLHttpRequest");

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

export const chatApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

chatApi.interceptors.request.use(async (config) => {
  const method = config.method?.toLowerCase();
  const isMutatingRequest = method ? MUTATING_METHODS.has(method) : false;

  setRequestHeader(config, "X-Requested-With", "XMLHttpRequest");

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

export const chatService = {
  getConversations: () => chatApi.get("/chat/conversations/"),
  getMessages: (conversationId: number) =>
    chatApi.get(`/chat/conversations/${conversationId}/messages/`),
  uploadAttachment: (conversationId: number, file: File, content = "") => {
    const formData = new FormData();
    formData.append("file", file);
    if (content) {
      formData.append("content", content);
    }

    return chatApi.post(
      `/chat/conversations/${conversationId}/attachments/`,
      formData
    );
  },
  createConversation: (otherUserId: string | number) =>
    chatApi.post("/chat/conversations/", { other_user: otherUserId }),
  markAsRead: (conversationId: number) =>
    chatApi.patch(`/chat/conversations/${conversationId}/read/`),
};

export const getChatAttachmentUrl = (messageId: number) =>
  `${API_BASE_URL}/chat/messages/${messageId}/attachment/`;

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: unknown = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
}

const AUTH_EXCLUDED_URLS = [
  "/auth/token/refresh/",
  "/auth/csrf/",
  "/auth/login/",
  "/auth/me/",
  "/auth/social/",
];

function isAuthExcludedUrl(url?: string): boolean {
  if (!url) return false;
  return AUTH_EXCLUDED_URLS.some((endpoint) => url.includes(endpoint));
}

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
      !isAuthExcludedUrl(originalRequest.url) &&
      !(originalRequest as AxiosRequestConfig & { _retry?: boolean })._retry
    ) {
      (originalRequest as AxiosRequestConfig & { _retry?: boolean })._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        const csrfToken = await ensureCsrfToken();

        await axios.post(
          `${API_BASE_URL}/auth/token/refresh/`,
          {},
          {
            withCredentials: true,
            headers: {
              "X-Requested-With": "XMLHttpRequest",
              ...(csrfToken ? { [CSRF_HEADER_NAME]: csrfToken } : {}),
            },
          }
        );

        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("unauthorized"));
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
