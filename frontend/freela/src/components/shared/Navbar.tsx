"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "motion/react";
import { Bell, ChevronDown, Menu, MessageSquare, User, X } from "lucide-react";
import { useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { navLinks } from "@/lib/nav-links";
import type { UserRole } from "@/types/nav";

const navLinkClassName =
  "border-b-2 border-transparent pb-1 text-sm font-medium tracking-tight text-slate-500 transition-all duration-300 ease-in-out hover:border-blue-600 hover:text-blue-600";

const activeLinkClassName =
  "border-b-2 border-blue-600 pb-1 text-sm font-semibold tracking-tight text-blue-600 transition-all duration-300 ease-in-out";

const mobileNavLinkClassName =
  "block rounded-2xl border border-white/30 bg-white/45 px-4 py-3 text-sm font-medium tracking-tight text-slate-600 backdrop-blur-md transition-all duration-300 ease-in-out hover:bg-white/65 hover:text-blue-600";

type NavbarProps = {
  role: UserRole;
};

export default function Navbar({ role }: NavbarProps) {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const links = navLinks[role];
  const isGuest = role === "guest";

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 20);
  });

  return (
    <motion.nav
      initial={{ y: -96, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`sticky top-0 z-50 w-full transition-all duration-300 ease-in-out ${
        isScrolled
          ? "border-b border-white/40 bg-white/60 shadow-[0_18px_45px_-24px_rgba(15,23,42,0.35)] backdrop-blur-2xl"
          : "border-b border-transparent bg-white/25 backdrop-blur-xl"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/45 via-white/18 to-white/8" />

      <div className="container relative mx-auto px-6 lg:px-10">
        <div className="flex h-16 items-center justify-between gap-6">
          <div className="flex items-center gap-10">
            <Link
              href="/"
              className="font-heading text-2xl font-bold tracking-tighter text-slate-950"
            >
              uFreela<span className="text-blue-600">.</span>
            </Link>

            <div className="hidden items-center gap-6 md:flex">
              {links.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ y: -8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    duration: 0.35,
                    delay: 0.08 + index * 0.05,
                    ease: "easeOut",
                  }}
                  whileHover={{ y: -1 }}
                >
                  <Link
                    href={link.href}
                    className={
                      pathname === link.href
                        ? activeLinkClassName
                        : navLinkClassName
                    }
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isGuest ? (
              <div className="hidden items-center gap-3 md:flex">
                <Link
                  href="/login"
                  className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition-all duration-300 ease-in-out hover:bg-white/45"
                >
                  Entrar
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:bg-blue-700"
                >
                  Cadastrar
                </Link>
              </div>
            ) : (
              <>
                <motion.button
                  whileHover={{ y: -1, scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  className="hidden rounded-full border border-white/35 bg-white/35 p-2 text-slate-500 shadow-sm backdrop-blur-md transition-all duration-300 ease-in-out hover:bg-white/55 hover:text-slate-900 md:inline-flex"
                >
                  <MessageSquare size={20} />
                </motion.button>

                <motion.button
                  whileHover={{ y: -1, scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  className="hidden rounded-full border border-white/35 bg-white/35 p-2 text-slate-500 shadow-sm backdrop-blur-md transition-all duration-300 ease-in-out hover:bg-white/55 hover:text-slate-900 md:inline-flex"
                >
                  <Bell size={20} />
                </motion.button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <motion.button
                      whileHover={{ y: -1, scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className="hidden items-center gap-1 rounded-full border border-white/35 bg-white/35 p-1 pl-2 text-slate-600 shadow-sm backdrop-blur-md transition-all duration-300 ease-in-out hover:bg-white/55 hover:text-slate-900 md:flex"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200/80 text-slate-600">
                        <User size={18} />
                      </div>
                      <ChevronDown size={16} className="text-slate-500" />
                    </motion.button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="rounded-2xl border border-white/30 bg-white/45 p-2 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.45)] backdrop-blur-2xl"
                  >
                    <DropdownMenuItem>Ver Perfil</DropdownMenuItem>
                    <DropdownMenuItem>Ajustes</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Sair</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle navigation menu"
              className="inline-flex rounded-full border border-white/35 bg-white/40 p-2 text-slate-700 shadow-sm backdrop-blur-md transition-all duration-300 ease-in-out hover:bg-white/60 md:hidden"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </motion.button>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen ? (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="pb-4 md:hidden"
            >
              <div className="overflow-hidden rounded-[1.75rem] border border-white/35 bg-white/45 p-3 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.45)] backdrop-blur-2xl">
                <div className="flex flex-col gap-2">
                  {links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={
                        pathname === link.href
                          ? `${mobileNavLinkClassName} border-blue-200 bg-blue-50/70 text-blue-600`
                          : mobileNavLinkClassName
                      }
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>

                <div className="mt-3 flex items-center gap-2 border-t border-white/35 pt-3">
                  {isGuest ? (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="inline-flex flex-1 items-center justify-center rounded-2xl border border-white/35 bg-white/45 px-4 py-3 text-sm font-medium text-slate-600 backdrop-blur-md transition-all duration-300 ease-in-out hover:bg-white/65 hover:text-slate-900"
                      >
                        Entrar
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="inline-flex flex-1 items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:bg-blue-700"
                      >
                        Cadastrar
                      </Link>
                    </>
                  ) : (
                    <>
                      <button className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/35 bg-white/45 px-4 py-3 text-sm font-medium text-slate-600 backdrop-blur-md transition-all duration-300 ease-in-out hover:bg-white/65 hover:text-slate-900">
                        <Bell size={18} />
                        Notificacoes
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/35 bg-white/45 px-4 py-3 text-sm font-medium text-slate-600 backdrop-blur-md transition-all duration-300 ease-in-out hover:bg-white/65 hover:text-slate-900">
                            <User size={18} />
                            Perfil
                            <ChevronDown size={16} className="text-slate-500" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="rounded-2xl border border-white/30 bg-white/45 p-2 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.45)] backdrop-blur-2xl"
                        >
                          <DropdownMenuItem>Ver Perfil</DropdownMenuItem>
                          <DropdownMenuItem>Ajustes</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>Sair</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
