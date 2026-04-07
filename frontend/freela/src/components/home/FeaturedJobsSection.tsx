import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { jobs } from "@/data/jobs";

const filterLabels = [
  { label: "Design & Creative", checked: true },
  { label: "Development & IT", checked: false },
  { label: "AI Services", checked: false },
];

const experienceLevels = [
  { label: "Entry Level", checked: false },
  { label: "Intermediate", checked: true },
  { label: "Expert Elite", checked: false },
];

const badgeToneClassName = {
  blue: "bg-blue-50 text-blue-600",
  cyan: "bg-cyan-50 text-cyan-600",
};

export default function FeaturedJobsSection() {
  return (
    <section className="container mx-auto px-8 py-16">
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="h-fit rounded-[2rem] border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur-sm">
          <div className="space-y-8">
            <div>
              <h3 className="font-heading text-xl font-semibold text-slate-950">
                Filters
              </h3>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Category
              </p>
              <div className="space-y-3">
                {filterLabels.map((item) => (
                  <label
                    key={item.label}
                    className="flex items-center gap-3 text-sm font-medium text-slate-600"
                  >
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                        item.checked
                          ? "border-blue-600 bg-blue-600"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    </span>
                    {item.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Budget Range
              </p>
              <div className="space-y-3">
                <div className="relative h-2 rounded-full bg-slate-200">
                  <div className="absolute left-[46%] top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-blue-600 shadow-sm" />
                </div>
                <div className="flex justify-between text-xs font-semibold text-slate-400">
                  <span>$1k</span>
                  <span>$50k+</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Experience Level
              </p>
              <div className="space-y-3">
                {experienceLevels.map((item) => (
                  <label
                    key={item.label}
                    className="flex items-center gap-3 text-sm font-medium text-slate-600"
                  >
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                        item.checked
                          ? "border-blue-600 bg-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {item.checked ? (
                        <span className="h-2 w-2 rounded-full bg-blue-600" />
                      ) : null}
                    </span>
                    {item.label}
                  </label>
                ))}
              </div>
            </div>

            <button className="w-full rounded-full bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-600 transition-colors duration-300 ease-in-out hover:bg-slate-200">
              Clear All Filters
            </button>
          </div>
        </aside>

        <div className="space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="font-heading text-3xl font-bold tracking-tight text-slate-950">
              Featured Job Posts
            </h2>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
              <span>Sort by:</span>
              <button className="rounded-full px-3 py-1 text-slate-700 transition-colors duration-300 ease-in-out hover:text-blue-600">
                Newest First
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {jobs.map((job) => (
              <article
                key={job.id}
                className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm transition-all duration-300 ease-in-out hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-5">
                    <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-400">
                      {job.badge ? (
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                            badgeToneClassName[job.badgeTone ?? "blue"]
                          }`}
                        >
                          {job.badge}
                        </span>
                      ) : null}
                      <span>{job.postedAt}</span>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-heading text-2xl font-bold tracking-tight text-slate-950">
                        {job.title}
                      </h3>
                      <p className="max-w-3xl text-sm font-medium leading-7 text-slate-500">
                        {job.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {job.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex w-full flex-row items-end justify-between gap-6 lg:w-auto lg:flex-col lg:items-end">
                    <div className="space-y-4 text-right">
                      <div>
                        <p className="font-heading text-3xl font-bold tracking-tight text-slate-950">
                          {job.budget}
                        </p>
                        <p className="text-sm font-medium text-slate-400">
                          {job.budgetType}
                        </p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-slate-950">
                          {job.duration}
                        </p>
                        <p className="text-sm font-medium text-slate-400">
                          {job.durationLabel}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={job.href}
                      className="rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors duration-300 ease-in-out hover:bg-blue-700"
                    >
                      Apply Now
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="flex items-center justify-center gap-3 pt-4">
            <button className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm transition-colors duration-300 ease-in-out hover:text-slate-900">
              <ArrowLeft size={16} />
            </button>
            <button className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
              1
            </button>
            <button className="inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-slate-500 transition-colors duration-300 ease-in-out hover:bg-white hover:text-slate-900">
              2
            </button>
            <button className="inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-slate-500 transition-colors duration-300 ease-in-out hover:bg-white hover:text-slate-900">
              3
            </button>
            <span className="px-1 text-sm font-semibold text-slate-400">...</span>
            <button className="inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-slate-500 transition-colors duration-300 ease-in-out hover:bg-white hover:text-slate-900">
              12
            </button>
            <button className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm transition-colors duration-300 ease-in-out hover:text-slate-900">
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
