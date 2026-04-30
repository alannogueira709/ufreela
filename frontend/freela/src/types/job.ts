export type JobCategory =
  | "Design"
  | "Desenvolvimento e TI"
  | "Serviços de IA";

export type ExperienceLevel =
  | "Iniciante"
  | "Intermediário"
  | "Especialista";

export interface Job {
  id: string;
  badge?: string;
  badgeTone?: "blue" | "cyan";
  postedAt: string;
  postedAtHours: number;
  title: string;
  description: string;
  tags: string[];
  category: JobCategory;
  experienceLevel: ExperienceLevel;
  budget: string;
  budgetAmount: number;
  budgetType: string;
  duration: string;
  durationLabel: string;
  href: string;
  categoryId?: string;
  categorySlug?: string;
}
