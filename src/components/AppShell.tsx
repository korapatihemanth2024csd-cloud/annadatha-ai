import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, ScanLine, Bug, Gauge, IndianRupee, CloudSun, Lightbulb, Sprout, History,
  Glasses, GraduationCap, Settings, Bell, Search, Menu, X, Wheat, LogIn, LogOut, User as UserIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useT, LANGS, type TKey } from "@/lib/i18n";
import { actions, useAppState } from "@/lib/store";
import { useAuth } from "@/lib/supabase";
import { AuthModal } from "@/components/AuthModal";
import { cn } from "@/lib/utils";

const NAV: { to: string; k: TKey; icon: typeof LayoutDashboard }[] = [
  { to: "/", k: "dashboard", icon: LayoutDashboard },
  { to: "/analysis", k: "analysis", icon: ScanLine },
  { to: "/disease", k: "disease", icon: Bug },
  { to: "/severity", k: "severity", icon: Gauge },
  { to: "/market", k: "market", icon: IndianRupee },
  { to: "/weather", k: "weather", icon: CloudSun },
  { to: "/recommendations", k: "recs", icon: Lightbulb },
  { to: "/crops", k: "crops", icon: Sprout },
  { to: "/history", k: "history", icon: History },
  { to: "/ar", k: "ar", icon: Glasses },
  { to: "/learn", k: "learn", icon: GraduationCap },
  { to: "/settings", k: "settings", icon: Settings },
];

function Sidebar({ onNav }: { onNav?: () => void }) {
  const t = useT();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user, signOut, isLoading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground backdrop-blur-2xl">
      <div className="flex items-center gap-3 px-5 py-6">
        <img
            src="https://i.postimg.cc/bvDgd9Wp/Annadatha-AI-Agricultural-Emblem-2.png"
            alt="Annadatha AI"
            className="h-10 w-10 rounded-xl object-cover ring-2 ring-sidebar-primary/40 shadow-lg"
          />
        <div>
          <div className="font-display text-lg font-bold">ANNADATHA AI</div>
          <div className="text-[11px] text-sidebar-foreground/70">{t("AI-Powered Smart Agriculture")}</div>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {NAV.map(({ to, k, icon: Icon }) => {
          const active = to === "/" ? path === "/" : path.startsWith(to);
          return (
            <Link key={to} to={to} onClick={onNav}
              className={cn("flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60")}>
              <Icon className={cn("h-4 w-4", active && "text-sidebar-primary")} />
              {t(k)}
            </Link>
          );
        })}
      </nav>

      {/* User Auth Section in Sidebar */}
      <div className="m-3 space-y-2">
        {isLoading ? (
          <div className="h-14 animate-pulse rounded-lg border border-sidebar-foreground/10 bg-sidebar-accent/30" />
        ) : user ? (
          <div className="rounded-lg border border-sidebar-foreground/15 bg-sidebar-accent/80 p-3 text-xs text-sidebar-foreground/90 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sidebar-primary text-[11px] font-bold text-sidebar-primary-foreground">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-semibold text-sidebar-foreground text-[11px]">{user.email}</div>
                  <div className="flex items-center gap-1 text-[10px] text-sidebar-primary">
                    <span className="h-1.5 w-1.5 rounded-full bg-sidebar-primary animate-pulse" />
                    <span>{t("Cloud Synced")}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => signOut()}
                title={t("Sign Out")}
                aria-label={t("Sign Out")}
                className="rounded p-1 hover:bg-sidebar-foreground/10 text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-sidebar-foreground/15 bg-sidebar-accent/60 p-3 text-xs text-sidebar-foreground/90 backdrop-blur-xl space-y-2">
            <div>
              <div className="font-semibold text-sidebar-accent-foreground">{t("Farmer Account")}</div>
              <p className="text-[11px] text-sidebar-foreground/70">{t("Stay signed in to save and sync your crop disease analyses across devices.")}</p>
            </div>
            <AuthModal open={authOpen} onOpenChange={setAuthOpen}>
              <button
                onClick={() => setAuthOpen(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-md bg-sidebar-primary py-1.5 text-xs font-semibold text-sidebar-primary-foreground shadow hover:opacity-95 transition-opacity"
              >
                <LogIn className="h-3.5 w-3.5" />
                {t("Sign In")}
              </button>
            </AuthModal>
          </div>
        )}

        <div className="rounded-lg border border-sidebar-foreground/10 bg-sidebar-accent/40 p-3 text-xs text-sidebar-foreground/80 backdrop-blur-xl">
          <div className="font-display text-xs text-sidebar-accent-foreground">{t("From Field to Insight")}</div>
          <div className="text-[11px] mt-0.5">{t("Snap a leaf, get a diagnosis in seconds.")}</div>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const t = useT();
  const { lang, farmerName } = useAppState();
  const { user, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-foreground/10 lg:block"><Sidebar /></aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[min(18rem,86vw)] animate-in slide-in-from-left">
            <Sidebar onNav={() => setOpen(false)} />
            <button aria-label={t("Close menu")} onClick={() => setOpen(false)} className="absolute right-3 top-6 text-sidebar-foreground"><X /></button>
          </div>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="glass-surface sticky top-0 z-20 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-x-0 border-t-0 px-3 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 lg:hidden">
          <button aria-label={t("Open menu")} className="p-1 text-foreground" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
          <img
            src="https://i.postimg.cc/bvDgd9Wp/Annadatha-AI-Agricultural-Emblem-2.png"
            alt="Annadatha AI"
            className="h-7 w-7 rounded-lg object-cover ring-1 ring-primary/30"
          />
        </div>
          <div className="relative min-w-0 max-w-md lg:col-start-1 lg:col-end-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input aria-label={t("Search")} placeholder={t("Search farmers, diseases, crops...")} className="w-full rounded-lg border bg-card py-2 pl-9 pr-3 text-sm outline-none backdrop-blur focus:ring-2 focus:ring-ring" />
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <select aria-label="Language" value={lang} onChange={(e) => actions.setLang(e.target.value as never)}
              className="max-w-24 rounded-lg border bg-card px-2 py-1.5 text-sm sm:max-w-none">
              {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
            <button aria-label="Notifications" className="relative grid h-9 w-9 place-items-center rounded-xl border bg-card">
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
            </button>

            {isLoading ? (
              <div className="h-9 w-9 animate-pulse rounded-full bg-muted border" />
            ) : user ? (
              <Link
                to="/settings"
                title={`${user.email}`}
                className="relative grid h-9 w-9 place-items-center rounded-full bg-primary font-semibold text-primary-foreground shadow transition-transform hover:scale-105"
              >
                {user.email?.charAt(0).toUpperCase() || farmerName.charAt(0).toUpperCase()}
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-emerald-500" />
              </Link>
            ) : (
              <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen}>
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors shadow-sm cursor-pointer"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t("Sign In")}</span>
                </button>
              </AuthModal>
            )}
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8 animate-in fade-in duration-300">{children}</main>
      </div>
    </div>
  );
}

