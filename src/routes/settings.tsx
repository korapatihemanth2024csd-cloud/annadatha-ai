import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { useState } from "react";
import { PageHeader } from "@/components/ui-kit";
import { LANGS, useT } from "@/lib/i18n";
import { actions, useAppState } from "@/lib/store";
import { useAuth } from "@/lib/supabase";
import { AuthModal } from "@/components/AuthModal";
import { Button } from "@/components/ui/button";
import { Cloud, CheckCircle2, LogIn, LogOut, User as UserIcon, Shield } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Annadatha AI" },
      { name: "description", content: "Profile, language, account and data preferences." },
      { property: "og:title", content: "Settings — Annadatha AI" },
      { property: "og:description", content: "Manage your Annadatha AI preferences." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const t = useT();
  const { farmerName, lang } = useAppState();
  const { user, signOut } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast.success(t("Signed out successfully"));
  };

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title={t("settings")} />

      {/* Account & Cloud Sync Card */}
      <div className="card-soft space-y-4 p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <Cloud className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold">{t("Cloud Sync & Account")}</h2>
            <p className="text-xs text-muted-foreground">
              {t("Save and access your crop health diagnostics across all your devices.")}
            </p>
          </div>
        </div>

        {user ? (
          <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-primary font-bold text-primary-foreground">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-muted-foreground">{t("Signed in as")}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" /> Connected
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-foreground break-all">{user.email}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-primary/15 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Shield className="h-3.5 w-3.5 text-primary" /> Supabase Auth
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="h-8 gap-1.5 text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-3.5 w-3.5" />
                {t("Sign Out")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 rounded-xl border border-border bg-card/60 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground">
                  <UserIcon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{t("Guest Farmer")}</div>
                  <div className="text-xs text-muted-foreground">{t("Stay signed in to save and sync your crop disease analyses across devices.")}</div>
                </div>
              </div>
            </div>

            <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen}>
              <Button
                onClick={() => setAuthModalOpen(true)}
                className="w-full gap-2 text-xs font-semibold"
              >
                <LogIn className="h-4 w-4" />
                {t("Sign In")} / {t("Sign Up")}
              </Button>
            </AuthModal>
          </div>
        )}
      </div>

      {/* Preferences Card */}
      <div className="card-soft space-y-4 p-6">
        <label className="block text-sm">
          <span className="mb-1 block text-muted-foreground">{t("Your name")}</span>
          <input
            value={farmerName}
            onChange={(e) => actions.setName(e.target.value || "Farmer")}
            className="w-full rounded-xl border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted-foreground">{t("Language")}</span>
          <select
            value={lang}
            onChange={(e) => actions.setLang(e.target.value as never)}
            className="w-full rounded-xl border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
          >
            {LANGS.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Data Card */}
      <div className="card-soft p-6">
        <h2 className="text-lg font-semibold">{t("Data")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("Analysis history is stored on this device.")}</p>
        <button
          onClick={() => {
            actions.clear();
            toast.success(t("History cleared"));
          }}
          className="mt-4 rounded-xl border border-destructive px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors"
        >
          {t("Clear analysis history")}
        </button>
      </div>
    </div>
  );
}
