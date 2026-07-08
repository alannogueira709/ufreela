import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="space-y-2">
        <p className="font-heading text-7xl font-bold tracking-tighter text-slate-950">
          404
        </p>
        <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-950">
          Página não encontrada
        </h2>
        <p className="mx-auto max-w-md text-sm leading-7 text-slate-500">
          A página que você procura não existe ou foi movida. Verifique o link
          ou volte para a página inicial.
        </p>
      </div>
      <Button render={<Link href="/">Voltar para o início</Link>} />
    </div>
  );
}