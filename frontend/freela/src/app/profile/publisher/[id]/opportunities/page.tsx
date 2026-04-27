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
                My Jobs
              </h1>
              <p className="text-base text-slate-500">
                Manage your ongoing opportunities and published milestones.
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
                  Efficiency Pulse
                </p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <Clock3 className="size-4 text-[#4962ff]" />
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {activeJobs.length} abertas
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
                          {proposals.length} propostas
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
                <button className="border-b-2 border-[#3d5afe] pb-3 text-[#3d5afe]">
                  Active ({activeJobs.length})
                </button>
                <button className="pb-3">Propostas ({proposals.length})</button>
                <button className="pb-3">Completed ({closedJobs.length})</button>
                <button className="pb-3">Invoices</button>
              </div>

              <div className="space-y-4">
                <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-950">
                  Active Contracts
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
                              Budget
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
                    Nenhum job encontrado para este publisher.
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-950">
                    Recent Proposals
                  </h2>
                  <Link href="/jobs" className="text-sm font-semibold text-[#3d5afe]">
                    View All Proposals
                  </Link>
                </div>

                <div className="rounded-[30px] bg-white p-4 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.18)]">
                  <div className="space-y-2">
                    {proposals.slice(0, 3).map((proposal, index) => {
                      const job = {
                        ...proposal.opportunity,
                        budget_min: proposal.proposed_value,
                        budget_max: proposal.proposed_value,
                        created_at: proposal.created_at,
                      };

                      return (
                      <div
                        key={proposal.proposal_id}
                        className="flex flex-col gap-3 rounded-2xl px-3 py-4 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef2ff] text-[#4962ff]">
                            <FileText className="size-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              {`${proposal.freelancer.name} ${proposal.freelancer.last_name}`.trim() || "Freelancer"}
                            </p>
                            <p className="text-xs text-slate-400">
                              Submitted {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(job.created_at))} • Bid: {formatCurrency(estimateOpportunityValue(job))}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 sm:gap-4">
                          <span className={`text-xs font-semibold ${
                            index === 0
                              ? "text-orange-500"
                              : index === 1
                                ? "text-blue-500"
                                : "text-slate-400"
                          }`}>
                            {index === 0 ? "• Interviewing" : index === 1 ? "• Under Review" : "• Draft"}
                          </span>
                          <Link href={`/jobs/${proposal.opportunity.opportunity_id}`}>
                            <Button
                              variant="outline"
                              className="h-9 rounded-full border-slate-200 bg-white px-4 text-xs font-semibold text-[#3d5afe]"
                            >
                              <Eye className="size-3.5" />
                              View Detail
                            </Button>
                          </Link>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
