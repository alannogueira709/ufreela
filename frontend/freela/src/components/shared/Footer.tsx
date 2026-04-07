import Link from "next/link";

const platformLinks = [
  { label: "Sobre a uFreela", href: "/about" },
  { label: "Encontre Vagas", href: "/jobs" },
  { label: "Publique Vagas", href: "/jobs/post" },
];

const resourceLinks = [
  { label: "Termos", href: "/terms" },
  { label: "Privacidade", href: "/privacy" },
  { label: "Suporte", href: "/support" },
];

const socialLinks = [
  { label: "Twitter", href: "https://twitter.com" },
  { label: "LinkedIn", href: "https://linkedin.com" },
  { label: "Instagram", href: "https://instagram.com" },
];

const footerLinkClassName =
  "text-[15px] font-medium text-slate-400 underline decoration-slate-300 underline-offset-4 transition-colors duration-300 ease-in-out hover:text-blue-600 hover:decoration-blue-200";

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-8 py-10">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-4">
            <Link
              href="/"
              className="font-heading text-4xl font-bold tracking-tight text-slate-950"
            >
              uFreela <span className="text-blue-600">.</span>
            </Link>
            <p className="max-w-sm text-[15px] font-medium leading-6 text-slate-400">
              Uma plataforma para conectar o ecossistema de inovação.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-heading text-xl font-semibold text-slate-950">
              Platforma
            </h3>
            <div className="flex flex-col gap-3">
              {platformLinks.map((link) => (
                <Link key={link.href} href={link.href} className={footerLinkClassName}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <h3 className="font-heading text-xl font-semibold text-slate-950">
              Recursos
            </h3>
            <div className="flex flex-col gap-3">
              {resourceLinks.map((link) => (
                <Link key={link.href} href={link.href} className={footerLinkClassName}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <h3 className="font-heading text-xl font-semibold text-slate-950">
              Social
            </h3>
            <div className="flex flex-col gap-3">
              {socialLinks.map((link) => (
                <Link key={link.href} href={link.href} className={footerLinkClassName}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-200 pt-4">
          <p className="text-center text-[15px] font-medium text-slate-400">
            © 2026 uFreela. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
