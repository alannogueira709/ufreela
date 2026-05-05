"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { UserSettings } from "@/lib/settings-api";

interface Props {
  settings: UserSettings;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
  onChange: () => void;
}

export function PrivacyTab({ settings, updateSetting, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Privacidade</h3>
        <p className="text-sm text-muted-foreground">Controle quem vê suas informações</p>
      </div>
      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base">Perfil visível</Label>
            <p className="text-sm text-muted-foreground">Permitir que outros vejam seu perfil</p>
          </div>
          <Switch
            checked={settings.profile_visible}
            onCheckedChange={(v) => {
              updateSetting("profile_visible", v);
              onChange();
            }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base">Status de atividade</Label>
            <p className="text-sm text-muted-foreground">Mostrar quando está online</p>
          </div>
          <Switch
            checked={settings.show_activity_status}
            onCheckedChange={(v) => {
              updateSetting("show_activity_status", v);
              onChange();
            }}
          />
        </div>
      </div>
    </div>
  );
}