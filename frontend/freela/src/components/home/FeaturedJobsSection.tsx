"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { getCategories, getFeaturedJobs } from "@/lib/public-service";
import type { Job } from "@/types/job";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const experienceOptions = [
  { id: "all", label: "Todos os Níveis" },
  { id: "entry", label: "Júnior" },
  { id: "intermediate", label: "Pleno" },
  { id: "expert", label: "Sênior" },
] as const;

type ExperienceFilter = (typeof experienceOptions)[number]["id"];

const ITEMS_PER_PAGE = 5;

const sortOptions = [
  { label: "Mais Recentes", value: "recent" },
  { label: "Maior Orcamento", value: "budget-desc" },
  { label: "Menor Orcamento", value: "budget-asc" },
] as const;

const badgeToneClassName = {
  blue: "bg-blue-50 text-blue-600",
  cyan: "bg-cyan-50 text-cyan-600",
};

function parseBudgetValue(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) {
    return null;
  }

  return Number(digits);
}

function hasAnyTerm(value: string, terms: string[]) {
  const normalizedValue = value.toLowerCase();
  return terms.some((term) => normalizedValue.includes(term));
}

export default function FeaturedJobsSection() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [categories, setCategories] = useState<{ id: string; label: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedExperience, setSelectedExperience] =
    useState<ExperienceFilter>("all");
  const [budgetRange, setBudgetRange] = useState<[number, number]>([0, 2000]);
  const [budgetLimits, setBudgetLimits] = useState<[number, number]>([0, 2000]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedExperience, budgetRange]);

  useEffect(() => {
    let isMounted = true;

    const loadJobs = async () => {
      try {
        const [data, categoriesData] = await Promise.all([
          getFeaturedJobs(),
          getCategories()
        ]);

        if (isMounted) {
          setJobs(data);          
          setCategories([
            { id: "all", label: "Todas as Categorias" },
            ...categoriesData.map(c => ({ id: c.category_slug, label: c.category_name }))
          ]);

          const parsedBudgets = data
            .map((job) => parseBudgetValue(job.budget))
            .filter((value): value is number => value !== null);

          if (parsedBudgets.length > 0) {
            const minBudget = Math.floor(Math.min(...parsedBudgets) / 100) * 100;
            const maxBudget = Math.ceil(Math.max(...parsedBudgets) / 100) * 100;
            const safeMaxBudget = maxBudget > minBudget ? maxBudget : minBudget + 100;

            setBudgetLimits([minBudget, safeMaxBudget]);
            setBudgetRange([minBudget, safeMaxBudget]);
          }
        }
      } catch {
        if (isMounted) {
          setJobs([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadJobs();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const joinedTags = job.tags.join(" ").toLowerCase();

      const matchesCategory =
        selectedCategory === "all"
          ? true
          : job.categorySlug === selectedCategory;

      const normalizedDuration = job.duration.toLowerCase();
      const matchesExperience =
        selectedExperience === "all"
          ? true
          : selectedExperience === "entry"
            ? hasAnyTerm(normalizedDuration, ["junior", "entry", "iniciante"])
            : selectedExperience === "intermediate"
              ? hasAnyTerm(normalizedDuration, ["mid", "intermediate", "pleno"])
              : hasAnyTerm(normalizedDuration, ["senior", "expert", "elite", "avancado"]);

      const parsedBudget = parseBudgetValue(job.budget);
      const matchesBudget =
        parsedBudget === null ||
        (parsedBudget >= budgetRange[0] && parsedBudget <= budgetRange[1]);

      return matchesCategory && matchesExperience && matchesBudget;
    });
  }, [jobs, selectedCategory, selectedExperience, budgetRange]);

  const totalPages = Math.ceil(filteredJobs.length / ITEMS_PER_PAGE);

  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredJobs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredJobs, currentPage]);

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "ellipsis", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages);
      }
    }
    return pages;
  };

  const clearFilters = () => {
    setSelectedCategory("all");
    setSelectedExperience("all");
    setBudgetRange([budgetLimits[0], budgetLimits[1]]);
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
                Categorias
              </p>
              <div className="space-y-3">
                {categories.map((item) => {
                  const isChecked = selectedCategory === item.id;

                  return (
                    <label
                      key={item.label}
                      className="flex cursor-pointer items-center gap-3 text-sm font-medium text-slate-600"
                    >
                      <input
                        type="radio"
                        name="category-filter"
                        className="sr-only"
                        checked={isChecked}
                        onChange={() => setSelectedCategory(item.id)}
                      />
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                          isChecked
                            ? "border-blue-400 bg-blue-400/80"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      </span>
                      {item.label}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Faixa de Orçamento
              </p>
              <div className="space-y-3">
                <Slider
                  min={budgetLimits[0]}
                  max={budgetLimits[1]}
                  step={100}
                  value={budgetRange}
                  onValueChange={(value) => {
                    if (!Array.isArray(value)) {
                      return;
                    }

                    setBudgetRange([
                      value[0] ?? budgetLimits[0],
                      value[1] ?? budgetLimits[1],
                    ]);
                  }}
                  className="mx-auto w-full"
                />
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                  <span>R$ {budgetRange[0].toLocaleString("pt-BR")}</span>
                  <span>R$ {budgetRange[1].toLocaleString("pt-BR")}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Nível de experiência
              </p>
              <div className="space-y-3">
                {experienceOptions.map((item) => {
                  const isChecked = selectedExperience === item.id;

                  return (
                    <label
                      key={item.label}
                      className="flex cursor-pointer items-center gap-3 text-sm font-medium text-slate-600"
                    >
                      <input
                        type="radio"
                        name="experience-filter"
                        className="sr-only"
                        checked={isChecked}
                        onChange={() => setSelectedExperience(item.id)}
                      />
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                          isChecked
                            ? "border-blue-400 bg-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isChecked ? (
                          <span className="h-2 w-2 rounded-full bg-blue-400/80" />
                        ) : null}
                      </span>
                      {item.label}
                    </label>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              className="w-full rounded-full bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-600 transition-colors duration-300 ease-in-out hover:bg-slate-200"
              onClick={clearFilters}
            >
              Limpar Filtros
            </button>
          </div>
        </aside>

        <div className="space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="font-heading text-3xl font-bold tracking-tight text-slate-950">
              Vagas em destaque: 
            </h2>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
              <span>Filtrar por:</span>
              <button className="rounded-full px-3 py-1 text-slate-700 transition-colors duration-300 ease-in-out hover:text-blue-600">
                Data
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <article key={i} className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1 space-y-5">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <div className="space-y-3">
                        <Skeleton className="h-8 w-2/3" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </div>
                    </div>
                    <div className="flex w-full flex-row items-end justify-between gap-6 lg:w-auto lg:flex-col lg:items-end">
                      <div className="space-y-4 lg:text-right">
                        <div className="space-y-1">
                          <Skeleton className="h-8 w-24 lg:ml-auto" />
                          <Skeleton className="h-4 w-16 lg:ml-auto" />
                        </div>
                        <div className="space-y-1">
                          <Skeleton className="h-6 w-20 lg:ml-auto" />
                          <Skeleton className="h-4 w-14 lg:ml-auto" />
                        </div>
                      </div>
                      <Skeleton className="h-10 w-28 rounded-full" />
                    </div>
                  </div>
                </article>
              ))
            ) : null}

            {!isLoading && jobs.length === 0 ? (
              <article className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Nenhuma vaga em destaque encontrada no momento.
                </p>
              </article>
            ) : null}

            {!isLoading && jobs.length > 0 && filteredJobs.length === 0 ? (
              <article className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Nenhuma vaga encontrada com os filtros selecionados.
                </p>
              </article>
            ) : null}

            {paginatedJobs.map((job) => (
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

          {!isLoading && totalPages > 1 && (
            <div className="pt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) {
                          setCurrentPage((p) => p - 1);
                          window.scrollTo({ top: 300, behavior: "smooth" });
                        }
                      }}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>

                  {getPageNumbers().map((page, i) => (
                    <PaginationItem key={i}>
                      {page === "ellipsis" ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          href="#"
                          isActive={currentPage === page}
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(page as number);
                            window.scrollTo({ top: 300, behavior: "smooth" });
                          }}
                        >
                          {page}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) {
                          setCurrentPage((p) => p + 1);
                          window.scrollTo({ top: 300, behavior: "smooth" });
                        }
                      }}
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
