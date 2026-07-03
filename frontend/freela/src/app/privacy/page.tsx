import Footer from "@/components/shared/Footer";
import Navbar from "@/components/shared/Navbar";

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Navbar role="guest" />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-14 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
          Privacidade
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">
          Politica de privacidade
        </h1>
        <div className="mt-8 space-y-6 text-sm leading-7 text-slate-600">
          <p>
            O uFreela coleta dados necessarios para cadastro, autenticacao,
            publicacao de oportunidades, envio de propostas, perfis profissionais,
            integracoes e pagamentos.
          </p>
          <p>
            Dados sensiveis e tokens de integracao sao armazenados com
            criptografia no backend. Usuarios podem atualizar dados de perfil e
            configuracoes pela area de conta.
          </p>
          <p>
            Em conformidade com a LGPD, voce tem direito a acessar, corrigir e
            solicitar a exclusao dos seus dados pessoais. Para exportar seus dados,
            acesse a area de configuracoes da conta. Para solicitar a exclusao,
            use a opcao "Excluir conta" no perfil ou entre em contato com nosso
            suporte.
          </p>
          <p>
            Esta politica e um texto inicial de produto e deve ser validada antes
            de qualquer lancamento publico.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
