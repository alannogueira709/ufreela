"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({
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
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="space-y-2">
        <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-950">
          Algo deu errado
        </h2>
        <p className="mx-auto max-w-md text-sm leading-7 text-slate-500">
          Ocorreu um erro inesperado ao carregar esta página. Tente novamente ou
          volte para a página inicial.
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={reset}>Tentar novamente</Button>
        <Button variant="outline" nativeButton={false} render={<Link href="/">Ir para o início</Link>} />
      </div>
    </div>
  );
}