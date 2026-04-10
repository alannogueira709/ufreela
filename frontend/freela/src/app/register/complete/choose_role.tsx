"use client";

import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, ChevronLeft, CircleUserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type Role = "publisher" | "freelancer" | null;

const roleOptions = [
  {
    id: "publisher" as const,
    title: "Sou empreendedor",
    description:
      "Publique oportunidades, receba propostas e conduza projetos com mais controle.",
    icon: BriefcaseBusiness,
    cta: "Continuar como empreendedor",
  },
  {
    id: "freelancer" as const,
    title: "Sou freelancer",
    description:
      "Monte seu perfil, destaque suas skills e encontre projetos alinhados com sua pretensao.",
    icon: CircleUserRound,
    cta: "Continuar como freelancer",
  },
];

type ChooseRoleProps = {
  selected: Role;
  onSelect: (role: Exclude<Role, null>) => void;
  onNext: () => void;
};

export default function ChooseRole({
  selected,
  onSelect,
  onNext,
}: ChooseRoleProps) {
  return (
    <>
      <div className="max-w-lg text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          Bem vindo ao uFreela!
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-500 sm:text-base">
          Queremos conhecer mais de voce para criar uma experiencia
          personalizada. Escolha a opcao que melhor descreve o seu perfil.
        </p>
      </div>

      <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
        {roleOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selected === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className={cn(
                "group relative flex flex-col rounded-2xl border-2 bg-white p-7 text-left transition-all duration-300",
                "hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_20px_48px_-24px_rgba(37,99,235,.22)]",
                isSelected
                  ? "border-blue-600 shadow-[0_20px_48px_-24px_rgba(37,99,235,.35)]"
                  : "border-slate-200"
              )}
            >
              {isSelected && (
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-blue-50/60" />
              )}
              <div className="relative flex flex-col gap-7">
                <div className="flex items-start justify-between">
                  <div
                    className={cn(
                      "flex size-14 items-center justify-center rounded-xl border transition-all",
                      isSelected
                        ? "border-blue-100 bg-blue-50 text-blue-600"
                        : "border-slate-200 bg-slate-50 text-slate-500 group-hover:border-blue-100 group-hover:bg-blue-50 group-hover:text-blue-600"
                    )}
                  >
                    <Icon className="size-6" />
                  </div>
                  <div
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full border-2 transition-all",
                      isSelected
                        ? "border-blue-600 bg-blue-600"
                        : "border-slate-300 bg-white"
                    )}
                  >
                    {isSelected && <div className="size-2 rounded-full bg-white" />}
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold tracking-tight text-slate-950">
                    {option.title}
                  </h3>
                  <p className="text-sm leading-6 text-slate-500">
                    {option.description}
                  </p>
                </div>
                <div
                  className={cn(
                    "inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition-all",
                    "group-hover:gap-3",
                    isSelected && "gap-3"
                  )}
                >
                  <span>{option.cta}</span>
                  <ArrowRight className="size-4" />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4">
        <Link
          href="/register"
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-6 text-sm font-medium text-slate-700 transition-all hover:bg-slate-100 hover:text-slate-950"
        >
          <ChevronLeft className="size-4" />
          Voltar
        </Link>
        <Button
          className="rounded-full bg-blue-600 px-8 hover:bg-blue-700"
          disabled={!selected}
          onClick={onNext}
        >
          Vamos la!
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </>
  );
}
