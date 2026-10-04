import { useSyncExternalStore } from "react";

export type RiskLevel = "Low" | "Moderate" | "High" | "Critical";
export type SeverityLevel = "Low" | "Moderate" | "High" | "Critical";
export type HealthStatus = "Healthy" | "Needs Attention" | "Critical";
export type DiseaseStatus = "No Disease" | "Suspected" | "Confirmed Likely" | "Severe Infection";
export type ProviderType = "Gemini AI" | "OpenRouter" | "Demo Mode";

export type AIResult = {
  provider?: ProviderType;
  crop_analysis: {
    crop_name: string;
    crop_confidence: number;
    growth_stage: string;
    health_score: number;
    health_status: HealthStatus;
    summary: string;
  };
  disease_detection: {
    disease_name: string;
    disease_confidence: number;
    disease_status: DiseaseStatus;
    description: string;
  };
  severity_analysis: {
    severity_level: SeverityLevel;
    affected_area_percentage: number;
    healthy_area_percentage: number;
    severity_explanation: string;
  };
  yield_prediction: {
    expected_yield: number;
    potential_yield: number;
    yield_unit: string;
    estimated_loss: number;
    loss_percentage: number;
    yield_explanation: string;
  };
  risk_assessment: {
    disease_risk: RiskLevel;
    yield_risk: RiskLevel;
    weather_risk: RiskLevel;
    overall_risk: RiskLevel;
  };
  recommendations: {
    immediate_actions: string[];
    fertilizer_recommendation: string;
    irrigation_recommendation: string;
    disease_management: string;
    preventive_measures: string[];
  };
  farmer_advice: {
    short_term: string[];
    long_term: string[];
    expert_verification_required: boolean;
  };
};

export type CropDetails = Record<string, string>;

export type Analysis = {
  id: string;
  createdAt: string;
  details: CropDetails;
  image: string;
  result: AIResult;
};

type State = { analyses: Analysis[]; currentId: string | null; lang: Lang; farmerName: string };
export type Lang = "en" | "ta" | "hi" | "te";


const KEY = "annadatha-ai-v1";
const initial: State = { analyses: [], currentId: null, lang: "en", farmerName: "Farmer" };
let state: State = initial;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...initial, ...JSON.parse(raw) };
  } catch {}
}

function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // quota: drop oldest images
    state = { ...state, analyses: state.analyses.slice(0, 5) };
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  load();
  listeners.add(l);
  l();
  return () => listeners.delete(l);
}

export function useAppState() {
  return useSyncExternalStore(subscribe, () => state, () => initial);
}

export function useCurrentAnalysis() {
  const s = useAppState();
  return s.analyses.find((a) => a.id === s.currentId) ?? s.analyses[0] ?? null;
}

export const actions = {
  addAnalysis(a: Analysis) {
    set({ analyses: [a, ...state.analyses].slice(0, 20), currentId: a.id });
  },
  select(id: string) { set({ currentId: id }); },
  remove(id: string) {
    set({ analyses: state.analyses.filter((a) => a.id !== id), currentId: state.currentId === id ? null : state.currentId });
  },
  setLang(lang: Lang) { set({ lang }); },
  setName(farmerName: string) { set({ farmerName }); },
  clear() { set({ analyses: [], currentId: null }); },
};
