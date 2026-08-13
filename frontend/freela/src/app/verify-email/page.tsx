import Link from "next/link";
import { Suspense } from "react";

import { EmailVerificationForm } from "@/components/auth/email-verification-form";
import { BackButton } from "@/components/ui/back-button";

function VerificationFallback() {
  return (
    <div className="flex flex-col gap-5">
      <div className="h-9 w-64 animate-pulse rounded-lg bg-slate-100" />
      <div className="h-12 w-full animate-pulse rounded-xl bg-slate-100" />
      <div className="h-12 w-full animate-pulse rounded-xl bg-slate-100" />
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-slate-100 px-4 py-8 gap-4">
      <div className="w-full max-w-lg">
        <BackButton variant="button" />
      </div>

      <section className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] sm:p-10">
        <Link
          href="/"
          className="mb-10 inline-flex font-heading text-3xl font-bold tracking-tighter text-slate-950"
        >
          uFreela<span className="text-blue-600">.</span>
        </Link>
        <Suspense fallback={<VerificationFallback />}>
          <EmailVerificationForm />
        </Suspense>
      </section>
    </main>
  );
}
