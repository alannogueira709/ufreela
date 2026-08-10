import { api } from "@/lib/api";
import type { UserRole } from "@/types/nav";

export interface AuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  role: UserRole;
  profile_img: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  confirm_password: string;
}

export interface CompleteRegistrationPayload {
  role_id: string;
  first_name: string;
  last_name: string;
  company_name: string;
  cnpj: string;
  cpf: string;
  primary_area: string;
  profile_title: string;
  profile_description: string;
  profile_image?: File;
}

export interface PasswordResetRequestPayload {
  email: string;
}

export interface PasswordResetConfirmPayload {
  email: string;
  code: string;
  new_password: string;
}

export interface LegacyPasswordResetConfirmPayload {
  uidb64: string;
  token: string;
  new_password: string;
}

export interface EmailVerificationPayload {
  email: string;
  code: string;
}

export async function getCurrentUser() {
  const response = await api.get<AuthUser>("/auth/me/");
  return response.data;
}

export async function login(payload: LoginPayload) {
  await api.post("/auth/login/", payload);
}

export async function register(payload: RegisterPayload) {
  await api.post("/auth/register/", payload);
}

export async function requestEmailVerification(email: string) {
  const response = await api.post<{ message: string }>(
    "/auth/email/verify/request/",
    { email }
  );
  return response.data;
}

export async function confirmEmailVerification(payload: EmailVerificationPayload) {
  const response = await api.post<{ message: string }>(
    "/auth/email/verify/confirm/",
    payload
  );
  return response.data;
}

export async function logout() {
  await api.post("/auth/logout/");
}

export async function completeRegistration(payload: CompleteRegistrationPayload) {
  const formData = new FormData();

  formData.append("role_id", payload.role_id);
  formData.append("first_name", payload.first_name);
  formData.append("last_name", payload.last_name);
  formData.append("company_name", payload.company_name);
  formData.append("cnpj", payload.cnpj);
  formData.append("cpf", payload.cpf);
  formData.append("primary_area", payload.primary_area);
  formData.append("profile_title", payload.profile_title);
  formData.append("profile_description", payload.profile_description);

  if (payload.profile_image) {
    formData.append("profile_image", payload.profile_image);
  }

  await api.post("/auth/register/complete/", formData);
}

export async function requestPasswordReset(payload: PasswordResetRequestPayload) {
  const response = await api.post<{ message: string }>(
    "/auth/password/reset/",
    payload
  );
  return response.data;
}

export async function confirmPasswordReset(payload: PasswordResetConfirmPayload) {
  const response = await api.post<{ message: string }>(
    "/auth/password/reset/confirm/",
    payload
  );
  return response.data;
}

export async function confirmLegacyPasswordReset(
  payload: LegacyPasswordResetConfirmPayload
) {
  const response = await api.post<{ message: string }>(
    "/auth/password/reset/confirm/",
    payload
  );
  return response.data;
}
