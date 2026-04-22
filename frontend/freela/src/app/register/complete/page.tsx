"use client";

import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import ChooseRole, { type Role } from "./choose_role";
import DataForm from "./data_form";
import UploadProfile from "./upload_profile";
import type { OnboardingFormData } from "./types";
import {
  completeRegistration,
  getCurrentUser,
} from "@/lib/auth-service";
import { getApiErrorMessage } from "@/lib/api-errors";
import { cn } from "@/lib/utils";

const steps = [
  { id: 1, label: "Cargo" },
  { id: 2, label: "Dados Pessoais" },
  { id: 3, label: "Seu Perfil" },
];

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 240 : -240,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 240 : -240,
    opacity: 0,
  }),
};

export default function RegisterCompletePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Role>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [formData, setFormData] = useState<OnboardingFormData>({
    role: "",
    firstName: "",
    lastName: "",
    companyName: "",
    cnpj: "",
    cpf: "",
    primaryArea: "Desenvolvimento",
    profileImage: null,
    profileTitle: "",
    profileDescription: "",
  });

  const updateFormData = (newData: Partial<OnboardingFormData>) => {
    setFormData((prev) => ({ ...prev, ...newData }));
  };

  const isChooseRoleStep = currentStep === 1;

  const handleNextStep = () => {
    if (!selected) return;

    if (currentStep < steps.length) {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    }
  };

  async function handleFinishOnboarding() {
    try {
      setIsSubmitting(true);
      setSubmitError("");

      const selectedRole = formData.role || selected || "";

      if (!selectedRole) {
        throw new Error("Selecione um cargo antes de finalizar o cadastro.");
      }

      await completeRegistration({
        role_id: selectedRole,
        first_name: formData.firstName,
        last_name: formData.lastName,
        company_name: formData.companyName,
        cnpj: formData.cnpj,
        cpf: formData.cpf,
        primary_area: formData.primaryArea,
        profile_title: formData.profileTitle,
        profile_description: formData.profileDescription,
        ...(formData.profileImage
          ? { profile_image: formData.profileImage }
          : {}),
      });

      const currentUser = await getCurrentUser();
      queryClient.setQueryData(["auth", "user"], currentUser);

      if (selectedRole === "freelancer") {
        router.push("/welcome/freelancer");
      } else {
        router.push(`/profile/publisher/${currentUser.id}`);
      }
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(error, "Nao foi possivel finalizar o cadastro.", [
          "error",
          "detail",
          "cpf",
          "cnpj",
          "first_name",
          "company_name",
          "message",
        ])
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-slate-50">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-transparent bg-white/25 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-slate-950"
          >
            uFreela<span className="text-blue-600">.</span>
          </Link>

          <nav className="flex items-center gap-3 sm:gap-6">
            <Link
              href="/about"
              className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
            >
              Como funciona
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all duration-300 ease-in-out hover:bg-blue-800"
            >
              Entrar
            </Link>
          </nav>
        </div>
      </header>

      <main
        className={cn(
          "flex flex-1 flex-col items-center px-6 pb-14 pt-24",
          isChooseRoleStep ? "justify-center" : "justify-start"
        )}
      >
        <div
          className={cn(
            "flex w-full flex-col items-center",
            isChooseRoleStep
              ? "min-h-[calc(100svh-9.5rem)] justify-center gap-12"
              : "gap-12"
          )}
        >
          <div className="relative w-full max-w-md">
            <div className="absolute left-0 right-0 top-5 grid grid-cols-[auto_1fr_auto_1fr_auto] items-center gap-x-4">
              <div />
              <div
                className={cn(
                  "h-px w-full",
                  currentStep > 1 ? "bg-emerald-400" : "bg-slate-200"
                )}
              />
              <div />
              <div
                className={cn(
                  "h-px w-full",
                  currentStep > 2 ? "bg-emerald-400" : "bg-slate-200"
                )}
              />
              <div />
            </div>

            <div className="grid grid-cols-3 items-start gap-x-6">
              {steps.map((step) => {
                const isActive = step.id === currentStep;
                const isDone = step.id < currentStep;

                return (
                  <div
                    key={step.id}
                    className="flex min-w-0 flex-col items-center gap-2"
                  >
                    <div
                      className={cn(
                        "relative z-10 flex size-10 items-center justify-center rounded-full border-2 bg-slate-50 text-sm font-bold transition-all",
                        isActive &&
                          "border-blue-600 bg-blue-600 text-white shadow-[0_8px_20px_-6px_rgba(37,99,235,.55)]",
                        isDone &&
                          "border-emerald-500 bg-emerald-500 text-white",
                        !isActive &&
                          !isDone &&
                          "border-slate-200 bg-white text-slate-400"
                      )}
                    >
                      {isDone ? <Check className="size-4" /> : step.id}
                    </div>
                    <span
                      className={cn(
                        "text-center text-[11px] font-semibold uppercase tracking-widest",
                        isActive && "text-blue-600",
                        isDone && "text-emerald-500",
                        !isActive && !isDone && "text-slate-400"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <AnimatePresence mode="wait" custom={direction}>
            {currentStep === 1 && (
              <motion.div
                key="step-choose-role"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="flex w-full flex-col items-center gap-12"
              >
                <ChooseRole
                  updateData={updateFormData}
                  selected={selected}
                  onSelect={setSelected}
                  onNext={handleNextStep}
                />
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step-data-form"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="flex w-full justify-center"
              >
                <DataForm
                  selected={selected}
                  data={formData}
                  updateData={updateFormData}
                  onPrev={handlePrevStep}
                  onNext={() => {
                    setDirection(1);
                    setCurrentStep(3);
                  }}
                />
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step-upload-profile"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="flex w-full justify-center"
              >
                <UploadProfile
                  data={formData}
                  updateData={updateFormData}
                  onPrev={handlePrevStep}
                  onSubmit={handleFinishOnboarding}
                  isSubmitting={isSubmitting}
                  error={submitError}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex min-h-14 max-w-6xl items-center justify-center px-6 py-4">
          <span className="text-center text-xs text-slate-400">
            © 2026 uFreela. Todos os direitos reservados.
          </span>
        </div>
      </footer>
    </div>
  );
}
