"use client";

import { Check, ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

type UploadProfileProps = {
  onPrev: () => void;
};

export default function UploadProfile({ onPrev }: UploadProfileProps) {
  return (
    <div className="w-full max-w-lg space-y-6 text-center">
      <h2 className="text-3xl font-bold tracking-tight text-slate-950">
        Monte seu Perfil
      </h2>
      <p className="text-slate-500">Adicione uma foto e uma bio.</p>

      <div className="flex h-40 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400">
        Arraste sua foto aqui
      </div>

      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={onPrev}
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-6 text-sm font-medium text-slate-700 transition-all hover:bg-slate-100 hover:text-slate-950"
        >
          <ChevronLeft className="size-4" />
          Voltar
        </button>
        <Button className="rounded-full bg-blue-600 px-8 hover:bg-blue-700">
          Finalizar Cadastro
          <Check className="ml-1 size-4" />
        </Button>
      </div>
    </div>
  );
}
