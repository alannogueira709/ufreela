"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { integrationsApi } from "@/lib/settings-api";

export default function GitHubCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Conectando GitHub...");

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      toast.error("Codigo GitHub ausente");
      router.replace("/");
      return;
    }

    integrationsApi
      .connectGitHub(code)
      .then((result) => {
        toast.success(`${result.imported_repos} repositorios importados`);
        setMessage("GitHub conectado com sucesso.");
        router.replace("/");
      })
      .catch(() => {
        toast.error("Erro ao conectar GitHub");
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
