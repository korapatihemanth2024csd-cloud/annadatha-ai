import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import type { ProviderType } from "@/lib/store";
import { cn } from "@/lib/utils";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, hint, icon, tone = "primary" }: {
  label: string; value: string; hint?: string; icon: ReactNode; tone?: "primary" | "warning" | "destructive" | "success" | "harvest";
}) {
  const tones = {
    primary: "bg-secondary text-primary",
    warning: "bg-warning/15 text-warning",
    destructive: "bg-destructive/10 text-destructive",
    success: "bg-success/15 text-success",
    harvest: "bg-harvest/20 text-foreground",
  };
  return (
    <div className="card-soft p-5 transition-transform duration-200 hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className={cn("grid h-9 w-9 place-items-center rounded-xl", tones[tone])}>{icon}</span>
      </div>
      <div className="mt-3 font-display text-2xl font-semibold text-foreground">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function Ring({ value, size = 160, label, color = "var(--primary)" }: { value: number; size?: number; label?: string; color?: string }) {
  const r = size / 2 - 12;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--muted)" strokeWidth={12} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={12} fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (v / 100) * c} style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-display text-3xl font-semibold">{v.toFixed(0)}%</div>
          {label && <div className="text-xs text-muted-foreground">{label}</div>}
        </div>
      </div>
    </div>
  );
}

export function EmptyAnalysis() {
  return (
    <div className="card-soft flex flex-col items-center gap-4 p-10 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-primary"><Sparkles /></div>
      <div>
        <h2 className="text-2xl font-semibold">No analysis yet</h2>
        <p className="mt-1 text-muted-foreground">Upload a crop photo to get disease detection, severity, yield and recommendations.</p>
      </div>
      <Link to="/analysis" className="rounded-xl bg-primary px-5 py-2.5 font-semibold text-primary-foreground hover:bg-primary/90">
        Start crop analysis
      </Link>
    </div>
  );
}

export function severityColor(s: string) {
  return s === "Low" ? "var(--success)" : s === "Moderate" ? "var(--warning)" : "var(--destructive)";
}

export function AIBadge({ provider }: { provider?: ProviderType | undefined }) {
  if (provider === "Gemini AI") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
        <Sparkles className="h-3.5 w-3.5 text-blue-500" /> AI Provider: Annadatha AI 1.1
      </span>
    );
  }
  if (provider === "OpenRouter") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400">
        <Sparkles className="h-3.5 w-3.5 text-purple-500" /> AI Provider: Annadatha AI 2.1
      </span>
    );
  }
  if (provider === "Demo Mode") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
        <Sparkles className="h-3.5 w-3.5 text-amber-500" /> AI Provider: Demo Mode
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
      <Sparkles className="h-3 w-3" /> AI estimate
    </span>
  );
}

export function DemoBanner({ provider }: { provider?: ProviderType | undefined }) {
  if (provider !== "Demo Mode") return null;
  return (
    <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/15 p-3.5 text-center font-display text-sm font-bold tracking-wide text-amber-800 dark:text-amber-300 shadow-sm">
      DEMO DATA — NOT REAL AI ANALYSIS
    </div>
  );
}
