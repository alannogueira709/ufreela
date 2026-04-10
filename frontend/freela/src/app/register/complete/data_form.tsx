"use client";

import { ArrowRight, ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Role } from "./choose_role";

type DataFormProps = {
  selected: Role;
  onPrev: () => void;
  onNext: () => void;
};

export default function DataForm({
  selected,
  onPrev,
  onNext,
}: DataFormProps) {
  return (
    <div className="w-full max-w-lg space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-950">
          {selected === "publisher" ? "Dados da Empresa" : "Dados Pessoais"}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Preencha as informações abaixo para continuar.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            {selected === "publisher" ? "Razão Social" : "Nome Completo"}
          </label>
          <input
            type="text"
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            placeholder={
              selected === "publisher" ? "Sua empresa LTDA" : "Joao da Silva"
            }
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            {selected === "publisher" ? "CNPJ" : "CPF"}
          </label>
          <input
            type="text"
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            placeholder="00.000.000/0000-00"
          />
        </div>

        {selected === "freelancer" && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Area de Atuacao Principal
            </label>
            <select className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-100">
              <option>Desenvolvimento</option>
              <option>Design</option>
              <option>Marketing</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onPrev}
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-6 text-sm font-medium text-slate-700 transition-all hover:bg-slate-100 hover:text-slate-950"
        >
          <ChevronLeft className="size-4" />
          Voltar
        </button>
        <Button
          className="rounded-full bg-blue-600 px-8 hover:bg-blue-700"
          onClick={onNext}
        >
          Proximo
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
