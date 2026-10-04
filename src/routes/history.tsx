import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { History as HistoryIcon, Trash2 } from "lucide-react";
import { useState } from "react";
import { AIBadge, PageHeader } from "@/components/ui-kit";
import { useT } from "@/lib/i18n";
import { actions, useAppState } from "@/lib/store";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Analysis History — Annadatha AI" },
      { name: "description", content: "Review past AI crop analyses and track disease over time." },
      { property: "og:title", content: "Analysis History — Annadatha AI" },
      { property: "og:description", content: "Every crop diagnosis you've run, saved on this device." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const t = useT();
  const nav = useNavigate();
  const { analyses } = useAppState();
  const [filter, setFilter] = useState<string>("All");

  const filtered = filter === "All"
    ? analyses
    : analyses.filter((a) => a.result.provider === filter);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("history")}
        subtitle={t("Analysis history is stored on this device.")}
        action={
          analyses.length > 0 ? (
            <button
              onClick={() => { actions.clear(); }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" /> {t("Clear analysis history")}
            </button>
          ) : undefined
        }
      />

      {analyses.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {["All", "Gemini AI", "OpenRouter", "Demo Mode"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
                filter === tab
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {tab === "All" ? t("All") : t(tab)} ({tab === "All" ? analyses.length : analyses.filter((a) => a.result.provider === tab).length})
            </button>
          ))}
        </div>
      )}

      {!filtered.length ? (
        <div className="card-soft flex flex-col items-center gap-4 p-10 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-primary">
            <HistoryIcon className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold">{t("No analysis history yet.")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("Upload a crop photo to get disease detection, severity, yield and recommendations.")}
            </p>
          </div>
          <Link
            to="/analysis"
            className="rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90 transition-transform hover:scale-[1.01]"
          >
            {t("Start crop analysis")}
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((a) => (
            <div key={a.id} className="card-soft flex gap-4 p-5 space-y-2 flex-col sm:flex-row sm:items-start">
              {a.image && (
                <img src={a.image} alt="" className="h-28 w-28 shrink-0 rounded-xl object-cover" />
              )}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</span>
                  <AIBadge provider={a.result.provider} />
                </div>
                <h3 className="truncate text-xl font-semibold">{a.result.disease_detection.disease_name}</h3>
                <div className="text-sm text-muted-foreground">
                  {a.result.crop_analysis.crop_name} · {a.result.severity_analysis.severity_level} · {a.result.severity_analysis.affected_area_percentage}% {t("affected")}
                </div>
                <div className="mt-3 flex items-center gap-2 pt-2 border-t">
                  <button
                    onClick={() => { actions.select(a.id); nav({ to: "/disease" }); }}
                    className="rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90"
                  >
                    {t("Open")}
                  </button>
                  <button
                    aria-label={t("Delete")}
                    onClick={() => actions.remove(a.id)}
                    className="rounded-lg border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
