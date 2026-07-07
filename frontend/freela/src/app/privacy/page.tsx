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
        
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Política de Privacidade e Proteção de Dados
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Última atualização: Julho de 2026
        </p>

        <div className="mt-8 space-y-10 text-slate-700">
          <section>
            <p className="leading-relaxed">
              Bem-vindo ao <strong>uFreela</strong>. Nós nos comprometemos com a segurança, transparência e proteção dos dados pessoais de todos os nossos usuários (freelancers e clientes). Esta Política de Privacidade explica como coletamos, usamos, armazenamos e protegemos suas informações, em total conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/18)</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 border-l-4 border-blue-600 pl-3 mb-4">
              1. Quais dados nós coletamos e para quê?
            </h2>
            <p className="mb-3">
              Para que a plataforma funcione de forma eficiente e segura, coletamos as seguintes categorias de dados:
            </p>
            <ul className="list-disc pl-5 space-y-3">
              <li>
                <strong>Dados de Cadastro e Autenticação:</strong> Nome completo, e-mail, CPF/CNPJ, senha (criptografada) e dados de contato. <br />
                <span className="text-sm italic text-slate-500">Finalidade: Identificar você na plataforma e garantir o acesso seguro à sua conta.</span>
              </li>
              <li>
                <strong>Perfis Profissionais:</strong> Foto, portfólio, competências, histórico profissional, bio e avaliações. <br />
                <span className="text-sm italic text-slate-500">Finalidade: Permitir que freelancers mostrem suas habilidades e clientes encontrem os profissionais ideais.</span>
              </li>
              <li>
                <strong>Oportunidades e Propostas:</strong> Dados inseridos na publicação de projetos, propostas enviadas, prazos e valores acordados. <br />
                <span className="text-sm italic text-slate-500">Finalidade: Viabilizar o match de negócios e a execução dos contratos na plataforma.</span>
              </li>
              <li>
                <strong>Integrações e Pagamentos:</strong> Dados de faturamento, chaves públicas de carteiras/tokens de integração e dados de pagamento processados por parceiros homologados. <br />
                <span className="text-sm italic text-slate-500">Finalidade: Processar pagamentos de forma segura e garantir o sistema de custódia (escrow) dos projetos.</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 border-l-4 border-blue-600 pl-3 mb-4">
              2. Segurança e Armazenamento dos Dados
            </h2>
            <p className="mb-3">A segurança dos seus dados é nossa prioridade absoluta:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Criptografia:</strong> Todos os dados sensíveis, senhas e tokens de integração são armazenados utilizando criptografia robusta em nossos servidores (<em>backend</em>).</li>
              <li><strong>Acesso Restrito:</strong> O acesso às informações coletadas é limitado estritamente a funcionários autorizados e necessários para a operação dos serviços.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 border-l-4 border-blue-600 pl-3 mb-4">
              3. Seus Direitos de Acordo com a LGPD
            </h2>
            <p className="mb-3">Você é o dono dos seus dados. A qualquer momento, você pode exercer seus direitos diretamente pela plataforma ou entrando em contato conosco:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Acesso e Portabilidade:</strong> Você pode visualizar seus dados de perfil e exportá-los acessando a área de <strong>Configurações da Conta</strong>.</li>
              <li><strong>Correção:</strong> É possível atualizar ou corrigir qualquer informação desatualizada diretamente pela sua área de perfil.</li>
              <li><strong>Exclusão (Direito ao Esquecimento):</strong> Você pode solicitar a exclusão definitiva dos seus dados utilizando a opção <strong>"Excluir Conta"</strong> nas configurações do perfil ou entrando em contato com o nosso suporte. <br /><span className="text-sm italic text-slate-500">(Nota: Dados necessários para cumprimento de obrigações legais ou fiscais podem ser retidos pelo período exigido por lei).</span></li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 border-l-4 border-blue-600 pl-3 mb-4">
              4. Compartilhamento de Dados com Terceiros
            </h2>
            <p className="mb-3">Não vendemos seus dados em nenhuma hipótese. O compartilhamento ocorre estritamente para a execução do serviço, tais como:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Gateways de pagamento e infraestrutura de contratos/integrações para processar as transações financeiras.</li>
              <li>Cumprimento de ordens judiciais ou obrigações legais.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 border-l-4 border-blue-600 pl-3 mb-4">
              5. Alterações nesta Política
            </h2>
            <p className="leading-relaxed">
              Como o uFreela está em constante evolução, esta política pode ser atualizada. Sempre que houver uma alteração significativa, você será notificado por e-mail ou através de um aviso em nossa plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 border-l-4 border-blue-600 pl-3 mb-4">
              6. Contato e Suporte
            </h2>
            <p className="leading-relaxed">
              Se tiver dúvidas sobre como seus dados são tratados ou queira fazer uma requisição formal, entre em contato com o nosso Encarregado de Proteção de Dados (DPO) através do e-mail: <strong className="text-blue-600">contatoufreela@gmail.com</strong> (ou pelo nosso canal oficial de suporte).
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}