import Link from "next/link";
import Image from "next/image";

import { LoginForm } from "@/components/login/login-form";

const trustedAvatars = [
  { src: "/images/elena.jpeg", alt: "Elena Rodriguez" },
  { src: "/images/julian.jpeg", alt: "Julian Thorne" },
  { src: "/images/sarah.jpeg", alt: "Sarah Jenkins" },
];

export default function Login() {
  return (
    <main className="min-h-svh bg-slate-100 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex min-h-[calc(100svh-2rem)] max-w-7xl items-center">
        <div className="grid w-full overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] md:grid-cols-[1.02fr_0.98fr]">
          <section className="relative hidden min-h-[640px] overflow-hidden bg-slate-950 md:flex md:flex-col">
            <Image
              src="/images/placeholder.png"
              alt="Profissional trabalhando em um escritorio"
              fill
              sizes="(max-width: 767px) 100vw, 50vw"
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.32)_0%,rgba(2,6,23,0.58)_34%,rgba(2,6,23,0.9)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.28),transparent_34%)]" />

            <div className="relative flex h-full min-h-[640px] flex-col justify-between p-8 lg:min-h-[720px] lg:p-10">
              <div>
                <div className="inline-flex items-center rounded-md bg-white px-4 py-2 shadow-sm">
                  <span className="font-heading text-2xl font-bold tracking-tight text-slate-950">
                    uFreela<span className="text-blue-600">.</span>
                  </span>
                </div>
              </div>

              <div className="max-w-md space-y-5 text-white">
                <div className="space-y-4">
                  <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                    A plataforma ideal para encontrar oportunidades.
                  </h1>
                  <p className="max-w-sm text-sm leading-7 text-slate-200 sm:text-base">
                    Conecte-se a projetos relevantes, empresas inovadoras e uma
                    comunidade pronta para construir o proximo passo da sua
                    carreira.
                  </p>
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <div className="flex -space-x-3">
                    {trustedAvatars.map((avatar) => (
                      <div
                        key={avatar.src}
                        className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-slate-900/80"
                      >
                        <Image
                          src={avatar.src}
                          alt={avatar.alt}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs font-medium text-slate-200/85 sm:text-sm">
                    Mais de {trustedAvatars.length} talentos e recrutadores usando a plataforma.
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

              <LoginForm />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
