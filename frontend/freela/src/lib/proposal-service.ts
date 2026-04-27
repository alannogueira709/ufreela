import { api } from "@/lib/api";
import type {
  CreateProposalPayload,
  Proposal,
} from "@/types/proposal";

export async function createProposal(
  opportunityId: string | number,
  payload: CreateProposalPayload,
) {
  const response = await api.post<Proposal>(
    `/opportunities/${opportunityId}/proposals/`,
    payload,
  );
  return response.data;
}

export async function getMyFreelancerProposals() {
  const response = await api.get<Proposal[]>("/freelancers/me/proposals/");
  return response.data;
}

export async function getMyPublisherProposals() {
  const response = await api.get<Proposal[]>("/publishers/me/proposals/");
  return response.data;
}
