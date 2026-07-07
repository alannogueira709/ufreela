"use client";

import { useState } from "react";
import Link from "next/link";
import Footer from "@/components/shared/Footer";
import Navbar from "@/components/shared/Navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type FaqItem = {
  question: string;
  answer: string;
};

type FaqCategory = {
  title: string;
  items: FaqItem[];
};

const FAQ_CATEGORIES: FaqCategory[] = [
  {
    title: "Conta e cadastro",
    items: [
      {
        question: "Esqueci minha senha, como recupero o acesso?",
        answer:
          "Na tela de login, clique em 'Esqueci minha senha' e siga as instruções enviadas ao e-mail cadastrado. Se não receber o e-mail em alguns minutos, confira a caixa de spam antes de abrir um chamado.",
      },
      {
        question: "Posso ter mais de um perfil (freelancer e cliente)?",
        answer:
          "Sim. Você pode alternar entre os modos Freelancer e Cliente a partir do menu da sua conta, sem precisar criar um novo cadastro.",
      },
      {
        question: "Como excluo minha conta?",
        answer:
          "Acesse Configurações > Conta > Encerrar conta. Projetos ou disputas em andamento precisam ser finalizados antes do encerramento.",
      },
    ],
  },
  {
    title: "Pagamentos e custódia",
    items: [
      {
        question: "Quando o freelancer recebe o pagamento?",
        answer:
          "Após o cliente confirmar a entrega, ou automaticamente 7 dias após a marcação de 'entrega concluída', caso nenhuma disputa seja aberta nesse período.",
      },
      {
        question: "Quais taxas são cobradas?",
        answer:
          "A taxa de serviço vigente está sempre visível na página de Preços antes da contratação. Eventuais taxas de processamento de pagamento também são exibidas de forma transparente no checkout.",
      },
      {
        question: "Posso pedir reembolso?",
        answer:
          "Se o escopo não foi entregue ou não corresponde ao combinado, abra uma disputa em até 7 dias da entrega. Nossa equipe de mediação analisa o caso e decide sobre liberação, reembolso ou divisão dos valores.",
      },
    ],
  },
  {
    title: "Propostas e contratos",
    items: [
      {
        question: "Como envio uma proposta para uma vaga?",
        answer:
          "Abra a oportunidade desejada e clique em 'Enviar proposta'. Descreva seu plano de execução, prazo e valor — propostas específicas para a vaga têm mais chance de aprovação do que modelos genéricos.",
      },
      {
        question:
          "O que acontece se o cliente ou freelancer não cumprir o combinado?",
        answer:
          "Registre a ocorrência na página do projeto e abra uma disputa. A equipe de suporte pode mediar, e o histórico de mensagens dentro da plataforma é usado como evidência.",
      },
    ],
  },
  {
    title: "Problemas técnicos",
    items: [
      {
        question: "A plataforma está fora do ar ou com erro?",
        answer:
          "Verifique primeiro se o problema persiste em uma aba anônima ou outro navegador. Se continuar, registre um chamado informando o horário, o link da página e uma captura de tela do erro.",
      },
      {
        question: "Encontrei um bug, como reporto?",
        answer:
          "Envie um e-mail para o suporte técnico com uma descrição do que esperava que acontecesse, o que de fato aconteceu, e os passos para reproduzir o problema.",
      },
    ],
  },
];

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`size-4 shrink-0 text-slate-400 transition-transform duration-200 ${
        open ? "rotate-180" : ""
      }`}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 7.5L10 12.5L15 7.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FaqAccordion({ category }: { category: FaqCategory }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="mb-10">
      <h2 className="font-heading text-xl font-bold tracking-tight text-slate-950 border-l-4 border-blue-600 pl-3 mb-4">
        {category.title}
      </h2>
      <div className="divide-y divide-slate-200 overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
        {category.items.map((item, index) => {
          const open = openIndex === index;
          return (
            <div key={item.question}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpenIndex(open ? null : index)}
                aria-expanded={open}
                className="h-auto w-full justify-start gap-4 rounded-none px-4 py-4 text-left font-medium text-slate-800"
              >
                <span className="text-sm font-semibold text-slate-800">
                  {item.question}
                </span>
                <ChevronIcon open={open} />
              </Button>
              {open && (
                <div className="px-4 pb-4 text-sm leading-6 text-muted-foreground">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function SupportPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Navbar role="guest" />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-14 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
          Ajuda
        </p>
        <h1 className="mt-3 font-heading text-4xl font-bold tracking-tight text-slate-950">
          Suporte
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
          Reunimos aqui as dúvidas mais comuns sobre conta, pagamentos,
          propostas e problemas técnicos. Se não encontrar o que precisa, fale
          diretamente com nosso time.
        </p>

        {/* Canal de contato */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="font-heading text-lg font-bold text-slate-950">
              Não encontrou sua resposta?
            </CardTitle>
            <CardDescription>
              Envie um e-mail para o nosso time e inclua as informações abaixo
              para agilizar o atendimento.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
              <li>O e-mail cadastrado na sua conta</li>
              <li>O link da página onde o problema ocorreu</li>
              <li>Uma descrição objetiva do que aconteceu e o que você esperava</li>
              <li>Capturas de tela, se possível</li>
            </ul>
            <Button
              nativeButton={false}
              render={<a href="mailto:suporte@ufreela.com.br" />}
            >
              Enviar e-mail para suporte@ufreela.com.br
            </Button>
            <p className="text-xs text-slate-500">
              Tempo médio de resposta: até 2 dias úteis. Chamados envolvendo
              pagamentos e disputas têm prioridade.
            </p>
            <p className="rounded-md border-l-4 border-amber-500 bg-amber-50 p-3 text-xs text-amber-700">
              <strong>Atenção:</strong> o time do uFreela nunca solicita sua
              senha, código de verificação ou dados de pagamento por e-mail,
              WhatsApp ou redes sociais. Desconfie de mensagens que peçam essas
              informações.
            </p>
          </CardContent>
        </Card>

        {/* FAQ */}
        <div className="mt-12">
          {FAQ_CATEGORIES.map((category) => (
            <FaqAccordion key={category.title} category={category} />
          ))}
        </div>

        {/* Links relacionados */}
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-200 pt-6 text-sm">
          <Link
            href="/terms"
            className="font-medium text-blue-600 hover:underline"
          >
            Termos de Uso
          </Link>
          <Link
            href="/privacy"
            className="font-medium text-blue-600 hover:underline"
          >
            Política de Privacidade
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}