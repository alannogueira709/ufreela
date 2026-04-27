"use client";

import type React from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import FeaturedJobsSection from "@/components/home/FeaturedJobsSection";
import InteractiveMarquee from "@/components/home/InteractiveMarquee";
import QuickActionMenu from "@/components/home/QuickActionMenu";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
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
            academica. Conectamos estudantes talentosos a empresas com projetos
            inovadores, fortalecendo o ecossistema de tecnologia e inovacao.
          </p>
        </div>
      </section>

      <InteractiveMarquee />
      <FeaturedJobsSection />
      <QuickActionMenu />
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
        Supervise usuarios, vagas e relatorios da plataforma a partir de uma
        visao centralizada.
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
        throw new Error("Freelancer nao autenticado.");
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
        throw new Error("Publisher nao autenticado.");
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
        
        <Footer />
      </div>
    );
  }

  const roleContent: Record<UserRole, React.ReactNode> = {
    guest: <GuestHome />,
    freelancer: (
      <FreelancerHome
        userEmail={user?.email}
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
                "Nao foi possivel carregar os dados do dashboard do freelancer.",
              )
            : null
        }
      />
    ),
    publisher: (
      <PublisherHome
        userEmail={user?.email}
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
                "Nao foi possivel carregar os dados do dashboard do publisher.",
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
