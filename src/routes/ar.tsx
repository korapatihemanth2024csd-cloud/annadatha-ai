import { createFileRoute } from "@tanstack/react-router";
import { Glasses, Layers, Map, ScanEye } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui-kit";
import { useT } from "@/lib/i18n";
import { useCurrentAnalysis } from "@/lib/store";

export const Route = createFileRoute("/ar")({
  head: () => ({
    meta: [
      { title: "AR/MR Visualization — Annadatha AI" },
      { name: "description", content: "Visualize crop disease hotspots in mixed reality on Meta Quest." },
      { property: "og:title", content: "AR/MR Field Visualization — Annadatha AI" },
      { property: "og:description", content: "See infected zones overlaid on your field with Meta Quest." },
    ],
  }),
  component: ARPage,
});

function ARPage() {
  const t = useT();
  const a = useCurrentAnalysis();
  const [xr, setXr] = useState<boolean | null>(null);
  useEffect(() => {
    const nx = (navigator as Navigator & { xr?: { isSessionSupported: (m: string) => Promise<boolean> } }).xr;
    if (!nx) return setXr(false);
    nx.isSessionSupported("immersive-ar").then(setXr).catch(() => setXr(false));
  }, []);

  return (
    <div>
      <PageHeader title={t("ar")} subtitle="Walk your field and see AI-detected hotspots in mixed reality." />
      <div className="bg-hero relative overflow-hidden rounded-3xl p-8 text-primary-foreground">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div>
            <Glasses className="h-10 w-10" />
            <h2 className="mt-4 text-3xl font-semibold">Meta Quest Mixed Reality</h2>
            <p className="mt-2 text-primary-foreground/85">Open this page in the Meta Quest Browser to overlay the latest diagnosis{a ? ` (${a.result.disease_detection.disease_name})` : ""} and severity heatmap on your real field.</p>
            <button onClick={() => toast.info(xr ? "Immersive AR session support detected — launching soon." : "Open this page in the Meta Quest Browser to start an MR session.")}
              className="mt-6 rounded-xl bg-primary-foreground px-5 py-3 font-semibold text-primary">Launch MR session</button>
            <p className="mt-3 text-xs text-primary-foreground/70">Device status: {xr === null ? "checking…" : xr ? "WebXR AR supported" : "Not a WebXR AR device"}</p>
          </div>
          <div className="relative aspect-video rounded-2xl border border-primary-foreground/30 bg-primary-foreground/10 p-4 [perspective:800px]">
            <div className="grid h-full grid-cols-8 gap-1 [transform:rotateX(45deg)]">
              {Array.from({ length: 48 }).map((_, i) => (
                <div key={i} className={`rounded-sm ${[5, 6, 13, 14, 22, 30].includes(i) ? "animate-pulse bg-destructive/80" : "bg-leaf/50"}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 grid gap-5 md:grid-cols-3">
        {[
          { i: ScanEye, h: "Hotspot overlay", p: "Infected zones glow red over plants as you look at them." },
          { i: Layers, h: "Data layers", p: "Toggle soil moisture, NPK and severity layers in 3D." },
          { i: Map, h: "Field walk mode", p: "Guided path to inspect the most affected rows first." },
        ].map(({ i: Icon, h, p }) => (
          <div key={h} className="card-soft p-6"><Icon className="h-6 w-6 text-primary" /><h3 className="mt-3 text-lg font-semibold">{h}</h3><p className="mt-1 text-sm text-muted-foreground">{p}</p></div>
        ))}
      </div>
    </div>
  );
}
