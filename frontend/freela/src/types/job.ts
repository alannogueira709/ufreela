export interface Job {
  id: string;
  badge?: string;
  badgeTone?: "blue" | "cyan";
  postedAt: string;
  title: string;
  description: string;
  tags: string[];
  budget: string;
  budgetType: string;
  duration: string;
  durationLabel: string;
  href: string;
}
