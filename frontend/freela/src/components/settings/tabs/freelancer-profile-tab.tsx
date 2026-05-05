"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Briefcase, DollarSign, X, Plus, Loader2, Save } from "lucide-react";
import { api } from "@/lib/api";

interface Props {
  onChange: () => void;
}

interface FreelancerProfile {
  hourly_rate: number;
  professional_level: string;
  description: string;
  skills: Array<{ name: string; level: string }>;
}

export function FreelancerProfileTab({ onChange }: Props) {
  const [profile, setProfile] = useState<FreelancerProfile>({
    hourly_rate: 0,
    professional_level: "mid",
    description: "",
    skills: [],
  });
  const [newSkill, setNewSkill] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/auth/me/");
        setProfile({
          hourly_rate: Number(data.hourly_rate || 0),
          professional_level: data.professional_level || "mid",
          description: data.description || "",
          skills: data.skills || [],
        });
      } catch {
        toast.error("Erro ao carregar perfil");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch("/auth/me/", profile);
      toast.success("Perfil atualizado!");
      onChange();
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (!newSkill.trim()) return;
    setProfile((p) => ({ ...p, skills: [...p.skills, { name: newSkill.trim(), level: "intermediate" }] }));
    setNewSkill("");
  };

  const removeSkill = (idx: number) => {
    setProfile((p) => ({ ...p, skills: p.skills.filter((_, i) => i !== idx) }));
  };

  if (loading) {
    return <div className="h-64 bg-slate-100 animate-pulse rounded-lg" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-blue-600" />
          Perfil Profissional
        </h3>
        <p className="text-sm text-muted-foreground">Dados visíveis publicamente para publishers</p>
      </div>
      <Separator />

      <div className="space-y-4 max-w-lg">
        <div className="space-y-2">
          <Label htmlFor="rate" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-slate-500" />
            Taxa Horária (R$)
          </Label>
          <Input
            id="rate"
            type="number"
            value={profile.hourly_rate || ""}
            onChange={(e) => setProfile((p) => ({ ...p, hourly_rate: Number(e.target.value) }))}
            placeholder="150.00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="level">Nível Profissional</Label>
          <select
            id="level"
            value={profile.professional_level}
            onChange={(e) => setProfile((p) => ({ ...p, professional_level: e.target.value }))}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="junior">Júnior</option>
            <option value="mid">Pleno</option>
            <option value="senior">Sênior</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Sobre Mim</Label>
          <Textarea
            id="bio"
            value={profile.description}
            onChange={(e) => setProfile((p) => ({ ...p, description: e.target.value }))}
            placeholder="Descreva sua experiência..."
            className="min-h-[120px]"
          />
        </div>
      </div>

      <Separator />

      <div>
        <Label className="mb-2 block">Competências</Label>
        <div className="flex flex-wrap gap-2 mb-3">
          {profile.skills.map((skill, idx) => (
            <Badge key={idx} variant="secondary" className="px-3 py-1.5 cursor-pointer hover:bg-red-100" onClick={() => removeSkill(idx)}>
              {skill.name}
              <X className="h-3 w-3 ml-1 inline" />
            </Badge>
          ))}
        </div>
        <div className="flex gap-2 max-w-sm">
          <Input
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            placeholder="Nova skill (ex: React)"
            onKeyDown={(e) => e.key === "Enter" && addSkill()}
          />
          <Button type="button" size="icon" variant="outline" onClick={addSkill}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="pt-2">
        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar Perfil
        </Button>
      </div>
    </div>
  );
}
