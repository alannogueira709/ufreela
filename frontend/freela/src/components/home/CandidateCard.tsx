import Link from "next/link";
import { Star } from "lucide-react";

import AvatarImage from "@/components/ui/avatar-image";
import type { Candidate } from "@/types/candidate";

interface CandidateCardProps {
  candidate: Candidate;
}

export default function CandidateCard({ candidate }: CandidateCardProps) {
  const formattedRate = candidate.hourlyRate.toFixed(2);

  return (
    <div className="group flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-300 hover:border-slate-200 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4 rounded-2xl bg-slate-50 p-4">
        <div className="flex items-center gap-4">
          <AvatarImage
            src={candidate.avatarUrl}
            size={72}
            alt={`Avatar de ${candidate.name}`}
            className="shadow-[0_18px_35px_-22px_rgba(15,23,42,0.65)]"
            fallbackClassName="bg-slate-200 text-slate-600"
          />
          <div>
            <h3 className="text-lg font-bold tracking-tight text-slate-950">
              {candidate.name}
            </h3>
            <p className="text-sm font-medium text-slate-500">
              {candidate.title}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-900 shadow backdrop-blur-sm">
          <Star size={14} className="fill-amber-400 text-amber-400" />
          <span>{candidate.rating.toFixed(1)}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-2 pt-5">
        <div className="mt-auto flex items-end justify-between gap-4">
          <div className="flex items-baseline gap-1">
            <span className="font-heading tabular-nums text-xl font-bold tracking-tighter text-blue-600">
              ${formattedRate}
            </span>
            <span className="text-sm font-medium text-slate-400">/hr</span>
          </div>

          <Link
            href={candidate.profileUrl}
            className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors duration-300 ease-in-out hover:bg-blue-700"
          >
            Ver Perfil
          </Link>
        </div>
      </div>
    </div>
  );
}
