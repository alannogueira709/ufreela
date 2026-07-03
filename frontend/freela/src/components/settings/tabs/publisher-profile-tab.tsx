"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Building2, Loader2, Save } from "lucide-react";

interface Props {
  onChange: () => void;
}

interface CompanyData {
  company_name: string;
  company_document: string;
}

export function PublisherCompanyTab({ onChange }: Props) {
  const [data, setData] = useState<CompanyData>({
    company_name: "",
    company_document: "",
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get("/auth/me/");
        setData({
          company_name: response.data.company_name || "",
          company_document: response.data.company_document || "",
        });
      } catch {
        toast.error("Erro ao carregar dados da empresa");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch("/auth/me/", data);
      toast.success("Dados da empresa salvos!");
      onChange();
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="h-64 bg-slate-100 animate-pulse rounded-lg" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-600" />
          Dados da Empresa
        </h3>
        <p className="text-sm text-muted-foreground">Informacoes visiveis para freelancers</p>
      </div>
      <Separator />

      <div className="space-y-4 max-w-lg">
        <div className="space-y-2">
          <Label htmlFor="company_name">Razao Social</Label>
          <Input
            id="company_name"
            value={data.company_name}
            onChange={(event) => setData((current) => ({ ...current, company_name: event.target.value }))}
            placeholder="Empresa LTDA"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company_document">CNPJ</Label>
          <Input
            id="company_document"
            value={data.company_document}
            onChange={(event) => setData((current) => ({ ...current, company_document: event.target.value }))}
            placeholder="00.000.000/0000-00"
          />
        </div>
      </div>

      <div className="pt-2">
        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar
        </Button>
      </div>
    </div>
  );
}
