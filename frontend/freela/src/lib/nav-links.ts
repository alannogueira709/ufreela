import type { NavItem, UserRole } from "@/types/nav";

type NavLinkResolver = {
  label: string;
  getHref: (userId?: string) => string;
};

const navLinkResolvers: Record<UserRole, NavLinkResolver[]> = {
  guest: [
    { label: "Encontrar Trabalho", getHref: () => "/jobs" },
    { label: "Encontrar Talentos", getHref: () => "/hire" },
  ],
  publisher: [
    {
      label: "Meus Projetos",
      getHref: (userId) =>
        userId
          ? `/profile/publisher/${userId}/opportunities`
          : "/",
    },
    { label: "Postar Vaga", getHref: () => "/jobs/post" },
    {
      label: "Dashboard",
      getHref: (userId) =>
        userId
          ? `/profile/publisher/${userId}/dashboard`
          : "/",
    },
  ],
  freelancer: [
    {
      label: "Minhas Propostas",
      getHref: (userId) =>
        userId
          ? `/profile/freelancer/${userId}/proposals`
          : "/",
    },
    { label: "Buscar Vagas", getHref: () => "/jobs" },
    {
      label: "Dashboard",
      getHref: (userId) =>
        userId
          ? `/profile/freelancer/${userId}/dashboard`
          : "/",
    },
  ],
  admin: [
    { label: "Gerenciar Usuarios", getHref: () => "/admin/users" },
    { label: "Gerenciar Vagas", getHref: () => "/admin/jobs" },
    { label: "Relatorios", getHref: () => "/admin/reports" },
  ],
};

export function getNavLinks(role: UserRole, userId?: string): NavItem[] {
  const resolvers = navLinkResolvers[role] ?? navLinkResolvers.guest;

  return resolvers.map((item) => ({
    label: item.label,
    href: item.getHref(userId),
  }));
}
