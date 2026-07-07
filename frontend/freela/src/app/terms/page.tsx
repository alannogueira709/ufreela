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

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Termos de Uso e Serviço
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Última atualização: Julho de 2026
        </p>

        <div className="mt-8 space-y-10 text-slate-700">
          <section>
            <p className="leading-relaxed">
              Seja bem-vindo ao <strong>uFreela</strong>. Ao acessar ou utilizar nossa plataforma, você concorda em cumprir e vincular-se integralmente a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deverá utilizar nossos serviços.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 border-l-4 border-blue-600 pl-3 mb-4">
              1. Elegibilidade e Cadastro
            </h2>
            <p className="mb-3">
              Para utilizar as funcionalidades do uFreela, o usuário deve:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Ter capacidade jurídica para celebrar contratos (mínimo 18 anos ou menor emancipado).</li>
              <li>Fornecer informações exatas, verídicas e atualizadas durante o processo de cadastro.</li>
              <li>Zelar pela confidencialidade de suas credenciais de acesso, sendo o único responsável por qualquer atividade realizada em sua conta.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 border-l-4 border-blue-600 pl-3 mb-4">
              2. Dinâmica do Marketplace e Responsabilidades
            </h2>
            <p className="mb-3">
              O uFreela atua como um ecossistema de conexão. O contrato de prestação de serviços é firmado diretamente entre o <strong>Cliente</strong> (contratante) e o <strong>Freelancer</strong> (prestador):
            </p>
            <ul className="list-disc pl-5 space-y-3">
              <li>
                <strong>Do Cliente:</strong> Compromete-se a publicar oportunidades com descrições claras, escopos definidos, prazos realistas e a honrar o pagamento acordado.
              </li>
              <li>
                <strong>Do Freelancer:</strong> Compromete-se a enviar propostas honestas que condigam com suas reais capacidades técnicas e a entregar o escopo aceito com zelo profissional.
              </li>
              <li>
                <strong>Da Plataforma:</strong> O uFreela disponibiliza as ferramentas de intermediação, não sendo responsável pela qualidade técnica das entregas, atrasos ou descumprimentos contratuais de terceiros.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 border-l-4 border-blue-600 pl-3 mb-4">
              3. Sistema de Pagamento e Custódia (Escrow)
            </h2>
            <p className="leading-relaxed mb-3">
              Para garantir a segurança financeira de ambas as partes, o uFreela utiliza um sistema de custódia de pagamentos (escrow):
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>O Cliente realiza o depósito do valor acordado no momento da contratação do projeto.</li>
              <li>Os fundos ficam retidos e protegidos pela plataforma até que o Freelancer execute o escopo acordado.</li>
              <li>A liberação do pagamento ocorre mediante a confirmação de entrega pelo Cliente ou, na ausência de manifestação, automaticamente após 7 (sete) dias corridos da marcação de "entrega concluída" pelo Freelancer, salvo abertura de disputa.</li>
              <li>Os fundos em custódia são mantidos em conta segregada e não se confundem com o patrimônio da plataforma.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 border-l-4 border-blue-600 pl-3 mb-4">
              4. Taxas e Comissões
            </h2>
            <p className="mb-3">
              A utilização das ferramentas de intermediação do uFreela está sujeita às seguintes cobranças:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Taxa de serviço de <strong>[X]%</strong> sobre o valor de cada projeto, descontada do Freelancer no momento da liberação do pagamento.</li>
              <li>Eventuais taxas de processamento de pagamento e/ou saque cobradas por instituições financeiras parceiras poderão ser repassadas ao usuário.</li>
              <li>As taxas vigentes estarão sempre disponíveis e atualizadas na página de Preços da plataforma, e sua alteração será comunicada com antecedência mínima de 15 (quinze) dias.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 border-l-4 border-blue-600 pl-3 mb-4">
              5. Resolução de Disputas
            </h2>
            <p className="mb-3">
              Em caso de divergência sobre a entrega ou qualidade do serviço prestado:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Qualquer das partes pode abrir uma disputa em até 7 (sete) dias corridos após a marcação de entrega, descrevendo o motivo e anexando evidências.</li>
              <li>A equipe do uFreela atuará como mediadora, podendo solicitar documentos, mensagens trocadas e demais evidências das partes envolvidas.</li>
              <li>A decisão de mediação será proferida em até 10 (dez) dias úteis, podendo resultar em liberação total, parcial ou reembolso dos fundos em custódia.</li>
              <li>A mediação interna não impede as partes de buscarem outras vias de resolução, incluindo Procon, juizados especiais ou mediação/arbitragem externa.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 border-l-4 border-blue-600 pl-3 mb-4">
              6. Propriedade Intelectual dos Entregáveis
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Salvo disposição em contrário acordada entre as partes, a titularidade dos direitos autorais e de propriedade intelectual sobre o trabalho entregue é transferida ao Cliente mediante a confirmação e o pagamento integral do projeto.</li>
              <li>O Freelancer garante que o material entregue é de sua autoria ou que possui os direitos necessários para cedê-lo, isentando a plataforma de qualquer responsabilidade por violação de direitos de terceiros.</li>
              <li>O Freelancer poderá utilizar o projeto entregue em seu portfólio pessoal, salvo cláusula de confidencialidade acordada diretamente com o Cliente.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 border-l-4 border-blue-600 pl-3 mb-4">
              7. Obrigações Fiscais
            </h2>
            <p className="leading-relaxed">
              Cada usuário é o único responsável pela apuração, declaração e recolhimento de tributos incidentes sobre os valores recebidos ou pagos através da plataforma, incluindo a emissão de notas fiscais e/ou recibos quando exigido por lei, isentando o uFreela de qualquer responsabilidade tributária individual dos usuários.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 border-l-4 border-blue-600 pl-3 mb-4">
              8. Privacidade e Proteção de Dados
            </h2>
            <p className="leading-relaxed">
              O tratamento de dados pessoais realizado pelo uFreela observa a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 – LGPD) e está detalhado em nossa Política de Privacidade, parte integrante destes Termos de Uso. Ao utilizar a plataforma, o usuário declara ciência e concordância com as práticas de coleta, uso e compartilhamento de dados ali descritas.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 border-l-4 border-blue-600 pl-3 mb-4">
              9. Políticas Antifraude e Conduta Proibida
            </h2>
            <p className="mb-3">
              Prezamos pela integridade do nosso ecossistema. São consideradas violações graves a estes termos:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Desintermediação (Bypass):</strong> Tentar contornar as taxas ou as ferramentas de pagamento da plataforma, migrando a negociação/pagamento do projeto para canais externos.</li>
              <li>Fornecer informações falsas, portfólios plagiados ou identidades fraudulentas.</li>
              <li>Utilizar linguagem ofensiva, assédio ou comportamento inadequado nas ferramentas de comunicação interna.</li>
            </ul>
            <p className="mt-3 italic text-sm text-amber-700 bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r-md">
              <strong>Sanções:</strong> Qualquer violação a esta cláusula poderá resultar na suspensão imediata ou exclusão permanente da conta do usuário, sem prejuízo de medidas judiciais cabíveis.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 border-l-4 border-blue-600 pl-3 mb-4">
              10. Encerramento de Conta
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>O usuário pode solicitar o encerramento de sua conta a qualquer momento, desde que não existam projetos ou disputas em andamento.</li>
              <li>O uFreela pode suspender ou encerrar contas por violação destes Termos, inatividade prolongada ou por determinação legal, mediante notificação prévia sempre que possível.</li>
              <li>O encerramento da conta não exime o usuário de obrigações financeiras ou contratuais já assumidas antes do encerramento.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 border-l-4 border-blue-600 pl-3 mb-4">
              11. Limitação de Responsabilidade
            </h2>
            <p className="leading-relaxed">
              O uFreela não se responsabiliza por lucros cessantes, perdas financeiras decorrentes de negócios mal sucedidos entre usuários, falhas de conexão de internet do usuário ou indisponibilidades temporárias da plataforma causadas por força maior.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 border-l-4 border-blue-600 pl-3 mb-4">
              12. Alterações destes Termos
            </h2>
            <p className="leading-relaxed">
              O uFreela poderá atualizar estes Termos de Uso periodicamente para refletir mudanças legais, operacionais ou de segurança. Alterações relevantes serão comunicadas por e-mail e/ou aviso na plataforma com antecedência mínima de 15 (quinze) dias da entrada em vigor. O uso continuado da plataforma após esse prazo constitui aceite dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 border-l-4 border-blue-600 pl-3 mb-4">
              13. Foro de Eleição
            </h2>
            <p className="leading-relaxed">
              Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil. Para dirimir quaisquer dúvidas ou litígios decorrentes deste documento, as partes elegem o foro da comarca da sede da plataforma, ressalvado o direito do usuário consumidor de optar pelo foro de seu domicílio, conforme legislação aplicável.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}