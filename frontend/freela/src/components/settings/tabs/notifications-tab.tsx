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

export function NotificationsTab({ settings, updateSetting, onChange }: Props) {
  const items = [
    { key: "email_notifications" as const, label: "E-mails", desc: "Receber atualizações importantes" },
    { key: "push_notifications" as const, label: "Push", desc: "Notificações no navegador" },
    { key: "marketing_emails" as const, label: "Marketing", desc: "Novidades e ofertas" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Notificações</h3>
        <p className="text-sm text-muted-foreground">Escolha como deseja ser notificado</p>
      </div>
      <Separator />

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between">
            <div>
              <Label className="text-base">{item.label}</Label>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
            <Switch
              checked={settings[item.key]}
              onCheckedChange={(v) => {
                updateSetting(item.key, v);
                onChange();
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}