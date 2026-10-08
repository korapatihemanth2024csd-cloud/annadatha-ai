import { MARKET, type MarketRow } from "./data";

export type DataGovRecord = {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  arrival_date: string;
  min_price: string;
  max_price: string;
  modal_price: string;
};

export type FetchMandiOptions = {
  apiKey?: string;
  state?: string;
  commodity?: string;
  limit?: number;
};

const STORAGE_KEY = "annadatha_datagov_api_key";

export function getStoredAgmarknetApiKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STORAGE_KEY) || import.meta.env["VITE_DATA_GOV_API_KEY"] || "";
}

export function setStoredAgmarknetApiKey(key: string): void {
  if (typeof window === "undefined") return;
  if (key) {
    localStorage.setItem(STORAGE_KEY, key.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export async function fetchLiveMandiPrices(options: FetchMandiOptions = {}): Promise<{
  records: MarketRow[];
  isLive: boolean;
  error?: string;
}> {
  const apiKey = options.apiKey || getStoredAgmarknetApiKey();

  if (!apiKey) {
    return {
      records: MARKET,
      isLive: false,
    };
  }

  try {
    const url = new URL("https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070");
    url.searchParams.set("api-key", apiKey.trim());
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", String(options.limit || 100));

    if (options.state && options.state !== "All") {
      url.searchParams.set("filters[state]", options.state);
    }
    if (options.commodity && options.commodity !== "All") {
      url.searchParams.set("filters[commodity]", options.commodity);
    }

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("Invalid API key provided. Please check your data.gov.in API key.");
      }
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.records || !Array.isArray(data.records)) {
      if (data.message) {
        throw new Error(data.message);
      }
      throw new Error("Unexpected API response format.");
    }

    const parsedRecords: MarketRow[] = data.records.map((r: DataGovRecord) => {
      const min = parseFloat(r.min_price) || 0;
      const max = parseFloat(r.max_price) || 0;
      const modal = parseFloat(r.modal_price) || 0;
      
      // Calculate arbitrary small 24h change representation for live feed
      const diff = max - min;
      const change = diff > 0 ? parseFloat(((modal - min) / (diff || 1) * 2 - 1).toFixed(1)) : 0;

      return {
        crop: r.commodity || "Unknown Crop",
        variety: r.variety || "Standard",
        state: r.state || "",
        district: r.district || "",
        market: r.market || "",
        min,
        max,
        modal,
        change: isNaN(change) ? 0 : change,
        arrivalDate: r.arrival_date,
      };
    });

    if (parsedRecords.length === 0) {
      return {
        records: MARKET,
        isLive: true,
        error: "No records found for the selected filter on data.gov.in. Showing sample data.",
      };
    }

    return {
      records: parsedRecords,
      isLive: true,
    };
  } catch (err: any) {
    console.warn("Live mandi price fetch failed, using sample data:", err);
    return {
      records: MARKET,
      isLive: false,
      error: err.message || "Failed to fetch live data from data.gov.in.",
    };
  }
}
