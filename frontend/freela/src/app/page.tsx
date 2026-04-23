"use client";

import type React from "react";
import FeaturedJobsSection from "@/components/home/FeaturedJobsSection";
import InteractiveMarquee from "@/components/home/InteractiveMarquee";
import QuickActionMenu from "@/components/home/QuickActionMenu";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { FreelancerHome } from "@/app/freelancerHome";
import { PublisherHome } from "@/app/publisherHome";
import type { UserRole } from "@/types/nav";
import { useAuth } from "@/contexts/AuthContext";

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
  const { user, isLoading } = useAuth();

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
    freelancer: <FreelancerHome userEmail={user?.email} />,
    publisher: <PublisherHome userEmail={user?.email} />,
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
