"use client";

import { useRef } from "react";
import AutoScroll from "embla-carousel-auto-scroll";

import CandidateCard from "@/components/home/CandidateCard";
import { candidates } from "@/data/candidates";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

export default function InteractiveMarquee() {
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

      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-12 bg-gradient-to-r from-slate-50 to-transparent sm:w-24" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 bg-gradient-to-l from-slate-50 to-transparent sm:w-24" />

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
