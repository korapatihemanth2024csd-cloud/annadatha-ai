import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { AIBadge, DemoBanner, EmptyAnalysis, PageHeader, Ring, severityColor } from "@/components/ui-kit";
import { useT } from "@/lib/i18n";
import { useCurrentAnalysis } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/severity")({
  head: () => ({
    meta: [
      { title: "Severity & Yield — Annadatha AI" },
      { name: "description", content: "Disease severity analysis and AI yield prediction with estimated loss." },
      { property: "og:title", content: "Severity & Yield Prediction — Annadatha AI" },
      { property: "og:description", content: "Affected area, severity level and predicted vs potential yield." },
    ],
  }),
  component: SeverityPage,
});

const LEVELS = ["Low", "Moderate", "High", "Critical"] as const;

function SeverityPage() {
  const t = useT();
  const a = useCurrentAnalysis();
  if (!a) return <><PageHeader title={t("severity")} /><EmptyAnalysis /></>;

  const sa = a.result.severity_analysis;
  const yp = a.result.yield_prediction;
  const affected = sa.affected_area_percentage;
  const severity = sa.severity_level as "Low" | "Moderate" | "High" | "Critical";

  const chart = [
    { name: "Potential", value: yp.potential_yield },
    { name: "Expected", value: yp.expected_yield },
    { name: "Loss", value: yp.estimated_loss },
  ];
  const cells = 100;
  const infectedCells = Math.round(affected);

  return (
    <div className="space-y-6">
      <DemoBanner provider={a.result.provider} />
      <PageHeader title={t("severity")} subtitle={`${a.result.crop_analysis.crop_name} · ${a.details["Cultivated area"] ? a.details["Cultivated area"] + " acres" : "area not specified"}`} />

      <section className="card-soft p-6">
        <div className="mb-5 flex items-center justify-between"><h2 className="text-2xl font-semibold">Disease Severity Analysis</h2><AIBadge provider={a.result.provider} /></div>
        <div className="grid items-center gap-8 md:grid-cols-3">
          <div className="flex justify-center"><Ring value={affected} label="Affected area" color={severityColor(severity)} /></div>
          <div className="space-y-4">
            <div className="flex justify-between rounded-xl bg-muted p-4"><span className="text-muted-foreground">Infected area</span><span className="font-display text-xl font-semibold">{affected}%</span></div>
            <div className="flex justify-between rounded-xl bg-muted p-4"><span className="text-muted-foreground">Healthy area</span><span className="font-display text-xl font-semibold">{sa.healthy_area_percentage}%</span></div>
            <div className="flex gap-1.5">
              {LEVELS.map((l) => (
                <div key={l} className={cn("flex-1 rounded-lg py-2 text-center text-xs font-semibold", l === severity ? "text-primary-foreground" : "bg-muted text-muted-foreground")}
                  style={l === severity ? { background: severityColor(l) } : undefined}>{l}</div>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 text-sm font-medium text-muted-foreground">Field diagram</div>
            <div className="grid grid-cols-10 gap-1">
              {Array.from({ length: cells }).map((_, i) => (
                <div key={i} className={cn("aspect-square rounded-sm", (i * 37) % cells < infectedCells ? "bg-destructive/70" : "bg-leaf/60")} />
              ))}
            </div>
            <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-leaf/60" />Healthy</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-destructive/70" />Infected</span>
            </div>
          </div>
        </div>
        <div className="mt-4 rounded-xl bg-muted/60 p-4">
          <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">Severity note: </span>{sa.severity_explanation}</p>
        </div>
      </section>

      <section className="card-soft p-6">
        <div className="mb-5 flex items-center justify-between"><h2 className="text-2xl font-semibold">AI Yield Prediction</h2><AIBadge /></div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Expected Yield", `${yp.expected_yield.toFixed(2)} ${yp.yield_unit}`],
              ["Potential Yield", `${yp.potential_yield.toFixed(2)} ${yp.yield_unit}`],
              ["Estimated Loss", `${yp.estimated_loss.toFixed(2)} ${yp.yield_unit}`],
              ["Loss %", `${yp.loss_percentage.toFixed(1)}%`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-muted p-4"><div className="text-xs text-muted-foreground">{k}</div><div className="mt-1 font-display text-xl font-semibold">{v}</div></div>
            ))}
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {chart.map((_, i) => <Cell key={i} fill={["var(--chart-1)", "var(--chart-2)", "var(--chart-4)"][i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="mt-4 rounded-xl bg-muted/60 p-4">
          <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">Yield note: </span>{yp.yield_explanation}</p>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">All yield figures are AI estimates based on the photo and details provided.</p>
      </section>
    </div>
  );
}

