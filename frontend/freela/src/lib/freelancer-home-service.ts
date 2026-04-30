import { getFreelancerProfile } from "@/lib/public-service";
import { getMyFreelancerProposals } from "@/lib/proposal-service";

import type { FreelancerHomeData } from "@/app/freelancerHome";
import type { Proposal } from "@/types/proposal";

export const EMPTY_FREELANCER_HOME_DATA: FreelancerHomeData = {
  summary: {
    monthlyRevenue: 0,
    jobSuccessRate: 0,
  },
  proposals: [],
  insight: {
    profileViews: 0,
    rankLabel: "Em desenvolvimento",
    rankSubtitle: "Dados do perfil",
  },
  skills: [],
  profileViewGrowth: "0%",
  workspaceSynced: false,
};

function parseNumber(value: string | null | undefined, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getRankLabel(professionalLevel: string | null | undefined) {
  if (!professionalLevel) {
    return "Perfil ativo";
  }

  if (professionalLevel === "junior") {
    return "Junior";
  }

  if (professionalLevel === "mid") {
    return "Pleno";
  }

  if (professionalLevel === "senior") {
    return "Senior";
  }

  return "Perfil ativo";
}

function getSkillProgress(level: string) {
  if (level === "advanced") {
    return 92;
  }

  if (level === "intermediate") {
    return 72;
  }

  return 48;
}

function getSkillLevelLabel(level: string) {
  if (level === "advanced") {
    return "Avancado";
  }

  if (level === "intermediate") {
    return "Intermediario";
  }

  return "Iniciante";
}

function mapProposalStatus(status: Proposal["status"]) {
  if (status === "accepted") {
    return {
      status: "hired" as const,
      label: "Aceita",
      subtitle: "Proposta aprovada",
      color: "emerald" as const,
    };
  }

  if (status === "rejected") {
    return {
      status: "under_review" as const,
      label: "Encerrada",
      subtitle: "Proposta nao selecionada",
      color: "slate" as const,
    };
  }

  return {
    status: "under_review" as const,
    label: "Em analise",
    subtitle: "Aguardando resposta",
    color: "blue" as const,
  };
}

export async function getFreelancerHomeData(
  userId: string,
): Promise<FreelancerHomeData> {
  const [profile, proposals] = await Promise.all([
    getFreelancerProfile(userId),
    getMyFreelancerProposals(),
  ]);
  const meanEval = parseNumber(profile.mean_eval);
  const acceptedProposals = proposals.filter(
    (proposal) => proposal.status === "accepted",
  );

  return {
    summary: {
      monthlyRevenue: acceptedProposals.reduce(
        (sum, proposal) => sum + parseNumber(proposal.proposed_value),
        0,
      ),
      jobSuccessRate: Math.round((meanEval / 5) * 100),
    },
    proposals: proposals.slice(0, 3).map((proposal) => {
      const mappedStatus = mapProposalStatus(proposal.status);
      return {
        id: String(proposal.proposal_id),
        projectName: proposal.opportunity.title,
        clientName: proposal.opportunity.publisher.company_name || "Publisher",
        status: mappedStatus.status,
        statusLabel: mappedStatus.label,
        subtitle: mappedStatus.subtitle,
        proposedValue: parseNumber(proposal.proposed_value),
        accentColor: mappedStatus.color,
      };
    }),
    insight: {
      profileViews: 0,
      rankLabel: getRankLabel(profile.professional_level),
      rankSubtitle: "Nivel profissional",
    },
    skills: profile.skills.map((skill) => ({
      name: skill.skill_name,
      level: skill.skill_level,
      levelLabel: getSkillLevelLabel(skill.skill_level),
      progress: getSkillProgress(skill.skill_level),
      color:
        skill.skill_level === "advanced"
          ? "text-blue-600"
          : skill.skill_level === "intermediate"
            ? "text-slate-500"
            : "text-cyan-600",
    })),
    profileViewGrowth: "0%",
    workspaceSynced: true,
  };
}
