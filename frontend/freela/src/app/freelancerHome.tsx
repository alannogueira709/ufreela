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

type FreelancerHomeProps = {
  userEmail?: string | null;
};

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

function ProposalStatusCard() {
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
        >
          Ver tudo
        </Button>
      </CardHeader>

      <CardContent className="space-y-3 pb-5">
        <div className="rounded-[1.6rem] border border-blue-200/80 bg-blue-50/80 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xl font-semibold text-slate-950">
                3D Architectural Viz
              </p>
              <p className="text-sm font-medium text-slate-500">Nexus Build Ltd.</p>
            </div>
            <Badge className="rounded-full bg-blue-600 px-3 text-white">
              Interviewing
            </Badge>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm font-medium text-slate-500">
            <span>Feedback em andamento</span>
            <span className="text-base font-semibold text-slate-950">$4,200</span>
          </div>
        </div>

        <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50/85 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xl font-semibold text-slate-950">iOS Social App</p>
              <p className="text-sm font-medium text-slate-500">Swift Labs</p>
            </div>
            <Badge
              variant="secondary"
              className="rounded-full bg-slate-200 text-slate-700"
            >
              Under Review
            </Badge>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm font-medium text-slate-500">
            <span>Resposta esperada hoje</span>
            <span className="text-base font-semibold text-slate-950">$12,000</span>
          </div>
        </div>

        <div className="rounded-[1.6rem] border border-emerald-200 bg-emerald-50/85 p-4 text-slate-900">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xl font-semibold">Fullstack Dashboard</p>
              <p className="text-sm font-medium text-slate-500">Fintech Global</p>
            </div>
            <Badge className="rounded-full bg-emerald-600 px-3 text-white">
              Hired
            </Badge>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm font-medium text-slate-500">
            <span>Kickoff em 2 dias</span>
            <span className="text-base font-semibold text-slate-950">$8,500</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InsightCard() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="rounded-[2rem] border-0 bg-slate-950 px-1 text-white shadow-[0_24px_60px_-36px_rgba(15,23,42,0.65)]">
        <CardHeader className="pb-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-white/10">
            <Eye className="size-6 text-cyan-300" />
          </span>
        </CardHeader>
        <CardContent className="space-y-2 pb-6">
          <p className="font-heading text-4xl font-bold tracking-tight">1.4k</p>
          <p className="text-sm uppercase tracking-[0.22em] text-slate-400">
            Visualizacoes de perfil
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
            Top Rated
          </p>
          <p className="text-sm uppercase tracking-[0.22em] text-blue-700">
            Freelancer rank
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function SkillAssessmentCard() {
  return (
    <Card className="rounded-[2rem] border-white/70 bg-white/92 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.35)]">
      <CardHeader className="pb-3">
        <CardTitle className="text-2xl font-semibold tracking-tight text-slate-950">
          Skill assessment
        </CardTitle>
        <CardDescription className="text-sm text-slate-500">
          Indicadores resumidos do seu posicionamento atual.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pb-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm font-medium text-slate-600">
            <span>UI/UX Design</span>
            <span className="text-blue-600">Advanced</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200">
            <div className="h-2 w-[92%] rounded-full bg-blue-600" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm font-medium text-slate-600">
            <span>React Development</span>
            <span className="text-blue-600">Expert</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200">
            <div className="h-2 w-[96%] rounded-full bg-blue-600" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm font-medium text-slate-600">
            <span>Project Management</span>
            <span className="text-slate-500">Intermediate</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200">
            <div className="h-2 w-[72%] rounded-full bg-slate-400" />
          </div>
        </div>

        <Button
          variant="outline"
          className="h-11 w-full rounded-full border-blue-200 text-blue-700 hover:bg-blue-50"
        >
          Refazer avaliacoes
        </Button>
      </CardContent>
    </Card>
  );
}

function VisibilityBanner() {
  return (
    <Card className="relative overflow-hidden rounded-[2.2rem] border-0 bg-slate-950 text-white shadow-[0_32px_80px_-42px_rgba(15,23,42,0.7)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.28),transparent_35%),linear-gradient(135deg,rgba(30,41,59,0.3),transparent_60%)]" />
      <CardContent className="relative flex flex-col gap-6 px-8 py-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl space-y-3">
          <Badge className="rounded-full bg-white/10 px-3 text-white">
            Pulse Plus
          </Badge>
          <h2 className="font-heading text-3xl font-bold tracking-tight">
            Boost your visibility by 50%
          </h2>
          <p className="text-sm leading-7 text-slate-300">
            Atualize seu perfil para desbloquear badges corporativos, prioridade
            nas buscas e convites mais qualificados.
          </p>
        </div>

        <Button className="h-12 rounded-full bg-linear-to-r from-blue-500 to-cyan-400 px-6 text-white hover:opacity-90">
          Learn more
        </Button>
      </CardContent>
    </Card>
  );
}

export function FreelancerHome({ userEmail }: FreelancerHomeProps) {
  const displayName = getDisplayName(userEmail);

  return (
    <div className="relative overflow-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#f6f8fc_28%,#f8fafc_100%)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.16),transparent_36%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.14),transparent_30%)]" />

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
                      Pulse Workspace
                    </Badge>

                    <div className="space-y-3">
                      <h1 className="font-heading text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
                        Welcome back, {displayName}
                      </h1>
                      <p className="max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
                        Seu perfil recebeu{" "}
                        <span className="font-semibold text-blue-600">
                          24% mais visualizacoes
                        </span>{" "}
                        nesta semana. Continue construindo tracao com propostas
                        mais fortes e respostas mais rapidas.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button className="h-12 rounded-full bg-slate-950 px-6 text-white hover:bg-slate-900">
                        <Target className="size-4" />
                        Minhas propostas
                      </Button>
                      <Button
                        variant="outline"
                        className="h-12 rounded-full border-white bg-white/80 px-6 text-slate-700 hover:bg-slate-50"
                      >
                        <Heart className="size-4" />
                        Vagas salvas
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:w-[320px] xl:grid-cols-1">
                    <StatCard
                      icon={Sparkles}
                      eyebrow="Monthly Revenue"
                      value="$12,450"
                      tone="accent"
                    />
                    <StatCard
                      icon={Star}
                      eyebrow="Job Success"
                      value="98%"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <VisibilityBanner />
          </div>

          <div className="space-y-6">
            <ProposalStatusCard />
            <InsightCard />
            <SkillAssessmentCard />
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.08, ease: "easeOut" }}
        className="container relative mx-auto px-6 pb-16 lg:px-10"
      >
        <div className="mb-6 flex flex-col gap-4 rounded-[2rem] border border-white/70 bg-white/75 px-6 py-5 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.28)] backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
              Jobs for you
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
              Feedback rapido
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 font-medium">
              <Bell className="size-4 text-blue-600" />
              Alertas ativos
            </span>
          </div>
        </div>

        <FeaturedJobsSection />
      </motion.section>

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
                  Seu workspace esta sincronizado
                </p>
                <p className="text-sm text-slate-500">
                  Continue respondendo mensagens e atualizando portfolio para
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
              >
                Atualizar portfolio
              </Button>
              <Button className="h-11 rounded-full bg-blue-600 px-5 text-white hover:bg-blue-700">
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
