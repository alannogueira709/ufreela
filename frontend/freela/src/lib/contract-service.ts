import { api } from "@/lib/api";

export type ContractStatus = "active" | "completed" | "terminated";

export interface DashboardContract {
  contract_id: string;
  proposal_id: number;
  opportunity_id: number;
  opportunity_title: string;
  publisher_id: string;
  publisher_name: string;
  freelancer_id: string;
  freelancer_name: string;
  proposed_value: string;
  total_value: string;
  status: ContractStatus;
  start_date: string;
  end_date: string | null;
  freelancer_completion_approved: boolean;
  publisher_completion_approved: boolean;
  completed_at: string | null;
  escrow_released_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function getDashboardContracts() {
  const response = await api.get<DashboardContract[]>("/billing/contracts/");
  return response.data;
}

export async function approveContractCompletion(contractId: string) {
  const response = await api.post<DashboardContract>(`/billing/contracts/${contractId}/complete/`);
  return response.data;
}
