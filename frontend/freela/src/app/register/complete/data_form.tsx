"use client";

import { useState } from "react";
import { ArrowRight, ChevronLeft } from "lucide-react";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  formatCnpj,
  formatCpf,
  isValidCnpj,
  isValidCpf,
} from "@/lib/documents";
import type { Role } from "./choose_role";
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

type DataFormProps = {
  selected: Role;
  data: OnboardingFormData;
  updateData: (data: Partial<OnboardingFormData>) => void;
  onPrev: () => void;
  onNext: () => void;
};

export default function DataForm({
  selected,
  onPrev,
  onNext,
  data,
  updateData,
}: DataFormProps) {
  const [primaryError, setPrimaryError] = useState("");
  const [documentError, setDocumentError] = useState("");

  const handleNext = () => {
    const primaryValue =
      selected === "publisher" ? data.companyName.trim() : data.firstName.trim();
    const documentValue = selected === "publisher" ? data.cnpj : data.cpf;

    if (!primaryValue) {
      setPrimaryError(
        selected === "publisher"
          ? "Razão social é obrigatória."
          : "Nome é obrigatório."
      );
      return;
    }

    setPrimaryError("");

    if (selected === "publisher") {
      if (!isValidCnpj(documentValue)) {
        setDocumentError("Informe um CNPJ válido.");
        return;
      }
    } else if (!isValidCpf(documentValue)) {
      setDocumentError("Informe um CPF válido.");
      return;
    }

    setDocumentError("");
    onNext();
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-lg space-y-8"
    >
      <motion.div variants={itemVariants} className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-950">
          {selected === "publisher" ? "Dados da Empresa" : "Dados Pessoais"}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Preencha as informacoes abaixo para continuar.
        </p>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <FieldGroup className="gap-4">
          <Field className="gap-2">
            <FieldLabel
              htmlFor="primary-name"
              className="text-sm font-medium text-slate-700"
            >
              {selected === "publisher" ? "Razao Social" : "Nome"}
            </FieldLabel>
            <Input
              id="primary-name"
              type="text"
              className="h-11 rounded-lg border-slate-300 px-4 text-sm shadow-none focus-visible:border-blue-600 focus-visible:ring-blue-100"
              placeholder={
                selected === "publisher" ? "Sua empresa LTDA" : "Joao da Silva"
              }
              required
              value={selected === "publisher" ? data.companyName : data.firstName}
              onChange={(e) => {
                setPrimaryError("");
                selected === "publisher"
                  ? updateData({ companyName: e.target.value })
                  : updateData({ firstName: e.target.value });
              }}
            />
            <FieldError>{primaryError}</FieldError>
          </Field>

          {selected === "freelancer" && (
            <Field className="gap-2">
              <FieldLabel
                htmlFor="last-name"
                className="text-sm font-medium text-slate-700"
              >
                Sobrenome
              </FieldLabel>
              <Input
                id="last-name"
                type="text"
                className="h-11 rounded-lg border-slate-300 px-4 text-sm shadow-none focus-visible:border-blue-600 focus-visible:ring-blue-100"
                placeholder="Sobrenome"
                value={data.lastName}
                onChange={(e) => {
                  updateData({ lastName: e.target.value });
                }}
                required
              />
            </Field>
          )}

          <Field className="gap-2">
            <FieldLabel
              htmlFor="document"
              className="text-sm font-medium text-slate-700"
            >
              {selected === "publisher" ? "CNPJ" : "CPF"}
            </FieldLabel>
            <Input
              id="document"
              type="text"
              className="h-11 rounded-lg border-slate-300 px-4 text-sm shadow-none focus-visible:border-blue-600 focus-visible:ring-blue-100"
              placeholder={
                selected === "publisher"
                  ? "00.000.000/0000-00"
                  : "000.000.000-00"
              }
              maxLength={selected === "publisher" ? 18 : 14}
              required
              value={selected === "publisher" ? data.cnpj : data.cpf}
              onChange={(e) => {
                setDocumentError("");
                selected === "publisher"
                  ? updateData({ cnpj: formatCnpj(e.target.value) })
                  : updateData({ cpf: formatCpf(e.target.value) });
              }}
            />
            <FieldError>{documentError}</FieldError>
          </Field>

          {selected === "freelancer" && (
            <Field className="gap-2">
              <FieldLabel
                htmlFor="primary-area"
                className="text-sm font-medium text-slate-700"
              >
                Área de Atuação Principal
              </FieldLabel>
              <select
                id="primary-area"
                className="h-11 w-full rounded-lg border border-slate-300 bg-transparent px-4 text-sm outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                value={data.primaryArea || "Desenvolvimento"}
                onChange={(e) => updateData({ primaryArea: e.target.value })}
              >
                <option>Desenvolvimento</option>
                <option>Design</option>
                <option>Marketing</option>
              </select>
              <FieldDescription className="text-xs text-slate-500">
                Escolha a area principal para personalizar suas oportunidades.
              </FieldDescription>
            </Field>
          )}
        </FieldGroup>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="flex items-center justify-between"
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
          className="rounded-full bg-blue-600 px-8 hover:bg-blue-700"
          onClick={handleNext}
        >
          Proximo
          <ArrowRight className="size-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
}
