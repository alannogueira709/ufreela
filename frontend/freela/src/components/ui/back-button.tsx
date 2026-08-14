"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export interface BackButtonProps {
  /** Rota de destino explícita. Se não fornecida, resolve automaticamente via query param (redirect/from) ou histórico */
  href?: string;
  /** Rota de fallback padrão se não houver query param nem histórico */
  fallbackUrl?: string;
  /** Rótulo textual. Se não fornecido, deduz dinamicamente o nome da página de origem */
  label?: string;
  /** Estilo do componente */
  variant?: "button" | "ghost" | "link" | "breadcrumb";
  /** Classe CSS customizada */
  className?: string;
  /** Exibir ícone de seta para a esquerda */
  showIcon?: boolean;
}

function getLabelForPath(path: string): string {
  if (!path || path === "/") return "Início";
  if (path.startsWith("/jobs/post")) return "Publicar Vaga";
  if (path.startsWith("/jobs/")) return "Detalhes da Vaga";
  if (path.startsWith("/jobs")) return "Vagas";
  if (path.startsWith("/hire")) return "Talentos";
  if (path.startsWith("/messages")) return "Mensagens";
  if (path.startsWith("/profile/freelancer")) return "Perfil Freelancer";
  if (path.startsWith("/profile/publisher")) return "Perfil Contratante";
  if (path.startsWith("/profile")) return "Perfil";
  if (path.startsWith("/admin")) return "Painel Administrativo";
  return "Página anterior";
}

export function BackButton({
  href,
  fallbackUrl = "/",
  label,
  variant = "button",
  className,
  showIcon = true,
}: BackButtonProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [canGoBack, setCanGoBack] = useState(false);

  const rawRedirectParam =
    searchParams.get("redirect") ||
    searchParams.get("from") ||
    searchParams.get("next");

  const redirectParam =
    rawRedirectParam && rawRedirectParam.startsWith("/") && !rawRedirectParam.startsWith("//")
      ? rawRedirectParam
      : null;

  const targetPath = href || redirectParam || fallbackUrl;
  const computedLabel =
    label || (redirectParam ? `Voltar para ${getLabelForPath(redirectParam)}` : "Voltar");
  const originLabel = redirectParam ? getLabelForPath(redirectParam) : "Início";

  useEffect(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      setCanGoBack(true);
    }
  }, []);

  const handleClick = (
    e: import("react").MouseEvent<HTMLAnchorElement | HTMLButtonElement>
  ) => {
    if (!href && !redirectParam && canGoBack) {
      e.preventDefault();
      router.back();
    }
  };

  const IconComponent = variant === "breadcrumb" ? ChevronLeft : ArrowLeft;

  if (variant === "breadcrumb") {
    return (
      <Breadcrumb className={className}>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href={targetPath} onClick={handleClick}>
              {originLabel}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Login / Cadastro</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  if (variant === "link") {
    return (
      <Link
        href={targetPath}
        onClick={handleClick}
        className={cn(
          "group inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 transition-colors hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded-lg px-2 py-1",
          className
        )}
      >
        {showIcon && (
          <IconComponent className="size-4 transition-transform group-hover:-translate-x-1 text-slate-400 group-hover:text-blue-600" />
        )}
        <span>{computedLabel}</span>
      </Link>
    );
  }

  if (variant === "ghost") {
    return (
      <Link
        href={targetPath}
        onClick={handleClick}
        className={cn(
          "group inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95",
          className
        )}
      >
        {showIcon && (
          <IconComponent className="size-4 text-slate-400 transition-transform group-hover:-translate-x-1 group-hover:text-slate-700" />
        )}
        <span>{computedLabel}</span>
      </Link>
    );
  }

  // Variant: "button" (Pill com visual elegante e refinado)
  return (
    <Link
      href={targetPath}
      onClick={handleClick}
      className={cn(
        "group inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-md transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-blue-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 active:scale-95",
        className
      )}
    >
      {showIcon && (
        <IconComponent className="size-4 text-slate-400 transition-transform group-hover:-translate-x-1 group-hover:text-blue-600" />
      )}
      <span>{computedLabel}</span>
    </Link>
  );
}
