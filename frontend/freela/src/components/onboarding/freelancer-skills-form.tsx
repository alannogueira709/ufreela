"use client";

import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowRight, Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-errors";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

type SkillCategory = {
  category_id: number;
  category_name: string;
  category_slug: string;
};

type Skill = {
  skill_id: number;
  skill_name: string;
  skill_slug: string;
  category: SkillCategory | null;
};

type SkillLevel = "beginner" | "intermediate" | "advanced";

type SkillLevelOption = {
  value: SkillLevel;
  label: string;
  helper: string;
};

const skillItemSchema = z.object({
  skill_id: z.coerce.number().min(1, "Selecione uma habilidade."),
  skill_level: z.enum(["beginner", "intermediate", "advanced"], {
    errorMap: () => ({ message: "Selecione um nivel valido." }),
  }),
});

const skillsFormSchema = z.object({
  skills: z
    .array(skillItemSchema)
    .min(1, "Adicione pelo menos uma habilidade.")
    .superRefine((skills, ctx) => {
      const selectedSkills = new Map<number, number>();

      skills.forEach((skill, index) => {
        if (!skill.skill_id) {
          return;
        }

        const previousIndex = selectedSkills.get(skill.skill_id);

        if (previousIndex !== undefined) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Essa habilidade ja foi escolhida em outra linha.",
            path: [index, "skill_id"],
          });
          return;
        }

        selectedSkills.set(skill.skill_id, index);
      });
    }),
});

type SkillsFormValues = z.infer<typeof skillsFormSchema>;

const EMPTY_SKILL_ROW: SkillsFormValues["skills"][number] = {
  skill_id: 0,
  skill_level: "beginner",
};

const SKILL_LEVEL_OPTIONS: SkillLevelOption[] = [
  {
    value: "beginner",
    label: "Iniciante",
    helper: "Para ferramentas que você domina no dia a dia com apoio ocasional.",
  },
  {
    value: "intermediate",
    label: "Intermediário",
    helper: "Para stacks em que você já entrega com segurança.",
  },
  {
    value: "advanced",
    label: "Avançado",
    helper: "Para especialidades nas quais você atua com profundidade.",
  },
];

export function FreelancerSkillsForm() {
  const router = useRouter();
  const { user } = useAuth();

  const { data: availableSkills = [], isLoading: isLoadingSkills } = useQuery<Skill[]>({
    queryKey: ["skills"],
    queryFn: async () => {
      const response = await api.get("/skills/");
      return response.data;
    },
  });

  const form = useForm<SkillsFormValues>({
    resolver: zodResolver(skillsFormSchema),
    defaultValues: {
      skills: [EMPTY_SKILL_ROW],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "skills",
  });

  const watchedSkills =
    useWatch({
      control: form.control,
      name: "skills",
    }) ?? [];

  const groupedSkills = useMemo(() => {
    const groups = new Map<string, Skill[]>();

    availableSkills.forEach((skill) => {
      const groupName = skill.category?.category_name ?? "Outras habilidades";
      const currentGroup = groups.get(groupName) ?? [];
      currentGroup.push(skill);
      groups.set(groupName, currentGroup);
    });

    return Array.from(groups.entries()).map(([label, items]) => ({
      label,
      items: items.sort((a, b) => a.skill_name.localeCompare(b.skill_name)),
    }));
  }, [availableSkills]);

  const saveSkillsMutation = useMutation({
    mutationFn: async (data: SkillsFormValues) => {
      await api.post("/freelancers/me/skills/", data);
    },
    onSuccess: () => {
      if (user?.id) {
        router.push(`/profile/freelancer/${user.id}`);
      }
    },
  });

  const submitErrorMessage = useMemo(() => {
    if (!saveSkillsMutation.error || !axios.isAxiosError(saveSkillsMutation.error)) {
      return null;
    }

    if (saveSkillsMutation.error.response?.status === 403) {
      return "Seu usuario não foi reconhecido pelo backend como freelancer autenticado.";
    }

    return getApiErrorMessage(
      saveSkillsMutation.error,
      "Não foi possível salvar agora. Tente novamente em instantes."
    );
  }, [saveSkillsMutation.error]);

  const handleSubmit = (data: SkillsFormValues) => {
    saveSkillsMutation.mutate(data);
  };

  if (isLoadingSkills) {
    return (
      <div className="space-y-6">
        <div className="gap-6 rounded-[2rem] border border-white/80 bg-white/95 p-6 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.35)] backdrop-blur sm:p-8">
          <div className="space-y-3 mb-6">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full rounded-full" />
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const canAddMoreSkills = watchedSkills.length < availableSkills.length;

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <FieldSet className="gap-6 rounded-[2rem] border border-white/80 bg-white/95 p-6 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.35)] backdrop-blur sm:p-8">
        <div className="space-y-3">
          <div className="space-y-2">
            <FieldLegend className="text-3xl font-bold tracking-tight text-slate-950">
              Suas habilidades
            </FieldLegend>
            <div className="h-1 w-14 rounded-full bg-blue-600" />
          </div>
          <FieldDescription className="max-w-2xl text-sm leading-6 text-slate-500">
            Escolha as stacks e ferramentas que melhor representam seu trabalho
            agora. Você pode adicionar mais de uma habilidade e definir o nível
            de domínio de cada uma.
          </FieldDescription>
        </div>

        <FieldGroup className="gap-4">
          {fields.map((field, index) => {
            const fieldErrors = form.formState.errors.skills?.[index];
            const currentSkillId = watchedSkills[index]?.skill_id ?? 0;
            const currentSkill =
              availableSkills.find((skill) => skill.skill_id === currentSkillId) ?? null;
            const currentSkillLevel = watchedSkills[index]?.skill_level ?? "beginner";
            const selectedSkillIds = new Set(
              watchedSkills
                .filter((_, skillIndex) => skillIndex !== index)
                .map((skill) => skill.skill_id)
                .filter((skillId) => skillId > 0)
            );
            const currentLevelOption =
              SKILL_LEVEL_OPTIONS.find((option) => option.value === currentSkillLevel) ?? null;

            return (
              <div
                key={field.id}
                className="rounded-3xl border border-slate-200/80 bg-slate-50/70 p-4 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.65)] sm:p-5"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Skill {String(index + 1).padStart(2, "0")}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Combine a habilidade com o nível que melhor descreve sua entrega.
                    </p>
                  </div>

                  {fields.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-10 rounded-full px-3 text-slate-500 hover:bg-slate-200/70 hover:text-slate-950"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="size-4" />
                      Remover
                    </Button>
                  ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-[minmax(0,1.45fr)_minmax(220px,1fr)]">
                  <Field className="gap-2">
                    <FieldLabel className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Skill
                    </FieldLabel>
                    <FieldContent>
                      <Controller
                        control={form.control}
                        name={`skills.${index}.skill_id`}
                        render={({ field: controlledField, fieldState }) => (
                          <>
                            <Combobox
                              items={availableSkills}
                              value={currentSkill}
                              itemToStringLabel={(skill) => skill.skill_name}
                              itemToStringValue={(skill) => String(skill.skill_id)}
                              isItemEqualToValue={(item, value) =>
                                item.skill_id === value.skill_id
                              }
                              onValueChange={(skill) => {
                                controlledField.onChange(skill?.skill_id ?? 0);
                              }}
                            >
                              <ComboboxInput
                                placeholder="Selecione uma habilidade"
                                aria-invalid={fieldState.invalid}
                                showClear={!!currentSkill}
                                className="h-12 rounded-2xl border-slate-200 bg-white px-3 shadow-none"
                              />
                              <ComboboxContent className="rounded-2xl border border-slate-200 bg-white p-1 shadow-2xl shadow-slate-900/10">
                                <ComboboxEmpty>
                                  Nenhuma habilidade encontrada.
                                </ComboboxEmpty>
                                <ComboboxList>
                                  {groupedSkills.map((group) => (
                                    <ComboboxGroup
                                      key={group.label}
                                      items={group.items}
                                      className="py-1"
                                    >
                                      <ComboboxLabel className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                        {group.label}
                                      </ComboboxLabel>
                                      {group.items.map((skill) => {
                                        const isTaken =
                                          selectedSkillIds.has(skill.skill_id) &&
                                          skill.skill_id !== currentSkillId;

                                        return (
                                          <ComboboxItem
                                            key={skill.skill_id}
                                            value={skill}
                                            disabled={isTaken}
                                            className="rounded-xl px-3 py-2 text-slate-700 data-highlighted:bg-blue-50 data-highlighted:text-blue-700 data-disabled:text-slate-300"
                                          >
                                            <div className="flex flex-col">
                                              <span className="font-medium">
                                                {skill.skill_name}
                                              </span>
                                              {skill.category?.category_name ? (
                                                <span className="text-xs text-slate-400">
                                                  {skill.category.category_name}
                                                </span>
                                              ) : null}
                                            </div>
                                          </ComboboxItem>
                                        );
                                      })}
                                    </ComboboxGroup>
                                  ))}
                                </ComboboxList>
                              </ComboboxContent>
                            </Combobox>
                            <FieldError errors={[fieldState.error, fieldErrors?.skill_id]} />
                          </>
                        )}
                      />
                    </FieldContent>
                  </Field>

                  <Field className="gap-2">
                    <FieldLabel className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Proficiencia
                    </FieldLabel>
                    <FieldContent>
                      <Controller
                        control={form.control}
                        name={`skills.${index}.skill_level`}
                        render={({ field: controlledField, fieldState }) => (
                          <>
                            <Combobox
                              items={SKILL_LEVEL_OPTIONS}
                              value={currentLevelOption}
                              itemToStringLabel={(option) => option.label}
                              itemToStringValue={(option) => option.value}
                              isItemEqualToValue={(item, value) =>
                                item.value === value.value
                              }
                              onValueChange={(option) => {
                                controlledField.onChange(option?.value ?? "beginner");
                              }}
                            >
                              <ComboboxInput
                                placeholder="Selecione o nivel"
                                readOnly
                                aria-invalid={fieldState.invalid}
                                className="h-12 rounded-2xl border-slate-200 bg-white px-3 shadow-none"
                              />
                              <ComboboxContent className="rounded-2xl border border-slate-200 bg-white p-1 shadow-2xl shadow-slate-900/10">
                                <ComboboxList>
                                  {SKILL_LEVEL_OPTIONS.map((option) => (
                                    <ComboboxItem
                                      key={option.value}
                                      value={option}
                                      className="rounded-xl px-3 py-2 text-slate-700 data-highlighted:bg-blue-50 data-highlighted:text-blue-700"
                                    >
                                      <div className="flex flex-col">
                                        <span className="font-medium">{option.label}</span>
                                        <span className="text-xs text-slate-400">
                                          {option.helper}
                                        </span>
                                      </div>
                                    </ComboboxItem>
                                  ))}
                                </ComboboxList>
                              </ComboboxContent>
                            </Combobox>
                            <FieldError errors={[fieldState.error, fieldErrors?.skill_level]} />
                          </>
                        )}
                      />
                    </FieldContent>
                  </Field>
                </div>
              </div>
            );
          })}
        </FieldGroup>

        <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            disabled={!canAddMoreSkills}
            onClick={() => append({ ...EMPTY_SKILL_ROW })}
            className="h-12 w-full justify-start rounded-full border border-dashed border-blue-200 bg-blue-50/80 px-4 text-blue-700 hover:bg-blue-100 sm:w-auto"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
              <Plus className="size-4" />
            </span>
            {canAddMoreSkills ? "Adicionar outra skill" : "Todas as skills ja foram listadas"}
          </Button>

          <div className="space-y-3 sm:text-right">
            <FieldError errors={form.formState.errors.skills ? [form.formState.errors.skills] : []} />
            {submitErrorMessage ? <p className="text-sm text-destructive">{submitErrorMessage}</p> : null}
            <Button
              type="submit"
              disabled={saveSkillsMutation.isPending}
              className="h-14 w-full rounded-full bg-blue-600 px-7 text-base font-semibold text-white shadow-[0_18px_45px_-18px_rgba(37,99,235,0.7)] hover:bg-blue-700 sm:w-auto"
            >
              {saveSkillsMutation.isPending ? "Salvando..." : "Completar perfil"}
              <ArrowRight className="size-5" />
            </Button>
          </div>
        </div>
      </FieldSet>
    </form>
  );
}
