import React from "react";
import { Star } from "lucide-react";

type Props = {
  rating: number;
  count?: number | null;
  size?: number;
};

export default function StarRating({ rating, count, size = 14 }: Props) {
  const rounded = Number.isFinite(rating) ? Math.round(rating) : 0;
  const formattedAvg = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Number(rating ?? 0));

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={
            i < rounded ? "fill-amber-400 text-amber-400" : "text-slate-200"
          }
        />
      ))}
      {count !== undefined && (
        <span className="ml-1.5 text-[13px] text-slate-400">
          {formattedAvg} de {count} avaliações
        </span>
      )}
    </div>
  );
}
