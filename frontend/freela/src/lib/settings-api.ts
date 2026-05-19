import { api } from "@/lib/api";

export interface UserSettings {
  id: string;
  theme: "light" | "dark" | "system";
  compact_mode: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  marketing_emails: boolean;
  profile_visible: boolean;
  show_activity_status: boolean;
  language: string;
  timezone: string;
  two_factor_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface LinkedInConnection {
  id: string;
  linkedin_id: string;
  profile_url: string | null;
  headline: string | null;
  is_active: boolean;
}

export interface GitHubConnection {
  id: string;
  github_id: string;
  username: string;
  profile_url: string;
  avatar_url: string | null;
  repos_fetched: number;
  is_active: boolean;
}

export interface ImportedEducation {
  id: string;
  source: string;
  institution: string;
  degree: string | null;
  field_of_study: string | null;
  start_year: number | null;
  end_year: number | null;
  is_current: boolean;
}

export interface ImportedExperience {
  id: string;
  source: string;
  company: string;
  title: string;
  location: string | null;
  start_year: number | null;
  end_year: number | null;
  is_current: boolean;
}

export interface PortfolioProject {
  id: string;
  source: string;
  title: string;
  description: string | null;
  url: string;
  technologies: string[];
  stars: number;
  forks: number;
  is_featured: boolean;
}

export interface StripeAccountData {
  id: string;
  stripe_account_id: string;
  status: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  onboarding_url?: string;
}

export interface TransactionItem {
  id: string;
  type: string;
  amount: string;
  status: string;
  description: string;
  created_at: string;
  freelancer_name?: string;
  publisher_name?: string;
}

export const settingsApi = {
  async get() {
    const response = await api.get<UserSettings>("/settings/");
    return response.data;
  },
  async update(data: Partial<UserSettings>) {
    const response = await api.patch<UserSettings>("/settings/", data);
    return response.data;
  },
};

export const integrationsApi = {
  async connectLinkedIn(code: string, redirectUri: string) {
    const response = await api.post<{ id: string }>("/integrations/linkedin/connect/", {
      code,
      redirect_uri: redirectUri,
    });
    return response.data;
  },
  async connectGitHub(code: string) {
    const response = await api.post<{ connection: GitHubConnection; imported_repos: number }>(
      "/integrations/github/connect/",
      { code }
    );
    return response.data;
  },
  async getData() {
    const response = await api.get<{
      connections: { linkedin: LinkedInConnection | null; github: GitHubConnection | null };
      education: ImportedEducation[];
      experience: ImportedExperience[];
      portfolio: PortfolioProject[];
    }>("/integrations/data/");
    return response.data;
  },
  async syncGitHub() {
    const response = await api.post<{ synced: number }>("/integrations/github/sync/");
    return response.data;
  },
  async disconnectLinkedIn() {
    const response = await api.post<{ status: string }>("/integrations/linkedin/disconnect/");
    return response.data;
  },
  async disconnectGitHub() {
    const response = await api.post<{ status: string }>("/integrations/github/disconnect/");
    return response.data;
  },
};

export const billingApi = {
  async createAccount() {
    const response = await api.post<{ account: StripeAccountData; onboarding_url: string }>(
      "/billing/account/create/",
      { country: "BR" }
    );
    return response.data;
  },
  async getAccount() {
    const response = await api.get<StripeAccountData>("/billing/account/");
    return response.data;
  },
  async getTransactions(role?: string) {
    const response = await api.get<TransactionItem[]>("/billing/transactions/", {
      params: role ? { role } : undefined,
    });
    return response.data;
  },
  async createPaymentIntent(payload: { proposal_id: string | number }) {
    const response = await api.post<{ client_secret: string; payment_intent_id: string }>(
      "/billing/payment-intent/",
      payload
    );
    return response.data;
  },
};
