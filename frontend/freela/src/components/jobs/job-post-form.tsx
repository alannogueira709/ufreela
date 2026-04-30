"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, CalendarIcon, Info, Minus, Plus } from "lucide-react";

import Loading from "@/components/shared/Loading";
import Footer from "@/components/shared/Footer";
import Navbar from "@/components/shared/Navbar";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getApiErrorMessage } from "@/lib/api-errors";
import {
  createOpportunity,
  getOpportunityCategories,
  getOpportunitySkills,
} from "@/lib/job-service";
import { useAuth } from "@/contexts/AuthContext";
import type { OpportunityCategory, OpportunitySkill } from "@/types/opportunity";
import type { UserRole } from "@/types/nav";

const initialForm = {
  title: "",
  description: "",
  category_id: "",
  xp_level: "",
  work_modality: "",
  budget_min: "5000",
  budget_max: "12500",
  deadline: undefined as Date | undefined,
};

function mapRole(role: UserRole | undefined) {
  return role && ["guest", "freelancer", "publisher", "admin"].includes(role)
    ? role
    : "guest";
}

function formatRange(min: string, max: string) {
  const formatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

  return `${formatter.format(Number(min || 0))} - ${formatter.format(Number(max || 0))}`;
}

export function JobPostForm() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [formData, setFormData] = useState(initialForm);
  const [categories, setCategories] = useState<OpportunityCategory[]>([]);
  const [skills, setSkills] = useState<OpportunitySkill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<number[]>([]);
  const [isLoadingMeta, setIsLoadingMeta] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [activeFormats, setActiveFormats] = useState<Set<"bold" | "italic" | "underline">>(new Set());
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const FORMAT_MARKERS = {
    bold: "**",
    italic: "*",
    underline: "__",
  } as const;

  function applyFormat(format: "bold" | "italic" | "underline") {
    const textarea = descriptionRef.current;
    if (!textarea) return;

    const marker = FORMAT_MARKERS[format];
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    const selected = value.slice(start, end);
    const before = value.slice(start - marker.length, start);
    const after = value.slice(end, end + marker.length);
    if (before === marker && after === marker) {
      const newValue =
        value.slice(0, start - marker.length) +
        selected +
        value.slice(end + marker.length);
      setFormData((c) => ({ ...c, description: newValue }));
      requestAnimationFrame(() => {
        textarea.selectionStart = start - marker.length;
        textarea.selectionEnd = end - marker.length;
        textarea.focus();
      });
      return;
    }

    const wrapped = `${marker}${selected}${marker}`;
    const newValue = value.slice(0, start) + wrapped + value.slice(end);
    setFormData((c) => ({ ...c, description: newValue }));
    requestAnimationFrame(() => {
      if (selected.length > 0) {
        textarea.selectionStart = start;
        textarea.selectionEnd = start + wrapped.length;
      } else {
        textarea.selectionStart = start + marker.length;
        textarea.selectionEnd = start + marker.length;
      }
      textarea.focus();
    });
  }

  function syncActiveFormats() {
    const textarea = descriptionRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    const next = new Set<"bold" | "italic" | "underline">();
    (Object.entries(FORMAT_MARKERS) as [keyof typeof FORMAT_MARKERS, string][]).forEach(([format, marker]) => {
      const before = value.slice(start - marker.length, start);
      const after = value.slice(end, end + marker.length);
      if (before === marker && after === marker) next.add(format);
    });
    setActiveFormats(next);
  }

  useEffect(() => {
    const loadMeta = async () => {
      try {
        setIsLoadingMeta(true);
        const [categoriesData, skillsData] = await Promise.all([
          getOpportunityCategories(),
          getOpportunitySkills(),
        ]);
        setCategories(categoriesData);
        setSkills(skillsData);
      } catch (loadError) {
        setError(
          getApiErrorMessage(
            loadError,
            "Não foi possível carregar categorias e skills para publicar a vaga.",
          ),
        );
      } finally {
        setIsLoadingMeta(false);
      }
    };

    void loadMeta();
  }, []);

  useEffect(() => {
    const loadSkills = async () => {
      try {
        const skillsData = await getOpportunitySkills(formData.category_id || undefined);
        setSkills(skillsData);
        setSelectedSkills((current) =>
          current.filter((skillId) => skillsData.some((skill) => skill.skill_id === skillId)),
        );
      } catch (loadError) {
        setError(
          getApiErrorMessage(loadError, "Não foi possível atualizar as skills."),
        );
      }
    };

    void loadSkills();
  }, [formData.category_id]);

  const activeRole = mapRole(user?.role);
  const canPublish = user?.role === "publisher";
  const rangeLabel = useMemo(
    () => formatRange(formData.budget_min, formData.budget_max),
    [formData.budget_max, formData.budget_min],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      setIsSubmitting(true);
      const created = await createOpportunity({
        title: formData.title,
        description: formData.description,
        category_id: formData.category_id ? Number(formData.category_id) : undefined,
        skill_ids: selectedSkills,
        xp_level: formData.xp_level || undefined,
        work_modality: formData.work_modality || undefined,
        budget_min: formData.budget_min ? Number(formData.budget_min) : undefined,
        budget_max: formData.budget_max ? Number(formData.budget_max) : undefined,
        deadline: formData.deadline ? formData.deadline.toISOString().slice(0, 10) : undefined,
      });

      router.push(`/jobs/${created.opportunity_id}`);
      router.refresh();
    } catch (submitError) {
      setError(
        getApiErrorMessage(
          submitError,
          "Não foi possível criar a oportunidade agora.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#f6f7fb] text-slate-900">
        <Navbar role="guest" />
        <main className="flex-1">
          <Loading text="Preparando formulário..." />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f6f7fb] text-slate-900">
      <Navbar role={activeRole} />
      <main className="flex-1">
        <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
          <div className="space-y-3 text-center">
            <h1 className="font-heading text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              Publique uma vaga
            </h1>
            <p className="text-base text-slate-500">
              Preencha os campos abaixo para publicar sua vaga e se conectar com os talentos da comunidade acadêmica.
            </p>
          </div>

          {!canPublish ? (
            <div className="mx-auto w-full max-w-4xl rounded-[30px] border border-amber-200 bg-amber-50 px-6 py-8">
              <h2 className="font-heading text-2xl font-bold tracking-tight text-amber-950">
                Publicação restrita a publishers
              </h2>
              <p className="mt-3 text-sm leading-7 text-amber-900/80">
                Entre com uma conta de publisher para publicar vagas neste fluxo.
              </p>
            </div>
          ) : null}

          {error ? (
            <div className="mx-auto w-full max-w-4xl rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {isLoadingMeta ? (
            <div className="mx-auto w-full max-w-4xl rounded-[32px] border border-white/70 bg-white p-8 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.22)]">
              <Loading text="Carregando metadados da vaga..." fullScreen={false} />
            </div>
          ) : null}

          {!isLoadingMeta && canPublish ? (
            <form
              onSubmit={handleSubmit}
              className="mx-auto w-full max-w-4xl rounded-[36px] border border-white/70 bg-white px-6 py-7 shadow-[0_30px_90px_-44px_rgba(15,23,42,0.18)] sm:px-8 sm:py-8"
            >
              <div className="space-y-7">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Título da Vaga
                  </label>
                  <Input
                    id="title"
                    required
                    value={formData.title}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    className="h-14 rounded-2xl border-transparent bg-slate-100 px-5 text-base shadow-none placeholder:text-slate-400"
                    placeholder="Ex.: Desenvolvimento Web Full Stack"
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
                  <div className="space-y-2">
                    <label htmlFor="category_id" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Categoria
                    </label>
                    <select
                      id="category_id"
                      value={formData.category_id}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          category_id: event.target.value,
                        }))
                      }
                      className="h-14 w-full rounded-2xl border border-transparent bg-slate-100 px-4 text-sm text-slate-700 outline-none focus:border-blue-300"
                    >
                      <option value="">Selecione uma categoria</option>
                      {categories.map((category) => (
                        <option key={category.category_id} value={category.category_id}>
                          {category.category_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Habilidades Necessárias
                    </span>
                    <div className="min-h-14 rounded-2xl bg-slate-100 px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        {skills.slice(0, 12).map((skill) => {
                          const isSelected = selectedSkills.includes(skill.skill_id);
                          return (
                            <button
                              key={skill.skill_id}
                              type="button"
                              onClick={() =>
                                setSelectedSkills((current) =>
                                  isSelected
                                    ? current.filter((item) => item !== skill.skill_id)
                                    : [...current, skill.skill_id],
                                )
                              }
                              className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                                isSelected
                                  ? "bg-[#dfe4ff] text-[#4c61ff]"
                                  : "bg-white text-slate-500 hover:bg-slate-50"
                              }`}
                            >
                              {isSelected ? <Minus className="size-3" /> : <Plus className="size-3" />}
                              {skill.skill_name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Descrição do projeto
                  </label>
                  <div className="overflow-hidden rounded-[24px] border border-slate-100 bg-slate-100">
                    <div className="flex items-center gap-1 border-b border-slate-200 px-3 py-2">
                      {([
                        { format: "bold" as const, label: "B", title: "Negrito", className: "font-bold" },
                        { format: "italic" as const, label: "I", title: "Itálico", className: "italic" },
                        { format: "underline" as const, label: "U", title: "Sublinhado", className: "underline" },
                      ]).map(({ format, label, title, className }) => (
                        <button
                          key={format}
                          type="button"
                          title={title}
                          onClick={() => applyFormat(format)}
                          className={[
                            "flex h-7 w-7 items-center justify-center rounded-md text-xs transition-all",
                            className,
                            activeFormats.has(format)
                              ? "bg-slate-800 text-white shadow-sm"
                              : "text-slate-400 hover:bg-slate-200 hover:text-slate-700",
                          ].join(" ")}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <Textarea
                      id="description"
                      ref={descriptionRef}
                      required
                      value={formData.description}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      onSelect={syncActiveFormats}
                      onKeyUp={syncActiveFormats}
                      onClick={syncActiveFormats}
                      className="min-h-56 border-0 bg-transparent px-5 py-4 text-sm leading-7 shadow-none focus-visible:ring-0"
                      placeholder="Descreva a ideia que você quer tirar do papel..."
                    />
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="xp_level" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Nível de Experiência
                    </label>
                    <select
                      id="xp_level"
                      value={formData.xp_level}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          xp_level: event.target.value,
                        }))
                      }
                      className="h-14 w-full rounded-2xl border border-transparent bg-slate-100 px-4 text-sm text-slate-700 outline-none focus:border-blue-300"
                    >
                      <option value="">Não especificado</option>
                      <option value="junior">Júnior</option>
                      <option value="mid">Pleno</option>
                      <option value="senior">Sênior</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="work_modality" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Modalidade da Vaga
                    </label>
                    <select
                      id="work_modality"
                      value={formData.work_modality}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          work_modality: event.target.value,
                        }))
                      }
                      className="h-14 w-full rounded-2xl border border-transparent bg-slate-100 px-4 text-sm text-slate-700 outline-none focus:border-blue-300"
                    >
                      <option value="">Não especificado</option>
                      <option value="remote">Remoto</option>
                      <option value="hybrid">Híbrido</option>
                      <option value="onsite">Presencial</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Prazo de Entrega
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={[
                          "flex h-14 w-full items-center gap-3 rounded-2xl border bg-slate-100 px-4 text-sm transition-colors hover:border-blue-300",
                          formData.deadline ? "border-blue-200 text-slate-800" : "border-transparent text-slate-400",
                        ].join(" ")}
                      >
                        <CalendarIcon className="size-4 shrink-0" />
                        {formData.deadline
                          ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).format(formData.deadline)
                          : "Selecione uma data limite"}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.deadline}
                        onSelect={(date) =>
                          setFormData((current) => ({ ...current, deadline: date ?? undefined }))
                        }
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-4 rounded-[28px] bg-white">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Faixa de Orçamento
                      </p>
                    </div>
                    <p className="text-xl font-bold tracking-tight text-[#3156ff]">
                      {rangeLabel}
                    </p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="budget_min" className="text-xs font-medium text-slate-500">
                        Mínimo
                      </label>
                      <Input
                        id="budget_min"
                        type="number"
                        min="0"
                        step="10"
                        value={formData.budget_min}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            budget_min: event.target.value,
                          }))
                        }
                        className="h-12 rounded-2xl border-transparent bg-slate-100 px-4"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="budget_max" className="text-xs font-medium text-slate-500">
                        Máximo
                      </label>
                      <Input
                        id="budget_max"
                        type="number"
                        min="0"
                        step="10"
                        value={formData.budget_max}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            budget_max: event.target.value,
                          }))
                        }
                        className="h-12 rounded-2xl border-transparent bg-slate-100 px-4"
                      />
                    </div>
                  </div>

                  <div className="px-1 pt-1">
                    <div className="relative h-7 pt-2">
                      <Slider
                        min={0}
                        max={50000}
                        step={10}
                        value={[Number(formData.budget_min), Number(formData.budget_max)]}
                        onValueChange={(values) =>
                          setFormData((current) => ({
                            ...current,
                            budget_min: String((values as number[])[0]),
                            budget_max: String((values as number[])[1]),
                          }))
                        }
                        className="w-full"
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] font-medium text-slate-400">
                      <span>R$0</span>
                      <span>R$50,000+</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 rounded-full border-transparent bg-slate-100 px-7 text-sm font-semibold text-slate-500"
                  >
                  <Bookmark className="size-4" />
                    Salvar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-12 rounded-full bg-[#1f4cff] px-8 text-sm font-semibold text-white shadow-[0_18px_36px_-18px_rgba(31,76,255,0.75)] hover:bg-[#1743ea]"
                  >
                    {isSubmitting ? "Publicando..." : "Publicar vaga"}
                  </Button>
                </div>
              </div>
            </form>
          ) : null}

          {!isLoadingMeta && canPublish ? (
            <div className="mx-auto flex w-full max-w-4xl items-start gap-4 rounded-[28px] bg-[#eef2ff] px-6 py-5 text-sm leading-7 text-slate-600">
              <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#3156ff] shadow-sm">
                <Info className="size-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Architect&apos;s Tip</p>
                <p>
                  Detailed descriptions and clear budget ranges attract better proposals.
                  Consider including constraints, expected milestones and review cadence.
                </p>
              </div>
            </div>
          ) : null}
        </section>
      </main>
      <Footer />
    </div>
  );
}
