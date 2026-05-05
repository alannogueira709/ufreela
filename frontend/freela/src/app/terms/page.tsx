import Footer from "@/components/shared/Footer";
import Navbar from "@/components/shared/Navbar";

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Navbar role="guest" />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-14 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
          Legal
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Termos de uso</h1>
        <div className="mt-8 space-y-6 text-sm leading-7 text-slate-600">
          <p>
            Ao usar o uFreela, usuarios concordam em manter informacoes verdadeiras,
            respeitar contratos firmados na plataforma e usar os canais de pagamento,
            proposta e comunicacao de forma responsavel.
          </p>
          <p>
            Publishers sao responsaveis por descrever oportunidades com clareza.
            Freelancers sao responsaveis por enviar propostas honestas e cumprir os
            escopos aceitos. A plataforma pode limitar contas em caso de fraude,
            abuso, tentativa de contornar pagamentos ou violacao de seguranca.
          </p>
          <p>
            Estes termos servem como base operacional inicial e devem ser revisados
            por assessoria juridica antes de uso em producao.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
