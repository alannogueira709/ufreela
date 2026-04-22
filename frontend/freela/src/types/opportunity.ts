export interface OpportunityCategory {
  category_id: number;
  category_name: string;
  category_slug: string;
}

export interface OpportunitySkill {
  skill_id: number;
  skill_name: string;
  skill_slug: string;
  category: OpportunityCategory | null;
}

export interface OpportunityPublisher {
  id: string;
  company_name: string;
}

export interface Opportunity {
  opportunity_id: number;
  title: string;
  description: string;
  xp_level: string;
  work_modality: string;
  status: string;
  budget_min: string | null;
  budget_max: string | null;
  created_at: string;
  updated_at: string;
  publisher: OpportunityPublisher;
  category: OpportunityCategory | null;
  skills: OpportunitySkill[];
}

export interface OpportunityFilters {
  q?: string;
  category?: string;
  skill?: string;
  publisher?: string;
  xp_level?: string;
  work_modality?: string;
  status?: string;
}

export interface CreateOpportunityPayload {
  title: string;
  description: string;
  category_id?: number;
  skill_ids: number[];
  xp_level?: string;
  work_modality?: string;
  budget_min?: number;
  budget_max?: number;
  status?: string;
}
