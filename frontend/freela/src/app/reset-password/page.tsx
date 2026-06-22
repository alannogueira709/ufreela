import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { ResetPasswordForm } from "@/components/login/reset-password-form";
import { getFeaturedCandidates } from "@/lib/public-service";

function ResetPasswordFallback() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <div className="h-9 w-64 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-5 w-full animate-pulse rounded-lg bg-slate-100" />
      </div>
      <div className="h-12 w-full animate-pulse rounded-xl bg-slate-100" />
      <div className="h-12 w-full animate-pulse rounded-xl bg-slate-100" />
    </div>
  );
}

export default async function ResetPasswordPage() {
  const featuredCandidates = await getFeaturedCandidates();

  return (
    <main className="min-h-svh bg-slate-100 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex min-h-[calc(100svh-2rem)] max-w-7xl items-center">
        <div className="grid w-full overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] md:grid-cols-[1.02fr_0.98fr]">
          <section className="relative hidden min-h-[640px] overflow-hidden bg-slate-950 md:flex md:flex-col">
            <Image
              src="/images/placeholder.png"
              alt="Profissional revisando acesso a uma plataforma"
              fill
              sizes="(max-width: 767px) 100vw, 50vw"
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.32)_0%,rgba(2,6,23,0.58)_34%,rgba(2,6,23,0.9)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.28),transparent_34%)]" />

            <div className="relative flex h-full min-h-[640px] flex-col justify-between p-8 lg:min-h-[720px] lg:p-10">
              <div />

              <div className="max-w-md space-y-5 text-white">
                <div className="space-y-4">
                  <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                    Volte para sua conta com segurança.
                  </h1>
                  <p className="max-w-sm text-sm leading-7 text-slate-200 sm:text-base">
                    Redefina sua senha e continue acompanhando propostas,
                    oportunidades e conversas importantes.
                  </p>
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <div className="flex -space-x-3">
                    {featuredCandidates.map((candidate) => (
                      <div
                        key={candidate.uuid}
                        className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-slate-900/80"
                      >
                        <Image
                          src={candidate.avatarUrl}
                          alt={candidate.name}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs font-medium text-slate-200/85 sm:text-sm">
                    Sua conta permanece protegida durante a recuperação.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="flex items-center bg-white px-5 py-8 sm:px-8 md:min-h-[640px] lg:px-10 lg:py-10">
            <div className="mx-auto flex w-full max-w-md flex-col">
              <Link
                href="/"
                className="mb-10 inline-flex w-fit items-center font-heading text-3xl font-bold tracking-tighter text-slate-950 md:mb-12 md:hidden"
              >
                uFreela<span className="text-blue-600">.</span>
              </Link>

              <Suspense fallback={<ResetPasswordFallback />}>
                <ResetPasswordForm />
              </Suspense>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
