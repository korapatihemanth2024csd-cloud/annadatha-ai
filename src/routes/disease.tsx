import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, ShieldAlert, Stethoscope } from "lucide-react";
import { AIBadge, DemoBanner, EmptyAnalysis, PageHeader } from "@/components/ui-kit";
import { useT } from "@/lib/i18n";
import { useCurrentAnalysis } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/disease")({
  head: () => ({
    meta: [
      { title: "Disease Detection — Annadatha AI" },
      { name: "description", content: "AI diagnosis of crop disease with confidence, symptoms and affected regions." },
      { property: "og:title", content: "AI Crop Disease Detection — Annadatha AI" },
      { property: "og:description", content: "See the detected disease, confidence and highlighted affected areas." },
    ],
  }),
  component: DiseasePage,
});

function riskBadge(level: string) {
  const map: Record<string, string> = {
    Low: "bg-success/15 text-success border-success/30",
    Moderate: "bg-warning/15 text-warning border-warning/30",
    High: "bg-orange-500/15 text-orange-600 border-orange-400/30",
    Critical: "bg-destructive/10 text-destructive border-destructive/30",
  };
  return map[level] ?? "bg-muted text-muted-foreground border-border";
}

function healthColor(status: string) {
  if (status === "Healthy") return "text-success";
  if (status === "Critical") return "text-destructive";
  return "text-warning";
}

function DiseasePage() {
  const t = useT();
  const a = useCurrentAnalysis();
  if (!a) return <><PageHeader title={t("disease")} /><EmptyAnalysis /></>;

  const ca = a.result.crop_analysis;
  const dd = a.result.disease_detection;
  const sa = a.result.severity_analysis;
  const risk = a.result.risk_assessment;
  const affirm = dd.disease_status === "No Disease";

  return (
    <div className="space-y-6">
      <DemoBanner provider={a.result.provider} />
      <PageHeader
        title={t("disease")}
        subtitle={`${ca.crop_name} · analysed ${new Date(a.createdAt).toLocaleString("en-IN")}`}
        action={<Link to="/severity" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Severity & Yield →</Link>}
      />

      {/* Top row: image + AI diagnosis */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Crop image */}
        <div className="card-soft overflow-hidden">
          <img src={a.image} alt="Analysed crop" className="w-full object-cover max-h-96" />
          <p className="p-4 text-xs text-muted-foreground">AI-analysed crop image. Affected areas are estimated.</p>
        </div>

        <div className="space-y-4">
          {/* Crop Analysis Card */}
          <div className="card-soft p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Crop Analysis</span>
              <AIBadge provider={a.result.provider} />
            </div>
            <h2 className="text-3xl font-semibold">{ca.crop_name}</h2>
            <p className={cn("mt-1 text-sm font-medium", healthColor(ca.health_status))}>{ca.health_status}</p>

            {/* Crop confidence bar */}
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-sm"><span className="text-muted-foreground">Crop Confidence</span><span className="font-semibold">{ca.crop_confidence}%</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="bg-hero h-full rounded-full transition-all duration-1000" style={{ width: `${ca.crop_confidence}%` }} /></div>
            </div>

            {/* Health score */}
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-sm"><span className="text-muted-foreground">Health Score</span><span className="font-semibold">{ca.health_score}/100</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${ca.health_score}%`, background: ca.health_score >= 70 ? "var(--success)" : ca.health_score >= 40 ? "var(--warning)" : "var(--destructive)" }} />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-muted p-3"><div className="text-xs text-muted-foreground">Growth Stage</div><div className="mt-0.5 font-semibold">{ca.growth_stage}</div></div>
              <div className="rounded-xl bg-muted p-3"><div className="text-xs text-muted-foreground">Health Status</div><div className={cn("mt-0.5 font-semibold", healthColor(ca.health_status))}>{ca.health_status}</div></div>
            </div>
          </div>

          {/* AI Diagnosis */}
          <div className="card-soft p-6">
            <div className="flex items-center gap-2 mb-3">
              {affirm ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Stethoscope className="h-5 w-5 text-destructive" />}
              <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">AI Diagnosis</span>
            </div>
            <h3 className="text-2xl font-semibold">{dd.disease_name}</h3>
            <span className={cn("mt-2 inline-block rounded-full border px-3 py-0.5 text-xs font-semibold", riskBadge(dd.disease_status))}>{dd.disease_status}</span>

            {/* Disease confidence */}
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-sm"><span className="text-muted-foreground">Disease Confidence</span><span className="font-semibold">{dd.disease_confidence}%</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="bg-hero h-full rounded-full transition-all duration-1000" style={{ width: `${dd.disease_confidence}%` }} /></div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-xl bg-muted p-3"><div className="text-muted-foreground">Severity</div><div className={cn("mt-1 font-bold", riskBadge(sa.severity_level))}>{sa.severity_level}</div></div>
              <div className="rounded-xl bg-muted p-3"><div className="text-muted-foreground">Affected</div><div className="mt-1 font-bold">{sa.affected_area_percentage}%</div></div>
              <div className="rounded-xl bg-muted p-3"><div className="text-muted-foreground">Healthy</div><div className="mt-1 font-bold text-success">{sa.healthy_area_percentage}%</div></div>
            </div>
          </div>
        </div>
      </div>

      {/* Disease Description + Severity Explanation */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-soft p-6">
          <h3 className="text-lg font-semibold mb-2">About this condition</h3>
          <p className="text-muted-foreground leading-relaxed">{dd.description}</p>
        </div>
        <div className="card-soft p-6">
          <h3 className="text-lg font-semibold mb-2">Severity Explanation</h3>
          <p className="text-muted-foreground leading-relaxed">{sa.severity_explanation}</p>
          {/* Affected area progress bar */}
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-sm"><span className="text-muted-foreground">Affected Area</span><span className="font-semibold">{sa.affected_area_percentage}%</span></div>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full transition-all duration-1000 bg-destructive/70" style={{ width: `${sa.affected_area_percentage}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>Affected: {sa.affected_area_percentage}%</span><span className="text-success">Healthy: {sa.healthy_area_percentage}%</span></div>
          </div>
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="card-soft p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldAlert className="h-5 w-5 text-warning" />
          <h3 className="text-lg font-semibold">Risk Assessment</h3>
          <AIBadge />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Disease Risk", value: risk.disease_risk },
            { label: "Yield Risk", value: risk.yield_risk },
            { label: "Weather Risk", value: risk.weather_risk },
            { label: "Overall Risk", value: risk.overall_risk },
          ].map(({ label, value }) => (
            <div key={label} className={cn("rounded-xl border p-4 text-center", riskBadge(value))}>
              <div className="text-xs font-medium opacity-80">{label}</div>
              <div className="mt-1 text-xl font-bold">{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Crop Summary */}
      <div className="card-soft p-6">
        <h3 className="text-lg font-semibold mb-2">Crop Summary</h3>
        <p className="text-muted-foreground leading-relaxed">{ca.summary}</p>
        <div className="mt-4 flex gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 text-warning mt-0.5" />
          <p>This is an AI estimate and should not replace expert agricultural advice. If confidence is low, please consult a local agricultural officer.</p>
        </div>
      </div>
    </div>
  );
}

