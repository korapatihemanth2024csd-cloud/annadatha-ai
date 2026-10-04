import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Camera, ImagePlus, Loader2, Sparkles, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui-kit";
import { CameraModal } from "@/components/CameraModal";
import { analyzeCrop, getDemoAnalysis } from "@/lib/analyze.functions";
import { useT } from "@/lib/i18n";
import { actions, useAppState, type AIResult } from "@/lib/store";

export const Route = createFileRoute("/analysis")({
  head: () => ({
    meta: [
      { title: "Crop Analysis — Annadatha AI" },
      { name: "description", content: "Enter farm details and upload crop photos for AI disease and yield analysis." },
      { property: "og:title", content: "AI Crop Analysis — Annadatha AI" },
      { property: "og:description", content: "Upload a crop photo and get an instant AI diagnosis." },
    ],
  }),
  component: AnalysisPage,
});

type F = { name: string; label: string; type?: string; options?: string[]; placeholder?: string };
const SECTIONS: { title: string; fields: F[] }[] = [
  { title: "Farmer Information", fields: [
    { name: "Farmer name", label: "Farmer name" }, { name: "Location", label: "Village / Location" },
    { name: "District", label: "District" }, { name: "State", label: "State", options: ["Tamil Nadu", "Andhra Pradesh", "Telangana", "Karnataka", "Kerala", "Maharashtra", "Uttar Pradesh", "Punjab", "Madhya Pradesh", "Other"] },
    { name: "Farm size", label: "Farm size (acres)", type: "number" }, { name: "Contact", label: "Contact number", type: "tel" },
  ]},
  { title: "Crop Information", fields: [
    { name: "Crop type", label: "Crop type", options: ["Paddy", "Tomato", "Banana", "Cotton", "Sugarcane", "Wheat", "Maize", "Chilli", "Groundnut", "Other"] },
    { name: "Variety", label: "Crop variety" },
    { name: "Growth stage", label: "Growth stage", options: ["Seedling", "Vegetative", "Flowering", "Fruiting", "Maturity"] },
    { name: "Planting date", label: "Planting date", type: "date" }, { name: "Cultivated area", label: "Cultivated area (acres)", type: "number" },
  ]},
  { title: "Soil Information", fields: [
    { name: "Soil type", label: "Soil type", options: ["Alluvial", "Black (Regur)", "Red", "Laterite", "Sandy", "Clay loam"] },
    { name: "Soil pH", label: "Soil pH", type: "number" },
    { name: "Organic matter", label: "Organic matter (%)", type: "number" },
    { name: "Nitrogen", label: "Nitrogen (kg/ha)", type: "number" },
    { name: "Phosphorus", label: "Phosphorus (kg/ha)", type: "number" }, { name: "Potassium", label: "Potassium (kg/ha)", type: "number" },
    { name: "Soil moisture", label: "Soil moisture (%)", type: "number" },
  ]},
  { title: "Agricultural Inputs", fields: [
    { name: "Fertilizer", label: "Fertilizer type" }, { name: "Fertilizer qty", label: "Fertilizer quantity (kg)", type: "number" },
    { name: "Irrigation type", label: "Irrigation method", options: ["Drip", "Sprinkler", "Flood", "Furrow", "Rainfed"] },
    { name: "Irrigation frequency", label: "Irrigation frequency", options: ["Daily", "Every 2–3 days", "Weekly", "As needed"] },
    { name: "Irrigation amount", label: "Irrigation amount (liters/day)", type: "number" },
    { name: "Pesticide usage", label: "Pesticide usage", options: ["None", "Organic", "Chemical – low", "Chemical – regular"] },
  ]},
  { title: "Environmental Information", fields: [
    { name: "Temperature", label: "Temperature (°C)", type: "number" }, { name: "Humidity", label: "Humidity (%)", type: "number" },
    { name: "Rainfall", label: "Rainfall (mm)", type: "number" },
    { name: "Weather", label: "Weather condition", options: ["Sunny", "Cloudy", "Rainy", "Humid", "Dry"] },
  ]},
];

function compress(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1024 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = img.width * scale; c.height = img.height * scale;
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", 0.82));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function AnalysisPage() {
  const t = useT();
  const nav = useNavigate();
  const run = useServerFn(analyzeCrop);
  const { lang } = useAppState();
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const [lastDetails, setLastDetails] = useState<Record<string, string>>({});

  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  const handleCameraOpen = () => {
    if (images.length >= 3) {
      toast.error(t("Maximum 3 photos allowed."));
      return;
    }
    if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === "function") {
      setCameraModalOpen(true);
    } else {
      camRef.current?.click();
    }
  };

  async function addFiles(files: FileList | null) {
    if (!files) return;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, 3 - images.length);
    const urls = await Promise.all(list.map(compress));
    setImages((p) => [...p, ...urls].slice(0, 3));
  }

  function finishAnalysis(details: Record<string, string>, result: AIResult) {
    actions.addAnalysis({
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      details,
      image: images[0] || "",
      result,
    });
    if (details["Farmer name"]) actions.setName(details["Farmer name"]);
    nav({ to: "/disease" });
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!images.length) { toast.error(t("Please upload at least one crop image.")); return; }
    const details: Record<string, string> = {};
    new FormData(e.currentTarget).forEach((v, k) => { if (typeof v === "string" && v) details[k] = v; });
    setLastDetails(details);
    setAiUnavailable(false);
    setBusy(true);

    // ── Attempt 1: Gemini AI ──────────────────────────────────────────────────
    setStatusText(t("🤖 Analyzing with Gemini AI..."));
    try {
      const res = (await run({ data: { images, details, provider: "gemini", lang } })) as {
        success: boolean;
        result?: AIResult;
      };
      if (res?.success && res.result) {
        toast.success(t("✅ Analysis completed using Gemini AI"));
        finishAnalysis(details, res.result);
        return;
      }
    } catch {
      // Gemini network/execution error
    }

    // ── Attempt 2: OpenRouter AI Fallback ────────────────────────────────────
    toast.error(t("⚠️ Gemini is temporarily unavailable."));
    toast.info(t("🔄 Switching to OpenRouter..."));
    setStatusText(t("🤖 Analyzing with OpenRouter AI..."));

    try {
      const res = (await run({ data: { images, details, provider: "openrouter", lang } })) as {
        success: boolean;
        result?: AIResult;
      };
      if (res?.success && res.result) {
        toast.success(t("✅ Analysis completed using OpenRouter AI"));
        finishAnalysis(details, res.result);
        return;
      }
    } catch {
      // OpenRouter network/execution error
    }

    // ── Both AI Providers Failed ──────────────────────────────────────────────
    setBusy(false);
    setStatusText("");
    setAiUnavailable(true);
    toast.error(t("⚠️ AI services are temporarily unavailable."));
  }

  function handleUseDemo() {
    const demoResult = getDemoAnalysis();
    toast.info(t("DEMO DATA — NOT REAL AI ANALYSIS"));
    finishAnalysis(lastDetails, demoResult);
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <PageHeader title={t("analysis")} subtitle={t("Tell us about your field and upload photos of the affected plant.")} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          {SECTIONS.map((s) => (
            <fieldset key={s.title} className="card-soft p-6">
              <legend className="sr-only">{t(s.title)}</legend>
              <h2 className="mb-4 text-xl font-semibold">{t(s.title)}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {s.fields.map((f) => (
                  <label key={f.name} className="block text-sm">
                    <span className="mb-1.5 block font-medium text-muted-foreground">{t(f.label)}</span>
                    {f.options ? (
                      <select name={f.name} defaultValue="" className="w-full rounded-xl border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring">
                        <option value="">{t("Select…")}</option>
                        {f.options.map((o) => <option key={o} value={o}>{t(o)}</option>)}
                      </select>
                    ) : (
                      <input name={f.name} type={f.type ?? "text"} step="any" className="w-full rounded-xl border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring" />
                    )}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="card-soft p-6">
            <h2 className="mb-4 text-xl font-semibold">{t("Crop Image")}</h2>
            <div
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
              className={`grid place-items-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${drag ? "border-primary bg-secondary" : "border-border"}`}
            >
              <ImagePlus className="h-10 w-10 text-primary" />
              <p className="mt-2 text-sm font-medium">{t("Drag & drop up to 3 photos")}</p>
              <p className="text-xs text-muted-foreground">{t("Clear, close-up leaf or fruit images work best")}</p>
              <div className="mt-4 flex gap-2">
                <button type="button" onClick={() => fileRef.current?.click()} className="rounded-lg border bg-card px-3 py-2 text-sm font-medium hover:bg-muted">{t("Browse")}</button>
                <button type="button" onClick={handleCameraOpen} className="inline-flex items-center gap-1 rounded-lg border bg-card px-3 py-2 text-sm font-medium hover:bg-muted"><Camera className="h-4 w-4" /> {t("Camera")}</button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
              <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
            </div>
            {images.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {images.map((src, i) => (
                  <div key={i} className="relative aspect-square overflow-hidden rounded-xl">
                    <img src={src} alt={`Upload ${i + 1}`} className="h-full w-full object-cover" />
                    <button type="button" aria-label={t("Remove image")} onClick={() => setImages((p) => p.filter((_, j) => j !== i))}
                      className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-foreground/70 text-background"><X className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
            <button type="submit" disabled={busy}
              className="bg-hero mt-6 flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-lg font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-[1.01] disabled:opacity-70">
              {busy ? <><Loader2 className="h-5 w-5 animate-spin" /> {statusText || t("Analyzing your crop…")}</> : <><Sparkles className="h-5 w-5" /> {t("analyze")}</>}
            </button>
            {busy && statusText && <p className="mt-2 text-center text-xs font-medium text-muted-foreground animate-pulse">{statusText}</p>}

            {aiUnavailable && (
              <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-center">
                <p className="font-semibold text-destructive">{t("⚠️ AI services are temporarily unavailable.")}</p>
                <p className="mt-1 text-xs text-muted-foreground">Both Gemini and OpenRouter AI services could not be reached.</p>
                <button
                  type="button"
                  onClick={handleUseDemo}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-amber-700 transition-colors"
                >
                  <Sparkles className="h-4 w-4" /> {t("Use Demo Analysis")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <CameraModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onCapture={(dataUrl) => {
          setImages((p) => [...p, dataUrl].slice(0, 3));
        }}
      />
    </form>
  );
}
