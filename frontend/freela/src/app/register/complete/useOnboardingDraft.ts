"use client";

import { useFormDraft } from "@/lib/hooks/useFormDraft";
import type { OnboardingFormData } from "./types";

/**
 * Wrapper do hook generico useFormDraft para o formulario de onboarding.
 * Mantem a chave e opcoes especificas do onboarding para que page.tsx
 * nao precise repetir configuracao. Aceita o generic para retrocompatibilidade
 * com a assinatura anterior.
 */
export function useOnboardingDraft<T extends OnboardingFormData = OnboardingFormData>(
  initial: T,
) {
  return useFormDraft<T>({
    key: "ufreela:onboarding-draft",
    initial,
    omit: ["profileImage"], // File nao e serializavel
  });
}