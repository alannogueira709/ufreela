"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { OtpCodeField } from "@/components/auth/otp-code-field";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/api-errors";
import {
  confirmEmailVerification,
  requestEmailVerification,
} from "@/lib/auth-service";

export function EmailVerificationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(() => searchParams.get("email") ?? "");
  const [code, setCode] = useState("");
  const [isCodeStep, setIsCodeStep] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setResendCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!isCodeStep) {
      try {
        setIsSubmitting(true);
        const result = await requestEmailVerification(email);
        setSuccess(result.message);
        setIsCodeStep(true);
        setResendCooldown(60);
      } catch (error) {
        setError(
          getApiErrorMessage(
            error,
            "Não foi possível enviar o código. Tente novamente mais tarde."
          )
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (code.length !== 6) {
      setError("Informe o código de 6 dígitos recebido por email.");
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await confirmEmailVerification({ email, code });
      setSuccess(result.message);
      window.setTimeout(() => router.push("/login"), 1200);
    } catch (error) {
      setError(
        getApiErrorMessage(
          error,
          "Não foi possível confirmar seu email. Verifique o código e tente novamente."
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      setIsSubmitting(true);
      const result = await requestEmailVerification(email);
      setSuccess(result.message);
      setResendCooldown(60);
    } catch (error) {
      setError(
        getApiErrorMessage(
          error,
          "Não foi possível reenviar o código. Tente novamente mais tarde."
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <FieldGroup className="gap-5">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            {isCodeStep ? "Confirme seu email" : "Confirmação de email"}
          </h1>
          <p className="text-sm leading-6 text-slate-500">
            {isCodeStep
              ? `Enviamos um código de 6 dígitos para ${email}.`
              : "Informe seu email para receber um novo código de confirmação."}
          </p>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}

        {!isCodeStep ? (
          <Field className="gap-2">
            <FieldLabel
              htmlFor="verification-email"
              className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400"
            >
              E-mail
            </FieldLabel>
            <Input
              id="verification-email"
              type="email"
              required
              placeholder="name@company.com"
              className="h-12 rounded-xl border-slate-200 bg-white px-4 text-sm shadow-none placeholder:text-slate-400"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
        ) : (
          <Field className="items-center gap-3">
            <FieldLabel className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Código de confirmação
            </FieldLabel>
            <OtpCodeField
              value={code}
              onChange={setCode}
              disabled={isSubmitting}
            />
            <FieldDescription className="text-center text-xs leading-5 text-slate-400">
              O código expira em 15 minutos.
            </FieldDescription>
          </Field>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-12 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {isSubmitting
            ? isCodeStep
              ? "Confirmando..."
              : "Enviando..."
            : isCodeStep
              ? "Confirmar email"
              : "Enviar código"}
        </Button>

        {isCodeStep ? (
          <button
            type="button"
            onClick={() => void handleResend()}
            disabled={isSubmitting || resendCooldown > 0}
            className="text-sm font-semibold text-blue-600 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            {resendCooldown > 0
              ? `Reenviar código em ${resendCooldown}s`
              : "Reenviar código"}
          </button>
        ) : null}

        <FieldDescription className="text-center text-sm text-slate-500">
          <Link
            href="/login"
            className="font-semibold text-blue-600 underline-offset-4 transition-colors hover:text-blue-700 hover:underline"
          >
            Voltar para login
          </Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
