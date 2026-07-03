"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { integrationsApi } from "@/lib/settings-api";

export default function LinkedInCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Conectando LinkedIn...");

  useEffect(() => {
    const code = searchParams.get("code");
    const redirectUri = `${window.location.origin}/auth/linkedin/callback`;

    if (!code) {
      toast.error("Codigo LinkedIn ausente");
      router.replace("/");
      return;
    }

    integrationsApi
      .connectLinkedIn(code, redirectUri)
      .then(() => {
        toast.success("LinkedIn conectado com sucesso");
        setMessage("LinkedIn conectado com sucesso.");
        router.replace("/");
      })
      .catch(() => {
        toast.error("Erro ao conectar LinkedIn");
        router.replace("/");
      });
  }, [router, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        {message}
      </div>
    </main>
  );
}
