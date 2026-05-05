"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import Footer from "@/components/shared/Footer";
import Navbar from "@/components/shared/Navbar";
import { useAuth } from "@/contexts/AuthContext";

type AdminPlaceholderPageProps = {
  title: string;
  description: string;
};

export function AdminPlaceholderPage({
  title,
  description,
}: AdminPlaceholderPageProps) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role !== "admin") {
      router.replace("/");
    }
  }, [isLoading, router, user]);

  if (isLoading || user?.role !== "admin") {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
        <Navbar role={user?.role ?? "guest"} />
        <main className="mx-auto flex w-full max-w-4xl flex-1 items-center px-6 py-14">
          <p className="text-sm font-medium text-slate-500">Carregando...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Navbar role="admin" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-14 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
          Admin
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">{title}</h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600">
          {description}
        </p>
      </main>
      <Footer />
    </div>
  );
}
