"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import {
  ArrowUpRight,
  BadgeCheck,
  Bookmark,
  Briefcase,
  Building2,
  CheckCircle,
  Clock,
  DollarSign,
  Share2,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  getPublisherProfile,
  resolveMediaUrl,
  type PublisherProfileResponse,
} from "@/lib/public-service";

function StarRating({
  rating,
  count,
  size = 14,
}: {
  rating: number;
  count?: number;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={
            i < Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "text-slate-200"
          }
        />
      ))}
      {count !== undefined && (
        <span className="ml-1.5 text-[13px] text-slate-400">
          {rating} ({count} reviews)
        </span>
      )}
    </div>
  );
}

const fadeUp = (delay = 0) => ({
  initial: { y: 28, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { delay, duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
});

const fadeRight = (delay = 0) => ({
  initial: { x: 28, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  transition: { delay, duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
});

function EmptySection({
  title,
  description,
  delay,
}: {
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <motion.div {...fadeUp(delay)}>
      <Card className="rounded-3xl border-0 shadow-[0_16px_48px_-16px_rgba(15,23,42,0.07)]">
        <CardContent className="p-8">
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-slate-500">
            {description}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function PublisherProfilePage() {
  const params = useParams<{ id: string }>();
  const userId = params?.id;
  const [profile, setProfile] = useState<PublisherProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const loadProfile = async () => {
      try {
        const data = await getPublisherProfile(userId);
        if (isMounted) {
          setProfile(data);
        }
      } catch {
        if (isMounted) {
          setProfile(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const companyName = useMemo(() => {
    return profile?.company_name || "Publicador";
  }, [profile]);

  const responsibleName = useMemo(() => {
    const firstName = profile?.name ?? "";
    const lastName = profile?.last_name ?? "";
    return `${firstName} ${lastName}`.trim() || "Responsavel nao informado";
  }, [profile]);

  const initials = useMemo(() => {
    return companyName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }, [companyName]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 antialiased">
        <Navbar role="publisher" />
        <main className="mx-auto max-w-7xl px-6 pb-20 pt-8 lg:px-8">
          <Card className="overflow-hidden rounded-3xl border-0 shadow-[0_24px_64px_-20px_rgba(15,23,42,0.1)]">
            <div className="relative h-44 animate-pulse bg-slate-200 lg:h-52" />
            <div className="relative px-8 pb-10 pt-4">
              <div className="absolute -top-16 flex items-end lg:-top-20">
                <Skeleton className="h-32 w-32 rounded-lg border-4 border-white lg:h-40 lg:w-40" />
                <div className="ml-5 pb-2">
                  <Skeleton className="mb-2 h-8 w-48" />
                  <Skeleton className="h-5 w-32" />
                </div>
              </div>
              <div className="mt-20 space-y-6 lg:mt-24">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex gap-3">
                  <Skeleton className="h-8 w-24 rounded-full" />
                  <Skeleton className="h-8 w-24 rounded-full" />
                </div>
              </div>
            </div>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 antialiased">
      <Navbar role="publisher" />

      <main className="mx-auto max-w-7xl px-6 pb-20 pt-8 lg:px-8">
        <motion.div {...fadeUp(0)}>
          <Card className="overflow-hidden rounded-3xl border-0 shadow-[0_24px_64px_-20px_rgba(15,23,42,0.1)]">
            <div className="relative h-44 bg-linear-to-br from-slate-800 via-slate-700 to-slate-900 lg:h-52">
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 20% 50%, rgba(99,102,241,.6) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(37,99,235,.5) 0%, transparent 45%)",
                }}
              />
              <div className="absolute right-6 top-5 flex gap-2">
                {[{ icon: Share2, label: "Compartilhar" }, { icon: Bookmark, label: "Salvar" }].map((action) => (
                  <Button
                    key={action.label}
                    size="sm"
                    variant="outline"
                    className="h-9 rounded-full border-white/30 bg-white/15 px-4 text-xs font-semibold text-white backdrop-blur-sm hover:bg-white/25"
                  >
                    <action.icon size={13} className="mr-1.5" />
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>

            <CardContent className="relative -mt-16 px-8 pb-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
                <div className="relative w-fit">
                  <Avatar className="h-28 w-28 rounded-2xl border-4 border-white shadow-[0_16px_48px_-12px_rgba(15,23,42,0.2)]">
                    <AvatarImage src={resolveMediaUrl(profile?.profile_img) ?? undefined} />
                    <AvatarFallback className="rounded-2xl bg-slate-100 text-xl font-bold text-slate-700">
                      {initials || "PB"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 ring-2 ring-white">
                    <BadgeCheck size={14} className="text-white" />
                  </span>
                </div>

                <div className="flex-1 pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-[1.9rem] font-bold tracking-tight text-slate-950">
                      {companyName}
                    </h1>
                    <Badge className="rounded-full bg-blue-50 px-3 py-0.5 text-xs font-bold text-blue-700 ring-1 ring-blue-100">
                      Perfil Publico
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-[15px] text-slate-500">
                    Responsavel: {responsibleName}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                      <Building2 size={13} />
                      Empresa cadastrada na plataforma
                    </span>
                    <StarRating rating={Number(profile?.mean_eval ?? 0)} size={13} />
                  </div>
                </div>

                <div className="flex gap-2.5 pb-1">
                  <Button
                    variant="outline"
                    className="h-11 rounded-full border-slate-200 px-6 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Contato
                  </Button>
                  <Button className="h-11 rounded-full bg-blue-600 px-7 text-sm font-semibold text-white shadow-[0_8px_28px_-8px_rgba(37,99,235,.5)] hover:bg-blue-700">
                    Publicar Vaga
                    <ArrowUpRight size={15} className="ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="mt-7 grid gap-7 lg:grid-cols-[1fr_300px]">
          <div className="space-y-7">
            <EmptySection
              title="Sobre a Empresa"
              description="Ainda nao existem detalhes adicionais cadastrados para esta empresa no banco de dados."
              delay={0.08}
            />

            <EmptySection
              title="Workflow Ativo"
              description="Nao ha workflow publico cadastrado para este perfil. Os cards e colunas mockados foram removidos para refletir apenas dados reais."
              delay={0.14}
            />

            <EmptySection
              title="Oportunidades Publicadas"
              description="As oportunidades deste publisher ainda nao estao sendo carregadas nesta tela a partir do banco de dados."
              delay={0.2}
            />
          </div>

          <div className="space-y-6 lg:sticky lg:top-24">
            <motion.div {...fadeRight(0.1)}>
              <Card className="overflow-hidden rounded-3xl border-0 bg-slate-950 shadow-[0_24px_64px_-16px_rgba(15,23,42,0.3)]">
                <CardContent className="p-7">
                  <div className="space-y-5">
                    {[
                      { label: "Jobs Publicados", value: "N/D", icon: Briefcase },
                      { label: "Total Investido", value: "N/D", icon: DollarSign },
                      {
                        label: "Avaliacao Media",
                        value: String(profile?.mean_eval ?? "0"),
                        icon: TrendingUp,
                      },
                    ].map((stat) => (
                      <div key={stat.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                            <stat.icon size={16} className="text-blue-400" />
                          </div>
                          <span className="text-[13px] font-medium text-slate-400">
                            {stat.label}
                          </span>
                        </div>
                        <span className="text-base font-bold text-white">
                          {stat.value}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-5 bg-white/10" />
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    </span>
                    <span className="text-[12px] font-medium text-slate-400">
                      Resumo exibindo apenas dados reais do perfil
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div {...fadeRight(0.16)}>
              <Card className="rounded-3xl border-0 shadow-[0_16px_48px_-16px_rgba(15,23,42,0.07)]">
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-slate-50 p-4 text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Avaliacao
                      </p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">
                        {Number(profile?.mean_eval ?? 0).toFixed(1)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-blue-600 p-4 text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-200">
                        Cadastro
                      </p>
                      <p className="mt-2 text-2xl font-bold text-white">OK</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div {...fadeRight(0.22)}>
              <Card className="rounded-3xl border-0 shadow-[0_16px_48px_-16px_rgba(15,23,42,0.07)]">
                <CardContent className="p-6">
                  <h3 className="text-sm font-bold text-slate-900">
                    Disponibilidade
                  </h3>
                  <div className="mt-4 space-y-3">
                    {[
                      {
                        icon: CheckCircle,
                        text: "Perfil publico disponivel",
                        color: "text-emerald-500",
                      },
                      {
                        icon: Clock,
                        text: "Sem prazo de resposta cadastrado",
                        color: "text-blue-500",
                      },
                      {
                        icon: Users,
                        text: "Sem idiomas informados",
                        color: "text-slate-400",
                      },
                    ].map((item) => (
                      <div key={item.text} className="flex items-center gap-2.5">
                        <item.icon size={14} className={item.color} />
                        <span className="text-[13px] text-slate-500">
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
