"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { UserSettings } from "@/lib/settings-api";

interface Props {
  settings: UserSettings;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
  onChange: () => void;
}

export function AccountTab({ settings, updateSetting, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Informações da Conta</h3>
        <p className="text-sm text-muted-foreground">Gerencie seus dados de acesso e segurança</p>
      </div>
      <Separator />

      <div className="grid gap-4 max-w-md">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" defaultValue="usuario@exemplo.com" disabled />
        </div>
      </div>

      <Separator />

      <div className="flex items-center justify-between py-2">
        <div className="space-y-0.5">
          <Label className="text-base">Autenticação de dois fatores</Label>
          <p className="text-sm text-muted-foreground">Adicione uma camada extra de segurança</p>
        </div>
        <Switch
          checked={settings.two_factor_enabled}
          onCheckedChange={(v) => {
            updateSetting("two_factor_enabled", v);
            onChange();
          }}
        />
      </div>
    </div>
  );
}