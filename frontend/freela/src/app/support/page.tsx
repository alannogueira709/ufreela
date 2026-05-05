import Footer from "@/components/shared/Footer";
import Navbar from "@/components/shared/Navbar";

export default function SupportPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Navbar role="guest" />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-14 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
          Ajuda
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Suporte</h1>
        <div className="mt-8 space-y-6 text-sm leading-7 text-slate-600">
          <p>
            Para problemas de acesso, cadastro, propostas, pagamentos ou
            integracoes, entre em contato com o time responsavel pela operacao da
            plataforma.
          </p>
          <p>
            Inclua o e-mail da conta, o link da pagina afetada e uma descricao
            objetiva do que aconteceu. Isso ajuda a reproduzir o problema com
            seguranca.
          </p>
          <p>
            Enquanto o canal definitivo nao estiver integrado, esta pagina funciona
            como ponto publico de orientacao para usuarios.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
