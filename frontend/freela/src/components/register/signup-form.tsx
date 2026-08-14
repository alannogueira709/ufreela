"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { OtpCodeField } from "@/components/auth/otp-code-field";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { getApiErrorMessage } from "@/lib/api-errors";
import { type SocialProvider } from "@/lib/social-auth";
import {
  confirmEmailVerification,
  requestEmailVerification,
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

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParamRaw = searchParams.get("redirect") || searchParams.get("from");
  const redirectParam =
    redirectParamRaw && redirectParamRaw.startsWith("/") && !redirectParamRaw.startsWith("//")
      ? redirectParamRaw
      : null;
  const loginHref = redirectParam
    ? `/login?redirect=${encodeURIComponent(redirectParam)}`
    : "/login";
  const { login, register } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSocialProvider, setActiveSocialProvider] =
    useState<SocialProvider | null>(null);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationSuccess, setVerificationSuccess] = useState("");
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
    setVerificationSuccess("");

    if (isVerifyingEmail) {
      if (verificationCode.length !== 6) {
        setError("Informe o código de 6 dígitos recebido por email.");
        return;
      }

      try {
        setIsSubmitting(true);
        await confirmEmailVerification({
          email: formData.email,
          code: verificationCode,
        });
        await login({
          email: formData.email,
          password: formData.password,
        });

        router.push("/register/complete");
        router.refresh();
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
      return;
    }

    if (!isStrongPassword(formData.password)) {
      setError(PASSWORD_HINT);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem. Por favor, tente novamente.");
      return;
    }

    try {
      setIsSubmitting(true);
      await register({
        email: formData.email,
        password: formData.password,
        confirm_password: formData.confirmPassword,
      });
      setIsVerifyingEmail(true);
      setResendCooldown(60);
    } catch (error) {
      setError(
        getApiErrorMessage(
          error,
          "Erro ao conectar com o servidor. Verifique se o backend esta rodando.",
          ["error", "detail", "email", "password", "confirm_password", "message"]
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendCode() {
    if (resendCooldown > 0) {
      return;
    }

    setError("");
    setVerificationSuccess("");

    try {
      setIsSubmitting(true);
      const result = await requestEmailVerification(formData.email);
      setVerificationSuccess(result.message);
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

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <FieldGroup className="gap-5">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-slate-950">
            {isVerifyingEmail ? "Confirme seu email" : "Crie sua conta no uFreela"}
          </h2>
          <p className="text-sm leading-6 text-slate-500">
            {isVerifyingEmail
              ? `Enviamos um código de 6 dígitos para ${formData.email}.`
              : "Cadastre-se para montar seu perfil, acompanhar candidaturas e se conectar com novas oportunidades."}
          </p>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {isVerifyingEmail ? (
          <>
            {verificationSuccess ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {verificationSuccess}
              </div>
            ) : null}

            <Field className="items-center gap-3">
              <FieldLabel className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Código de confirmação
              </FieldLabel>
              <OtpCodeField
                value={verificationCode}
                onChange={setVerificationCode}
                disabled={isSubmitting}
              />
              <FieldDescription className="text-center text-xs leading-5 text-slate-400">
                O código expira em 15 minutos.
              </FieldDescription>
            </Field>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {isSubmitting ? "Confirmando..." : "Confirmar email"}
            </Button>

            <div className="flex flex-col items-center gap-3 text-center text-sm text-slate-500">
              <button
                type="button"
                onClick={() => void handleResendCode()}
                disabled={isSubmitting || resendCooldown > 0}
                className="font-semibold text-blue-600 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                {resendCooldown > 0
                  ? `Reenviar código em ${resendCooldown}s`
                  : "Reenviar código"}
              </button>
              <Link
                href="/login"
                className="font-semibold text-slate-500 underline-offset-4 hover:text-slate-900 hover:underline"
              >
                Ir para o login
              </Link>
            </div>
          </>
        ) : (
          <>
            <SocialAuthButtons
              activeProvider={activeSocialProvider}
              onStart={setActiveSocialProvider}
              onError={setError}
            />

            <FieldSeparator>Ou continue com email</FieldSeparator>

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
                value={formData.email}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, email: event.target.value }))
                }
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field className="gap-2">
                <FieldLabel
                  htmlFor="password"
                  className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400"
                >
                  Senha
                </FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="Crie uma senha"
                  required
                  className="h-12 rounded-xl border-slate-200 bg-white px-4 text-sm shadow-none placeholder:text-slate-400"
                  value={formData.password}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      password: event.target.value,
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
                  placeholder="Repita a senha"
                  required
                  className="h-12 rounded-xl border-slate-200 bg-white px-4 text-sm shadow-none placeholder:text-slate-400"
                  value={formData.confirmPassword}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      confirmPassword: event.target.value,
                    }))
                  }
                />
              </Field>
            </div>

            <FieldDescription className="-mt-2 text-xs leading-6 text-slate-400">
              {PASSWORD_HINT}
            </FieldDescription>

            <Field>
              <Button
                type="submit"
                disabled={isSubmitting || activeSocialProvider !== null}
                className="h-12 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700"
              >
                {isSubmitting ? "Criando conta..." : "Criar conta"}
              </Button>
            </Field>

            <FieldDescription className="text-center text-sm text-slate-500">
              Já tem uma conta?{" "}
              <Link
                href={loginHref}
                className="font-semibold text-blue-600 underline-offset-4 transition-colors hover:text-blue-700 hover:underline"
              >
                Faça login
              </Link>
            </FieldDescription>

            <div className="border-t border-slate-100 pt-5 text-xs leading-6 text-slate-400">
              Ao criar sua conta, você concorda com nossos Termos, Política de
              Privacidade e Diretrizes da Plataforma.
            </div>
          </>
        )}
      </FieldGroup>
    </form>
  );
}
