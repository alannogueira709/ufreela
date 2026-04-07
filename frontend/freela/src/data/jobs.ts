import type { Job } from "@/types/job";

export const jobs: Job[] = [
  {
    id: "saas-redesign",
    badge: "Verified Client",
    badgeTone: "blue",
    postedAt: "2 hours ago",
    title: "Next-Gen SaaS Platform Redesign",
    description:
      "We are looking for a visionary UI/UX designer to lead the complete overhaul of our enterprise analytics dashboard. The ideal candidate has experience with complex data visualization and sleek, dark-mode interfaces.",
    tags: ["UI/UX Design", "React", "Figma", "Data Viz"],
    budget: "$12,000",
    budgetType: "Fixed Price",
    duration: "3 Months",
    durationLabel: "Duration",
    href: "/jobs/saas-redesign",
  },
  {
    id: "ai-recommendation-engine",
    badge: "Hot Opportunity",
    badgeTone: "cyan",
    postedAt: "5 hours ago",
    title: "AI-Powered Content Recommendation Engine",
    description:
      "Seeking a Machine Learning Engineer to help us refine our neural network for a high-traffic media platform. Experience with PyTorch and AWS SageMaker is essential.",
    tags: ["AI/ML", "Python", "AWS"],
    budget: "$150/hr",
    budgetType: "Hourly",
    duration: "Ongoing",
    durationLabel: "Duration",
    href: "/jobs/ai-recommendation-engine",
  },
  {
    id: "brand-identity-fintech",
    postedAt: "Yesterday",
    title: "Brand Identity for Fintech Startup",
    description:
      "Help us build a brand that communicates trust and innovation. We need a full visual identity package including logo, typography, and marketing assets.",
    tags: ["Branding", "Illustration", "Typography"],
    budget: "$5,500",
    budgetType: "Fixed Price",
    duration: "1 Month",
    durationLabel: "Duration",
    href: "/jobs/brand-identity-fintech",
  },
];
