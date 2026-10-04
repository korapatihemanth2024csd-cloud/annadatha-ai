import type { CROPS } from "@/lib/data";
import { cn } from "@/lib/utils";

export function CropCard({ crop: c }: { crop: (typeof CROPS)[number] }) {
  const tone = c.health === "Healthy" ? "bg-success/15 text-success" : "bg-warning/20 text-foreground";
  return (
    <div className="card-soft group overflow-hidden">
      <div className="relative h-40 overflow-hidden">
        <img src={c.img} alt={c.name} loading="lazy" width={992} height={672} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <span className={cn("absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur", tone)}>{c.health}</span>
      </div>
      <div className="p-5">
        <div className="flex items-baseline justify-between">
          <h3 className="text-xl font-semibold">{c.name}</h3>
          <span className="text-sm text-muted-foreground">{c.variety}</span>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Stage</dt><dd className="text-right font-medium">{c.stage}</dd>
          <dt className="text-muted-foreground">Planted</dt><dd className="text-right font-medium">{new Date(c.planted).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</dd>
          <dt className="text-muted-foreground">Disease</dt><dd className="text-right font-medium">{c.disease}</dd>
          <dt className="text-muted-foreground">Expected yield</dt><dd className="text-right font-medium">{c.yield} t</dd>
        </dl>
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs"><span className="text-muted-foreground">Severity</span><span className="font-semibold">{c.severity}%</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className={cn("h-full rounded-full", c.severity > 20 ? "bg-warning" : "bg-success")} style={{ width: `${c.severity}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
