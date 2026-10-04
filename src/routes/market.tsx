import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, IndianRupee } from "lucide-react";
import { PageHeader } from "@/components/ui-kit";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/market")({
  head: () => ({
    meta: [
      { title: "Market Prices — Annadatha AI" },
      { name: "description", content: "Mandi crop prices in Indian Rupees by crop, state, district and market." },
      { property: "og:title", content: "Crop Market Prices — Annadatha AI" },
      { property: "og:description", content: "Compare min, max and modal mandi prices across India." },
    ],
  }),
  component: MarketPage,
});

function MarketPage() {
  const t = useT();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("market")}
        subtitle={t("Market data is updated from official agricultural mandis when available.")}
      />

      {/* Main Notice as required by Rule #12 */}
      <div className="card-soft flex flex-col items-center gap-4 p-8 text-center sm:p-12">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
          <AlertCircle className="h-8 w-8" />
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">
            {t("Live market price data is currently unavailable.")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("Market data is updated from official agricultural mandis when available.")}
          </p>
        </div>
        <div className="mt-2 rounded-xl border bg-muted/40 p-4 text-xs text-muted-foreground max-w-lg text-left space-y-1">
          <div className="font-semibold text-foreground flex items-center gap-1.5">
            <IndianRupee className="h-3.5 w-3.5 text-primary" /> API Integration Ready
          </div>
          <div>
            Agmarknet / e-NAM API architecture is supported for live mandi price feeds. Connect your government API credentials in settings to view real-time commodity rates.
          </div>
        </div>
      </div>
    </div>
  );
}
