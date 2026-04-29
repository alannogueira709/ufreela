"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  MapPin,
  ShieldCheck,
  Star,
} from "lucide-react";

import Loading from "@/components/shared/Loading";
import Footer from "@/components/shared/Footer";
import Navbar from "@/components/shared/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/api-errors";
import { toast } from "sonner";
import { getOpportunityById, getOpportunities } from "@/lib/job-service";
import { createProposal } from "@/lib/proposal-service";
import { useAuth } from "@/contexts/AuthContext";
import type { Opportunity } from "@/types/opportunity";
import type { UserRole } from "@/types/nav";

function formatBudget(min: string | null, max: string | null) {
  if (!min && !max) {
    return "A combinar";
  }

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  if (min && max) {
    return `${formatter.format(Number(min))} - ${formatter.format(Number(max))}`;
  }

  return formatter.format(Number(min ?? max ?? 0));
}

function formatPublished(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffHours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));

  if (diffHours < 24) {
    return `Posted ${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  }

  const diffDays = Math.max(1, Math.round(diffHours / 24));
  return `Posted ${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

function mapRole(role: UserRole | undefined) {
  return role && ["guest", "freelancer", "publisher", "admin"].includes(role)
    ? role
    : "guest";
}

function buildResponsibilities(job: Opportunity) {
  const category = job.category?.category_name ?? "product";
  const firstSkill = job.skills[0]?.skill_name ?? "execution";
  const secondSkill = job.skills[1]?.skill_name ?? "delivery";

  return [
    `Translate ${category.toLowerCase()} goals into a clear execution plan with measurable outcomes.`,
    `Lead the workstream with strong attention to ${firstSkill} quality, consistency and usability.`,
    `Collaborate with the client team to validate decisions, align scope and de-risk delivery.`,
    `Document key tradeoffs and recommendations around ${secondSkill.toLowerCase()} and launch readiness.`,
  ];
}

function buildHeroPalette(title: string) {
  const normalized = title.toLowerCase();

  if (normalized.includes("design")) {
    return {
      shell: "from-slate-950 via-slate-900 to-slate-800",
      panel: "from-cyan-300 via-sky-300 to-teal-300",
      accent: "bg-cyan-200/80",
    };
  }

  if (normalized.includes("data") || normalized.includes("ai")) {
    return {
      shell: "from-slate-950 via-indigo-950 to-slate-900",
      panel: "from-violet-300 via-fuchsia-300 to-sky-300",
      accent: "bg-violet-200/80",
    };
  }

  return {
    shell: "from-slate-950 via-slate-900 to-slate-800",
    panel: "from-blue-300 via-cyan-300 to-teal-200",
    accent: "bg-blue-200/80",
  };
}

export function JobDetailsPage() {
  const params = useParams<{ id: string }>();
  const opportunityId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const { user, isLoading: authLoading } = useAuth();
  const [job, setJob] = useState<Opportunity | null>(null);
  const [relatedJobs, setRelatedJobs] = useState<Opportunity[]>([]);
  const [proposalValue, setProposalValue] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);
  const [proposalError, setProposalError] = useState("");
  const [proposalSuccess, setProposalSuccess] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!opportunityId) {
      return;
    }

    const loadJob = async () => {
      try {
        setIsLoading(true);
        setError("");
        const response = await getOpportunityById(opportunityId);
        setJob(response);

        const related = await getOpportunities({
          category: response.category?.category_slug,
        });
        setRelatedJobs(
          related.filter((item) => item.opportunity_id !== response.opportunity_id).slice(0, 2),
        );
      } catch (loadError) {
        setError(
          getApiErrorMessage(loadError, "Não foi possível carregar esta vaga."),
        );
        setJob(null);
        setRelatedJobs([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadJob();
  }, [opportunityId]);

  const activeRole = mapRole(user?.role);
  const canApply = user?.role === "freelancer" && job?.status === "open";
  const responsibilities = useMemo(
    () => (job ? buildResponsibilities(job) : []),
    [job],
  );
  const palette = useMemo(
    () => buildHeroPalette(job?.title ?? ""),
    [job?.title],
  );

  async function handleProposalSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!job) {
      return;
    }

    try {
      setIsSubmittingProposal(true);
      setProposalError("");
      setProposalSuccess("");

      await createProposal(job.opportunity_id, {
        proposed_value: Number(proposalValue),
        cover_letter: coverLetter,
      });

      setProposalSuccess("Proposta enviada com sucesso.");
      setProposalValue("");
      setCoverLetter("");
    } catch (submitError) {
      setProposalError(
        getApiErrorMessage(
          submitError,
          "Não foi possível enviar sua proposta agora.",
          ["error", "detail", "proposed_value", "cover_letter"],
        ),
      );
    } finally {
      setIsSubmittingProposal(false);
    }
  }

  async function handleSaveToggle() {
    if (!user) {
      toast.error("Você precisa estar logado para salvar vagas.");
      return;
    }

    try {
      setIsSaving(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_URL}/api/jobs/opportunities/save/${opportunityId}/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Falha ao salvar");

      const data = await res.json();
      setIsSaved(data.saved);
      toast.success(data.saved ? "Vaga salva com sucesso!" : "Vaga removida dos salvos.");
    } catch (err) {
      toast.error("Ocorreu um erro ao tentar salvar esta vaga.");
    } finally {
      setIsSaving(false);
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#f5f7fb] text-slate-900">
        <Navbar role="guest" />
        <main className="flex-1">
          <Loading text="Carregando vaga..." />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f7fb] text-slate-900">
      <Navbar role={activeRole} />
      <main className="flex-1">
        <section className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/jobs"
            className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-blue-600"
          >
            <ArrowLeft className="size-4" />
            Voltar para vagas
          </Link>

          {isLoading ? (
            <div className="rounded-[32px] border border-white/70 bg-white p-8 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.22)]">
              <Loading text="Buscando detalhes da oportunidade..." fullScreen={false} />
            </div>
          ) : null}

          {!isLoading && error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {!isLoading && !error && !job ? (
            <div className="rounded-[32px] border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
              <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-950">
                Vaga não encontrada
              </h1>
            </div>
          ) : null}

          {!isLoading && job ? (
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px]">
              <section className="space-y-8">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">
                      {job.category?.category_name ?? "Opportunity"}
                    </span>
                    <span>{formatPublished(job.created_at)}</span>
                  </div>

                  <div className="max-w-4xl space-y-3">
                    <h1 className="font-heading text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
                      {job.title}
                    </h1>
                    <p className="max-w-3xl text-base leading-8 text-slate-600">
                      {job.description}
                    </p>
                  </div>
                </div>

                <div className={`relative overflow-hidden rounded-[30px] bg-gradient-to-br ${palette.shell} p-3 shadow-[0_30px_90px_-44px_rgba(15,23,42,0.55)]`}>
                  <div className={`relative h-[250px] rounded-[24px] bg-gradient-to-br ${palette.panel} sm:h-[320px]`}>
                    <div className="absolute inset-y-0 left-[32%] w-[10px] bg-slate-950/65 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]" />
                    <div className="absolute inset-y-0 right-[28%] w-[2px] bg-white/20" />
                    <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-[8px] border-slate-950/70 bg-slate-950/10 shadow-[0_0_0_10px_rgba(255,255,255,0.06)] sm:h-36 sm:w-36" />
                    <div className={`absolute left-[30%] top-6 h-6 w-6 rounded-sm ${palette.accent}`} />
                    <div className={`absolute bottom-6 right-[23%] h-8 w-8 rounded-sm ${palette.accent}`} />
                    <div className="absolute bottom-8 left-[31%] h-12 w-2 rounded-full bg-slate-950/60" />
                    <div className="absolute top-9 left-[31%] h-12 w-2 rounded-full bg-slate-950/60" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.25),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0)_100%)]" />
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-950">
                    Sobre o projeto
                  </h2>
                  <div className="space-y-5 text-[15px] leading-8 text-slate-600">
                    <p>
                      {job.description}
                    </p>
                    <p>
                      The ideal candidate should feel comfortable owning a focused
                      workstream, collaborating closely with stakeholders and
                      shipping polished deliverables with clarity and pace.
                    </p>
                  </div>
                </div>

                <div className="rounded-[30px] bg-[#eef2f7] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                  <h2 className="font-heading text-xl font-bold tracking-tight text-slate-950">
                    Suas Responsabilidades
                  </h2>
                  <ul className="mt-5 space-y-4">
                    {responsibilities.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm leading-7 text-slate-600">
                        <CheckCircle2 className="mt-1 size-4 shrink-0 text-blue-600" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-4">
                  <h2 className="font-heading text-xl font-bold tracking-tight text-slate-950">
                    Skills necessárias
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill) => (
                      <span
                        key={skill.skill_id}
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm"
                      >
                        {skill.skill_name}
                      </span>
                    ))}
                  </div>
                </div>
              </section>

              <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
                <div className="rounded-[30px] bg-white p-6 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.24)]">
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Orçamento Estimado
                    </p>
                    <p className="font-heading text-4xl font-bold tracking-tight text-slate-950">
                      {formatBudget(job.budget_min, job.budget_max)}
                    </p>
                    <p className="text-sm font-medium text-blue-600">
                      Projeto de preço fixo
                    </p>
                  </div>

                  {canApply ? (
                    <form onSubmit={handleProposalSubmit} className="mt-6 space-y-4">
                      <div className="space-y-2">
                        <label
                          htmlFor="proposal_value"
                          className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400"
                        >
                          Sua proposta
                        </label>
                        <Input
                          id="proposal_value"
                          required
                          type="number"
                          min="1"
                          step="0.01"
                          value={proposalValue}
                          onChange={(event) => setProposalValue(event.target.value)}
                          className="h-12 rounded-2xl border-slate-200 bg-slate-50"
                          placeholder="Valor em R$"
                        />
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="cover_letter"
                          className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400"
                        >
                          Mensagem
                        </label>
                        <Textarea
                          id="cover_letter"
                          required
                          value={coverLetter}
                          onChange={(event) => setCoverLetter(event.target.value)}
                          className="min-h-28 rounded-2xl border-slate-200 bg-slate-50"
                          placeholder="Explique rapidamente como você entregaria este projeto."
                        />
                      </div>
                      {proposalError ? (
                        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                          {proposalError}
                        </p>
                      ) : null}
                      {proposalSuccess ? (
                        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                          {proposalSuccess}
                        </p>
                      ) : null}
                      <Button
                        type="submit"
                        disabled={isSubmittingProposal}
                        className="h-12 w-full rounded-full bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        {isSubmittingProposal ? "Enviando..." : "Enviar proposta"}
                      </Button>
                    </form>
                  ) : (
                    <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-500">
                      {user
                        ? "Somente freelancers podem enviar propostas para esta vaga."
                        : "Entre como freelancer para enviar uma proposta."}
                    </div>
                  )}
                  <Button
                    variant="outline"
                    onClick={handleSaveToggle}
                    disabled={isSaving}
                    className={`mt-3 h-12 w-full rounded-full border-slate-200 text-sm font-semibold transition-colors ${
                      isSaved ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-slate-50 text-slate-600"
                    }`}
                  >
                    <Bookmark className={`size-4 mr-2 ${isSaved ? 'fill-current' : ''}`} />
                    {isSaved ? "Vaga Salva" : "Salvar Vaga"}
                  </Button>

                  <div className="mt-6 space-y-4 border-t border-slate-100 pt-6 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-400">Project Length</span>
                      <span className="font-semibold text-slate-700">
                        {job.work_modality === "onsite"
                          ? "3-4 Months"
                          : job.work_modality === "hybrid"
                            ? "2-3 Months"
                            : "Flexible"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-400">Expertise Level</span>
                      <span className="font-semibold capitalize text-slate-700">
                        {job.xp_level || "Not specified"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-[30px] bg-white p-6 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.24)]">
                  <h3 className="font-heading text-lg font-bold tracking-tight text-slate-950">
                    About the Client
                  </h3>
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <div className="flex items-center gap-1 text-blue-600">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star key={index} className="size-3.5 fill-current" />
                        ))}
                      </div>
                      <span className="font-semibold text-slate-700">4.9 of 12 reviews</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <MapPin className="size-4 text-slate-400" />
                      London, United Kingdom
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <CircleDollarSign className="size-4 text-slate-400" />
                      250k+ total spent
                    </div>
                    <div className="flex items-center gap-3 text-sm text-blue-600">
                      <ShieldCheck className="size-4" />
                      Payment verified
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <Building2 className="size-4 text-slate-400" />
                      {job.publisher.company_name || "Verified client"}
                    </div>
                  </div>
                </div>

                <div className="rounded-[30px] bg-white p-6 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.24)]">
                  <h3 className="font-heading text-lg font-bold tracking-tight text-slate-950">
                    Oportunidades Similares
                  </h3>
                  <div className="mt-4 space-y-3">
                    {relatedJobs.length > 0 ? (
                      relatedJobs.map((item) => (
                        <Link
                          key={item.opportunity_id}
                          href={`/jobs/${item.opportunity_id}`}
                          className="block rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 transition-colors hover:border-blue-200 hover:bg-blue-50/50"
                        >
                          <p className="text-sm font-semibold text-slate-800">
                            {item.title}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatBudget(item.budget_min, item.budget_max)} • {item.xp_level || "Flexible"}
                          </p>
                        </Link>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-sm leading-6 text-slate-500">
                        Ainda não encontramos oportunidades parecidas para esta categoria.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-[30px] bg-white p-6 text-sm text-slate-500 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.24)]">
                  <div className="flex items-center gap-3">
                    <Clock3 className="size-4 text-slate-400" />
                    Updated{" "}
                    {new Intl.DateTimeFormat("en-US", {
                      dateStyle: "medium",
                    }).format(new Date(job.updated_at))}
                  </div>
                </div>
              </aside>
            </div>
          ) : null}
        </section>
      </main>
      <Footer />
    </div>
  );
}
