"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CircleDollarSign,
  Clock3,
  FileText,
} from "lucide-react";

import Footer from "@/components/shared/Footer";
import Loading from "@/components/shared/Loading";
import Navbar from "@/components/shared/Navbar";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api-errors";
import { getMyFreelancerProposals } from "@/lib/proposal-service";
import { useAuth } from "@/contexts/AuthContext";
import type { Proposal, ProposalStatus } from "@/types/proposal";
import type { UserRole } from "@/types/nav";

function mapRole(role: UserRole | undefined) {
  return role && ["guest", "freelancer", "publisher", "admin"].includes(role)
    ? role
    : "guest";
}

function formatCurrency(value: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusLabel(status: ProposalStatus) {
  if (status === "accepted") {
    return "Aceita";
  }

  if (status === "rejected") {
    return "Recusada";
  }

  return "Pendente";
}

function statusClassName(status: ProposalStatus) {
  if (status === "accepted") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "rejected") {
    return "bg-red-100 text-red-700";
  }

  return "bg-blue-100 text-blue-700";
}

export default function FreelancerProposalsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const userId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const { user, isLoading: authLoading } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.push("/login");
      return;
    }

    if (user.role !== "freelancer") {
      router.push("/");
      return;
    }

    const loadProposals = async () => {
      try {
        setIsLoading(true);
        setError("");
        const data = await getMyFreelancerProposals();
        setProposals(data);
      } catch (loadError) {
        setError(
          getApiErrorMessage(
            loadError,
            "Nao foi possivel carregar suas propostas agora.",
          ),
        );
        setProposals([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadProposals();
  }, [authLoading, router, user]);

  const activeRole = mapRole(user?.role);
  const visibleProposals = useMemo(() => {
    if (!userId || user?.id === userId) {
      return proposals;
    }

    return [];
  }, [proposals, user?.id, userId]);

  const totalValue = visibleProposals.reduce(
    (sum, proposal) => sum + Number(proposal.proposed_value),
    0,
  );
  const pendingCount = visibleProposals.filter(
    (proposal) => proposal.status === "pending",
  ).length;

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
        <Navbar role={activeRole} />
        <main className="flex-1">
          <Loading text="Carregando propostas..." />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Navbar role={activeRole} />
      <main className="flex-1">
        <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-blue-600"
          >
            <ArrowLeft className="size-4" />
            Voltar ao dashboard
          </Link>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
                Minhas propostas
              </p>
              <h1 className="font-heading text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
                Acompanhe cada oportunidade enviada.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-500 md:text-base">
                Veja status, valores e detalhes das propostas que voce enviou
                para publishers na plataforma.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[28px] bg-white p-5 shadow-[0_24px_70px_-44px_rgba(15,23,42,0.35)]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Valor proposto
                </p>
                <p className="mt-2 font-heading text-3xl font-bold tracking-tight text-slate-950">
                  {formatCurrency(String(totalValue))}
                </p>
              </div>
              <div className="rounded-[28px] bg-slate-950 p-5 text-white shadow-[0_24px_70px_-44px_rgba(15,23,42,0.55)]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
                  Pendentes
                </p>
                <p className="mt-2 font-heading text-3xl font-bold tracking-tight">
                  {pendingCount}
                </p>
              </div>
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {visibleProposals.length === 0 ? (
            <div className="rounded-[30px] border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
              <FileText className="mx-auto size-10 text-slate-300" />
              <h2 className="mt-4 font-heading text-2xl font-bold tracking-tight text-slate-950">
                Nenhuma proposta enviada
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
                Encontre uma vaga alinhada ao seu perfil e envie sua primeira
                proposta.
              </p>
              <Link href="/jobs">
                <Button className="mt-5 h-11 rounded-full bg-blue-600 px-5 text-white hover:bg-blue-700">
                  Buscar vagas
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {visibleProposals.map((proposal) => (
                <article
                  key={proposal.proposal_id}
                  className="rounded-[30px] bg-white p-6 shadow-[0_24px_70px_-44px_rgba(15,23,42,0.28)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${statusClassName(proposal.status)}`}
                    >
                      {statusLabel(proposal.status)}
                    </span>
                    <span className="flex items-center gap-2 text-xs font-medium text-slate-400">
                      <Clock3 className="size-3.5" />
                      {formatDate(proposal.created_at)}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-950">
                      {proposal.opportunity.title}
                    </h2>
                    <p className="line-clamp-3 text-sm leading-7 text-slate-500">
                      {proposal.cover_letter}
                    </p>
                  </div>

                  <div className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Publisher
                      </p>
                      <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-700">
                        <BriefcaseBusiness className="size-4 text-slate-400" />
                        {proposal.opportunity.publisher.company_name || "Publisher"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Valor
                      </p>
                      <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-700">
                        <CircleDollarSign className="size-4 text-slate-400" />
                        {formatCurrency(proposal.proposed_value)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex justify-end">
                    <Link href={`/jobs/${proposal.opportunity.opportunity_id}`}>
                      <Button
                        variant="outline"
                        className="h-10 rounded-full border-slate-200 px-4 text-slate-700"
                      >
                        Ver vaga
                      </Button>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
