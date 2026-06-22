export type SocialProvider = "google" | "github" | "linkedin_oauth2";
// allauth headless provider/redirect only accepts "login" or "connect".
// Social signup is handled automatically when using "login" and the account
// does not yet exist.
export type SocialAuthProcess = "login" | "connect";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

function getBackendOrigin() {
  return API_BASE_URL.replace(/\/api\/?$/, "");
}

function getFrontendOrigin() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://localhost:3000";
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

async function ensureCsrfCookie(): Promise<string | null> {
  const token = getCookie("csrftoken");
  if (token) return token;

  await fetch(`${getBackendOrigin()}/api/auth/csrf/`, {
    method: "GET",
    credentials: "include",
  });

  return getCookie("csrftoken");
}

export async function initiateSocialLogin(
  provider: SocialProvider,
  process: SocialAuthProcess = "login"
) {
  const csrfToken = await ensureCsrfCookie();
  if (!csrfToken) {
    throw new Error("Não foi possível obter o token CSRF.");
  }

  const callbackUrl = `${getFrontendOrigin()}/auth/social/callback`;

  // allauth headless only accepts "login" or "connect" as the process value.
  // Treat any other value (e.g. a legacy "signup") as "login" so that new
  // users are automatically signed up.
  const normalizedProcess = process === "connect" ? "connect" : "login";

  const form = document.createElement("form");
  form.method = "POST";
  form.action = `${getBackendOrigin()}/api/_allauth/browser/v1/auth/provider/redirect`;
  form.style.display = "none";

  const addField = (name: string, value: string) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  };

  addField("provider", provider);
  addField("callback_url", callbackUrl);
  addField("process", normalizedProcess);
  addField("csrfmiddlewaretoken", csrfToken);

  document.body.appendChild(form);
  form.submit();
}
