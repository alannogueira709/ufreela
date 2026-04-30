import type { Role } from "./choose_role";

export type OnboardingFormData = {
  role: Exclude<Role, null> | "";
  firstName: string;
  lastName: string;
  companyName: string;
  cnpj: string;
  cpf: string;
  primaryArea: string;
  profileImage: File | null;
  profileTitle: string;
  profileDescription: string;
};
