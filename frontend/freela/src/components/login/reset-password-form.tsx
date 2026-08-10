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
  confirmLegacyPasswordReset,
  confirmPasswordReset,
  requestPasswordReset,
} from "@/lib/auth-service";
import { cn } from "@/lib/utils";

const PASSWORD_HINT =
  "Use no minimo 8 caracteres, com 1 letra maiuscula, 1 minuscula e 1 caractere especial (!, @, #, $, %, ^, &, *).";

function isStrongPassword(password: string) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uidb64 = searchParams.get("uidb64");
  const token = searchParams.get("token");
  const isLegacyConfirming = Boolean(uidb64 && token);

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"request" | "code">("request");
  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: "",
  });
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

    if (!isLegacyConfirming && step === "request") {
      try {
        setIsSubmitting(true);
        const result = await requestPasswordReset({ email });
        setSuccess(result.message);
        setStep("code");
        setResendCooldown(60);
      } catch (error) {
        setError(
          getApiErrorMessage(
            error,
            "Erro ao enviar código de recuperação. Tente novamente mais tarde."
          )
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!isStrongPassword(passwords.newPassword)) {
      setError(PASSWORD_HINT);
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError("As senhas não coincidem. Por favor, tente novamente.");
      return;
    }

    if (!isLegacyConfirming && code.length !== 6) {
      setError("Informe o código de 6 dígitos recebido por email.");
      return;
    }

    try {
      setIsSubmitting(true);

      const result = isLegacyConfirming
        ? await confirmLegacyPasswordReset({
            uidb64: uidb64 ?? "",
            token: token ?? "",
            new_password: passwords.newPassword,
          })
        : await confirmPasswordReset({
            email,
            code,
            new_password: passwords.newPassword,
          });

      setSuccess(result.message);
      window.setTimeout(() => router.push("/login"), 1800);
    } catch (error) {
      setError(
        getApiErrorMessage(
          error,
          isLegacyConfirming
            ? "Não foi possível redefinir sua senha. Solicite um novo link."
            : "Não foi possível redefinir sua senha. Verifique o código e tente novamente."
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendCode() {
    if (resendCooldown > 0 || isLegacyConfirming) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      setIsSubmitting(true);
      const result = await requestPasswordReset({ email });
      setSuccess(result.message);
      setResendCooldown(60);
    } catch (error) {
      setError(
        getApiErrorMessage(
          error,
          "Não foi possível reenviar o código. Tente novamente em instantes."
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const isCodeStep = !isLegacyConfirming && step === "code";
  const isConfirming = isLegacyConfirming || isCodeStep;

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <FieldGroup className="gap-5">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-slate-950">
            {isConfirming ? "Crie uma nova senha" : "Recupere sua senha"}
          </h2>
          <p className="text-sm leading-6 text-slate-500">
            {isLegacyConfirming
              ? "Informe uma senha segura para voltar a acessar sua conta."
              : isCodeStep
                ? `Informe o código enviado para ${email} e escolha uma nova senha.`
                : "Digite seu e-mail e enviaremos um código para redefinir sua senha."}
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

        {!isConfirming ? (
          <Field className="gap-2">
            <FieldLabel
              htmlFor="email"
              className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400"
            >
              E-mail
            </FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              required
              className="h-12 rounded-xl border-slate-200 bg-white px-4 text-sm shadow-none placeholder:text-slate-400"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
        ) : null}

        {isCodeStep ? (
          <Field className="items-center gap-3">
            <FieldLabel className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Código de recuperação
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
        ) : null}

        {isConfirming ? (
          <>
            <Field className="gap-2">
              <FieldLabel
                htmlFor="new-password"
                className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400"
              >
                Nova senha
              </FieldLabel>
              <Input
                id="new-password"
                type="password"
                placeholder="Digite a nova senha"
                required
                className="h-12 rounded-xl border-slate-200 bg-white px-4 text-sm shadow-none placeholder:text-slate-400"
                value={passwords.newPassword}
                onChange={(event) =>
                  setPasswords((current) => ({
                    ...current,
                    newPassword: event.target.value,
                  }))
                }
              />
            </Field>

            <Field className="gap-2">
              <FieldLabel
                htmlFor="confirm-password"
                className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400"
              >
                Confirmar senha
              </FieldLabel>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Repita a nova senha"
                required
                className="h-12 rounded-xl border-slate-200 bg-white px-4 text-sm shadow-none placeholder:text-slate-400"
                value={passwords.confirmPassword}
                onChange={(event) =>
                  setPasswords((current) => ({
                    ...current,
                    confirmPassword: event.target.value,
                  }))
                }
              />
            </Field>

            <FieldDescription className="-mt-2 text-xs leading-6 text-slate-400">
              {PASSWORD_HINT}
            </FieldDescription>
          </>
        ) : null}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-12 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {isSubmitting
            ? isConfirming
              ? "Redefinindo..."
              : "Enviando..."
            : isConfirming
              ? "Redefinir senha"
              : "Enviar código"}
        </Button>

        {isCodeStep ? (
          <button
            type="button"
            onClick={() => void handleResendCode()}
            disabled={isSubmitting || resendCooldown > 0}
            className="text-sm font-semibold text-blue-600 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            {resendCooldown > 0
              ? `Reenviar código em ${resendCooldown}s`
              : "Reenviar código"}
          </button>
        ) : null}

        <FieldDescription className="text-center text-sm text-slate-500">
          Lembrou sua senha?{" "}
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
