import { NavItem, UserRole } from "@/types/nav";

export const navLinks: Record<UserRole, NavItem[]> = {
  guest: [
    { label: "Encontrar Trabalho", href: "/jobs" },
    { label: "Encontrar Talentos", href: "/hire" },
  ],
  publisher:[
    { label: "Meus Projetos", href: "/dashboard/client" },
    { label: "Postar Vaga", href: "/jobs/post" },
    { label: "Mensagens", href: "/messages" },
  ],
  candidate:[
    { label: "Minhas Propostas", href: "/proposals" },
    { label: "Buscar Vagas", href: "/jobs" },
    { label: "Mensagens", href: "/messages" },
  ],
    admin:[
    { label: "Gerenciar Usuários", href: "/admin/users" },
    { label: "Gerenciar Vagas", href: "/admin/jobs" },
    { label: "Relatórios", href: "/admin/reports" },
  ],

};