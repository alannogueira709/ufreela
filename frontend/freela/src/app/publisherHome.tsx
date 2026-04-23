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

type PublisherHomeProps = {
  userEmail?: string | null;
};

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

function ProposalPreviewCard() {
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
        >
          Ver todas
        </Button>
      </CardHeader>

      <CardContent className="space-y-3 pb-5">
        <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <Avatar className="bg-blue-100 text-blue-700">
              <AvatarFallback className="bg-blue-100 font-semibold text-blue-700">
                JS
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-slate-950">Jordan Smith</p>
              <p className="truncate text-sm text-slate-500">
                Applied for Q4 Brand Video Campaign
              </p>
            </div>
            <div className="text-right">
              <p className="text-base font-semibold text-slate-950">$4,500</p>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                2 hours ago
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <Avatar className="bg-orange-100 text-orange-700">
              <AvatarFallback className="bg-orange-100 font-semibold text-orange-700">
                LV
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-slate-950">Lydia Vance</p>
              <p className="truncate text-sm text-slate-500">
                Applied for SaaS Platform UI Audit
              </p>
            </div>
            <div className="text-right">
              <p className="text-base font-semibold text-slate-950">$2,250</p>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                5 hours ago
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <Avatar className="bg-emerald-100 text-emerald-700">
              <AvatarFallback className="bg-emerald-100 font-semibold text-emerald-700">
                DK
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-slate-950">David Koh</p>
              <p className="truncate text-sm text-slate-500">
                Applied for Webflow Development Sprint
              </p>
            </div>
            <div className="text-right">
              <p className="text-base font-semibold text-slate-950">$1,800</p>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Yesterday
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActionCard() {
  return (
    <Card className="relative overflow-hidden rounded-[2rem] border-0 bg-slate-950 text-white shadow-[0_32px_80px_-42px_rgba(15,23,42,0.8)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.24),transparent_32%),linear-gradient(145deg,rgba(37,99,235,0.14),transparent_55%)]" />
      <CardContent className="relative space-y-6 px-7 py-7">
        <div className="space-y-3">
          <Badge className="rounded-full bg-white/10 px-3 text-white">
            Quick Action
          </Badge>
          <h3 className="font-heading text-4xl font-bold tracking-tight">
            Need specific expertise?
          </h3>
          <p className="text-sm leading-7 text-slate-300">
            Lance seu proximo projeto hoje e alcance talentos mais alinhados com
            seu momento de produto.
          </p>
        </div>

        <div className="space-y-3">
          <Button className="h-12 w-full rounded-full bg-blue-600 text-white hover:bg-blue-700">
            <Plus className="size-4" />
            Post a job
          </Button>
          <Button
            variant="outline"
            className="h-12 w-full rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10"
          >
            Browse templates
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
            Join 2,000+ publishers sourcing vetted talent on Pulse.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function PublisherHome({ userEmail }: PublisherHomeProps) {
  const displayName = getPublisherName(userEmail);

  return (
    <div className="relative overflow-hidden bg-[linear-gradient(180deg,#f9fbff_0%,#f6f7fb_30%,#f8fafc_100%)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[30rem] bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_35%),radial-gradient(circle_at_top_right,rgba(125,211,252,0.16),transparent_28%)]" />

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
                      Pulse Workspace
                    </Badge>
                    <div className="space-y-3">
                      <h1 className="font-heading text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
                        Welcome back, {displayName}
                      </h1>
                      <p className="max-w-3xl text-base leading-8 text-slate-600 md:text-lg">
                        Seu ecossistema criativo segue aquecido. Centralize
                        projetos, acompanhe a chegada de talentos e mantenha o
                        time em movimento com uma experiencia mais fluida.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:w-[320px] lg:grid-cols-1">
                    <SummaryCard
                      icon={LayoutDashboard}
                      label="Active Projects"
                      value="12"
                      accent
                    />
                    <SummaryCard
                      icon={FileText}
                      label="New Proposals"
                      value="4"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button className="h-12 rounded-full bg-slate-950 px-6 text-white hover:bg-slate-900">
                    <BriefcaseBusiness className="size-4" />
                    Criar novo projeto
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 rounded-full border-white bg-white/80 px-6 text-slate-700 hover:bg-slate-50"
                  >
                    <UsersRound className="size-4" />
                    Ver candidatos
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            <SummaryCard
              icon={TrendingUp}
              label="Conversion Rate"
              value="82%"
            />
            <SummaryCard
              icon={Sparkles}
              label="Top Matches"
              value="18"
            />
            <SummaryCard icon={Star} label="Avg Rating" value="4.9" />
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.08, ease: "easeOut" }}
        className="container relative mx-auto px-6 pb-8 lg:px-10"
      >
        <div className="mb-6 flex flex-col gap-4 rounded-[2rem] border border-white/70 bg-white/75 px-6 py-5 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.28)] backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
              Curated network
            </p>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-slate-950">
              Featured talent ready for your next brief
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 font-medium">
              <UsersRound className="size-4 text-blue-600" />
              Perfis em destaque
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 font-medium">
              <MessageCircleMore className="size-4 text-blue-600" />
              Contato direto
            </span>
          </div>
        </div>
      </motion.section>

      <InteractiveMarquee />

      <section className="container mx-auto px-6 pb-16 pt-8 lg:px-10">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
          <ProposalPreviewCard />

          <div className="space-y-6">
            <QuickActionCard />

            <Card className="rounded-[2rem] border-white/70 bg-white/92 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.35)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-2xl font-semibold tracking-tight text-slate-950">
                  Hiring pulse
                </CardTitle>
                <CardDescription className="text-sm text-slate-500">
                  Sinais rapidos para ajudar na decisao do dia.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pb-6">
                <div className="rounded-[1.4rem] bg-slate-100 p-4">
                  <p className="text-sm font-medium text-slate-500">
                    Response time
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-slate-950">
                    1h 24m
                  </p>
                </div>
                <div className="rounded-[1.4rem] bg-blue-50 p-4">
                  <p className="text-sm font-medium text-blue-700">
                    Shortlist growth
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-slate-950">
                    +6 perfis esta semana
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="h-11 w-full rounded-full border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Abrir analytics
                  <ArrowRight className="size-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
