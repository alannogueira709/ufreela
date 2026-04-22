"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { FreelancerSkillsForm } from "@/components/onboarding/freelancer-skills-form";
import { useAuth } from "@/contexts/AuthContext";

export default function WelcomeFreelancerPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else if (user.role !== "freelancer") {
        router.push("/");
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== "freelancer") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="flex animate-pulse flex-col items-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-secondary border-t-transparent" />
          <p className="font-inter text-on_surface/70">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#f3f6fb_48%,#eef4ff_100%)] px-4 pb-16 pt-20 sm:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-white/70" />
      <div className="pointer-events-none absolute left-1/2 top-56 size-[28rem] -translate-x-1/2 rounded-full bg-blue-200/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 size-[30rem] translate-x-1/4 translate-y-1/4 rounded-full bg-blue-100/60 blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center">
        <div className="mb-12 max-w-3xl text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-blue-600">
            Welcome freelancer
          </p>
          <h1 className="font-manrope text-5xl font-extrabold tracking-tight text-slate-950 sm:text-6xl">
            Bem-vindo ao uFreela,
            <span className="block text-blue-600">{user.email.split("@")[0]}</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl font-inter text-base leading-7 text-slate-500 sm:text-lg">
            Para começarmos a sugerir projetos mais aderentes ao seu perfil,
            selecione as ferramentas que você domina e organize sua experiência em uma etapa rápida.
          </p>
        </div>

        <div className="relative w-full max-w-4xl">
          <div className="absolute inset-x-10 top-8 h-full rounded-[2.25rem] bg-blue-200/20 blur-3xl" />
          <div className="relative rounded-[2.5rem] border border-white/70 bg-white/65 p-3 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:p-4">
            <FreelancerSkillsForm />
          </div>
        </div>
      </div>
    </div>
  );
}
