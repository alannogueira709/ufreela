"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  BriefcaseBusiness,
  Clock3,
  Eye,
  FileText,
  MoreVertical,
  Search,
} from "lucide-react";

import Footer from "@/components/shared/Footer";
import Loading from "@/components/shared/Loading";
import Navbar from "@/components/shared/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { getApiErrorMessage } from "@/lib/api-errors";
import { getOpportunities } from "@/lib/job-service";
import { getMyPublisherProposals } from "@/lib/proposal-service";
import type { Opportunity } from "@/types/opportunity";
import type { Proposal } from "@/types/proposal";
import type { UserRole } from "@/types/nav";

function mapRole(role: UserRole | undefined) {
  return role && ["guest", "freelancer", "publisher", "admin"].includes(role)
    ? role
    : "guest";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function estimateOpportunityValue(job: Opportunity) {
  const min = Number(job.budget_min ?? 0);
  const max = Number(job.budget_max ?? 0);

  if (min && max) {
    return (min + max) / 2;
  }

  return min || max || 0;
}

function statusLabel(job: Opportunity) {
  if (job.status === "closed") {
    return "Fechada";
  }

  return "Aberta";
}

function statusTone(job: Opportunity) {
  if (job.status === "closed") {
    return "bg-emerald-100 text-emerald-700";
  }

  return "bg-[#e8ecff] text-[#4962ff]";
}

export default function PublisherOpportunitiesPage() {
  const params = useParams<{ id: string }>();
  const userId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const { user, isLoading: authLoading } = useAuth();
  const [jobs, setJobs] = useState<Opportunity[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("ativas");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const loadJobs = async () => {
      try {
        setIsLoading(true);
        setError("");
        const [data, proposalData] = await Promise.all([
          getOpportunities({
            publisher: userId,
            status: "all",
          }),
          user?.role === "publisher" && user.id === userId
            ? getMyPublisherProposals()
            : Promise.resolve([]),
        ]);
        setJobs(data);
        setProposals(proposalData);
      } catch (loadError) {
        setError(
          getApiErrorMessage(loadError, "Nao foi possivel carregar os jobs deste publisher."),
        );
        setJobs([]);
        setProposals([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadJobs();
  }, [user?.id, user?.role, userId]);

  const activeRole = mapRole(user?.role);
  const filteredJobs = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) {
      return jobs;
    }

    return jobs.filter((job) =>
      `${job.title} ${job.description} ${job.category?.category_name ?? ""}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [jobs, search]);

  const activeJobs = filteredJobs.filter((job) => job.status !== "closed");
  const closedJobs = filteredJobs.filter((job) => job.status === "closed");
  const totalValue = filteredJobs.reduce(
    (sum, job) => sum + estimateOpportunityValue(job),
    0,
  );
  const pendingValue = activeJobs.reduce(
    (sum, job) => sum + estimateOpportunityValue(job),
    0,
  );
  const proposalsByOpportunity = useMemo(
    () =>
      proposals.reduce<Record<number, Proposal[]>>((acc, proposal) => {
        const opportunityId = proposal.opportunity.opportunity_id;
        acc[opportunityId] = [...(acc[opportunityId] ?? []), proposal];
        return acc;
      }, {}),
    [proposals],
  );

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#f6f7fb] text-slate-900">
        <Navbar role={activeRole} />
        <main className="flex-1">
          <Loading text="Carregando meus trabalhos..." />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f6f7fb] text-slate-900">
      <Navbar role={activeRole} />
      <main className="flex-1">
        <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <h1 className="font-heading text-5xl font-bold tracking-tight text-slate-950">
                Meus Projetos
              </h1>
              <p className="text-base text-slate-500">
                Gerencie suas oportunidades e propostas recebidas.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search..."
                  className="h-12 w-72 rounded-full border-white/70 bg-white pl-11 shadow-sm"
                />
              </label>
              <button className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm">
                <Bell className="size-4 text-slate-500" />
              </button>
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="space-y-6">
              <div className="rounded-[32px] bg-white p-6 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.18)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Resumo de vagas
                </p>
                <p className="mt-3 text-sm text-slate-500">Valor publicado</p>
                <p className="mt-1 font-heading text-4xl font-bold tracking-tight text-slate-950">
                  {formatCurrency(totalValue)}
                </p>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400">Em aberto</p>
                    <p className="mt-1 text-xl font-bold text-slate-800">
                      {formatCurrency(pendingValue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Propostas</p>
                    <p className="mt-1 text-xl font-bold text-slate-800">
                      {proposals.length}
                    </p>
                  </div>
                </div>

                <Link href="/jobs/post">
                  <Button className="mt-6 h-12 w-full rounded-full bg-[#1f4cff] text-sm font-semibold text-white hover:bg-[#1743ea]">
                    Publicar vaga
                  </Button>
                </Link>
              </div>

              <div className="rounded-[32px] bg-[#f0f2f6] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Eficiência do perfil
                </p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <Clock3 className="size-4 text-[#4962ff]" />
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {activeJobs.length} {activeJobs.length === 1 ? "vaga" : "vagas"} {activeJobs.length === 1 ? "ativa" : "ativas"}
                        </p>
                        <p className="text-xs text-slate-400">Oportunidades recebendo propostas</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <FileText className="size-4 text-[#4962ff]" />
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {proposals.length} {proposals.length === 1 ? "proposta" : "propostas"} {proposals.length === 1 ? "recebida" : "recebidas"}
                        </p>
                        <p className="text-xs text-slate-400">Recebidas nas suas vagas</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            <section className="space-y-8">
              <div className="flex flex-wrap items-center gap-6 border-b border-slate-200 pb-2 text-sm font-semibold text-slate-400">
                <button 
                  onClick={() => setActiveTab("ativas")}
                  className={activeTab === "ativas" ? "border-b-2 border-[#3d5afe] pb-3 text-[#3d5afe]" : "pb-3 transition-colors hover:text-slate-600"}
                >
                  Ativas ({activeJobs.length})
                </button>
                <button 
                  onClick={() => setActiveTab("propostas")}
                  className={activeTab === "propostas" ? "border-b-2 border-[#3d5afe] pb-3 text-[#3d5afe]" : "pb-3 transition-colors hover:text-slate-600"}
                >
                  Propostas ({proposals.length})
                </button>
                <button 
                  onClick={() => setActiveTab("finalizadas")}
                  className={activeTab === "finalizadas" ? "border-b-2 border-[#3d5afe] pb-3 text-[#3d5afe]" : "pb-3 transition-colors hover:text-slate-600"}
                >
                  Finalizadas ({closedJobs.length})
                </button>
                <button 
                  onClick={() => setActiveTab("registros")}
                  className={activeTab === "registros" ? "border-b-2 border-[#3d5afe] pb-3 text-[#3d5afe]" : "pb-3 transition-colors hover:text-slate-600"}
                >
                  Registros
                </button>
              </div>

              {activeTab === "ativas" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-950">
                    Projetos ativos
                  </h2>

                  {activeJobs.length > 0 ? (
                    activeJobs.map((job) => {
                      const estimated = estimateOpportunityValue(job);
                      const jobProposals = proposalsByOpportunity[job.opportunity_id] ?? [];

                      return (
                        <article
                          key={job.opportunity_id}
                          className="rounded-[30px] bg-white px-6 py-5 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.18)]"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef2ff] text-[#4461ff]">
                                <BriefcaseBusiness className="size-5" />
                              </div>
                              <div>
                                <p className="text-lg font-semibold text-slate-900">
                                  {job.title}
                                </p>
                                <p className="text-sm text-slate-500">
                                  {job.publisher.company_name || "Client account"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${statusTone(job)}`}>
                                {statusLabel(job)}
                              </span>
                              <button className="text-slate-400">
                                <MoreVertical className="size-4" />
                              </button>
                            </div>
                          </div>

                          <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_170px]">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                Propostas recebidas
                              </p>
                              <p className="mt-1 text-sm font-semibold text-slate-800">
                                {jobProposals.length} candidato(s)
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                {jobProposals.filter((proposal) => proposal.status === "pending").length} pendente(s)
                              </p>
                            </div>
                            <div className="sm:text-right">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                Orçamento
                              </p>
                              <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
                                {formatCurrency(estimated)}
                              </p>
                            </div>
                          </div>
                        </article>
                      );
                    })
                  ) : (
                    <div className="rounded-[30px] border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500 shadow-sm">
                      Nenhum projeto ativo encontrado.
                    </div>
                  )}
                </div>
              )}

              {activeTab === "finalizadas" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-950">
                    Projetos finalizados
                  </h2>

                  {closedJobs.length > 0 ? (
                    closedJobs.map((job) => {
                      const estimated = estimateOpportunityValue(job);
                      const jobProposals = proposalsByOpportunity[job.opportunity_id] ?? [];

                      return (
                        <article
                          key={job.opportunity_id}
                          className="rounded-[30px] bg-white px-6 py-5 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.18)]"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f8fafc] text-slate-400">
                                <BriefcaseBusiness className="size-5" />
                              </div>
                              <div>
                                <p className="text-lg font-semibold text-slate-900">
                                  {job.title}
                                </p>
                                <p className="text-sm text-slate-500">
                                  {job.publisher.company_name || "Client account"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${statusTone(job)}`}>
                                {statusLabel(job)}
                              </span>
                              <button className="text-slate-400">
                                <MoreVertical className="size-4" />
                              </button>
                            </div>
                          </div>

                          <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_170px]">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                Propostas recebidas
                              </p>
                              <p className="mt-1 text-sm font-semibold text-slate-800">
                                {jobProposals.length} candidato(s)
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                {jobProposals.filter((proposal) => proposal.status === "accepted").length} aceita(s)
                              </p>
                            </div>
                            <div className="sm:text-right">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                Orçamento
                              </p>
                              <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
                                {formatCurrency(estimated)}
                              </p>
                            </div>
                          </div>
                        </article>
                      );
                    })
                  ) : (
                    <div className="rounded-[30px] border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500 shadow-sm">
                      Nenhum projeto finalizado encontrado.
                    </div>
                  )}
                </div>
              )}

              {activeTab === "propostas" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-950">
                      Propostas recebidas
                    </h2>
                  </div>

                  <div className="rounded-[30px] bg-white p-4 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.18)]">
                    <div className="space-y-2">
                      {proposals.length > 0 ? (
                        proposals.map((proposal) => {
                          return (
                          <div
                            key={proposal.proposal_id}
                            className="flex flex-col gap-3 rounded-2xl px-3 py-4 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between border border-transparent hover:border-slate-100"
                          >
                            <div className="flex items-center gap-4">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef2ff] text-[#4962ff]">
                                <FileText className="size-4" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-800">
                                  {`${proposal.freelancer.name} ${proposal.freelancer.last_name}`.trim() || "Freelancer"}
                                </p>
                                <p className="text-xs text-slate-500">
                                  Vaga: <Link href={`/jobs/${proposal.opportunity.opportunity_id}`} className="hover:underline">{proposal.opportunity.title}</Link>
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  Enviada em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(proposal.created_at))} • Proposta: {formatCurrency(Number(proposal.proposed_value))}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 sm:gap-4 mt-2 sm:mt-0">
                              <span className={`text-xs font-semibold uppercase tracking-wider ${
                                proposal.status === "accepted"
                                  ? "text-emerald-600"
                                  : proposal.status === "rejected"
                                    ? "text-red-500"
                                    : "text-amber-500"
                              }`}>
                                • {proposal.status === "accepted" ? "Aceita" : proposal.status === "rejected" ? "Recusada" : "Pendente"}
                              </span>
                              <Link href={`/proposals/${proposal.proposal_id}`}>
                                <Button
                                  variant="outline"
                                  className="h-9 rounded-full border-slate-200 bg-white px-4 text-xs font-semibold text-[#3d5afe] hover:bg-blue-50 hover:text-blue-700"
                                >
                                  <Eye className="mr-1.5 size-3.5" />
                                  Ver Detalhes
                                </Button>
                              </Link>
                            </div>
                          </div>
                          );
                        })
                      ) : (
                        <div className="py-8 text-center text-sm text-slate-500">
                          Nenhuma proposta recebida ainda.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "registros" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-950">
                    Registros
                  </h2>
                  <div className="rounded-[30px] border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500 shadow-sm">
                    Ainda não há registros disponíveis para os seus contratos.
                  </div>
                </div>
              )}
            </section>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
