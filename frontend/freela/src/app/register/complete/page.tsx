"use client";

import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";

import ChooseRole, { type Role } from "./choose_role";
import DataForm from "./data_form";
import UploadProfile from "./upload_profile";
import { cn } from "@/lib/utils";

const steps = [
  { id: 1, label: "Cargo" },
  { id: 2, label: "Identidade" },
  { id: 3, label: "Seu Perfil" },
];

export default function RegisterCompletePage() {
  const [selected, setSelected] = useState<Role>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const handleNextStep = () => {
    if (!selected) return;

    if (currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className=" sticky top-0 z-50 border-b border-transparent bg-white/25 backdrop-blur-xl
      
      ">
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

      <main className="flex flex-1 flex-col items-center gap-12 px-6 py-14">
        <div className="flex w-full max-w-sm items-center">
          {steps.map((step, index) => {
            const isActive = step.id === currentStep;
            const isDone = step.id < currentStep;
            const isLast = index === steps.length - 1;

            return (
              <div key={step.id} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={cn(
                      "flex size-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-all",
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
                      "text-[11px] font-semibold uppercase tracking-widest",
                      isActive && "text-blue-600",
                      isDone && "text-emerald-500",
                      !isActive && !isDone && "text-slate-400"
                    )}
                  >
                    {step.label}
                  </span>
                </div>

                {!isLast && (
                  <div
                    className={cn(
                      "mb-7 h-px flex-1",
                      isDone ? "bg-emerald-400" : "bg-slate-200"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {currentStep === 1 && (
          <ChooseRole
            selected={selected}
            onSelect={setSelected}
            onNext={handleNextStep}
          />
        )}

        {currentStep === 2 && (
          <DataForm
            selected={selected}
            onPrev={handlePrevStep}
            onNext={() => setCurrentStep(3)}
          />
        )}

        {currentStep === 3 && <UploadProfile onPrev={handlePrevStep} />}
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
