"use client";

import type React from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import FeaturedJobsSection from "@/components/home/FeaturedJobsSection";
import InteractiveMarquee from "@/components/home/InteractiveMarquee";
import QuickActionMenu from "@/components/home/QuickActionMenu";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { FreelancerHome } from "@/app/freelancerHome";
import { PublisherHome } from "@/app/publisherHome";
import type { UserRole } from "@/types/nav";
import { useAuth } from "@/contexts/AuthContext";
import { getApiErrorMessage } from "@/lib/api-errors";
import {
  EMPTY_FREELANCER_HOME_DATA,
  getFreelancerHomeData,
} from "@/lib/freelancer-home-service";
import {
  EMPTY_PUBLISHER_HOME_DATA,
  getPublisherHomeData,
} from "@/lib/publisher-home-service";

function GuestHome() {
  return (
    <>
      <section className="container mx-auto space-y-6 px-8 pb-8 pt-6">
        <div className="space-y-3">
          <h1 className="font-heading text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
            Bem vindo ao uFreela
          </h1>
          <p className="max-w-2xl text-sm font-medium text-slate-500 md:text-base">
            Uma plataforma de oportunidades de trabalho feita para a comunidade
            acadêmica. Conectamos estudantes talentosos a empresas com projetos
            inovadores, fortalecendo o ecossistema de tecnologia e inovação.
          </p>
        </div>
      </section>

      <InteractiveMarquee />
      <FeaturedJobsSection />
      <QuickActionMenu />
    </>
  );
}

function GuestHomeSkeleton() {
  return (
    <>
      <section className="container mx-auto space-y-6 px-8 pb-8 pt-6">
        <div className="space-y-3">
          <Skeleton className="h-11 w-72 md:w-96" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full max-w-2xl" />
            <Skeleton className="h-4 w-5/6 max-w-2xl" />
            <Skeleton className="h-4 w-2/3 max-w-2xl" />
          </div>
        </div>
      </section>

      <section className="relative flex w-full flex-col items-center justify-center overflow-hidden bg-slate-50 py-20">
        <div className="mb-10 px-4 text-center">
          <Skeleton className="mx-auto h-9 w-56" />
          <Skeleton className="mx-auto mt-4 h-4 w-80 max-w-full" />
        </div>
        <div className="flex w-full gap-4 overflow-hidden px-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="min-w-[260px] rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:min-w-[300px]"
            >
              <div className="mb-4 flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-8 py-16">
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="h-fit space-y-8 rounded-[2rem] border border-slate-200 bg-white/70 p-6 shadow-sm">
            <Skeleton className="h-6 w-24" />
            <div className="space-y-4">
              <Skeleton className="h-3 w-28" />
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-32" />
              ))}
            </div>
            <div className="space-y-4">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-10 w-full rounded-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-3 w-28" />
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-32" />
              ))}
            </div>
          </aside>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-9 w-56" />
              <Skeleton className="h-5 w-32" />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <article
                key={i}
                className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1 space-y-5">
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
                  <div className="flex items-end justify-between gap-6 lg:flex-col lg:items-end">
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
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function AdminHome() {
  return (
    <section className="container mx-auto space-y-4 px-8 py-10">
      <h1 className="font-heading text-4xl font-bold tracking-tight text-slate-950">
        Painel Administrativo
      </h1>
      <p className="max-w-2xl text-sm font-medium text-slate-500 md:text-base">
        Supervise usuários, vagas e relatórios da plataforma a partir de uma
        visão centralizada.
      </p>
    </section>
  );
}

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const {
    data: freelancerHomeData,
    isLoading: isLoadingFreelancerHome,
    error: freelancerHomeError,
  } = useQuery({
    queryKey: ["freelancer-home", user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error("Freelancer não autenticado.");
      }

      return getFreelancerHomeData(user.id);
    },
    enabled: user?.role === "freelancer" && Boolean(user?.id),
    retry: false,
  });
  const {
    data: publisherHomeData,
    isLoading: isLoadingPublisherHome,
    error: publisherHomeError,
  } = useQuery({
    queryKey: ["publisher-home", user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error("Publisher não autenticado.");
      }

      return getPublisherHomeData(user.id);
    },
    enabled: user?.role === "publisher" && Boolean(user?.id),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
        <Navbar role="guest" />
        <main className="flex-1 pb-32 md:pb-8">
          <GuestHomeSkeleton />
        </main>
        <Footer />
      </div>
    );
  }

  const roleContent: Record<UserRole, React.ReactNode> = {
    guest: <GuestHome />,
    freelancer: (
      <FreelancerHome
        userDisplayName={user?.display_name || user?.first_name}
        onViewProposals={() =>
          user?.id && router.push(`/profile/freelancer/${user.id}/proposals`)
        }
        onViewAllProposals={() =>
          user?.id && router.push(`/profile/freelancer/${user.id}/proposals`)
        }
        onViewSavedJobs={() => router.push("/jobs")}
        onRetakeAssessments={() => router.push("/welcome/freelancer")}
        onUpdatePortfolio={() =>
          user?.id && router.push(`/profile/freelancer/${user.id}/settings`)
        }
        data={
          freelancerHomeData ??
          (isLoadingFreelancerHome || freelancerHomeError
            ? EMPTY_FREELANCER_HOME_DATA
            : undefined)
        }
        isLoading={isLoadingFreelancerHome}
        error={
          freelancerHomeError
            ? getApiErrorMessage(
                freelancerHomeError,
                "Não foi possível carregar os dados do dashboard do freelancer.",
              )
            : null
        }
      />
    ),
    publisher: (
      <PublisherHome
        userDisplayName={user?.display_name || user?.first_name}
        onCreateProject={() => router.push("/jobs/post")}
        onPostJob={() => router.push("/jobs/post")}
        onViewCandidates={() => router.push("/hire")}
        onViewAllProposals={() =>
          user?.id && router.push(`/profile/publisher/${user.id}/opportunities`)
        }
        onOpenAnalytics={() =>
          user?.id && router.push(`/profile/publisher/${user.id}/opportunities`)
        }
        data={
          publisherHomeData ??
          (isLoadingPublisherHome || publisherHomeError
            ? EMPTY_PUBLISHER_HOME_DATA
            : undefined)
        }
        isLoading={isLoadingPublisherHome}
        error={
          publisherHomeError
            ? getApiErrorMessage(
                publisherHomeError,
                "Não foi possível carregar os dados do dashboard do publisher.",
              )
            : null
        }
      />
    ),
    admin: <AdminHome />,
  };

  const activeRole: UserRole =
    user?.role && user.role in roleContent ? user.role : "guest";
    
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Navbar role={activeRole} />
      <main className="flex-1 pb-32 md:pb-8">{roleContent[activeRole]}</main>
      <Footer />
    </div>
  );
}
