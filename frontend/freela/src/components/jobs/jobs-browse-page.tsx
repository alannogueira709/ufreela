"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BriefcaseBusiness, Building2, CircleDollarSign, Search, Sparkles } from "lucide-react";

import Loading from "@/components/shared/Loading";
import Footer from "@/components/shared/Footer";
import Navbar from "@/components/shared/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/api-errors";
import {
  getOpportunities,
  getOpportunityCategories,
  getOpportunitySkills,
} from "@/lib/job-service";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/types/nav";
import type {
  Opportunity,
  OpportunityCategory,
  OpportunityFilters,
  OpportunitySkill,
} from "@/types/opportunity";

const xpOptions = [
  { value: "", label: "Todos os niveis" },
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Pleno" },
  { value: "senior", label: "Senior" },
];

const modalityOptions = [
  { value: "", label: "Todas as modalidades" },
  { value: "remote", label: "Remoto" },
  { value: "hybrid", label: "Hibrido" },
  { value: "onsite", label: "Presencial" },
];

function formatBudget(min: string | null, max: string | null) {
  if (!min && !max) {
    return "A combinar";
  }

  const formatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

  if (min && max) {
    return `${formatter.format(Number(min))} - ${formatter.format(Number(max))}`;
  }

  return formatter.format(Number(min ?? max ?? 0));
}

function formatPostedAt(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function mapRole(role: UserRole | undefined) {
  return role && ["guest", "freelancer", "publisher", "admin"].includes(role)
    ? role
    : "guest";
}

export function JobsBrowsePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [jobs, setJobs] = useState<Opportunity[]>([]);
  const [categories, setCategories] = useState<OpportunityCategory[]>([]);
  const [skills, setSkills] = useState<OpportunitySkill[]>([]);
  const [filters, setFilters] = useState<OpportunityFilters>({
    q: "",
    category: "",
    skill: "",
    xp_level: "",
    work_modality: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [categoriesData, skillsData] = await Promise.all([
          getOpportunityCategories(),
          getOpportunitySkills(),
        ]);
        setCategories(categoriesData);
        setSkills(skillsData);
      } catch (loadError) {
        setError(
          getApiErrorMessage(
            loadError,
            "Nao foi possivel carregar categorias e skills agora.",
          ),
        );
      }
    };

    void loadInitialData();
  }, []);

  useEffect(() => {
    const loadSkills = async () => {
      try {
        setIsLoadingSkills(true);
        const skillsData = await getOpportunitySkills(filters.category || undefined);
        setSkills(skillsData);
      } catch (loadError) {
        setError(
          getApiErrorMessage(
            loadError,
            "Nao foi possivel atualizar as skills da categoria selecionada.",
          ),
        );
      } finally {
        setIsLoadingSkills(false);
      }
    };

    void loadSkills();
  }, [filters.category]);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        setIsLoading(true);
        setError("");
        const jobsData = await getOpportunities(filters);
        setJobs(jobsData);
      } catch (loadError) {
        setError(
          getApiErrorMessage(
            loadError,
            "Nao foi possivel carregar as oportunidades no momento.",
          ),
        );
        setJobs([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadJobs();
  }, [filters]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
        <Navbar role="guest" />
        <main className="flex-1">
          <Loading text="Carregando oportunidades..." />
        </main>
        <Footer />
      </div>
    );
  }

  const activeRole = mapRole(user?.role);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Navbar role={activeRole} />
      <main className="flex-1">
        <section className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.10),transparent_38%),linear-gradient(180deg,#f8fbff_0%,#f8fafc_100%)]">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-12 lg:px-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl space-y-3">
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                  <Sparkles className="size-3.5" />
                  Marketplace de oportunidades
                </span>
                <h1 className="font-heading text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
                  Descubra trabalhos alinhados com sua stack e seu momento.
                </h1>
                <p className="text-sm leading-7 text-slate-600 md:text-base">
                  Explore vagas publicadas na plataforma, filtre por categoria,
                  skill e modalidade, e avance direto para os detalhes da
                  oportunidade.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/jobs/post">
                  <Button className="h-11 rounded-xl bg-blue-600 px-5 text-white hover:bg-blue-700">
                    <BriefcaseBusiness className="size-4" />
                    Publicar vaga
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid gap-3 rounded-[28px] border border-slate-200 bg-white/90 p-4 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.35)] md:grid-cols-2 xl:grid-cols-5">
              <label className="relative xl:col-span-2">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={filters.q ?? ""}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      q: event.target.value,
                    }))
                  }
                  placeholder="Busque por titulo, descricao ou empresa"
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-11"
                />
              </label>

              <select
                value={filters.category ?? ""}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    category: event.target.value,
                    skill: "",
                  }))
                }
                className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none focus:border-blue-400"
              >
                <option value="">Todas as categorias</option>
                {categories.map((category) => (
                  <option key={category.category_id} value={category.category_slug}>
                    {category.category_name}
                  </option>
                ))}
              </select>

              <select
                value={filters.skill ?? ""}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    skill: event.target.value,
                  }))
                }
                className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none focus:border-blue-400"
                disabled={isLoadingSkills}
              >
                <option value="">
                  {isLoadingSkills ? "Carregando skills..." : "Todas as skills"}
                </option>
                {skills.map((skill) => (
                  <option key={skill.skill_id} value={skill.skill_slug}>
                    {skill.skill_name}
                  </option>
                ))}
              </select>

              <select
                value={filters.xp_level ?? ""}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    xp_level: event.target.value,
                  }))
                }
                className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none focus:border-blue-400"
              >
                {xpOptions.map((option) => (
                  <option key={option.value || "all"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={filters.work_modality ?? ""}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    work_modality: event.target.value,
                  }))
                }
                className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none focus:border-blue-400 xl:col-start-5"
              >
                {modalityOptions.map((option) => (
                  <option key={option.value || "all"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-10 lg:px-10">
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                Oportunidades abertas
              </p>
              <h2 className="mt-1 font-heading text-2xl font-bold tracking-tight text-slate-950">
                {isLoading ? "Carregando..." : `${jobs.length} vaga(s) encontradas`}
              </h2>
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
              <Loading text="Buscando vagas..." fullScreen={false} />
            </div>
          ) : null}

          {!isLoading && jobs.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
              <h3 className="font-heading text-2xl font-bold tracking-tight text-slate-950">
                Nenhuma vaga encontrada
              </h3>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
                Tente ajustar os filtros de categoria, skill ou modalidade para
                ampliar os resultados.
              </p>
            </div>
          ) : null}

          {!isLoading ? (
            <div className="grid gap-5 lg:grid-cols-2">
              {jobs.map((job) => (
                <article
                  key={job.opportunity_id}
                  className="group rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.55)] transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_28px_70px_-44px_rgba(37,99,235,0.34)]"
                >
                  <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
                      {job.status === "open" ? "Aberta" : "Fechada"}
                    </span>
                    <span>{formatPostedAt(job.created_at)}</span>
                  </div>

                  <div className="mt-4 space-y-3">
                    <h3 className="font-heading text-2xl font-bold tracking-tight text-slate-950">
                      {job.title}
                    </h3>
                    <p className="line-clamp-3 text-sm leading-7 text-slate-600">
                      {job.description}
                    </p>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {job.category ? (
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                        {job.category.category_name}
                      </span>
                    ) : null}
                    {job.skills.slice(0, 5).map((skill) => (
                      <span
                        key={skill.skill_id}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
                      >
                        {skill.skill_name}
                      </span>
                    ))}
                  </div>

                  <div className="mt-6 grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-3">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Empresa
                      </p>
                      <p className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <Building2 className="size-4 text-slate-400" />
                        {job.publisher.company_name || "Publisher"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Nivel
                      </p>
                      <p className="text-sm font-medium text-slate-700">
                        {job.xp_level || "Nao informado"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Budget
                      </p>
                      <p className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <CircleDollarSign className="size-4 text-slate-400" />
                        {formatBudget(job.budget_min, job.budget_max)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-3">
                    <p className="text-sm text-slate-500">
                      Modalidade:{" "}
                      <span className="font-semibold text-slate-700">
                        {job.work_modality || "Nao informada"}
                      </span>
                    </p>

                    <Link href={`/jobs/${job.opportunity_id}`}>
                      <Button
                        variant="outline"
                        className="h-11 rounded-xl border-slate-200 px-4 text-slate-700 group-hover:border-blue-200 group-hover:text-blue-700"
                      >
                        Ver detalhes
                      </Button>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      </main>
      <Footer />
    </div>
  );
}
