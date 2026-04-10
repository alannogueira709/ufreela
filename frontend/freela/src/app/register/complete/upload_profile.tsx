"use client";

import { Check, ChevronLeft, ImagePlus } from "lucide-react";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { OnboardingFormData } from "./types";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: "easeOut" },
  },
};

type UploadProfileProps = {
  data: OnboardingFormData;
  updateData: (data: Partial<OnboardingFormData>) => void;
  onPrev: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
};

export default function UploadProfile({
  onPrev,
  data,
  updateData,
  onSubmit,
  isSubmitting,
}: UploadProfileProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-lg space-y-6 text-center"
    >
      <motion.h2
        variants={itemVariants}
        className="text-3xl font-bold tracking-tight text-slate-950"
      >
        Monte seu Perfil
      </motion.h2>
      <motion.p variants={itemVariants} className="text-slate-500">
        Adicione uma foto e uma bio.
      </motion.p>

      <motion.div
        variants={itemVariants}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <FieldGroup className="gap-5">
          <Field className="gap-2">
            <FieldLabel
              htmlFor="profile-image"
              className="text-sm font-medium text-slate-700"
            >
              Foto de Perfil
            </FieldLabel>
            <label
              htmlFor="profile-image"
              className="flex h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 text-slate-400 transition-colors hover:border-blue-300 hover:bg-blue-50/50"
            >
              <ImagePlus className="size-8 text-slate-400" />
              <span className="text-base">Arraste sua foto aqui</span>
              <span className="text-xs text-slate-500">
                ou clique para selecionar um arquivo
              </span>
            </label>
            <Input
              id="profile-image"
              type="file"
              className="sr-only"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  updateData({ profileImage: e.target.files[0] });
                }
              }}
            />
          </Field>

          <Field className="gap-2">
            <FieldLabel
              htmlFor="profile-title"
              className="text-sm font-medium text-slate-700"
            >
              Titulo Profissional
            </FieldLabel>
            <Input
              id="profile-title"
              type="text"
              className="h-11 rounded-lg border-slate-300 px-4 text-sm shadow-none focus-visible:border-blue-600 focus-visible:ring-blue-100"
              placeholder="Ex: Desenvolvedor Frontend Freelancer"
              value={data.profileTitle}
              onChange={(e) => updateData({ profileTitle: e.target.value })}
            />
          </Field>

          <Field className="gap-2">
            <FieldLabel
              htmlFor="profile-bio"
              className="text-sm font-medium text-slate-700"
            >
              Bio
            </FieldLabel>
            <textarea
              id="profile-bio"
              rows={4}
              className="w-full rounded-lg border border-slate-300 bg-transparent px-4 py-3 text-sm outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              placeholder="Escreva um resumo curto sobre voce, sua experiencia e no que voce se destaca."
              value={data.profileDescription}
              onChange={(e) =>
                updateData({ profileDescription: e.target.value })
              }
            />
            <FieldDescription className="text-xs text-slate-500">
              Uma descricao curta ajuda seu perfil a parecer mais completo.
            </FieldDescription>
          </Field>
        </FieldGroup>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="flex items-center justify-between pt-4"
      >
        <button
          type="button"
          onClick={onPrev}
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-6 text-sm font-medium text-slate-700 transition-all hover:bg-slate-100 hover:text-slate-950"
        >
          <ChevronLeft className="size-4" />
          Voltar
        </button>
        <Button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="rounded-full bg-blue-600 px-8 hover:bg-blue-700"
        >
          {isSubmitting ? "Finalizando..." : "Finalizar Cadastro"}
          <Check className="ml-1 size-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
}
