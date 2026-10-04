import { createFileRoute } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PageHeader } from "@/components/ui-kit";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      { title: "Student Learning — Annadatha AI" },
      { name: "description", content: "Learning modules on plant pathology, soil health, AI in agriculture and markets." },
      { property: "og:title", content: "Student Learning Hub — Annadatha AI" },
      { property: "og:description", content: "Short modules for agricultural students." },
    ],
  }),
  component: LearnPage,
});

const MODULES = [
  { title: "Plant Pathology Basics", level: "Beginner", topics: [
    ["What causes crop disease?", "Fungi, bacteria, viruses and nematodes cause most crop diseases. Disease needs a susceptible host, a virulent pathogen and a favourable environment — the disease triangle."],
    ["Early blight vs late blight", "Early blight (Alternaria) shows concentric-ring brown spots on older leaves; late blight (Phytophthora) causes water-soaked, rapidly spreading lesions in cool, wet weather."],
  ]},
  { title: "Soil Health & NPK", level: "Beginner", topics: [
    ["Reading a soil health card", "India's Soil Health Card reports pH, EC, organic carbon and N, P, K plus micronutrients, with crop-wise fertilizer advice."],
    ["Why pH matters", "Most crops prefer pH 6.0–7.5. Outside this range nutrients become locked and unavailable to roots."],
  ]},
  { title: "AI in Agriculture", level: "Intermediate", topics: [
    ["How image-based disease detection works", "Vision models learn visual patterns of lesions, discolouration and texture from labelled images, then estimate the most likely condition with a confidence score."],
    ["Limits of AI diagnosis", "Lighting, blur and look-alike symptoms reduce accuracy. Always confirm with field scouting and an expert."],
  ]},
  { title: "Markets & MSP", level: "Intermediate", topics: [
    ["What is modal price?", "The price at which most trades happened in a mandi on a given day — a better guide than min or max."],
    ["Minimum Support Price", "MSP is announced by the Government of India for 22+ crops to protect farmers against price crashes."],
  ]},
];

function LearnPage() {
  const t = useT();
  return (
    <div>
      <PageHeader title={t("learn")} subtitle="Bite-sized modules for agricultural students." />
      <div className="grid gap-5 lg:grid-cols-2">
        {MODULES.map((m) => (
          <div key={m.title} className="card-soft p-6">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary"><BookOpen className="h-5 w-5" /></span>
              <div><h2 className="text-xl font-semibold">{m.title}</h2><span className="text-xs text-muted-foreground">{m.level} · {m.topics.length} lessons</span></div>
            </div>
            <Accordion type="single" collapsible className="mt-3">
              {m.topics.map(([q = "", a = ""]) => (
                <AccordionItem key={q} value={q}><AccordionTrigger>{q}</AccordionTrigger><AccordionContent className="text-muted-foreground">{a}</AccordionContent></AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </div>
    </div>
  );
}
