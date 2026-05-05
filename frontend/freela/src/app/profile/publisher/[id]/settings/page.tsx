"use client";

import { useRouter } from "next/navigation";
import { SettingsModal } from "@/components/settings/settings-dialog";

export default function PublisherSettingsPage() {
  const router = useRouter();

  const handleOpenChange = (open: boolean) => {
    if (open) {
      return;
    }

    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  };

  return <SettingsModal open onOpenChange={handleOpenChange} />;
}
