import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, BadgeCheck, Droplets, Leaf, ShieldCheck, Sprout, Stethoscope, Zap } from "lucide-react";
import { AIBadge, DemoBanner, EmptyAnalysis, PageHeader } from "@/components/ui-kit";
import { useT } from "@/lib/i18n";
import { useCurrentAnalysis } from "@/lib/store";

export const Route = createFileRoute("/recommendations")({
  head: () => ({
    meta: [
      { title: "Recommendations — Annadatha AI" },
      { name: "description", content: "AI-powered treatment, irrigation, monitoring and prevention guidance." },
      { property: "og:title", content: "AI Crop Recommendations — Annadatha AI" },
      { property: "og:description", content: "Practical next steps for your crop based on AI diagnosis." },
    ],
  }),
  component: RecsPage,
});

function RecsPage() {
  const t = useT();
  const a = useCurrentAnalysis();
  if (!a) return <><PageHeader title={t("recs")} /><EmptyAnalysis /></>;

  const rec = a.result.recommendations;
  const adv = a.result.farmer_advice;
  const ca = a.result.crop_analysis;
  const dd = a.result.disease_detection;

  return (
    <div className="space-y-6">
      <DemoBanner provider={a.result.provider} />
      <PageHeader title="AI-Powered Recommendations"
        subtitle={`For ${ca.crop_name} — ${dd.disease_name}`}
        action={<AIBadge provider={a.result.provider} />} />

      {/* Immediate Actions */}
      <div className="card-soft p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-destructive/10 text-destructive"><Zap className="h-5 w-5" /></span>
          <h3 className="text-xl font-semibold">Immediate Actions</h3>
        </div>
        <ul className="space-y-3">
          {rec.immediate_actions.map((action, i) => (
            <li key={i} className="flex gap-3 rounded-xl bg-destructive/5 border border-destructive/15 p-3 text-sm">
              <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-destructive/80 text-white flex items-center justify-center text-xs font-bold">{i + 1}</span>
              {action}
            </li>
          ))}
        </ul>
      </div>

      {/* Single-value recommendations */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[
          { k: "Disease Management", v: rec.disease_management, icon: Stethoscope, tone: "bg-secondary text-primary" },
          { k: "Fertilizer Recommendation", v: rec.fertilizer_recommendation, icon: Sprout, tone: "bg-chart-5/15 text-chart-5" },
          { k: "Irrigation Recommendation", v: rec.irrigation_recommendation, icon: Droplets, tone: "bg-chart-5/15 text-chart-5" },
        ].map(({ k, v, icon: Icon, tone }) => (
          <div key={k} className="card-soft p-6">
            <span className={`grid h-11 w-11 place-items-center rounded-xl ${tone}`}><Icon className="h-5 w-5" /></span>
            <h3 className="mt-4 text-lg font-semibold">{k}</h3>
            <p className="mt-2 text-muted-foreground text-sm leading-relaxed">{v}</p>
          </div>
        ))}
      </div>

      {/* Preventive Measures */}
      <div className="card-soft p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-success/15 text-success"><ShieldCheck className="h-5 w-5" /></span>
          <h3 className="text-xl font-semibold">Preventive Measures</h3>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {rec.preventive_measures.map((m, i) => (
            <li key={i} className="flex gap-2 text-sm rounded-xl bg-success/5 border border-success/15 p-3">
              <Leaf className="h-4 w-4 mt-0.5 shrink-0 text-success" />{m}
            </li>
          ))}
        </ul>
      </div>

      {/* Farmer Advice */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card-soft p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-warning/15 text-warning"><Zap className="h-5 w-5" /></span>
            <h3 className="text-xl font-semibold">Short-term Actions</h3>
          </div>
          <ul className="space-y-2">
            {adv.short_term.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />{item}
              </li>
            ))}
          </ul>
        </div>
        <div className="card-soft p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><BadgeCheck className="h-5 w-5" /></span>
            <h3 className="text-xl font-semibold">Long-term Actions</h3>
          </div>
          <ul className="space-y-2">
            {adv.long_term.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Disclaimer / Expert Verification */}
      <div className={`flex gap-3 rounded-2xl border p-5 text-sm ${adv.expert_verification_required ? "border-destructive/40 bg-destructive/10" : "border-warning/40 bg-warning/10"}`}>
        <AlertTriangle className={`h-5 w-5 shrink-0 ${adv.expert_verification_required ? "text-destructive" : "text-warning"}`} />
        <p>
          {adv.expert_verification_required
            ? "⚠️ Expert verification is recommended before applying any treatments. Please consult a qualified agricultural officer or agronomist."
            : "Recommendations are AI-generated guidance and should be verified with qualified agricultural experts before applying treatments."}
        </p>
      </div>
    </div>
  );
}

