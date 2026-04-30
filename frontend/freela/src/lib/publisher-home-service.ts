import { getOpportunities } from "@/lib/job-service";
import {
  getFeaturedCandidates,
  getPublisherProfile,
} from "@/lib/public-service";
import { getMyPublisherProposals } from "@/lib/proposal-service";

import type { PublisherHomeData } from "@/app/publisherHome";

export const EMPTY_PUBLISHER_HOME_DATA: PublisherHomeData = {
  summary: {
    activeProjects: 0,
    newProposals: 0,
    conversionRate: 0,
    topMatches: 0,
    avgRating: 0,
  },
  proposals: [],
  hiringPulse: {
    responseTime: "0 vagas abertas",
    shortlistGrowth: "0 vagas encerradas",
  },
  featuredTalentCount: 0,
  publisherCount: null,
};

function parseNumber(value: string | null | undefined, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getInitials(name: string) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return initials || "FR";
}

function formatAppliedAt(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffHours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));

  if (diffHours < 24) {
    return `${diffHours}h atras`;
  }

  const diffDays = Math.max(1, Math.round(diffHours / 24));
  return `${diffDays}d atras`;
}

export async function getPublisherHomeData(
  userId: string,
): Promise<PublisherHomeData> {
  const [profile, opportunities, featuredCandidates, proposals] = await Promise.all([
    getPublisherProfile(userId),
    getOpportunities({
      publisher: userId,
      status: "all",
    }),
    getFeaturedCandidates(),
    getMyPublisherProposals(),
  ]);

  const activeProjects = opportunities.filter(
    (opportunity) => opportunity.status !== "closed",
  ).length;
  const closedProjects = opportunities.length - activeProjects;
  const acceptedProposals = proposals.filter(
    (proposal) => proposal.status === "accepted",
  ).length;
  const conversionRate = opportunities.length
    ? Math.round((acceptedProposals / proposals.length || 0) * 100)
    : 0;
  const pendingProposals = proposals.filter(
    (proposal) => proposal.status === "pending",
  );

  return {
    summary: {
      activeProjects,
      newProposals: pendingProposals.length,
      conversionRate,
      topMatches: featuredCandidates.length,
      avgRating: parseNumber(profile.mean_eval),
    },
    proposals: proposals.slice(0, 3).map((proposal) => {
      const fullName =
        `${proposal.freelancer.name || ""} ${proposal.freelancer.last_name || ""}`.trim() ||
        "Freelancer";

      return {
        id: String(proposal.proposal_id),
        candidateName: fullName,
        initials: getInitials(fullName),
        avatarColor: "blue",
        jobTitle: `Candidatou-se para ${proposal.opportunity.title}`,
        proposedValue: parseNumber(proposal.proposed_value),
        appliedAt: formatAppliedAt(proposal.created_at),
      };
    }),
    hiringPulse: {
      responseTime: `${activeProjects} vagas abertas`,
      shortlistGrowth: `${closedProjects} vagas encerradas`,
    },
    featuredTalentCount: featuredCandidates.length,
    publisherCount: null,
  };
}
