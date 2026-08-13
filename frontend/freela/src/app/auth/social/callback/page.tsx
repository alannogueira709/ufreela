"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { getCurrentUser } from "@/lib/auth-service";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

function getBackendOrigin() {
  return API_BASE_URL.replace(/\/api\/?$/, "");
}

function Loading() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-slate-100">
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        <p className="text-sm text-slate-500">Completando autenticação...</p>
      </div>
    </main>
  );
}

function SocialCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const called = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const error = searchParams.get("error");
    const errorProcess = searchParams.get("error_process");

    if (error) {
      const messages: Record<string, string> = {
        signup_closed: "Cadastro indisponível no momento.",
        permission_denied: "Permissão negada pelo provedor.",
        reauthentication_required: "Reautenticação necessária.",
        unknown: "Erro ao completar login social.",
        cancelled: "Login cancelado.",
      };
      const msg = messages[error] ?? "Erro ao completar login social.";
      queueMicrotask(() => setErrorMessage(msg));

      const loginUrl = new URL("/login", window.location.origin);
      loginUrl.searchParams.set("error", msg);
      if (errorProcess) {
        loginUrl.searchParams.set("error_process", errorProcess);
      }
      setTimeout(() => router.push(loginUrl.toString()), 2000);
      return;
    }

    fetch(`${getBackendOrigin()}/api/auth/social/session/`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("not_authenticated");
        return res.json();
      })
      .then(async (data) => {
        if (data.authenticated && data.redirect_url) {
          try {
            const user = await getCurrentUser();
            queryClient.setQueryData(["auth", "user"], user);
          } catch {
            queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
          }
          window.location.href = data.redirect_url;
        } else {
          throw new Error("not_authenticated");
        }
      })
      .catch(() => {
        setErrorMessage("Erro ao verificar autenticação.");
        setTimeout(() => router.push("/login?error=social_auth_failed"), 2000);
      });
  }, [searchParams, router, queryClient]);

  if (errorMessage) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-slate-100">
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="text-red-600 font-semibold">{errorMessage}</p>
          <p className="mt-2 text-sm text-slate-500">Redirecionando...</p>
        </div>
      </main>
    );
  }

  return <Loading />;
}

export default function SocialCallbackPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SocialCallbackContent />
    </Suspense>
  );
}
