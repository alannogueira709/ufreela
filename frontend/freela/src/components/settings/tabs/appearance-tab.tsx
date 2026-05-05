"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

export function AppearanceTab({ settings, updateSetting, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Aparência</h3>
        <p className="text-sm text-muted-foreground">Personalize a interface da plataforma</p>
      </div>
      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base">Tema</Label>
            <p className="text-sm text-muted-foreground">Escolha o tema da interface</p>
          </div>
          <Select
            value={settings.theme}
            onValueChange={(v) => {
              if (!v) return;
              updateSetting("theme", v as UserSettings["theme"]);
              onChange();
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Claro</SelectItem>
              <SelectItem value="dark">Escuro</SelectItem>
              <SelectItem value="system">Sistema</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base">Modo compacto</Label>
            <p className="text-sm text-muted-foreground">Reduzir espaçamento dos elementos</p>
          </div>
          <Switch
            checked={settings.compact_mode}
            onCheckedChange={(v) => {
              updateSetting("compact_mode", v);
              onChange();
            }}
          />
        </div>
      </div>
    </div>
  );
}
