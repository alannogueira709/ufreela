"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  BriefcaseBusiness,
  MessageSquareMore,
  Search,
  UserRound,
} from "lucide-react";

const menuItems = [
  { href: "/find-work", label: "Pesquisar", icon: Search },
  { href: "/post-a-job", label: "Publicar", icon: BriefcaseBusiness },
  { href: "/messages", label: "Mensagens", icon: MessageSquareMore },
  { href: "/profile", label: "Perfil", icon: UserRound },
];

export default function QuickActionMenu() {
  const pathname = usePathname();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
      className="fixed inset-x-0 bottom-4 z-50 mx-auto w-[calc(100%-1.5rem)] max-w-sm md:hidden"
    >
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.16),transparent_60%)] blur-2xl" />

      <div className="relative flex items-center justify-between rounded-full border border-white/40 bg-white/50 px-4 py-3 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.45)] backdrop-blur-2xl">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, scale: 0.85, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                duration: 0.35,
                delay: 0.22 + index * 0.06,
                ease: "easeOut",
              }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <Link
                href={item.href}
                className="group flex min-w-16 flex-col items-center gap-1 rounded-full px-2 py-1 text-center"
              >
                <motion.div
                  animate={{
                    scale: isActive ? 1.08 : 1,
                  }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className={`relative flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-300 ease-in-out ${
                    isActive
                      ? "border-blue-200 bg-blue-50 text-blue-600 shadow-[0_10px_30px_-18px_rgba(37,99,235,0.75)]"
                      : "border-white/40 bg-white/35 text-slate-500 group-hover:border-blue-100 group-hover:bg-white/60 group-hover:text-blue-600"
                  }`}
                >
                  <Icon size={18} />
                </motion.div>

                <span
                  className={`text-[11px] font-medium tracking-tight transition-colors duration-300 ease-in-out ${
                    isActive
                      ? "text-blue-600"
                      : "text-slate-500 group-hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </span>

                {isActive ? (
                  <motion.div
                    layoutId="quick-menu-indicator"
                    className="absolute -bottom-1 h-1.5 w-1.5 rounded-full bg-blue-500"
                    transition={{ type: "spring", stiffness: 500, damping: 32 }}
                  />
                ) : null}
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
