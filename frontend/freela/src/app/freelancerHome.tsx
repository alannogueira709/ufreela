"use client";

import type React from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  Eye,
  Heart,
  MessageSquareMore,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  BadgeCheck,
  CircleDollarSign,
} from "lucide-react";

import FeaturedJobsSection from "@/components/home/FeaturedJobsSection";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

export interface FreelancerDashboardSummary {
  monthlyRevenue: number;
  jobSuccessRate: number; // percentage
}

export type ProposalStatus = "interviewing" | "under_review" | "hired";

export interface FreelancerProposal {
  id: string;
  projectName: string;
  clientName: string;
  status: ProposalStatus;
  statusLabel: string;
  subtitle: string;
  proposedValue: number;
  accentColor: "blue" | "slate" | "emerald";
}

export interface FreelancerInsight {
  profileViews: number;
  rankLabel: string;
  rankSubtitle: string;
}

export interface Skill {
  name: string;
  level: string;
  levelLabel: string;
  progress: number; // 0-100
  color: string; // tailwind color class
}

export interface FreelancerHomeData {
  summary: FreelancerDashboardSummary;
  proposals: FreelancerProposal[];
  insight: FreelancerInsight;
  skills: Skill[];
  profileViewGrowth: string; // e.g. "24%"
  workspaceSynced: boolean;
}

// ============================================================================
// PROPS
// ============================================================================

type FreelancerHomeProps = {
  userEmail?: string | null;
  /** Dados vindos do banco de dados. Se não fornecido, a UI renderiza estados de carregamento. */
  data?: FreelancerHomeData | null;
  isLoading?: boolean;
  error?: string | null;
  /** Callbacks de ação */
  onViewProposals?: () => void;
  onViewSavedJobs?: () => void;
  onViewAllProposals?: () => void;
  onRetakeAssessments?: () => void;
  onUpdatePortfolio?: () => void;
  onViewMessages?: () => void;
};

// ============================================================================
// HELPERS
// ============================================================================

function getDisplayName(userEmail?: string | null) {
  if (!userEmail) {
    return "Alex";
  }

  const localPart = userEmail.split("@")[0] ?? "Alex";
  const cleaned = localPart.replace(/[._-]+/g, " ").trim();
  const [firstName] = cleaned.split(" ");

  if (!firstName) {
    return "Alex";
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

function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    compactDisplay: "short",
  }).format(value);
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function StatCard({
  icon: Icon,
  eyebrow,
  value,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  eyebrow: string;
  value: string;
  tone?: "default" | "accent";
}) {
  return (
    <Card
      className={cn(
        "rounded-[2rem] border-white/70 px-1 py-1 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.35)] backdrop-blur",
        tone === "accent"
          ? "bg-linear-to-br from-blue-600 via-blue-500 to-cyan-400 text-white ring-blue-300/40"
          : "bg-white/90 text-slate-950",
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Badge
            variant="secondary"
            className={cn(
              "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em]",
              tone === "accent"
                ? "bg-white/15 text-white"
                : "bg-blue-50 text-blue-700",
            )}
          >
            {eyebrow}
          </Badge>
          <span
            className={cn(
              "flex size-10 items-center justify-center rounded-2xl",
              tone === "accent" ? "bg-white/12" : "bg-slate-100 text-blue-600",
            )}
          >
            <Icon className="size-5" />
          </span>
        </div>
      </CardHeader>
      <CardContent className="pb-5">
        <p className="font-heading text-3xl font-bold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

function ProposalStatusCard({
  proposals,
  onViewAll,
}: {
  proposals: FreelancerProposal[];
  onViewAll?: () => void;
}) {
  const statusBadgeClasses: Record<
    ProposalStatus,
    { wrapper: string; badge: string }
  > = {
    interviewing: {
      wrapper: "border-blue-200/80 bg-blue-50/80",
      badge: "bg-blue-600 text-white",
    },
    under_review: {
      wrapper: "border-slate-200 bg-slate-50/85",
      badge: "bg-slate-200 text-slate-700",
    },
    hired: {
      wrapper: "border-emerald-200 bg-emerald-50/85 text-slate-900",
      badge: "bg-emerald-600 text-white",
    },
  };

  return (
    <Card className="rounded-[2rem] border-white/70 bg-white/92 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.35)]">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
        <div>
          <CardTitle className="text-2xl font-semibold tracking-tight text-slate-950">
            Propostas ativas
          </CardTitle>
          <CardDescription className="mt-1 text-sm text-slate-500">
            Seu pipeline de oportunidades mais recentes.
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full px-3 text-blue-600 hover:bg-blue-50"
          onClick={onViewAll}
        >
          Ver tudo
        </Button>
      </CardHeader>

      <CardContent className="space-y-3 pb-5">
        {proposals.length === 0 ? (
          <div className="rounded-[1.6rem] border border-dashed border-slate-200 bg-white p-6 text-center">
            <p className="text-sm text-slate-400">
              Nenhuma proposta ativa no momento.
            </p>
          </div>
        ) : (
          proposals.map((proposal) => {
            const styles = statusBadgeClasses[proposal.status];
            return (
              <div
                key={proposal.id}
                className={cn(
                  "rounded-[1.6rem] border p-4",
                  styles.wrapper,
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xl font-semibold text-slate-950">
                      {proposal.projectName}
                    </p>
                    <p className="text-sm font-medium text-slate-500">
                      {proposal.clientName}
                    </p>
                  </div>
                  <Badge
                    className={cn("rounded-full px-3", styles.badge)}
                    variant={
                      proposal.status === "under_review"
                        ? "secondary"
                        : "default"
                    }
                  >
                    {proposal.statusLabel}
                  </Badge>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm font-medium text-slate-500">
                  <span>{proposal.subtitle}</span>
                  <span className="text-base font-semibold text-slate-950">
                    {formatCurrency(proposal.proposedValue)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function InsightCard({ insight }: { insight: FreelancerInsight }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="rounded-[2rem] border-0 bg-slate-950 px-1 text-white shadow-[0_24px_60px_-36px_rgba(15,23,42,0.65)]">
        <CardHeader className="pb-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-white/10">
            <Eye className="size-6 text-cyan-300" />
          </span>
        </CardHeader>
        <CardContent className="space-y-2 pb-6">
          <p className="font-heading text-4xl font-bold tracking-tight">
            {formatNumber(insight.profileViews)}
          </p>
          <p className="text-sm uppercase tracking-[0.22em] text-slate-400">
            Visualizações de perfil
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-[2rem] border-0 bg-linear-to-br from-blue-100 via-indigo-50 to-cyan-50 px-1 shadow-[0_24px_60px_-36px_rgba(37,99,235,0.35)]">
        <CardHeader className="pb-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-white/70 text-blue-700">
            <ShieldCheck className="size-6" />
          </span>
        </CardHeader>
        <CardContent className="space-y-2 pb-6 text-slate-950">
          <p className="font-heading text-4xl font-bold tracking-tight">
            {insight.rankLabel}
          </p>
          <p className="text-sm uppercase tracking-[0.22em] text-blue-700">
            {insight.rankSubtitle}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function SkillAssessmentCard({
  skills,
  onRetake,
}: {
  skills: Skill[];
  onRetake?: () => void;
}) {
  return (
    <Card className="rounded-[2rem] border-white/70 bg-white/92 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.35)]">
      <CardHeader className="pb-3">
        <CardTitle className="text-2xl font-semibold tracking-tight text-slate-950">
          Avaliação de habilidades
        </CardTitle>
        <CardDescription className="text-sm text-slate-500">
          Indicadores resumidos do seu posicionamento atual.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pb-6">
        {skills.map((skill) => (
          <div key={skill.name} className="space-y-2">
            <div className="flex items-center justify-between text-sm font-medium text-slate-600">
              <span>{skill.name}</span>
              <span className={cn("text-blue-600", skill.color)}>
                {skill.levelLabel}
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-200">
              <div
                className={cn("h-2 rounded-full", skill.color.replace("text-", "bg-"))}
                style={{ width: `${skill.progress}%` }}
              />
            </div>
          </div>
        ))}

        <Button
          variant="outline"
          className="h-11 w-full rounded-full border-blue-200 text-blue-700 hover:bg-blue-50"
          onClick={onRetake}
        >
          Refazer avaliações
        </Button>
      </CardContent>
    </Card>
  );
}

function VisibilityBanner() {
  return (
    <div className="flex items-center gap-3 rounded-[1.6rem] border border-blue-200/60 bg-blue-50/70 px-5 py-4 text-sm text-blue-800 backdrop-blur">
      <Sparkles className="size-5 shrink-0 text-blue-600" />
      <p>
        Dica: perfis com portfolio atualizado recebem{" "}
        <span className="font-semibold">até 3x mais visualizações</span> dos
        publishers.
      </p>
    </div>
  );
}

// ============================================================================
// SKELETON / LOADING STATES
// ============================================================================

function StatCardSkeleton({ tone = "default" }: { tone?: "default" | "accent" }) {
  return (
    <Card
      className={cn(
        "rounded-[2rem] border-white/70 px-1 py-1 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.35)] backdrop-blur",
        tone === "accent"
          ? "bg-linear-to-br from-blue-600 via-blue-500 to-cyan-400"
          : "bg-white/90",
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="h-5 w-24 animate-pulse rounded-full bg-slate-300/40" />
          <div className="size-10 animate-pulse rounded-2xl bg-slate-300/40" />
        </div>
      </CardHeader>
      <CardContent className="pb-5">
        <div className="h-8 w-20 animate-pulse rounded-lg bg-slate-300/40" />
      </CardContent>
    </Card>
  );
}

function ProposalsSkeleton() {
  return (
    <Card className="rounded-[2rem] border-white/70 bg-white/92 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.35)]">
      <CardHeader className="pb-3">
        <div className="h-6 w-40 animate-pulse rounded-lg bg-slate-300/40" />
        <div className="mt-1 h-3 w-56 animate-pulse rounded-full bg-slate-300/40" />
      </CardHeader>
      <CardContent className="space-y-3 pb-5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-[1.6rem] border border-slate-200 bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="h-5 w-32 animate-pulse rounded-full bg-slate-300/40" />
                <div className="h-3 w-24 animate-pulse rounded-full bg-slate-300/40" />
              </div>
              <div className="h-5 w-20 animate-pulse rounded-full bg-slate-300/40" />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="h-3 w-28 animate-pulse rounded-full bg-slate-300/40" />
              <div className="h-5 w-16 animate-pulse rounded-full bg-slate-300/40" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function InsightsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="rounded-[2rem] border-0 bg-slate-950 px-1 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.65)]">
        <CardHeader className="pb-3">
          <div className="size-12 animate-pulse rounded-2xl bg-white/10" />
        </CardHeader>
        <CardContent className="space-y-2 pb-6">
          <div className="h-8 w-16 animate-pulse rounded-lg bg-white/10" />
          <div className="h-3 w-32 animate-pulse rounded-full bg-white/10" />
        </CardContent>
      </Card>
      <Card className="rounded-[2rem] border-0 bg-linear-to-br from-blue-100 via-indigo-50 to-cyan-50 px-1 shadow-[0_24px_60px_-36px_rgba(37,99,235,0.35)]">
        <CardHeader className="pb-3">
          <div className="size-12 animate-pulse rounded-2xl bg-slate-300/40" />
        </CardHeader>
        <CardContent className="space-y-2 pb-6">
          <div className="h-8 w-24 animate-pulse rounded-lg bg-slate-300/40" />
          <div className="h-3 w-28 animate-pulse rounded-full bg-slate-300/40" />
        </CardContent>
      </Card>
    </div>
  );
}

function SkillsSkeleton() {
  return (
    <Card className="rounded-[2rem] border-white/70 bg-white/92 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.35)]">
      <CardHeader className="pb-3">
        <div className="h-6 w-48 animate-pulse rounded-lg bg-slate-300/40" />
        <div className="mt-1 h-3 w-56 animate-pulse rounded-full bg-slate-300/40" />
      </CardHeader>
      <CardContent className="space-y-5 pb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-3 w-28 animate-pulse rounded-full bg-slate-300/40" />
              <div className="h-3 w-20 animate-pulse rounded-full bg-slate-300/40" />
            </div>
            <div className="h-2 animate-pulse rounded-full bg-slate-200">
              <div className="h-2 w-2/3 animate-pulse rounded-full bg-slate-300/40" />
            </div>
          </div>
        ))}
        <div className="h-11 animate-pulse rounded-full bg-slate-300/40" />
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function FreelancerHome({
  userEmail,
  data,
  isLoading = false,
  error,
  onViewProposals,
  onViewSavedJobs,
  onViewAllProposals,
  onRetakeAssessments,
  onUpdatePortfolio,
  onViewMessages,
}: FreelancerHomeProps) {
  const displayName = getDisplayName(userEmail);

  const fallbackData: FreelancerHomeData = {
    summary: {
      monthlyRevenue: 0,
      jobSuccessRate: 0,
    },
    proposals: [
      {
        id: "1",
        projectName: "Visualização Arquitetônica 3D",
        clientName: "Nexus Build Ltd.",
        status: "interviewing",
        statusLabel: "Em entrevista",
        subtitle: "Feedback em andamento",
        proposedValue: 4200,
        accentColor: "blue",
      },
      {
        id: "2",
        projectName: "App Social iOS",
        clientName: "Swift Labs",
        status: "under_review",
        statusLabel: "Em análise",
        subtitle: "Resposta esperada hoje",
        proposedValue: 12000,
        accentColor: "slate",
      },
      {
        id: "3",
        projectName: "Dashboard Fullstack",
        clientName: "Fintech Global",
        status: "hired",
        statusLabel: "Contratado",
        subtitle: "Kickoff em 2 dias",
        proposedValue: 8500,
        accentColor: "emerald",
      },
    ],
    insight: {
      profileViews: 1400,
      rankLabel: "Top Rated",
      rankSubtitle: "Rank de freelancer",
    },
    skills: [
      {
        name: "UI/UX Design",
        level: "advanced",
        levelLabel: "Avançado",
        progress: 92,
        color: "text-blue-600",
      },
      {
        name: "React Development",
        level: "expert",
        levelLabel: "Especialista",
        progress: 96,
        color: "text-blue-600",
      },
      {
        name: "Gestão de Projetos",
        level: "intermediate",
        levelLabel: "Intermediário",
        progress: 72,
        color: "text-slate-500",
      },
    ],
    profileViewGrowth: "24%",
    workspaceSynced: true,
  };

  const resolvedData =
    data ?? {
      ...fallbackData,
      proposals: [],
      insight: {
        profileViews: 0,
        rankLabel: "Perfil ativo",
        rankSubtitle: "Rank de freelancer",
      },
      skills: [],
      profileViewGrowth: "0%",
      workspaceSynced: false,
    };

  return (
    <div className="relative overflow-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#f6f8fc_28%,#f8fafc_100%)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.16),transparent_36%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.14),transparent_30%)]" />

      {/* ── HERO SECTION ── */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="container relative mx-auto px-6 py-10 lg:px-10"
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_380px]">
          <div className="space-y-6">
            <Card className="rounded-[2.5rem] border-white/70 bg-white/82 px-2 shadow-[0_30px_80px_-42px_rgba(15,23,42,0.32)] backdrop-blur-xl">
              <CardContent className="px-6 py-7 md:px-8 md:py-8">
                <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
                  <div className="max-w-2xl space-y-5">
                    <Badge className="rounded-full bg-blue-50 px-3 text-blue-700">
                      <BadgeCheck />
                      Verificado
                    </Badge>

                    <div className="space-y-3">
                      <h1 className="font-heading text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
                        Bem-vindo de volta, {displayName}
                      </h1>
                      <p className="max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
                        Seu perfil recebeu{" "}
                        <span className="font-semibold text-blue-600">
                          {resolvedData.profileViewGrowth} mais visualizações
                        </span>{" "}
                        nesta semana. Continue construindo tração com propostas
                        mais fortes e respostas mais rápidas.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button
                        className="h-12 rounded-full bg-slate-950 px-6 text-white hover:bg-slate-900"
                        onClick={onViewProposals}
                      >
                        <Target className="size-4" />
                        Minhas propostas
                      </Button>
                      <Button
                        variant="outline"
                        className="h-12 rounded-full border-white bg-white/80 px-6 text-slate-700 hover:bg-slate-50"
                        onClick={onViewSavedJobs}
                      >
                        <Heart className="size-4" />
                        Vagas salvas
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:w-[320px] xl:grid-cols-1">
                    {isLoading ? (
                      <>
                        <StatCardSkeleton tone="accent" />
                        <StatCardSkeleton />
                      </>
                    ) : (
                      <>
                        <StatCard
                          icon={CircleDollarSign}
                          eyebrow="Receita mensal"
                          value={formatCurrency(resolvedData.summary.monthlyRevenue)}
                          tone="accent"
                        />
                        <StatCard
                          icon={Star}
                          eyebrow="Taxa de sucesso"
                          value={`${resolvedData.summary.jobSuccessRate}%`}
                        />
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <VisibilityBanner />
          </div>

          <div className="space-y-6">
            {isLoading ? (
              <>
                <ProposalsSkeleton />
                <InsightsSkeleton />
                <SkillsSkeleton />
              </>
            ) : (
              <>
                <ProposalStatusCard
                  proposals={resolvedData.proposals}
                  onViewAll={onViewAllProposals}
                />
                <InsightCard insight={resolvedData.insight} />
                <SkillAssessmentCard
                  skills={resolvedData.skills}
                  onRetake={onRetakeAssessments}
                />
              </>
            )}
          </div>
        </div>
      </motion.section>

      {/* ── FEATURED JOBS SECTION ── */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.08, ease: "easeOut" }}
        className="container relative mx-auto px-6 pb-16 lg:px-10"
      >
        {error ? (
          <div className="mb-6 rounded-[1.6rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            {error}
          </div>
        ) : null}

        <div className="mb-6 flex flex-col gap-4 rounded-[2rem] border border-white/70 bg-white/75 px-6 py-5 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.28)] backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
              Vagas para você
            </p>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-slate-950">
              Combine seu perfil com oportunidades mais aderentes
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 font-medium">
              <BriefcaseBusiness className="size-4 text-blue-600" />
              Matching inteligente
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 font-medium">
              <MessageSquareMore className="size-4 text-blue-600" />
              Feedback rápido
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 font-medium">
              <Bell className="size-4 text-blue-600" />
              Alertas ativos
            </span>
          </div>
        </div>

        <FeaturedJobsSection />
      </motion.section>

      {/* ── WORKSPACE STATUS FOOTER ── */}
      <section className="container mx-auto px-6 pb-16 lg:px-10">
        <Card className="rounded-[2rem] border-white/70 bg-white/85 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.26)]">
          <CardContent className="flex flex-col gap-6 px-6 py-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Avatar size="lg" className="bg-blue-100">
                <AvatarFallback className="bg-blue-100 font-semibold text-blue-700">
                  UF
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-semibold text-slate-950">
                  Seu workspace está sincronizado
                </p>
                <p className="text-sm text-slate-500">
                  Continue respondendo mensagens e atualizando portfólio para
                  manter o momentum.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Separator
                orientation="vertical"
                className="hidden h-12 bg-slate-200 md:block"
              />
              <Button
                variant="outline"
                className="h-11 rounded-full border-slate-200 px-5 text-slate-700 hover:bg-slate-50"
                onClick={onUpdatePortfolio}
              >
                Atualizar portfólio
              </Button>
              <Button
                className="h-11 rounded-full bg-blue-600 px-5 text-white hover:bg-blue-700"
                onClick={onViewMessages}
              >
                Ver mensagens
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
