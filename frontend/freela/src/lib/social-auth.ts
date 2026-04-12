export type SocialProvider = "google" | "github" | "linkedin_oauth2";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export function getBackendOrigin() {
  return API_BASE_URL.replace(/\/api\/?$/, "");
}

export function getSocialLoginUrl(provider: SocialProvider) {
  return `${getBackendOrigin()}/api/auth/social/${provider}/login/`;
}
