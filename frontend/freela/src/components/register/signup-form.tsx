"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { type SocialProvider } from "@/lib/social-auth";
import { cn } from "@/lib/utils";

const PASSWORD_HINT =
  "Use no minimo 8 caracteres, com 1 letra maiuscula, 1 minuscula e 1 caractere especial (!, @, #, $, %, ^, &, *).";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

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
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSocialProvider, setActiveSocialProvider] =
    useState<SocialProvider | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!isStrongPassword(formData.password)) {
      setError(PASSWORD_HINT);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("As senhas nao coincidem. Por favor, tente novamente.");
      return;
    }

    try {
      setIsSubmitting(true);

      const registerResponse = await fetch(`${API_BASE_URL}/auth/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          confirm_password: formData.confirmPassword,
        }),
      });

      const contentType = registerResponse.headers.get("content-type") ?? "";
      const data = contentType.includes("application/json")
        ? await registerResponse.json()
        : null;

      if (!registerResponse.ok) {
        setError(
          data?.error ??
            data?.detail ??
            data?.email?.[0] ??
            data?.password?.[0] ??
            data?.confirm_password?.[0] ??
            "Nao foi possivel criar a conta. Por favor, tente novamente."
        );
        return;
      }

      const loginResponse = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const loginContentType = loginResponse.headers.get("content-type") ?? "";
      const loginData = loginContentType.includes("application/json")
        ? await loginResponse.json()
        : null;

      if (!loginResponse.ok) {
        setError(
          loginData?.detail ??
            loginData?.error ??
            "Conta criada, mas nao foi possivel autenticar automaticamente."
        );
        return;
      }

      router.push("/register/complete");
      router.refresh();
    } catch {
      setError(
        "Erro ao conectar com o servidor. Verifique se o backend esta rodando."
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
            Crie sua conta no uFreela
          </h2>
          <p className="text-sm leading-6 text-slate-500">
            Cadastre-se para montar seu perfil, acompanhar candidaturas e se
            conectar com novas oportunidades.
          </p>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <SocialAuthButtons
          activeProvider={activeSocialProvider}
          onStart={setActiveSocialProvider}
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
          Ja tem uma conta?{" "}
          <Link
            href="/login"
            className="font-semibold text-blue-600 underline-offset-4 transition-colors hover:text-blue-700 hover:underline"
          >
            Faca login
          </Link>
        </FieldDescription>

        <div className="border-t border-slate-100 pt-5 text-xs leading-6 text-slate-400">
          Ao criar sua conta, voce concorda com nossos Termos, Politica de
          Privacidade e Diretrizes da Plataforma.
        </div>
      </FieldGroup>
    </form>
  );
}
