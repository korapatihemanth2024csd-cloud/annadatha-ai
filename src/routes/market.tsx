import { useState, useEffect, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  IndianRupee,
  Search,
  RefreshCw,
  Key,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Building2,
  Tag,
  ExternalLink,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";
import { PageHeader } from "@/components/ui-kit";
import { useT } from "@/lib/i18n";
import { inr, type MarketRow } from "@/lib/data";
import {
  fetchLiveMandiPrices,
  getStoredAgmarknetApiKey,
  setStoredAgmarknetApiKey,
} from "@/lib/mandi.api";
import { toast } from "sonner";

export const Route = createFileRoute("/market")({
  head: () => ({
    meta: [
      { title: "Mandi Market Prices — Annadatha AI" },
      { name: "description", content: "Live and historical mandi crop prices across India in Indian Rupees." },
      { property: "og:title", content: "Crop Market Prices — Annadatha AI" },
      { property: "og:description", content: "Compare min, max and modal mandi prices across Indian markets." },
    ],
  }),
  component: MarketPage,
});

function MarketPage() {
  const t = useT();

  const [apiKey, setApiKey] = useState("");
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [records, setRecords] = useState<MarketRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("All");
  const [selectedCrop, setSelectedCrop] = useState("All");

  // Load API key from local storage on mount
  useEffect(() => {
    const saved = getStoredAgmarknetApiKey();
    setApiKey(saved);
    loadData(saved);
  }, []);

  const loadData = async (keyToUse?: string) => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await fetchLiveMandiPrices({
        apiKey: keyToUse !== undefined ? keyToUse : apiKey,
      });
      setRecords(res.records);
      setIsLive(res.isLive);
      if (res.error) {
        setApiError(res.error);
      }
    } catch (e: any) {
      setApiError(e.message || "Failed to load mandi prices");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiKey = () => {
    setStoredAgmarknetApiKey(apiKey);
    toast.success("API key saved locally");
    loadData(apiKey);
  };

  const handleClearApiKey = () => {
    setApiKey("");
    setStoredAgmarknetApiKey("");
    toast.info("API key removed. Switched to sample data mode.");
    loadData("");
  };

  // Derive filter lists
  const availableStates = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => r.state && set.add(r.state));
    return ["All", ...Array.from(set).sort()];
  }, [records]);

  const availableCrops = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => r.crop && set.add(r.crop));
    return ["All", ...Array.from(set).sort()];
  }, [records]);

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchesSearch =
        searchQuery === "" ||
        r.crop.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.market.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.variety.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesState = selectedState === "All" || r.state === selectedState;
      const matchesCrop = selectedCrop === "All" || r.crop === selectedCrop;

      return matchesSearch && matchesState && matchesCrop;
    });
  }, [records, searchQuery, selectedState, selectedCrop]);

  // Calculate summary metrics
  const metrics = useMemo(() => {
    if (filteredRecords.length === 0) return { count: 0, highest: 0, lowest: 0, avgModal: 0 };
    let highest = 0;
    let lowest = Infinity;
    let sumModal = 0;

    filteredRecords.forEach((r) => {
      if (r.max > highest) highest = r.max;
      if (r.min < lowest && r.min > 0) lowest = r.min;
      sumModal += r.modal;
    });

    return {
      count: filteredRecords.length,
      highest,
      lowest: lowest === Infinity ? 0 : lowest,
      avgModal: sumModal / filteredRecords.length,
    };
  }, [filteredRecords]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title={t("market")}
          subtitle={t("Market data is updated from official agricultural mandis when available.")}
        />
        <div className="flex items-center gap-2">
          {/* Status Badge */}
          <div
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md transition-all ${
              isLive
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isLive ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              }`}
            />
            {isLive ? t("Live Mandi Feed Active") : t("Sample Mandi Data Mode")}
          </div>

          <button
            onClick={() => setShowKeyConfig(!showKeyConfig)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card/60 px-3 py-1.5 text-xs font-medium hover:bg-accent hover:text-accent-foreground transition-all"
          >
            <Key className="h-3.5 w-3.5 text-primary" />
            <span>API Config</span>
          </button>
        </div>
      </div>

      {/* API Key Drawer / Config Card */}
      {showKeyConfig && (
        <div className="rounded-2xl border border-primary/20 bg-card/70 p-5 shadow-lg backdrop-blur-md space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Key className="h-4 w-4 text-primary" />
                {t("Agmarknet / data.gov.in API Key")}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Connect your free official Mandi Price API key from the Open Government Data Platform India.
              </p>
            </div>
            <a
              href="https://data.gov.in"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              {t("Get Free API Key on data.gov.in")}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={t("Enter your free data.gov.in API key")}
                className="w-full rounded-xl border border-input bg-background/80 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                onClick={handleSaveApiKey}
                disabled={loading}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t("Save API Key")}
              </button>
              {apiKey && (
                <button
                  onClick={handleClearApiKey}
                  className="inline-flex items-center justify-center rounded-xl border border-input bg-background px-3 py-2 text-xs font-medium hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  {t("Remove Key")}
                </button>
              )}
            </div>
          </div>

          {apiError && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{apiError}</span>
            </div>
          )}
        </div>
      )}

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <Building2 className="h-3.5 w-3.5 text-primary" />
            <span>Markets Listed</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{metrics.count}</div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            <span>Highest Price</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {metrics.highest ? inr(metrics.highest) : "₹0"}
            <span className="text-xs font-normal text-muted-foreground"> / Qtl</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <TrendingDown className="h-3.5 w-3.5 text-amber-500" />
            <span>Lowest Price</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {metrics.lowest ? inr(metrics.lowest) : "₹0"}
            <span className="text-xs font-normal text-muted-foreground"> / Qtl</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <IndianRupee className="h-3.5 w-3.5 text-blue-500" />
            <span>Avg Modal Rate</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {metrics.avgModal ? inr(metrics.avgModal) : "₹0"}
            <span className="text-xs font-normal text-muted-foreground"> / Qtl</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("Search crop, market or state...")}
            className="w-full rounded-2xl border border-input bg-card/80 pl-10 pr-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* State Filter */}
          <div className="flex items-center gap-1.5 rounded-2xl border border-input bg-card/80 px-3 py-1.5 text-xs">
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="bg-transparent text-foreground focus:outline-none font-medium"
            >
              {availableStates.map((st) => (
                <option key={st} value={st}>
                  {st === "All" ? t("All States") : st}
                </option>
              ))}
            </select>
          </div>

          {/* Crop Filter */}
          <div className="flex items-center gap-1.5 rounded-2xl border border-input bg-card/80 px-3 py-1.5 text-xs">
            <Tag className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="bg-transparent text-foreground focus:outline-none font-medium"
            >
              {availableCrops.map((c) => (
                <option key={c} value={c}>
                  {c === "All" ? t("All Crops") : c}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => loadData()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-card/80 p-2 text-xs font-medium hover:bg-accent transition-colors"
            title={t("Refresh Live Prices")}
          >
            <RefreshCw className={`h-4 w-4 text-primary ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Prices Grid / Table */}
      <div className="rounded-2xl border border-border/80 bg-card/50 overflow-hidden backdrop-blur-md shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
              <tr>
                <th className="px-5 py-3.5">Crop & Variety</th>
                <th className="px-5 py-3.5">Mandi / Market</th>
                <th className="px-5 py-3.5">State & District</th>
                <th className="px-5 py-3.5 text-right">{t("Min Price")}</th>
                <th className="px-5 py-3.5 text-right">{t("Max Price")}</th>
                <th className="px-5 py-3.5 text-right">{t("Modal Price")}</th>
                <th className="px-5 py-3.5 text-center">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />
                    <span>Fetching live Mandi price feeds...</span>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                    <span>No market records match your search query or filters.</span>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((row, idx) => (
                  <tr
                    key={`${row.crop}-${row.market}-${idx}`}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        {row.crop}
                        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          {row.variety}
                        </span>
                      </div>
                      {row.arrivalDate && (
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          Arrival: {row.arrivalDate}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-foreground">{row.market}</div>
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">
                      <div>{row.district}</div>
                      <div className="font-medium text-foreground/80">{row.state}</div>
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-muted-foreground">
                      {inr(row.min)}
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-muted-foreground">
                      {inr(row.max)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-base font-bold text-foreground">
                        {inr(row.modal)}
                      </span>
                      <span className="text-[10px] text-muted-foreground block">/ Quintal</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          row.change >= 0
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-red-500/10 text-red-600 dark:text-red-400"
                        }`}
                      >
                        {row.change >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {row.change >= 0 ? `+${row.change}%` : `${row.change}%`}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
