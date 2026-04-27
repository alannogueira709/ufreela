"use client";

import type React from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  BriefcaseBusiness,
  FileText,
  LayoutDashboard,
  MessageCircleMore,
  Plus,
  Sparkles,
  Star,
  TrendingUp,
  UsersRound,
  BadgeCheck,
} from "lucide-react";

import InteractiveMarquee from "@/components/home/InteractiveMarquee";
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES / INTERFACES — devem ser movidos para um arquivo de tipos compartilhado
// ============================================================================

export interface DashboardSummary {
  activeProjects: number;
  newProposals: number;
  conversionRate: number; // percentage
  topMatches: number;
  avgRating: number;
}

export interface Proposal {
  id: string;
  candidateName: string;
  initials: string;
  avatarColor: string; // tailwind color class prefix, e.g. "blue", "orange", "emerald"
  jobTitle: string;
  proposedValue: number;
  appliedAt: string; // human-readable relative time
}

export interface HiringPulse {
  responseTime: string;
  shortlistGrowth: string;
}

export interface PublisherHomeData {
  summary: DashboardSummary;
  proposals: Proposal[];
  hiringPulse: HiringPulse;
  featuredTalentCount: number;
  publisherCount: number | null;
}

// ============================================================================
// PROPS
// ============================================================================

type PublisherHomeProps = {
  userEmail?: string | null;
  /** Dados vindos do banco de dados. Se não fornecido, a UI renderiza estados de carregamento. */
  data?: PublisherHomeData | null;
  isLoading?: boolean;
  error?: string | null;
  /** Callback para criar novo projeto */
  onCreateProject?: () => void;
  /** Callback para ver todos os candidatos */
  onViewCandidates?: () => void;
  /** Callback para ver todas as propostas */
  onViewAllProposals?: () => void;
  /** Callback para postar uma vaga */
  onPostJob?: () => void;
  /** Callback para abrir analytics */
  onOpenAnalytics?: () => void;
};

// ============================================================================
// HELPERS
// ============================================================================

function getPublisherName(userEmail?: string | null) {
  if (!userEmail) {
    return "Alexander";
  }

  const localPart = userEmail.split("@")[0] ?? "Alexander";
  const cleaned = localPart.replace(/[._-]+/g, " ").trim();
  const [firstName] = cleaned.split(" ");

  if (!firstName) {
    return "Alexander";
  }

  return firstName.charAt(0).toUpperCase() + firstName.slice(1);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function SummaryCard({
  icon: Icon,
  label,
  value,
  accent = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <Card
      className={cn(
        "rounded-[2rem] border-white/70 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.35)]",
        accent
          ? "bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 text-white"
          : "bg-white/92",
      )}
    >
      <CardContent className="px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <p
              className={cn(
                "text-xs font-semibold uppercase tracking-[0.2em]",
                accent ? "text-blue-200" : "text-slate-400",
              )}
            >
              {label}
            </p>
            <p className="font-heading text-3xl font-bold tracking-tight">
              {value}
            </p>
          </div>
          <span
            className={cn(
              "flex size-11 items-center justify-center rounded-2xl",
              accent ? "bg-white/10 text-blue-100" : "bg-blue-50 text-blue-600",
            )}
          >
            <Icon className="size-5" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function ProposalPreviewCard({
  proposals,
  onViewAll,
}: {
  proposals: Proposal[];
  onViewAll?: () => void;
}) {
  return (
    <Card className="rounded-[2rem] border-white/70 bg-white/92 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.35)]">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
        <div>
          <CardTitle className="text-2xl font-semibold tracking-tight text-slate-950">
            Novas propostas
          </CardTitle>
          <CardDescription className="mt-1 text-sm text-slate-500">
            Visualize os candidatos que acabaram de entrar no pipeline.
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full px-3 text-blue-600 hover:bg-blue-50"
          onClick={onViewAll}
        >
          Ver todas
        </Button>
      </CardHeader>

      <CardContent className="space-y-3 pb-5">
        {proposals.length === 0 ? (
          <div className="rounded-[1.6rem] border border-dashed border-slate-200 bg-white p-6 text-center">
            <p className="text-sm text-slate-400">
              Nenhuma proposta nova no momento.
            </p>
          </div>
        ) : (
          proposals.map((proposal) => (
            <div
              key={proposal.id}
              className="rounded-[1.6rem] border border-slate-200 bg-white p-4"
            >
              <div className="flex items-center gap-3">
                <Avatar className={`bg-${proposal.avatarColor}-100 text-${proposal.avatarColor}-700`}>
                  <AvatarFallback
                    className={`bg-${proposal.avatarColor}-100 font-semibold text-${proposal.avatarColor}-700`}
                  >
                    {proposal.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold text-slate-950">
                    {proposal.candidateName}
                  </p>
                  <p className="truncate text-sm text-slate-500">
                    {proposal.jobTitle}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-base font-semibold text-slate-950">
                    {formatCurrency(proposal.proposedValue)}
                  </p>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    {proposal.appliedAt}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function QuickActionCard({
  publisherCount,
  onPostJob,
}: {
  publisherCount: number | null;
  onPostJob?: () => void;
}) {
  return (
    <Card className="relative overflow-hidden rounded-[2rem] border-0 bg-slate-950 text-white shadow-[0_32px_80px_-42px_rgba(15,23,42,0.8)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.24),transparent_32%),linear-gradient(145deg,rgba(37,99,235,0.14),transparent_55%)]" />
      <CardContent className="relative space-y-6 px-7 py-7">
        <div className="space-y-3">
          <Badge className="rounded-full bg-white/10 px-3 text-white">
            Ação rápida
          </Badge>
          <h3 className="font-heading text-4xl font-bold tracking-tight">
            Precisa de expertise específica?
          </h3>
          <p className="text-sm leading-7 text-slate-300">
            Lance seu próximo projeto hoje e alcance talentos mais alinhados
            com o momento do seu produto.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            className="h-12 w-full rounded-full bg-blue-600 text-white hover:bg-blue-700"
            onClick={onPostJob}
          >
            <Plus className="size-4" />
            Publicar vaga
          </Button>
          <Button
            variant="outline"
            className="h-12 w-full rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10"
          >
            Explorar modelos
          </Button>
        </div>

        <Separator className="bg-white/10" />

        <div className="flex items-center justify-between gap-4">
          <AvatarGroup>
            <Avatar size="sm" className="bg-slate-700">
              <AvatarFallback className="bg-slate-700 text-[10px] text-white">
                AR
              </AvatarFallback>
            </Avatar>
            <Avatar size="sm" className="bg-blue-700">
              <AvatarFallback className="bg-blue-700 text-[10px] text-white">
                MV
              </AvatarFallback>
            </Avatar>
            <Avatar size="sm" className="bg-cyan-700">
              <AvatarFallback className="bg-cyan-700 text-[10px] text-white">
                SK
              </AvatarFallback>
            </Avatar>
          </AvatarGroup>
          <p className="max-w-[11rem] text-xs leading-5 text-slate-400">
            {publisherCount
              ? `Junte-se a ${publisherCount.toLocaleString("pt-BR")}+ publishers contratando talentos verificados no uFreela.`
              : "Publique sua proxima vaga e comece a atrair talentos verificados na Pulse."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function HiringPulseCard({
  pulse,
  onOpenAnalytics,
}: {
  pulse: HiringPulse;
  onOpenAnalytics?: () => void;
}) {
  return (
    <Card className="rounded-[2rem] border-white/70 bg-white/92 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.35)]">
      <CardHeader className="pb-3">
        <CardTitle className="text-2xl font-semibold tracking-tight text-slate-950">
          Pulso de contratação
        </CardTitle>
        <CardDescription className="text-sm text-slate-500">
          Sinais rápidos para ajudar na decisão do dia.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pb-6">
        <div className="rounded-[1.4rem] bg-slate-100 p-4">
          <p className="text-sm font-medium text-slate-500">
            Tempo de resposta
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">
            {pulse.responseTime}
          </p>
        </div>
        <div className="rounded-[1.4rem] bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-700">
            Crescimento da shortlist
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">
            {pulse.shortlistGrowth}
          </p>
        </div>
        <Button
          variant="outline"
          className="h-11 w-full rounded-full border-slate-200 text-slate-700 hover:bg-slate-50"
          onClick={onOpenAnalytics}
        >
          Abrir analytics
          <ArrowRight className="size-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SKELETON / LOADING STATES
// ============================================================================

function SummaryCardSkeleton({ accent = false }: { accent?: boolean }) {
  return (
    <Card
      className={cn(
        "rounded-[2rem] border-white/70 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.35)]",
        accent
          ? "bg-linear-to-br from-slate-950 via-slate-900 to-blue-950"
          : "bg-white/92",
      )}
    >
      <CardContent className="px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="h-3 w-24 animate-pulse rounded-full bg-slate-300/40" />
            <div className="h-8 w-16 animate-pulse rounded-lg bg-slate-300/40" />
          </div>
          <div className="size-11 animate-pulse rounded-2xl bg-slate-300/40" />
        </div>
      </CardContent>
    </Card>
  );
}

function ProposalsSkeleton() {
  return (
    <Card className="rounded-[2rem] border-white/70 bg-white/92 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.35)]">
      <CardHeader className="pb-3">
        <div className="h-6 w-40 animate-pulse rounded-lg bg-slate-300/40" />
        <div className="mt-1 h-3 w-64 animate-pulse rounded-full bg-slate-300/40" />
      </CardHeader>
      <CardContent className="space-y-3 pb-5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-[1.6rem] border border-slate-200 bg-white p-4"
          >
            <div className="flex items-center gap-3">
              <div className="size-10 animate-pulse rounded-full bg-slate-300/40" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-32 animate-pulse rounded-full bg-slate-300/40" />
                <div className="h-3 w-48 animate-pulse rounded-full bg-slate-300/40" />
              </div>
              <div className="space-y-2 text-right">
                <div className="h-4 w-16 animate-pulse rounded-full bg-slate-300/40" />
                <div className="h-3 w-20 animate-pulse rounded-full bg-slate-300/40" />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PublisherHome({
  userEmail,
  data,
  isLoading = false,
  error,
  onCreateProject,
  onViewCandidates,
  onViewAllProposals,
  onPostJob,
  onOpenAnalytics,
}: PublisherHomeProps) {
  const displayName = getPublisherName(userEmail);

  const fallbackData: PublisherHomeData = {
    summary: {
      activeProjects: 0,
      newProposals: 0,
      conversionRate: 0,
      topMatches: 0,
      avgRating: 0,
    },
    proposals: [
      {
        id: "1",
        candidateName: "Jordan Smith",
        initials: "JS",
        avatarColor: "blue",
        jobTitle: "Candidatou-se para Campanha de Vídeo de Marca Q4",
        proposedValue: 4500,
        appliedAt: "2 horas atrás",
      },
      {
        id: "2",
        candidateName: "Lydia Vance",
        initials: "LV",
        avatarColor: "orange",
        jobTitle: "Candidatou-se para Auditoria de UI de Plataforma SaaS",
        proposedValue: 2250,
        appliedAt: "5 horas atrás",
      },
      {
        id: "3",
        candidateName: "David Koh",
        initials: "DK",
        avatarColor: "emerald",
        jobTitle: "Candidatou-se para Sprint de Desenvolvimento Webflow",
        proposedValue: 1800,
        appliedAt: "Ontem",
      },
    ],
    hiringPulse: {
      responseTime: "1h 24m",
      shortlistGrowth: "+6 perfis esta semana",
    },
    featuredTalentCount: 1240,
    publisherCount: 2000,
  };

  const resolvedData =
    data ?? {
      ...fallbackData,
      proposals: [],
      hiringPulse: {
        responseTime: "0 vagas abertas",
        shortlistGrowth: "0 vagas encerradas",
      },
      featuredTalentCount: 0,
      publisherCount: null,
    };

  return (
    <div className="relative overflow-hidden bg-[linear-gradient(180deg,#f9fbff_0%,#f6f7fb_30%,#f8fafc_100%)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[30rem] bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_35%),radial-gradient(circle_at_top_right,rgba(125,211,252,0.16),transparent_28%)]" />

      {/* ── HERO SECTION ── */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="container relative mx-auto px-6 py-10 lg:px-10"
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
          <Card className="rounded-[2.5rem] border-white/70 bg-white/84 px-2 shadow-[0_30px_80px_-42px_rgba(15,23,42,0.32)] backdrop-blur-xl">
            <CardContent className="px-6 py-7 md:px-8 md:py-8">
              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl space-y-4">
                    <Badge className="rounded-full bg-blue-50 px-3 text-blue-700">
                      <BadgeCheck/>
                      Verificado
                    </Badge>
                    <div className="space-y-3">
                      <h1 className="font-heading text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
                        Bem-vindo de volta, {displayName}
                      </h1>
                      <p className="max-w-3xl text-base leading-8 text-slate-600 md:text-lg">
                        Seu ecossistema criativo segue aquecido. Centralize
                        projetos, acompanhe a chegada de talentos e mantenha o
                        time em movimento com uma experiência mais fluida.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:w-[320px] lg:grid-cols-1">
                    {isLoading ? (
                      <>
                        <SummaryCardSkeleton accent />
                        <SummaryCardSkeleton />
                      </>
                    ) : (
                      <>
                        <SummaryCard
                          icon={LayoutDashboard}
                          label="Projetos ativos"
                          value={String(resolvedData.summary.activeProjects)}
                          accent
                        />
                        <SummaryCard
                          icon={FileText}
                          label="Novas propostas"
                          value={String(resolvedData.summary.newProposals)}
                        />
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    className="h-12 rounded-full bg-slate-950 px-6 text-white hover:bg-slate-900"
                    onClick={onCreateProject}
                  >
                    <BriefcaseBusiness className="size-4" />
                    Criar novo projeto
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 rounded-full border-white bg-white/80 px-6 text-slate-700 hover:bg-slate-50"
                    onClick={onViewCandidates}
                  >
                    <UsersRound className="size-4" />
                    Ver candidatos
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            {isLoading ? (
              <>
                <SummaryCardSkeleton />
                <SummaryCardSkeleton />
                <SummaryCardSkeleton />
              </>
            ) : (
              <>
                <SummaryCard
                  icon={TrendingUp}
                  label="Taxa de conversão"
                  value={`${resolvedData.summary.conversionRate}%`}
                />
                <SummaryCard
                  icon={Sparkles}
                  label="Melhores matches"
                  value={String(resolvedData.summary.topMatches)}
                />
                <SummaryCard
                  icon={Star}
                  label="Avaliação média"
                  value={String(resolvedData.summary.avgRating)}
                />
              </>
            )}
          </div>
        </div>
      </motion.section>

      {/* ── FEATURED TALENT SECTION ── */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.08, ease: "easeOut" }}
        className="container relative mx-auto px-6 pb-8 lg:px-10"
      >
        {error ? (
          <div className="mb-6 rounded-[1.6rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            {error}
          </div>
        ) : null}

        <div className="mb-6 flex flex-col gap-4 rounded-[2rem] border border-white/70 bg-white/75 px-6 py-5 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.28)] backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
              Rede curada
            </p>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-slate-950">
              Talentos em destaque prontos para o seu próximo brief
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 font-medium">
              <UsersRound className="size-4 text-blue-600" />
              {resolvedData.featuredTalentCount.toLocaleString("pt-BR")} perfis em destaque
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 font-medium">
              <MessageCircleMore className="size-4 text-blue-600" />
              Contato direto
            </span>
          </div>
        </div>
      </motion.section>

      <InteractiveMarquee />

      {/* ── BOTTOM SECTION: PROPOSALS + SIDEBAR ── */}
      <section className="container mx-auto px-6 pb-16 pt-8 lg:px-10">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
          {isLoading ? (
            <ProposalsSkeleton />
          ) : (
            <ProposalPreviewCard
              proposals={resolvedData.proposals}
              onViewAll={onViewAllProposals}
            />
          )}

          <div className="space-y-6">
            <QuickActionCard
              publisherCount={resolvedData.publisherCount}
              onPostJob={onPostJob}
            />

            {isLoading ? (
              <Card className="rounded-[2rem] border-white/70 bg-white/92 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.35)]">
                <CardHeader className="pb-3">
                  <div className="h-6 w-32 animate-pulse rounded-lg bg-slate-300/40" />
                  <div className="mt-1 h-3 w-48 animate-pulse rounded-full bg-slate-300/40" />
                </CardHeader>
                <CardContent className="space-y-4 pb-6">
                  <div className="h-20 animate-pulse rounded-[1.4rem] bg-slate-300/40" />
                  <div className="h-20 animate-pulse rounded-[1.4rem] bg-slate-300/40" />
                  <div className="h-11 animate-pulse rounded-full bg-slate-300/40" />
                </CardContent>
              </Card>
            ) : (
              <HiringPulseCard
                pulse={resolvedData.hiringPulse}
                onOpenAnalytics={onOpenAnalytics}
              />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
