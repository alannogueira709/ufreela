"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Search, Star, UsersRound } from "lucide-react";

import Footer from "@/components/shared/Footer";
import Loading from "@/components/shared/Loading";
import Navbar from "@/components/shared/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getFeaturedCandidates } from "@/lib/public-service";
import { useAuth } from "@/contexts/AuthContext";
import type { Candidate } from "@/types/candidate";
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

export default function HirePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadCandidates = async () => {
      try {
        const data = await getFeaturedCandidates();
        if (isMounted) {
          setCandidates(data);
        }
      } catch {
        if (isMounted) {
          setCandidates([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadCandidates();

    return () => {
      isMounted = false;
    };
  }, []);

  const activeRole = mapRole(user?.role);
  const filteredCandidates = candidates.filter((candidate) =>
    `${candidate.name} ${candidate.title}`.toLowerCase().includes(search.toLowerCase()),
  );

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
        <Navbar role={activeRole} />
        <main className="flex-1">
          <Loading text="Carregando talentos..." />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Navbar role={activeRole} />
      <main className="flex-1">
        <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <p className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                <UsersRound className="size-3.5" />
                Talentos em destaque
              </p>
              <h1 className="font-heading text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
                Encontre freelancers prontos para o seu proximo projeto.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-500 md:text-base">
                Esta primeira versao usa os perfis reais em destaque do backend.
                Filtros avancados podem entrar depois do fluxo de propostas.
              </p>
            </div>

            <label className="relative w-full lg:w-80">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar talento"
                className="h-12 rounded-full border-slate-200 bg-white pl-11"
              />
            </label>
          </div>

          {filteredCandidates.length === 0 ? (
            <div className="rounded-[30px] border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
              <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-950">
                Nenhum talento encontrado
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
                Tente buscar outro nome ou especialidade.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCandidates.map((candidate) => (
                <article
                  key={candidate.uuid}
                  className="rounded-[30px] bg-white p-6 shadow-[0_24px_70px_-44px_rgba(15,23,42,0.28)]"
                >
                  <div className="flex items-center gap-4">
                    <Image
                      src={candidate.avatarUrl}
                      alt={candidate.name}
                      width={64}
                      height={64}
                      className="h-16 w-16 rounded-2xl object-cover"
                    />
                    <div className="min-w-0">
                      <h2 className="truncate font-heading text-xl font-bold tracking-tight text-slate-950">
                        {candidate.name}
                      </h2>
                      <p className="text-sm text-slate-500">{candidate.title}</p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Hora
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {candidate.hourlyRate > 0
                          ? formatCurrency(candidate.hourlyRate)
                          : "N/D"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Rating
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-slate-800">
                        <Star className="size-4 fill-amber-400 text-amber-400" />
                        {candidate.rating.toFixed(1)}
                      </p>
                    </div>
                  </div>

                  <Link href={candidate.profileUrl}>
                    <Button
                      variant="outline"
                      className="mt-5 h-11 w-full rounded-full border-slate-200 text-slate-700"
                    >
                      Ver perfil
                    </Button>
                  </Link>
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
