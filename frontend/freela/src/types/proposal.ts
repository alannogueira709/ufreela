import type { Opportunity } from "@/types/opportunity";

export type ProposalStatus = "pending" | "accepted" | "rejected";

export interface ProposalFreelancer {
  id: string;
  name: string;
  last_name: string;
  profile_img: string | null;
  professional_level: string;
  mean_eval: string;
}

export interface Proposal {
  proposal_id: number;
  opportunity: Opportunity;
  freelancer: ProposalFreelancer;
  proposed_value: string;
  cover_letter: string;
  status: ProposalStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateProposalPayload {
  proposed_value: number;
  cover_letter: string;
}
