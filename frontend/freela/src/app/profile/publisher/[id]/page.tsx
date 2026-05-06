"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import {
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  Bookmark,
  Briefcase,
  Building2,
  CheckCircle,
  Clock,
  DollarSign,
  Pencil,
  Settings,
  Share2,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { getAvatarUrl } from "@/lib/avatar";
import { getPublisherProfile, toggleSavedProfile } from "@/lib/public-service";
import type { PublisherProfileResponse } from "@/lib/public-service";
import { ShareDialog } from "@/components/shared/ShareDialog";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();

  const isOwnProfile = !!user && user.id === userId;

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
          setIsSaved(data.is_saved ?? false);
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
    return `${firstName} ${lastName}`.trim() || "Responsável não informado";
  }, [profile]);

  const initials = useMemo(() => {
    return companyName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }, [companyName]);

  const handleSaveToggle = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para salvar perfis.");
      return;
    }

    try {
      setIsSaving(true);
      const data = await toggleSavedProfile(userId);
      setIsSaved(data.saved);
      toast.success(data.saved ? "Perfil salvo com sucesso!" : "Perfil removido dos salvos.");
    } catch {
      toast.error("Ocorreu um erro ao tentar salvar este perfil.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 antialiased">
        <Navbar role="publisher" />
        <main className="mx-auto max-w-7xl px-6 pb-20 pt-8 lg:px-8">
          <Card className="overflow-hidden rounded-3xl border-0 shadow-[0_24px_64px_-20px_rgba(15,23,42,0.1)]">
            <div className="relative h-44 animate-pulse bg-slate-200 lg:h-52" />
            <div className="relative px-8 pb-10 pt-4">
              <div className="absolute -top-16 flex items-end lg:-top-20">
                <Skeleton className="h-32 w-32 rounded-2xl border-4 border-white lg:h-40 lg:w-40" />
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
            {/* Banner — mesmo gradiente do freelancer mas com tom índigo para diferenciar */}
            <div
              className="relative h-48 overflow-hidden lg:h-56"
              style={{
                background: "linear-gradient(135deg, #312e81 0%, #4f46e5 50%, #818cf8 100%)",
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle at 20% 25%, rgba(255,255,255,0.22), transparent 34%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.15), transparent 28%)",
                }}
              />
              <div className="absolute right-6 top-5 z-10 flex gap-2">
                {isOwnProfile ? (
                  <Link
                    href={`/profile/publisher/${userId}/settings`}
                    className="inline-flex h-9 items-center gap-2 rounded-full border border-white/30 bg-white/20 px-4 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                  >
                    <Pencil size={13} />
                    Editar perfil
                  </Link>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsShareOpen(true)}
                      className="h-9 rounded-full border-white/30 bg-white/20 px-4 text-xs font-semibold text-white backdrop-blur-sm hover:bg-white/30"
                    >
                      <Share2 size={13} className="mr-1.5" />
                      Compartilhar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleSaveToggle}
                      disabled={isSaving}
                      className={`h-9 rounded-full border-white/30 px-4 text-xs font-semibold text-white backdrop-blur-sm hover:bg-white/30 ${isSaved ? "bg-white/40" : "bg-white/20"}`}
                    >
                      <Bookmark size={13} className={`mr-1.5 ${isSaved ? "fill-current" : ""}`} />
                      {isSaved ? "Salvo" : "Salvar"}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Info section */}
            <CardContent className="px-6 pb-8 pt-0 sm:px-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                {/* Left: Avatar + Info */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                  {/* Avatar */}
                  <div className="relative -mt-14 shrink-0 self-start sm:-mt-16">
                    <div className="rounded-2xl bg-white p-1.5 shadow-[0_16px_48px_-12px_rgba(15,23,42,0.22)]">
                      <Avatar className="h-24 w-24 rounded-2xl border-0 sm:h-28 sm:w-28">
                        <AvatarImage
                          src={getAvatarUrl(profile?.email, profile?.profile_img)}
                          className="h-full w-full rounded-2xl object-cover"
                        />
                        <AvatarFallback className="rounded-2xl bg-indigo-100 text-xl font-bold text-indigo-700">
                          {initials || "PB"}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 ring-2 ring-white">
                      <BadgeCheck size={14} className="text-white" />
                    </span>
                  </div>

                  {/* Name and details */}
                  <div className="pt-0 sm:pb-2 sm:pt-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-[1.75rem] font-bold tracking-tight text-slate-950 sm:text-[1.9rem]">
                        {companyName}
                      </h1>
                    </div>
                    <p className="mt-0.5 text-[15px] text-slate-600">
                      Responsável: {responsibleName}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-4">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                        <Building2 size={13} />
                        Empresa cadastrada na plataforma
                      </span>
                      <StarRating rating={Number(profile?.mean_eval ?? 0)} size={13} />
                    </div>
                  </div>
                </div>

                {/* Right: Action buttons */}
                <div className="flex gap-2.5 pt-0 sm:pt-4">
                  {isOwnProfile ? (
                    <Link
                      href={`/profile/publisher/${userId}/settings`}
                      className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-100"
                    >
                      <Settings size={16} />
                      Configurações
                    </Link>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        className="h-11 rounded-full border-slate-200 px-6 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Contato
                      </Button>
                      <Button className="h-11 rounded-full bg-indigo-600 px-7 text-sm font-semibold text-white shadow-[0_8px_28px_-8px_rgba(79,70,229,.5)] hover:bg-indigo-700">
                        Publicar Vaga
                        <ArrowUpRight size={15} className="ml-1" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="mt-7 grid gap-7 lg:grid-cols-[1fr_320px]">
          <div className="space-y-7">
            <EmptySection
              title="Sobre a Empresa"
              description="Ainda não existem detalhes adicionais cadastrados para esta empresa no banco de dados."
              delay={0.08}
            />

            <motion.div {...fadeUp(0.14)}>
              <Card className="rounded-3xl border-0 shadow-[0_16px_48px_-16px_rgba(15,23,42,0.07)]">
                <CardContent className="p-8">
                  <h2 className="text-base font-bold text-slate-900">
                    Oportunidades Publicadas
                  </h2>
                  {profile?.opportunities.length ? (
                    <div className="mt-5 space-y-3">
                      {profile.opportunities.map((opportunity) => (
                        <Link
                          key={opportunity.opportunity_id}
                          href={`/jobs/${opportunity.opportunity_id}`}
                          className="block rounded-2xl bg-slate-50 px-4 py-4 transition-colors hover:bg-indigo-50"
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-semibold text-slate-900">
                                {opportunity.title}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                {opportunity.category?.category_name ?? "Sem categoria"}
                              </p>
                            </div>
                            <span className="w-fit rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                              {opportunity.status === "open" ? "Aberta" : "Fechada"}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-[15px] leading-relaxed text-slate-500">
                      Este publisher ainda não possui oportunidades publicadas.
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <EmptySection
              title="Histórico de Contratações"
              description="O histórico de projetos e avaliações ainda não está disponível para este perfil."
              delay={0.2}
            />
          </div>

          <div className="space-y-6 lg:sticky lg:top-24">
            {/* Stats card */}
            <motion.div {...fadeRight(0.1)}>
              <Card className="overflow-hidden rounded-3xl border-0 bg-slate-950 shadow-[0_24px_64px_-16px_rgba(15,23,42,0.3)]">
                <CardContent className="p-7">
                  <div className="space-y-5">
                    {[
                      { label: "Jobs Publicados", value: "N/D", icon: Briefcase },
                      { label: "Total Investido", value: "N/D", icon: DollarSign },
                      {
                        label: "Avaliação Média",
                        value: String(profile?.mean_eval ?? "0"),
                        icon: TrendingUp,
                      },
                    ].map((stat) => (
                      <div key={stat.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                            <stat.icon size={16} className="text-indigo-400" />
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
                      Exibindo apenas dados reais do perfil
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Info card */}
            <motion.div {...fadeRight(0.16)}>
              <Card className="rounded-3xl border-0 shadow-[0_16px_48px_-16px_rgba(15,23,42,0.07)]">
                <CardContent className="p-6">
                  <h3 className="text-sm font-bold text-slate-900">
                    Informações
                  </h3>
                  <div className="mt-4 space-y-3">
                    {[
                      {
                        icon: CheckCircle,
                        text: "Perfil público disponível",
                        color: "text-emerald-500",
                      },
                      {
                        icon: Clock,
                        text: "Sem prazo de resposta cadastrado",
                        color: "text-indigo-500",
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

            {/* Actions card — only for visitors */}
            {!isOwnProfile && (
              <motion.div {...fadeRight(0.22)}>
                <Card className="rounded-3xl border-0 shadow-[0_16px_48px_-16px_rgba(15,23,42,0.07)]">
                  <CardContent className="p-4">
                    <button
                      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
                      onClick={() => setIsShareOpen(true)}
                    >
                      <Share2 size={15} className="text-indigo-600" />
                      Compartilhar Perfil
                    </button>
                    <button
                      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
                      onClick={handleSaveToggle}
                    >
                      <Bookmark size={15} className="text-indigo-600" />
                      {isSaved ? "Remover dos Salvos" : "Salvar Perfil"}
                    </button>
                    <button
                      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
                      onClick={() => console.log("Ver resumo")}
                    >
                      <BarChart3 size={15} className="text-indigo-600" />
                      Ver resumo público
                    </button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <ShareDialog
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        url={typeof window !== "undefined" ? window.location.href : ""}
        title={`Confira o perfil de ${companyName} na Ufreela!`}
      />
    </div>
  );
}
