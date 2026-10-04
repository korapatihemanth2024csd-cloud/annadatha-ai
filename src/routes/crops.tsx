import { createFileRoute, Link } from "@tanstack/react-router";
import { Sprout } from "lucide-react";
import { PageHeader } from "@/components/ui-kit";
import { useT } from "@/lib/i18n";
import { actions, useAppState } from "@/lib/store";

export const Route = createFileRoute("/crops")({
  head: () => ({
    meta: [
      { title: "My Crops — Annadatha AI" },
      { name: "description", content: "Track growth stage, health and expected yield for every crop on your farm." },
      { property: "og:title", content: "My Crops — Annadatha AI" },
      { property: "og:description", content: "All your crops' health and yield in one place." },
    ],
  }),
  component: CropsPage,
});

function CropsPage() {
  const t = useT();
  const { analyses } = useAppState();

  return (
    <div className="space-y-6">
      <PageHeader title={t("crops")} subtitle={t("Health, growth stage and yield outlook for each field.")} />

      {analyses.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {analyses.map((item) => (
            <div key={item.id} className="card-soft overflow-hidden p-6 space-y-4">
              {item.image && (
                <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
                  <img src={item.image} alt={item.result.crop_analysis.crop_name} className="h-full w-full object-cover" />
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-semibold">{item.result.crop_analysis.crop_name}</h3>
                  <p className="text-xs text-muted-foreground">{item.details["Variety"] || "Field Crop"}</p>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
                  {t(item.result.crop_analysis.health_status)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-muted p-2.5">
                  <div className="text-muted-foreground">{t("Disease")}</div>
                  <div className="font-semibold text-foreground mt-0.5">{item.result.disease_detection.disease_name}</div>
                </div>
                <div className="rounded-lg bg-muted p-2.5">
                  <div className="text-muted-foreground">{t("Expected Yield")}</div>
                  <div className="font-semibold text-foreground mt-0.5">
                    {item.result.yield_prediction.expected_yield} {item.result.yield_prediction.yield_unit}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                <Link
                  to="/disease"
                  onClick={() => actions.select(item.id)}
                  className="rounded-lg bg-primary/10 px-3 py-1.5 font-semibold text-primary hover:bg-primary/20 transition-colors"
                >
                  {t("Open")} →
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card-soft flex flex-col items-center gap-4 p-10 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-primary">
            <Sprout className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold">{t("No crops added yet.")}</h2>
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
      )}
    </div>
  );
}
