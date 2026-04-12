"use client";

import FeaturedJobsSection from "@/components/home/FeaturedJobsSection";
import InteractiveMarquee from "@/components/home/InteractiveMarquee";
import QuickActionMenu from "@/components/home/QuickActionMenu";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
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

function FreelancerHome() {
  return (
    <section className="container mx-auto space-y-4 px-8 py-10">
      <h1 className="font-heading text-4xl font-bold tracking-tight text-slate-950">
        Painel do Freelancer
      </h1>
      <p className="max-w-2xl text-sm font-medium text-slate-500 md:text-base">
        Acompanhe propostas enviadas, encontre novas vagas e mantenha suas
        conversas com recrutadores em dia.
      </p>
    </section>
  );
}

function PublisherHome() {
  return (
    <section className="container mx-auto space-y-4 px-8 py-10">
      <h1 className="font-heading text-4xl font-bold tracking-tight text-slate-950">
        Painel do Publicador
      </h1>
      <p className="max-w-2xl text-sm font-medium text-slate-500 md:text-base">
        Gerencie projetos, publique vagas e acompanhe candidatos interessados
        em trabalhar com sua equipe.
      </p>
    </section>
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

const roleContent: Record<UserRole, React.ReactNode> = {
  guest: <GuestHome />,
  freelancer: <FreelancerHome />,
  publisher: <PublisherHome />,
  admin: <AdminHome />,
};

export default function Home() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-slate-50">Carregando...</div>;
  }

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
