"use client";

import { useEffect, useRef, useState } from "react";
import AutoScroll from "embla-carousel-auto-scroll";

import CandidateCard from "@/components/home/CandidateCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { getFeaturedCandidates } from "@/lib/public-service";
import type { Candidate } from "@/types/candidate";

export default function InteractiveMarquee() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadCandidates = async () => {
      try {
        const data = await getFeaturedCandidates();
        if (isMounted) {
          setCandidates(data);
        }
      } catch {
        if (isMounted) {
          setCandidates([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadCandidates();

    return () => {
      isMounted = false;
    };
  }, []);

  const marqueeCandidates = [...candidates, ...candidates];

  const autoScrollPlugin = useRef(
    AutoScroll({
      speed: 0.8,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    }),
  );

  return (
    <section className="relative flex w-full flex-col items-center justify-center overflow-hidden bg-slate-50 py-20">
      <div className="mb-10 px-4 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">
          Em destaque: 
        </h2>
        <p className="mt-4 font-medium text-slate-500">
          Trabalhe com alguns dos talentos mais promissores da comunidade acadêmica.
        </p>
      </div>

      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-12 bg-linear-to-r from-slate-50 to-transparent sm:w-24" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 bg-linear-to-l from-slate-50 to-transparent sm:w-24" />

      <Carousel
        opts={{
          align: "start",
          loop: true,
          dragFree: true,
        }}
        plugins={[autoScrollPlugin.current]}
        className="w-full cursor-grab active:cursor-grabbing"
      >
        <CarouselContent className="-ml-4 sm:-ml-6">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <CarouselItem
                key={`skeleton-${i}`}
                className="basis-[85%] pl-4 sm:basis-1/2 sm:pl-6 lg:basis-[34%] xl:basis-[28%]"
              >
                <div className="p-1">
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                      <Skeleton className="h-16 w-16 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-4/5" />
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))
          ) : null}

          {!isLoading && candidates.length === 0 ? (
            <CarouselItem className="basis-full pl-4 sm:pl-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm font-medium text-slate-500">
                Nenhum freelancer em destaque encontrado no momento.
              </div>
            </CarouselItem>
          ) : null}

          {marqueeCandidates.map((candidate, index) => (
            <CarouselItem
              key={`${candidate.uuid}-${index}`}
              className="basis-[85%] pl-4 sm:basis-1/2 sm:pl-6 lg:basis-[34%] xl:basis-[28%]"
            >
              <div className="p-1">
                <CandidateCard candidate={candidate} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
}
