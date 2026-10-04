import { createFileRoute, Link } from "@tanstack/react-router";
import { HeartPulse, Bug, Gauge, Wheat, TrendingDown, IndianRupee, ArrowRight, Sparkles, Sprout } from "lucide-react";
import { useEffect, useState } from "react";
import { StatCard } from "@/components/ui-kit";
import { useT } from "@/lib/i18n";
import { actions, useAppState, useCurrentAnalysis } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Annadatha AI" },
      { name: "description", content: "Your farm's crop health, disease, yield and market value at a glance." },
      { property: "og:title", content: "Annadatha AI — Smart Agriculture Dashboard" },
      { property: "og:description", content: "AI crop disease detection, yield prediction and mandi prices for Indian farmers." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const t = useT();
  const { farmerName, analyses } = useAppState();
  const a = useCurrentAnalysis();
  const [greet, setGreet] = useState<"morning" | "afternoon" | "evening">("morning");

  useEffect(() => {
    const h = new Date().getHours();
    setGreet(h < 12 ? "morning" : h < 17 ? "afternoon" : "evening");
  }, []);

  // Filter out Demo Mode results from real dashboard statistics
  const realAnalyses = analyses.filter((x) => x.result.provider !== "Demo Mode");
  const hasRealData = realAnalyses.length > 0;

  const latestReal = realAnalyses[0]?.result;
  const diseaseCount = realAnalyses.filter((x) => x.result.disease_detection.disease_status !== "No Disease").length;
  const avgSev = hasRealData
    ? realAnalyses.reduce((s, x) => s + x.result.severity_analysis.affected_area_percentage, 0) / realAnalyses.length
    : 0;

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <section className="bg-hero relative overflow-hidden rounded-3xl p-7 text-primary-foreground sm:p-10">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary-foreground/10 blur-2xl" />
        <p className="text-sm font-medium uppercase tracking-widest text-primary-foreground/70">{t("From Field to Insight")}</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">{t(greet)}, {farmerName} 👋</h1>
        <p className="mt-2 text-primary-foreground/85">{t("Here is your crop health overview.")}</p>
        <Link to="/analysis" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-foreground px-5 py-3 font-semibold text-primary hover:bg-primary-foreground/90 transition-transform hover:scale-[1.01]">
          {t("analyze")} <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {/* Dashboard Real Stats Grid */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label={t("Crop Health")}
          value={hasRealData && latestReal ? t(latestReal.crop_analysis.health_status) : t("N/A")}
          hint={hasRealData && latestReal ? latestReal.crop_analysis.crop_name : t("No crop analyses yet.")}
          icon={<HeartPulse className="h-4 w-4" />}
          tone={hasRealData && latestReal?.crop_analysis.health_status === "Healthy" ? "success" : hasRealData && latestReal?.crop_analysis.health_status === "Critical" ? "destructive" : "warning"}
        />
        <StatCard
          label={t("Disease Detection")}
          value={hasRealData ? `${diseaseCount} ${t(diseaseCount === 1 ? "Disease Detected" : "Diseases Detected")}` : t("N/A")}
          hint={t("Across recent analyses")}
          icon={<Bug className="h-4 w-4" />}
          tone="destructive"
        />
        <StatCard
          label={t("Average Severity")}
          value={hasRealData ? `${avgSev.toFixed(0)}% ${t("Affected")}` : t("N/A")}
          icon={<Gauge className="h-4 w-4" />}
          tone="warning"
        />
        <StatCard
          label={t("Expected Yield")}
          value={hasRealData && latestReal ? `${latestReal.yield_prediction.expected_yield.toFixed(2)} ${latestReal.yield_prediction.yield_unit}` : t("N/A")}
          hint={t("AI estimate")}
          icon={<Wheat className="h-4 w-4" />}
          tone="success"
        />
        <StatCard
          label={t("Estimated Loss")}
          value={hasRealData && latestReal ? `${latestReal.yield_prediction.loss_percentage.toFixed(0)}% ${t("Potential Loss")}` : t("N/A")}
          icon={<TrendingDown className="h-4 w-4" />}
          tone="destructive"
        />
        <StatCard
          label={t("Yield Loss")}
          value={hasRealData && latestReal ? `${latestReal.yield_prediction.estimated_loss.toFixed(2)} ${latestReal.yield_prediction.yield_unit}` : t("N/A")}
          hint={t("Compared to potential yield")}
          icon={<IndianRupee className="h-4 w-4" />}
          tone="harvest"
        />
      </section>

      {/* Empty State Banner if no analyses performed */}
      {!hasRealData && (
        <section className="card-soft flex flex-col items-center gap-4 p-8 text-center sm:p-10">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-primary">
            <Sparkles className="h-7 w-7" />
          </div>
          <div className="max-w-md">
            <h2 className="text-2xl font-semibold">{t("No crop analyses yet.")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("Upload a crop photo to get disease detection, severity, yield and recommendations.")}
            </p>
          </div>
          <Link
            to="/analysis"
            className="rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-transform hover:scale-[1.02]"
          >
            {t("Analyze Your First Crop")}
          </Link>
        </section>
      )}

      {/* My Crops Section */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">{t("crops")}</h2>
          <Link to="/crops" className="text-sm font-semibold text-primary hover:underline">{t("View all")}</Link>
        </div>

        {hasRealData ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {realAnalyses.slice(0, 3).map((item) => (
              <div key={item.id} className="card-soft overflow-hidden p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{item.result.crop_analysis.crop_name}</h3>
                    <p className="text-xs text-muted-foreground">{item.details["Variety"] || "Local Variety"}</p>
                  </div>
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
                    {t(item.result.crop_analysis.health_status)}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">{t("Disease")}: </span>
                  <span className="font-medium">{item.result.disease_detection.disease_name}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  <Link to="/disease" onClick={() => actions.select(item.id)} className="font-semibold text-primary hover:underline">
                    {t("Open")} →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card-soft p-8 text-center">
            <Sprout className="mx-auto h-8 w-8 text-muted-foreground/60" />
            <p className="mt-2 text-sm font-medium text-muted-foreground">{t("No crops added yet.")}</p>
            <Link to="/analysis" className="mt-3 inline-block rounded-xl bg-secondary px-4 py-2 text-xs font-semibold text-primary hover:bg-secondary/80">
              {t("Start crop analysis")}
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
