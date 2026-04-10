"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const PASSWORD_HINT =
  "Use no minimo 8 caracteres, com 1 letra maiúscula, 1 minúscula e 1 caractere especial (!, @, #, $, %, ^, &,*).";

function isStrongPassword(password: string) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path
        d="M21.8 12.23c0-.79-.07-1.55-.2-2.27H12v4.3h5.49a4.7 4.7 0 0 1-2.04 3.08v2.56h3.3c1.93-1.78 3.05-4.4 3.05-7.67Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.75 0 5.06-.91 6.74-2.47l-3.3-2.56c-.92.62-2.09.99-3.44.99-2.64 0-4.88-1.78-5.68-4.17H2.9v2.63A10 10 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.32 13.79A5.98 5.98 0 0 1 6 12c0-.62.11-1.23.32-1.79V7.58H2.9a10 10 0 0 0 0 8.84l3.42-2.63Z"
        fill="#FBBC05"
      />
      <path
        d="M12 6.04c1.5 0 2.84.52 3.9 1.53l2.92-2.92C17.05 2.99 14.74 2 12 2A10 10 0 0 0 2.9 7.58l3.42 2.63C7.12 7.82 9.36 6.04 12 6.04Z"
        fill="#EA4335"
      />
    </svg>
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
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

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

      const response = await fetch("http://localhost:8000/api/auth/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          confirm_password: formData.confirmPassword,
        }),
      });

      const contentType = response.headers.get("content-type") ?? "";
      const data = contentType.includes("application/json")
        ? await response.json()
        : null;

      if (!response.ok) {
        const backendError =
          data?.detail ??
          data?.email?.[0] ??
          data?.password?.[0] ??
          data?.confirm_password?.[0] ??
          "Nao foi possivel criar a conta. Por favor, tente novamente.";

        setError(backendError);
        return;
      }
      setFormData({
        email: "",
        password: "",
        confirmPassword: "",
      });
      router.push("/register/complete");
    } catch {
      setError("Erro ao conectar com o servidor. Verifique se o backend esta rodando.");
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

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-11 justify-center rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          >
            <GoogleIcon />
            Google
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 justify-center rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          >
            <BriefcaseBusiness className="size-4" />
            Institucional
          </Button>
        </div>

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
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
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
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
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
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
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
            disabled={isSubmitting}
            className="h-12 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {isSubmitting ? "Criando conta..." : "Criar conta"}
          </Button>
        </Field>

        <FieldDescription className="text-center text-sm text-slate-500">
          Já tem uma conta?{" "}
          <Link
            href="/login"
            className="font-semibold text-blue-600 underline-offset-4 transition-colors hover:text-blue-700 hover:underline"
          >
            Faça login
          </Link>
        </FieldDescription>

        <div className="border-t border-slate-100 pt-5 text-xs leading-6 text-slate-400">
          Ao criar sua conta, você concorda com nossos Termos, Politica de
          Privacidade e Diretrizes da Plataforma.
        </div>
      </FieldGroup>
    </form>
  );
}
