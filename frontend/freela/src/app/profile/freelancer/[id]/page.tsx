"use client";

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
  BadgeCheck,
  BarChart3,
  Bookmark,
  CheckCircle,
  CircleDot,
  Clock,
  DollarSign,
  Share2,
  Star,
} from "lucide-react";
import { getApiErrorMessage } from "@/lib/api-errors";
import { getAvatarUrl } from "@/lib/avatar";
import { getFreelancerProfile } from "@/lib/public-service";
import type { FreelancerProfileResponse } from "@/types/public";
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

function formatProfessionalLevel(level: string | null | undefined) {
  if (!level) {
    return "Freelancer";
  }

  const labels: Record<string, string> = {
    junior: "Freelancer Júnior",
    mid: "Freelancer Pleno",
    senior: "Freelancer Sênior",
  };

  return labels[level.toLowerCase()] ?? "Freelancer";
}

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

export default function FreelancerProfilePage() {
  const params = useParams<{ id: string }>();
  const userId = params?.id;
  const [profile, setProfile] = useState<FreelancerProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const loadProfile = async () => {
      try {
        const data = await getFreelancerProfile(userId);
        if (isMounted) {
          setProfile(data);
          setIsSaved(data.is_saved ?? false);
        }
      } catch (err) {
        if (isMounted) {
          setError(getApiErrorMessage(err));
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

  const fullName = useMemo(() => {
    const firstName = profile?.name ?? "";
    const lastName = profile?.last_name ?? "";
    return `${firstName} ${lastName}`.trim() || "Freelancer";
  }, [profile]);

  const initials = useMemo(() => {
    return fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }, [fullName]);

  const rating = Number(profile?.mean_eval ?? 0);
  const hourlyRate = Number(profile?.hourly_rate ?? 0);
  const levelLabel = formatProfessionalLevel(profile?.professional_level);

  const handleSaveToggle = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para salvar perfis.");
      return;
    }
    if (user.id === userId) {
      toast.error("Você não pode salvar a si mesmo.");
      return;
    }

    try {
      setIsSaving(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_URL}/api/users/profile/save/${userId}/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Falha ao salvar");

      const data = await res.json();
      setIsSaved(data.saved);
      toast.success(data.saved ? "Perfil salvo com sucesso!" : "Perfil removido dos salvos.");
    } catch (err) {
      toast.error("Ocorreu um erro ao tentar salvar este perfil.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 antialiased">
        <Navbar role="freelancer" />
        <main className="mx-auto max-w-7xl px-6 pb-20 pt-8 lg:px-8">
          <Card className="overflow-hidden rounded-3xl border-0 shadow-[0_24px_64px_-20px_rgba(15,23,42,0.1)]">
            <div className="relative h-44 animate-pulse bg-slate-200 lg:h-52" />
            <div className="relative px-8 pb-10 pt-4">
              <div className="absolute -top-16 flex items-end lg:-top-20">
                <Skeleton className="h-32 w-32 rounded-full border-4 border-white lg:h-40 lg:w-40" />
                <div className="ml-5 pb-2">
                  <Skeleton className="mb-2 h-8 w-48" />
                  <Skeleton className="h-5 w-32" />
                </div>
              </div>
              <div className="mt-20 space-y-6 lg:mt-24">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
                <div className="flex gap-3">
                  <Skeleton className="h-8 w-24 rounded-full" />
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
      <Navbar role="freelancer" />

      <main className="mx-auto max-w-7xl px-6 pb-20 pt-8 lg:px-8">
        <motion.div {...fadeUp(0)}>
          <Card className="overflow-hidden rounded-3xl border-0 shadow-[0_24px_64px_-20px_rgba(15,23,42,0.1)]">
            <div className="relative h-44 bg-linear-to-br from-blue-700 via-blue-600 to-indigo-500 lg:h-52">
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
                }}
              />
              <div className="absolute right-6 top-5 flex gap-2">
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
                  className={`h-9 rounded-full border-white/30 px-4 text-xs font-semibold text-white backdrop-blur-sm hover:bg-white/30 ${isSaved ? 'bg-white/40' : 'bg-white/20'}`}
                >
                  <Bookmark size={13} className={`mr-1.5 ${isSaved ? 'fill-current' : ''}`} />
                  {isSaved ? "Salvo" : "Salvar"}
                </Button>
              </div>
            </div>

            <CardContent className="relative -mt-16 px-8 pb-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
                <div className="relative w-fit">
                  <Avatar className="h-28 w-28 rounded-2xl border-4 border-white shadow-[0_16px_48px_-12px_rgba(15,23,42,0.2)]">
                    <AvatarImage src={getAvatarUrl(profile?.email, profile?.profile_img)} className="w-full h-full object-cover" />
                    <AvatarFallback className="rounded-2xl bg-blue-100 text-xl font-bold text-blue-700">
                      {initials || "FR"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-2 right-2 flex h-3.5 w-3.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                  </span>
                </div>

                <div className="flex-1 pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-[1.9rem] font-bold tracking-tight text-slate-950">
                      {fullName}
                    </h1>
                    <BadgeCheck size={22} className="text-blue-600" />
                  </div>
                  <p className="mt-0.5 text-[15px] text-slate-500">{levelLabel}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-4">
                    <StarRating
                      rating={Number.isFinite(rating) ? rating : 0}
                      count={profile?.finished_jobs ?? 0}
                      size={13}
                    />
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
                    {`Contratar ${fullName.split(" ")[0] ?? "Freelancer"}`}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="mt-7 grid gap-7 lg:grid-cols-[1fr_320px]">
          <div className="space-y-7">
            <motion.div {...fadeUp(0.08)}>
              <Card className="rounded-3xl border-0 shadow-[0_16px_48px_-16px_rgba(15,23,42,0.07)]">
                <CardContent className="p-8">
                  <h2 className="text-base font-bold text-slate-900">Sobre Mim</h2>
                  <p className="mt-4 text-[15px] leading-relaxed text-slate-500">
                    {profile?.description ||
                      "Este freelancer ainda nao adicionou uma descricao detalhada no banco de dados."}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div {...fadeUp(0.13)}>
              <Card className="rounded-3xl border-0 shadow-[0_16px_48px_-16px_rgba(15,23,42,0.07)]">
                <CardContent className="p-8">
                  <h2 className="text-base font-bold text-slate-900">Competencias</h2>
                  {profile?.skills.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {profile.skills.map((skill) => (
                        <span
                          key={skill.skill_id}
                          className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700"
                        >
                          {skill.skill_name}
                          {skill.skill_level ? ` - ${skill.skill_level}` : ""}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-[15px] leading-relaxed text-slate-500">
                      As competencias deste freelancer ainda nao foram cadastradas no banco de dados.
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <EmptySection
              title="Portfolio"
              description="Este freelancer ainda nao possui itens de portfolio cadastrados."
              delay={0.18}
            />

            <EmptySection
              title="Histórico de Trabalho e Reviews"
              description="O histórico detalhado de projetos e avaliações ainda não está disponível para este perfil."
              delay={0.23}
            />

            <EmptySection
              title="Educação"
              description="As informações acadêmicas deste freelancer ainda não foram cadastradas."
              delay={0.28}
            />
          </div>

          <div className="space-y-6 lg:sticky lg:top-24">
            <motion.div {...fadeRight(0.12)}>
              <Card className="overflow-hidden rounded-3xl border-0 bg-slate-950 shadow-[0_24px_64px_-16px_rgba(15,23,42,0.3)]">
                <CardContent className="p-7">
                  <div className="space-y-5">
                    {[
                      { label: "Total Faturado", value: "N/D", icon: DollarSign },
                      {
                        label: "Jobs Concluídos",
                        value: String(profile?.finished_jobs ?? 0),
                        icon: CheckCircle,
                      },
                      {
                        label: "Taxa/hora",
                        value:
                          hourlyRate > 0
                            ? `R$ ${hourlyRate.toFixed(2)}/hr`
                            : "N/D",
                        icon: Clock,
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
                </CardContent>
              </Card>
            </motion.div>

            <motion.div {...fadeRight(0.18)}>
              <Card className="rounded-3xl border-0 shadow-[0_16px_48px_-16px_rgba(15,23,42,0.07)]">
                <CardContent className="p-6">
                  <h3 className="text-sm font-bold text-slate-900">
                    Disponibilidade
                  </h3>
                  <div className="mt-4 space-y-3">
                    {[
                      {
                        icon: CircleDot,
                        text: "Disponível para novos projetos",
                        color: "text-emerald-500",
                      },
                      {
                        icon: Clock,
                        text:
                          hourlyRate > 0
                            ? `Taxa cadastrada: R$ ${hourlyRate.toFixed(2)}/h`
                            : "Taxa horária não informada",
                        color: "text-blue-500",
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

            <motion.div {...fadeRight(0.24)}>
              <Card className="rounded-3xl border-0 shadow-[0_16px_48px_-16px_rgba(15,23,42,0.07)]">
                <CardContent className="p-4">
                  <button
                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
                    onClick={() => setIsShareOpen(true)}
                  >
                    <Share2 size={15} className="text-blue-600" />
                    Compartilhar Perfil
                  </button>
                  <button
                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
                    onClick={handleSaveToggle}
                  >
                    <Bookmark size={15} className="text-blue-600" />
                    {isSaved ? "Remover dos Salvos" : "Salvar Perfil"}
                  </button>
                  <button
                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
                    onClick={() => console.log("Ver resumo")}
                  >
                    <BarChart3 size={15} className="text-blue-600" />
                    Ver resumo público
                  </button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
      <ShareDialog 
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        url={typeof window !== "undefined" ? window.location.href : ""}
        title={`Confira o perfil de ${fullName} na Ufreela!`}
      />
    </div>
  );
}
