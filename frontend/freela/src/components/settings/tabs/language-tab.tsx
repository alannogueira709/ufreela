"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { UserSettings } from "@/lib/settings-api";

interface Props {
  settings: UserSettings;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
  onChange: () => void;
}

export function LanguageTab({ settings, updateSetting, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Idioma e Região</h3>
        <p className="text-sm text-muted-foreground">Preferências de localização</p>
      </div>
      <Separator />

      <div className="space-y-4 max-w-sm">
        <div className="space-y-2">
          <Label>Idioma</Label>
          <Select
            value={settings.language}
            onValueChange={(v) => {
              if (!v) return;
              updateSetting("language", v);
              onChange();
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
              <SelectItem value="en-US">English (US)</SelectItem>
              <SelectItem value="es">Español</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Fuso horário</Label>
          <Select
            value={settings.timezone}
            onValueChange={(v) => {
              if (!v) return;
              updateSetting("timezone", v);
              onChange();
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="America/Sao_Paulo">América/São Paulo</SelectItem>
              <SelectItem value="America/New_York">América/Nova York</SelectItem>
              <SelectItem value="Europe/London">Europa/Londres</SelectItem>
              <SelectItem value="Europe/Paris">Europa/Paris</SelectItem>
              <SelectItem value="Asia/Tokyo">Ásia/Tóquio</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
