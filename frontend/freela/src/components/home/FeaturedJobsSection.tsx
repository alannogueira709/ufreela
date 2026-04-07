"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { jobs } from "@/data/jobs";
import type { ExperienceLevel, JobCategory } from "@/types/job";

const categoryOptions: JobCategory[] = [
  "Design",
  "Desenvolvimento e TI",
  "Serviços de IA",
];

const experienceOptions: ExperienceLevel[] = [
  "Iniciante",
  "Intermediário",
  "Especialista",
];

const sortOptions = [
  { label: "Mais Recentes", value: "recent" },
  { label: "Maior Orcamento", value: "budget-desc" },
  { label: "Menor Orcamento", value: "budget-asc" },
] as const;

const badgeToneClassName = {
  blue: "bg-blue-50 text-blue-600",
  cyan: "bg-cyan-50 text-cyan-600",
};

const PAGE_SIZE = 3;
const MIN_BUDGET = 1000;
const MAX_BUDGET = 5000;

type SortOption = (typeof sortOptions)[number]["value"];

export default function FeaturedJobsSection() {
  const [selectedCategory, setSelectedCategory] = useState<JobCategory | null>(
    null,
  );
  const [selectedExperience, setSelectedExperience] =
    useState<ExperienceLevel | null>(null);
  const [minimumBudget, setMinimumBudget] = useState(MIN_BUDGET);
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredJobs = useMemo(() => {
    return [...jobs]
      .filter((job) => {
        if (selectedCategory && job.category !== selectedCategory) {
          return false;
        }

        if (selectedExperience && job.experienceLevel !== selectedExperience) {
          return false;
        }

        return job.budgetAmount >= minimumBudget;
      })
      .sort((jobA, jobB) => {
        if (sortBy === "budget-desc") {
          return jobB.budgetAmount - jobA.budgetAmount;
        }

        if (sortBy === "budget-asc") {
          return jobA.budgetAmount - jobB.budgetAmount;
        }

        return jobA.postedAtHours - jobB.postedAtHours;
      });
  }, [minimumBudget, selectedCategory, selectedExperience, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / PAGE_SIZE));
  const activePage = Math.min(currentPage, totalPages);
  const paginatedJobs = filteredJobs.slice(
    (activePage - 1) * PAGE_SIZE,
    activePage * PAGE_SIZE,
  );

  const budgetProgress =
    ((minimumBudget - MIN_BUDGET) / (MAX_BUDGET - MIN_BUDGET)) * 100;

  const handleCategoryToggle = (category: JobCategory) => {
    setSelectedCategory((current) => (current === category ? null : category));
    setCurrentPage(1);
  };

  const handleExperienceToggle = (level: ExperienceLevel) => {
    setSelectedExperience((current) => (current === level ? null : level));
    setCurrentPage(1);
  };

  const handleBudgetChange = (value: number) => {
    setMinimumBudget(value);
    setCurrentPage(1);
  };

  const handleSortClick = () => {
    const currentIndex = sortOptions.findIndex((option) => option.value === sortBy);
    const nextIndex = (currentIndex + 1) % sortOptions.length;
    setSortBy(sortOptions[nextIndex].value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedExperience(null);
    setMinimumBudget(MIN_BUDGET);
    setSortBy("recent");
    setCurrentPage(1);
  };

  return (
    <section className="container mx-auto px-8 py-16">
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="h-fit rounded-[2rem] border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur-sm">
          <div className="space-y-8">
            <div>
              <h3 className="font-heading text-xl font-semibold text-slate-950">
                Filtros
              </h3>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Categoria
              </p>
              <div className="space-y-3">
                {categoryOptions.map((item) => {
                  const checked = selectedCategory === item;

                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleCategoryToggle(item)}
                      className="flex items-center gap-3 text-left text-sm font-medium text-slate-600"
                      aria-pressed={checked}
                    >
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                          checked
                            ? "border-blue-600 bg-blue-600"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {checked ? (
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        ) : null}
                      </span>
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Faixa de Preço
              </p>
              <div className="space-y-3">
                <div className="relative h-4">
                  <div className="absolute left-0 top-1/2 h-2 w-full -translate-y-1/2 rounded-full bg-slate-200" />
                  <div
                    className="absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-blue-600"
                    style={{ width: `${budgetProgress}%` }}
                  />
                  <div
                    className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-blue-600 shadow-sm"
                    style={{ left: `${budgetProgress}%` }}
                  />
                  <input
                    type="range"
                    min={MIN_BUDGET}
                    max={MAX_BUDGET}
                    step={1000}
                    value={minimumBudget}
                    onChange={(event) =>
                      handleBudgetChange(Number(event.target.value))
                    }
                    aria-label="Faixa minima de preco"
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                </div>
                <div className="flex justify-between text-xs font-semibold text-slate-400">
                  <span>R$1k</span>
                  <span>R$5k+</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Nível de Experiência
              </p>
              <div className="space-y-3">
                {experienceOptions.map((item) => {
                  const checked = selectedExperience === item;

                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleExperienceToggle(item)}
                      className="flex items-center gap-3 text-left text-sm font-medium text-slate-600"
                      aria-pressed={checked}
                    >
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                          checked
                            ? "border-blue-600 bg-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {checked ? (
                          <span className="h-2 w-2 rounded-full bg-blue-600" />
                        ) : null}
                      </span>
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="w-full rounded-full bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-600 transition-colors duration-300 ease-in-out hover:bg-slate-200"
            >
              Limpar filtros
            </button>
          </div>
        </aside>

        <div className="space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="font-heading text-3xl font-bold tracking-tight text-slate-950">
              Vagas em Destaque
            </h2>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
              <span>Ordenar por:</span>
              <button
                type="button"
                onClick={handleSortClick}
                className="rounded-full px-3 py-1 text-slate-700 transition-colors duration-300 ease-in-out hover:text-blue-600"
              >
                {sortOptions.find((option) => option.value === sortBy)?.label}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {paginatedJobs.length ? (
              paginatedJobs.map((job) => (
                <article
                  key={job.id}
                  className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm transition-all duration-300 ease-in-out hover:border-slate-300 hover:shadow-md"
                >
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1 space-y-5">
                      <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-400">
                        {job.badge ? (
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                              badgeToneClassName[job.badgeTone ?? "blue"]
                            }`}
                          >
                            {job.badge}
                          </span>
                        ) : null}
                        <span>{job.postedAt}</span>
                      </div>

                      <div className="space-y-3">
                        <h3 className="font-heading text-2xl font-bold tracking-tight text-slate-950">
                          {job.title}
                        </h3>
                        <p className="max-w-3xl text-sm font-medium leading-7 text-slate-500">
                          {job.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {job.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex w-full flex-row items-end justify-between gap-6 lg:w-auto lg:flex-col lg:items-end">
                      <div className="space-y-4 text-right">
                        <div>
                          <p className="font-heading text-3xl font-bold tracking-tight text-slate-950">
                            {job.budget}
                          </p>
                          <p className="text-sm font-medium text-slate-400">
                            {job.budgetType}
                          </p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-slate-950">
                            {job.duration}
                          </p>
                          <p className="text-sm font-medium text-slate-400">
                            {job.durationLabel}
                          </p>
                        </div>
                      </div>

                      <Link
                        href={job.href}
                        className="rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors duration-300 ease-in-out hover:bg-blue-700"
                      >
                        Aplicar Agora
                      </Link>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[2rem] border border-slate-200 bg-white p-7 text-center shadow-sm">
                <h3 className="font-heading text-2xl font-bold tracking-tight text-slate-950">
                  Nenhuma vaga encontrada
                </h3>
                <p className="mt-3 text-sm font-medium leading-7 text-slate-500">
                  Ajuste os filtros ou limpe a selecao para visualizar outras
                  oportunidades em destaque.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={activePage === 1}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm transition-colors duration-300 ease-in-out hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Pagina anterior"
            >
              <ArrowLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, index) => {
              const page = index + 1;
              const isActive = page === activePage;

              return (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={
                    isActive
                      ? "inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white"
                      : "inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-slate-500 transition-colors duration-300 ease-in-out hover:bg-white hover:text-slate-900"
                  }
                >
                  {page}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              disabled={activePage === totalPages}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm transition-colors duration-300 ease-in-out hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Proxima pagina"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
