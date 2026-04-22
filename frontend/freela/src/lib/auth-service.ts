import { api } from "@/lib/api";
import type { UserRole } from "@/types/nav";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
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
