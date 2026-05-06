"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  User,
  Palette,
  Bell,
  Shield,
  Globe,
  CreditCard,
  Briefcase,
  Building2,
  Link as LinkIcon,
  Loader2,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { settingsApi, type UserSettings } from "@/lib/settings-api";
import { AccountTab } from "./tabs/account-tab";
import { AppearanceTab } from "./tabs/appearance-tab";
import { NotificationsTab } from "./tabs/notifications-tab";
import { PrivacyTab } from "./tabs/privacy-tab";
import { LanguageTab } from "./tabs/language-tab";
import { BillingTab } from "./tabs/billing-tab";
import { IntegrationsTab } from "./tabs/integrations-tab";
import { FreelancerProfileTab } from "./tabs/freelancer-profile-tab";
import { PublisherCompanyTab } from "./tabs/publisher-profile-tab";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type UserRole = "freelancer" | "publisher";

const TAB_CONFIG: Record<UserRole, Array<{ id: string; label: string; icon: React.ElementType }>> = {
  freelancer: [
    { id: "account", label: "Conta", icon: User },
    { id: "profile", label: "Perfil Profissional", icon: Briefcase },
    { id: "integrations", label: "Integrações", icon: LinkIcon },
    { id: "billing", label: "Pagamentos", icon: CreditCard },
    { id: "appearance", label: "Aparência", icon: Palette },
    { id: "notifications", label: "Notificações", icon: Bell },
    { id: "privacy", label: "Privacidade", icon: Shield },
    { id: "language", label: "Idioma", icon: Globe },
  ],
  publisher: [
    { id: "account", label: "Conta", icon: User },
    { id: "company", label: "Empresa", icon: Building2 },
    { id: "billing", label: "Pagamentos", icon: CreditCard },
    { id: "appearance", label: "Aparência", icon: Palette },
    { id: "notifications", label: "Notificações", icon: Bell },
    { id: "privacy", label: "Privacidade", icon: Shield },
    { id: "language", label: "Idioma", icon: Globe },
  ],
};

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("account");
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const role = (user?.role as UserRole) || "freelancer";
  const tabs = TAB_CONFIG[role];

  const fetchSettings = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    try {
      const data = await settingsApi.get();
      setSettings(data);
      setHasChanges(false);
    } catch {
      toast.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (open) fetchSettings();
  }, [open, fetchSettings]);

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await settingsApi.update({
        theme: settings.theme,
        compact_mode: settings.compact_mode,
        email_notifications: settings.email_notifications,
        push_notifications: settings.push_notifications,
        marketing_emails: settings.marketing_emails,
        profile_visible: settings.profile_visible,
        show_activity_status: settings.show_activity_status,
        language: settings.language,
        timezone: settings.timezone,
        two_factor_enabled: settings.two_factor_enabled,
      });
      toast.success("Configurações salvas!");
      setHasChanges(false);
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const renderTab = () => {
    if (!settings) return null;
    const common = { settings, updateSetting, onChange: () => setHasChanges(true) };
    switch (activeTab) {
      case "account":
        return <AccountTab {...common} />;
      case "profile":
        return <FreelancerProfileTab onChange={() => setHasChanges(true)} />;
      case "company":
        return <PublisherCompanyTab onChange={() => setHasChanges(true)} />;
      case "integrations":
        return <IntegrationsTab />;
      case "billing":
        return <BillingTab role={role} />;
      case "appearance":
        return <AppearanceTab {...common} />;
      case "notifications":
        return <NotificationsTab {...common} />;
      case "privacy":
        return <PrivacyTab {...common} />;
      case "language":
        return <LanguageTab {...common} />;
      default:
        return <AccountTab {...common} />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[900px] max-w-[95vw] max-h-[92vh] overflow-hidden p-0 gap-0 border-slate-200 dark:border-slate-800">
        <DialogHeader className="px-6 pt-6 pb-3 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                Configurações
                <Badge variant="secondary" className="capitalize text-xs">
                  {role === "freelancer" ? "Freelancer" : "Publicador"}
                </Badge>
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Gerencie suas preferências e informações da conta
              </p>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex h-[calc(92vh-140px)] min-h-[500px] min-h-0">
            <aside className="w-64 border-r bg-slate-50/50 dark:bg-slate-900/50 p-4 overflow-y-auto shrink-0">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        active
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>

              <div className="mt-6 px-3">
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3 border border-amber-200 dark:border-amber-900">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed">
                      {role === "freelancer"
                        ? "Conecte GitHub e LinkedIn para importar automaticamente portfólio e experiência."
                        : "Configure métodos de pagamento para contratar freelancers com agilidade."}
                    </p>
                  </div>
                </div>
              </div>
            </aside>

            <div className="flex-1 min-w-0 overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.18 }}
                  className="p-6"
                >
                  {renderTab()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}

        <div className="border-t px-6 py-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2 text-sm">
            {hasChanges ? (
              <span className="text-amber-600 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                Alterações não salvas
              </span>
            ) : (
              <span className="text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                Tudo salvo
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Fechar
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges || saving} className="bg-blue-600 hover:bg-blue-700">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
