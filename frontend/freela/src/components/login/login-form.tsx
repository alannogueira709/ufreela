"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

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

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [activeSocialProvider, setActiveSocialProvider] =
    useState<SocialProvider | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(
    searchParams.get("error") === "social_auth_failed"
      ? "Nao foi possivel autenticar com o provedor escolhido."
      : ""
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      setIsSubmitting(true);

      const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const contentType = response.headers.get("content-type") ?? "";
      const data = contentType.includes("application/json")
        ? await response.json()
        : null;

      if (!response.ok) {
        setError(
          data?.detail ??
            data?.error ??
            "Nao foi possivel entrar. Verifique suas credenciais."
        );
        return;
      }

      router.push("/");
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
            Bem vindo ao uFreela!
          </h2>
          <p className="text-sm leading-6 text-slate-500">
            Entre para acessar sua conta, acompanhar candidaturas e descobrir
            novas oportunidades.
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

        <FieldSeparator>Ou entre com email</FieldSeparator>

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

        <Field className="gap-2">
          <div className="flex items-center justify-between gap-4">
            <FieldLabel
              htmlFor="password"
              className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400"
            >
              Senha
            </FieldLabel>
            <Link
              href="#"
              className="text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700"
            >
              Esqueceu a senha?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="Digite sua senha"
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

        <Field>
          <Button
            type="submit"
            disabled={isSubmitting || activeSocialProvider !== null}
            className="h-12 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {isSubmitting ? "Entrando..." : "Entrar"}
          </Button>
        </Field>

        <FieldDescription className="text-center text-sm text-slate-500">
          Nao tem uma conta?{" "}
          <Link
            href="/register"
            className="font-semibold text-blue-600 underline-offset-4 transition-colors hover:text-blue-700 hover:underline"
          >
            Registre-se
          </Link>
        </FieldDescription>

        <div className="border-t border-slate-100 pt-5 text-xs leading-6 text-slate-400">
          Ao continuar, voce concorda com nossos Termos, Politica de
          Privacidade e Diretrizes da Plataforma.
        </div>
      </FieldGroup>
    </form>
  );
}
