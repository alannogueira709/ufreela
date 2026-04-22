import { api } from "@/lib/api";
import type {
  CreateOpportunityPayload,
  Opportunity,
  OpportunityCategory,
  OpportunityFilters,
  OpportunitySkill,
} from "@/types/opportunity";

function cleanFilters(filters: OpportunityFilters) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== ""),
  );
}

export async function getOpportunityCategories() {
  const response = await api.get<OpportunityCategory[]>("/categories/");
  return response.data;
}

export async function getOpportunitySkills(category?: string) {
  const response = await api.get<OpportunitySkill[]>("/skills/", {
    params: cleanFilters({ category }),
  });
  return response.data;
}

export async function getOpportunities(filters: OpportunityFilters = {}) {
  const response = await api.get<Opportunity[]>("/opportunities/", {
    params: cleanFilters(filters),
  });
  return response.data;
}

export async function getOpportunityById(opportunityId: string | number) {
  const response = await api.get<Opportunity>(`/opportunities/${opportunityId}/`);
  return response.data;
}

export async function createOpportunity(payload: CreateOpportunityPayload) {
  const response = await api.post<Opportunity>("/opportunities/", payload);
  return response.data;
}
