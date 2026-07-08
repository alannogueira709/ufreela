"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="pt-br">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
          <div className="space-y-2">
            <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-950">
              Erro no aplicativo
            </h2>
            <p className="mx-auto max-w-md text-sm leading-7 text-slate-500">
              Ocorreu um erro crítico que impediu o carregamento da aplicação.
              Tente novamente ou volte para a página inicial.
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={reset}>Tentar novamente</Button>
            <Button variant="outline" render={<Link href="/">Ir para o início</Link>} />
          </div>
        </div>
      </body>
    </html>
  );
}