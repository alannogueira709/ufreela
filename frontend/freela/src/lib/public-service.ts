import { api } from "@/lib/api";
import type { Candidate } from "@/types/candidate";
import type { Job } from "@/types/job";
import type { Opportunity } from "@/types/opportunity";

interface ApiFreelancer {
  id: string;
  name: string;
  last_name: string;
  profile_img: string | null;
  professional_level: string | null;
  hourly_rate: string | null;
  mean_eval: string;
  finished_jobs: number;
}

export interface FreelancerProfileResponse {
  id: string;
  email: string;
  name: string;
  last_name: string;
  profile_img: string | null;
  description: string;
  professional_level: string;
  hourly_rate: string | null;
  mean_eval: string;
  finished_jobs: number;
}

export interface PublisherProfileResponse {
  id: string;
  email: string;
  name: string;
  last_name: string;
  profile_img: string | null;
  company_name: string;
  mean_eval: string;
}

function getApiOrigin() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
  return baseUrl.endsWith("/api") ? baseUrl.slice(0, -4) : baseUrl;
}

export function resolveMediaUrl(path: string | null | undefined) {
  if (!path) {
    return null;
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const origin = getApiOrigin();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const mediaPath = normalizedPath.startsWith("/media/") ? normalizedPath : `/media${normalizedPath}`;

  return `${origin}${mediaPath}`;
}

function formatRelativePostedAt(value: string) {
  const postedDate = new Date(value);
  const now = new Date();
  const diffMs = postedDate.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  return rtf.format(diffDays, "day");
}

function parseNumber(value: string | null | undefined, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatBudget(min: string | null, max: string | null) {
  const minNumber = parseNumber(min, 0);
  const maxNumber = parseNumber(max, 0);

  if (!min && !max) {
    return "A combinar";
  }

  if (min && max) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format((minNumber + maxNumber) / 2);
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(min ? minNumber : maxNumber);
}

function mapProfessionalLevel(level: string | null | undefined) {
  if (!level) {
    return "Freelancer";
  }

  const normalized = level.toLowerCase();

  if (normalized === "junior") {
    return "Freelancer Junior";
  }

  if (normalized === "mid") {
    return "Freelancer Pleno";
  }

  if (normalized === "senior") {
    return "Freelancer Senior";
  }

  return "Freelancer";
}

function mapOpportunityToJob(opportunity: Opportunity): Job {
  return {
    id: String(opportunity.opportunity_id),
    badge: opportunity.status === "open" ? "Open" : "Closed",
    badgeTone: opportunity.status === "open" ? "blue" : "cyan",
    postedAt: formatRelativePostedAt(opportunity.created_at),
    title: opportunity.title,
    description: opportunity.description,
    tags: opportunity.skills.map((skill) => skill.skill_name).slice(0, 5),
    budget: formatBudget(opportunity.budget_min, opportunity.budget_max),
    budgetType: "Budget",
    duration: opportunity.xp_level ? opportunity.xp_level.toUpperCase() : "N/A",
    durationLabel: "Nivel",
    href: `/jobs/${opportunity.opportunity_id}`,
    categoryId: opportunity.category ? String(opportunity.category.category_id) : undefined,
    categorySlug: opportunity.category?.category_slug,
  };
}

function mapFreelancerToCandidate(freelancer: ApiFreelancer): Candidate {
  const fullName = `${freelancer.name || ""} ${freelancer.last_name || ""}`.trim();

  return {
    uuid: freelancer.id,
    name: fullName || "Freelancer",
    title: mapProfessionalLevel(freelancer.professional_level),
    hourlyRate: parseNumber(freelancer.hourly_rate, 0),
    rating: parseNumber(freelancer.mean_eval, 0),
    avatarUrl:
      resolveMediaUrl(freelancer.profile_img) ||
      "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=600&q=80",
    profileUrl: `/profile/freelancer/${freelancer.id}`,
  };
}

export async function getCategories() {
  const response = await api.get<{ category_id: number; category_name: string; category_slug: string }[]>("/categories/");
  return response.data;
}

export async function getFeaturedJobs() {
  const response = await api.get<Opportunity[]>("/opportunities/");
  return response.data.map(mapOpportunityToJob);
}

export async function getFeaturedCandidates() {
  const response = await api.get<ApiFreelancer[]>("/freelancers/featured/");
  return response.data.map(mapFreelancerToCandidate);
}

export async function getFreelancerProfile(userId: string) {
  const response = await api.get<FreelancerProfileResponse>(
    `/profile/freelancer/${userId}/`,
  );
  return response.data;
}

export async function getPublisherProfile(userId: string) {
  const response = await api.get<PublisherProfileResponse>(
    `/profile/publisher/${userId}/`,
  );
  return response.data;
}
