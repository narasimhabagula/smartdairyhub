import { useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Upload, Camera, ImageIcon, X, Sparkles, Activity, Pill, Utensils, Syringe,
  CalendarClock, ShieldAlert, AlertCircle, RefreshCw, Loader2, Plus, CheckCircle2, ScanLine,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  PieChart, Pie, Cell, ResponsiveContainer, RadialBarChart, RadialBar,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { demoDiseaseResults, USE_DEMO_DATA } from "@/data/demo";
import HeroPanel from "@/components/hero/HeroPanel";
import { HERO_AISCAN } from "@/components/hero/heroContent";

type Result = {
  animal: string; breed: string; disease: string;
  confidence: number; severity: "Mild" | "Moderate" | "Severe";
  recoveryChance: number; symptoms: string[];
  medicines: { name: string; dosage: string; duration: string }[];
  isolation: string; nutrition: string[]; vaccination: string; nextCheckup: string;
  affectedArea: { x: number; y: number; w: number; h: number };
};

type QueueItem = {
  id: string;
  file: File;
  preview: string;
  progress: number; // 0-100 upload
  status: "uploading" | "ready" | "error";
};

const severityColor: Record<string, string> = {
  Mild: "bg-emerald-500", Moderate: "bg-amber-500", Severe: "bg-red-500",
};

const healthTrend = Array.from({ length: 12 }, (_, i) => ({
  month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
  health: 70 + Math.round(Math.sin(i / 2) * 15) + (i > 8 ? -10 : 0),
  yield: 18 + Math.round(Math.cos(i / 2) * 4),
}));

const MAX_IMAGES = 10;

const WHAT_YOU_GET = [
  { icon: ShieldAlert, title: "Disease Prediction", body: "AI identifies possible diseases based on symptoms", tint: "bg-emerald-500/10 text-emerald-600" },
  { icon: Activity, title: "Severity Assessment", body: "Get severity level and confidence score", tint: "bg-amber-500/10 text-amber-600" },
  { icon: Pill, title: "Treatment Suggestions", body: "Recommended treatment and preventive care", tint: "bg-violet-500/10 text-violet-600" },
  { icon: Stethoscope, title: "Nearest Vet", body: "Find nearby veterinarians for consultation", tint: "bg-sky-500/10 text-sky-600" },
  { icon: ClipboardList, title: "Health History", body: "Track and manage your animal's health records", tint: "bg-primary/10 text-primary" },
];

export default function DiseaseDetection() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [aiStage, setAiStage] = useState<string>("");
  const [result, setResult] = useState<Result | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const camInput = useRef<HTMLInputElement>(null);

  const active = queue.find((q) => q.id === activeId) || null;

  const addFiles = useCallback((files: File[]) => {
    const room = MAX_IMAGES - queue.length;
    if (room <= 0) { toast.error(`Max ${MAX_IMAGES} images`); return; }
    const accepted = files
      .filter((f) => {
        if (!f.type.startsWith("image/")) { toast.error(`${f.name}: not an image`); return false; }
        if (f.size > 10 * 1024 * 1024) { toast.error(`${f.name}: over 10 MB`); return false; }
        return true;
      })
      .slice(0, room);

    accepted.forEach((f) => {
      const id = crypto.randomUUID();
      const reader = new FileReader();
      reader.onload = () => {
        const preview = reader.result as string;
        setQueue((q) => [...q, { id, file: f, preview, progress: 0, status: "uploading" }]);
        setActiveId((cur) => cur ?? id);
        // simulate upload progress
        const started = performance.now();
        const tick = () => {
          const elapsed = performance.now() - started;
          const pct = Math.min(100, Math.round((elapsed / 900) * 100));
          setQueue((q) => q.map((it) => it.id === id ? { ...it, progress: pct } : it));
          if (pct < 100) requestAnimationFrame(tick);
          else setQueue((q) => q.map((it) => it.id === id ? { ...it, status: "ready" } : it));
        };
        requestAnimationFrame(tick);
      };
      reader.readAsDataURL(f);
    });
  }, [queue.length]);

  const removeItem = (id: string) => {
    setQueue((q) => q.filter((it) => it.id !== id));
    if (activeId === id) {
      setActiveId((cur) => {
        const rest = queue.filter((it) => it.id !== id);
        return rest[0]?.id ?? null;
      });
      setResult(null);
    }
  };

  const clearAll = () => { setQueue([]); setActiveId(null); setResult(null); };

  const saveReport = async (r: Result, imageUrl: string | null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const safeImageUrl = imageUrl && /^https?:\/\//i.test(imageUrl) ? imageUrl : null;
      const { error } = await supabase.from("disease_reports").insert({
        user_id: user.id,
        animal: r.animal, breed: r.breed, disease: r.disease,
        confidence: r.confidence, severity: r.severity,
        recovery_chance: r.recoveryChance,
        symptoms: r.symptoms as any,
        treatment: {
          medicines: r.medicines, isolation: r.isolation,
          nutrition: r.nutrition, vaccination: r.vaccination, nextCheckup: r.nextCheckup,
        } as any,
        image_url: safeImageUrl,
      });
      if (error) toast.error("Could not save report to history");
    } catch (e) { console.warn("saveReport error", e); }
  };

  const finalizeResult = (r: Result, imageUrl: string | null) => {
    setResult(r); saveReport(r, imageUrl);
  };

  const analyze = async () => {
    if (!active) return;
    setAnalyzing(true); setProgress(5); setResult(null);
    const stages = ["Enhancing image…", "Detecting animal…", "Scanning for symptoms…", "Cross-checking database…", "Generating diagnosis…"];
    let sIdx = 0; setAiStage(stages[0]);
    const stageTimer = setInterval(() => { sIdx = (sIdx + 1) % stages.length; setAiStage(stages[sIdx]); }, 900);
    const tick = setInterval(() => setProgress((p) => Math.min(p + 6, 92)), 260);

    try {
      const base64 = active.preview.split(",")[1];
      const { data, error } = await supabase.functions.invoke("analyze-animal-health", {
        body: { imageBase64: base64, mimeType: active.file.type },
      });
      clearInterval(tick); clearInterval(stageTimer); setProgress(100); setAiStage("Complete");

      if (error || data?.error) {
        if (USE_DEMO_DATA) {
          toast.info("Using demo analysis (AI unavailable)");
          finalizeResult(demoDiseaseResults[Math.floor(Math.random() * demoDiseaseResults.length)] as Result, active.preview);
        } else {
          toast.error(error?.message || data?.error || "Analysis failed");
        }
      } else {
        finalizeResult(data as Result, active.preview);
        toast.success("Analysis complete");
      }
    } catch (e) {
      clearInterval(tick); clearInterval(stageTimer);
      if (USE_DEMO_DATA) { toast.info("Using demo analysis"); finalizeResult(demoDiseaseResults[0] as Result, active.preview); }
      else toast.error((e as Error).message);
    } finally {
      setTimeout(() => { setAnalyzing(false); setProgress(0); setAiStage(""); }, 600);
    }
  };

  const runDemo = () => {
    const img = "https://images.unsplash.com/photo-1546445317-29f4545e9d53?w=1200&q=80";
    // seed queue with the demo image
    const id = crypto.randomUUID();
    setQueue([{ id, file: new File([], "demo.jpg", { type: "image/jpeg" }), preview: img, progress: 100, status: "ready" }]);
    setActiveId(id);
    finalizeResult(demoDiseaseResults[Math.floor(Math.random() * demoDiseaseResults.length)] as Result, img);
    toast.success("Demo analysis loaded");
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="container pt-3 md:pt-6">
        <HeroPanel
          content={HERO_AISCAN}
          priority
          showBack
          actions={<>
            <Button onClick={() => fileInput.current?.click()} className="h-10 gap-1.5 rounded-full px-4 text-[13px] font-semibold sm:h-11 sm:px-6 sm:text-sm">
              <Upload className="h-4 w-4" /> Upload Photos
            </Button>
            <Button variant="outline" onClick={runDemo} className="h-10 gap-1.5 rounded-full border-primary/30 px-4 text-[13px] font-semibold text-primary sm:h-11 sm:px-6 sm:text-sm">
              <Sparkles className="h-4 w-4" /> Try Demo
            </Button>
          </>}
        />
      </div>

      <div className="container py-10 space-y-8">
        {/* Upload zone — ChatGPT-style */}
        <Card className="overflow-hidden rounded-3xl border-primary/10 shadow-[0_20px_60px_-30px_hsl(var(--primary)/0.4)]">
          <CardContent className="p-6 md:p-8">
            {queue.length === 0 ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault(); setDragOver(false);
                  const files = Array.from(e.dataTransfer.files || []);
                  if (files.length) addFiles(files);
                }}
                className={`group relative overflow-hidden rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-300 ${
                  dragOver ? "border-primary bg-primary/10 scale-[1.01]" : "border-border hover:border-primary/50 hover:bg-primary/[0.03]"
                }`}
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-emerald-400/[0.04] opacity-0 transition group-hover:opacity-100" />
                <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-500 shadow-lg shadow-primary/30">
                  <ImageIcon className="h-9 w-9 text-white" />
                </div>
                <h3 className="mt-5 font-display text-2xl font-semibold">Drop photos or paste from clipboard</h3>
                <p className="mt-2 text-sm text-muted-foreground">JPG, PNG · up to 10 MB each · up to {MAX_IMAGES} images</p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Button onClick={() => fileInput.current?.click()} className="gap-2 rounded-full px-5 shadow-md"><Upload className="h-4 w-4" /> Choose files</Button>
                  <Button variant="outline" onClick={() => camInput.current?.click()} className="gap-2 rounded-full px-5"><Camera className="h-4 w-4" /> Camera</Button>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-[1fr,320px]">
                {/* Active preview */}
                <div className="relative overflow-hidden rounded-2xl border bg-black/5">
                  {active && (
                    <img src={active.preview} alt="Preview" className="h-auto max-h-[520px] w-full object-contain bg-neutral-900/5" />
                  )}
                  {analyzing && (
                    <>
                      <div className="pointer-events-none absolute inset-0 backdrop-blur-[1px] bg-gradient-to-b from-primary/5 via-transparent to-primary/10">
                        {/* scan line */}
                        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_25px_4px_hsl(var(--primary))] animate-[scan_2.2s_linear_infinite]" />
                        {/* grid shimmer */}
                        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(hsl(var(--primary)/0.3)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--primary)/0.3)_1px,transparent_1px)] [background-size:24px_24px] animate-pulse" />
                      </div>
                      <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-xl bg-background/90 px-4 py-3 shadow-lg backdrop-blur">
                        <div className="relative h-8 w-8 shrink-0">
                          <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
                          <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                          <ScanLine className="absolute inset-0 m-auto h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{aiStage || "Processing…"}</p>
                          <Progress value={progress} className="mt-1.5 h-1.5" />
                        </div>
                        <span className="text-xs font-semibold tabular-nums text-primary">{progress}%</span>
                      </div>
                      <style>{`@keyframes scan { 0% { top: 0% } 100% { top: 100% } }`}</style>
                    </>
                  )}
                  {result && !analyzing && (
                    <div
                      className="pointer-events-none absolute rounded-lg border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)]"
                      style={{
                        left: `${result.affectedArea?.x ?? 40}%`, top: `${result.affectedArea?.y ?? 50}%`,
                        width: `${result.affectedArea?.w ?? 25}%`, height: `${result.affectedArea?.h ?? 20}%`,
                        background: "radial-gradient(circle, rgba(239,68,68,0.35), transparent 70%)",
                      }}
                    >
                      <span className="absolute -top-6 left-0 whitespace-nowrap rounded bg-red-500 px-2 py-0.5 text-xs font-medium text-white">
                        Affected: {result.disease}
                      </span>
                    </div>
                  )}
                </div>

                {/* Right column: gallery + actions */}
                <div className="flex flex-col gap-4">
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault(); setDragOver(false);
                      const files = Array.from(e.dataTransfer.files || []);
                      if (files.length) addFiles(files);
                    }}
                    className={`rounded-2xl border p-3 ${dragOver ? "border-primary bg-primary/5" : "border-border"}`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold text-muted-foreground">{queue.length}/{MAX_IMAGES} images</p>
                      <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-foreground">Clear all</button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {queue.map((it) => (
                        <button
                          key={it.id}
                          onClick={() => { setActiveId(it.id); setResult(null); }}
                          className={`group relative aspect-square overflow-hidden rounded-xl border transition ${
                            activeId === it.id ? "border-primary ring-2 ring-primary/40" : "border-border hover:border-primary/50"
                          }`}
                        >
                          <img src={it.preview} alt="" className="h-full w-full object-cover" />
                          {it.status === "uploading" && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-[10px] font-semibold text-white">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="mt-1 tabular-nums">{it.progress}%</span>
                              <div className="absolute bottom-0 left-0 h-1 bg-primary transition-all" style={{ width: `${it.progress}%` }} />
                            </div>
                          )}
                          {it.status === "ready" && (
                            <div className="absolute right-1 top-1 rounded-full bg-emerald-500 p-0.5 text-white">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </div>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); removeItem(it.id); }}
                            className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition group-hover:opacity-100"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </button>
                      ))}
                      {queue.length < MAX_IMAGES && (
                        <button
                          onClick={() => fileInput.current?.click()}
                          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-muted-foreground transition hover:border-primary hover:text-primary hover:bg-primary/5"
                        >
                          <Plus className="h-5 w-5" />
                          <span className="text-[10px] font-medium">Add</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button className="w-full gap-2 rounded-full shadow-md" size="lg" onClick={analyze} disabled={analyzing || !active || active.status !== "ready"}>
                      {analyzing ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing…</> : <><Sparkles className="h-4 w-4" /> Analyze with AI</>}
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" className="gap-2 rounded-full" onClick={() => fileInput.current?.click()} disabled={analyzing}>
                        <Upload className="h-4 w-4" /> Add more
                      </Button>
                      <Button variant="outline" className="gap-2 rounded-full" onClick={() => camInput.current?.click()} disabled={analyzing}>
                        <Camera className="h-4 w-4" /> Camera
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">AI results are advisory. Always confirm with a licensed veterinarian.</p>
                </div>
              </div>
            )}

            <input ref={fileInput} type="file" accept="image/*" multiple className="hidden"
              onChange={(e) => { const fs = Array.from(e.target.files || []); if (fs.length) addFiles(fs); e.currentTarget.value = ""; }} />
            <input ref={camInput} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={(e) => { const fs = Array.from(e.target.files || []); if (fs.length) addFiles(fs); e.currentTarget.value = ""; }} />
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <div className="animate-fade-in space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard label="Animal" value={`${result.animal} · ${result.breed}`} icon={Activity} />
              <StatCard label="Disease" value={result.disease} icon={ShieldAlert} />
              <StatCard label="Severity" value={result.severity} accent={severityColor[result.severity]} />
              <StatCard label="Recovery" value={`${result.recoveryChance}%`} icon={RefreshCw} />
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <Card className="rounded-2xl"><CardContent className="p-6">
                <h3 className="font-display text-lg font-semibold">Confidence</h3>
                <div className="mt-2 h-48">
                  <ResponsiveContainer><RadialBarChart innerRadius="65%" outerRadius="100%" data={[{ v: result.confidence, fill: "hsl(var(--primary))" }]} startAngle={90} endAngle={-270}>
                    <RadialBar background dataKey="v" cornerRadius={12} />
                  </RadialBarChart></ResponsiveContainer>
                </div>
                <p className="text-center font-display text-3xl font-bold">{result.confidence}%</p>
              </CardContent></Card>

              <Card className="rounded-2xl"><CardContent className="p-6">
                <h3 className="font-display text-lg font-semibold">Recovery Probability</h3>
                <div className="mt-2 h-48">
                  <ResponsiveContainer><PieChart>
                    <Pie data={[{ v: result.recoveryChance }, { v: 100 - result.recoveryChance }]} innerRadius={55} outerRadius={80} dataKey="v" startAngle={90} endAngle={-270}>
                      <Cell fill="hsl(142, 60%, 45%)" /><Cell fill="hsl(var(--muted))" />
                    </Pie>
                  </PieChart></ResponsiveContainer>
                </div>
                <p className="text-center font-display text-3xl font-bold">{result.recoveryChance}%</p>
              </CardContent></Card>

              <Card className="rounded-2xl"><CardContent className="p-6">
                <h3 className="font-display text-lg font-semibold">12-Month Health Trend</h3>
                <div className="mt-2 h-48">
                  <ResponsiveContainer><LineChart data={healthTrend}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="month" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Line dataKey="health" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    <Line dataKey="yield" stroke="hsl(36, 80%, 55%)" strokeWidth={2} dot={false} />
                  </LineChart></ResponsiveContainer>
                </div>
              </CardContent></Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="rounded-2xl"><CardContent className="p-6">
                <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold"><AlertCircle className="h-5 w-5 text-amber-500" /> Symptoms Observed</h3>
                <ul className="space-y-2">
                  {result.symptoms.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />{s}</li>
                  ))}
                </ul>
              </CardContent></Card>

              <Card className="rounded-2xl"><CardContent className="p-6">
                <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold"><Pill className="h-5 w-5 text-primary" /> Medicine Plan</h3>
                <div className="space-y-3">
                  {result.medicines.map((m, i) => (
                    <div key={i} className="rounded-lg border bg-muted/40 p-3">
                      <p className="font-medium">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.dosage} · {m.duration}</p>
                    </div>
                  ))}
                </div>
              </CardContent></Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <RecCard icon={ShieldAlert} title="Isolation" body={result.isolation} tint="bg-red-500/10 text-red-600" />
              <RecCard icon={Utensils} title="Nutrition" body={result.nutrition.join(" · ")} tint="bg-emerald-500/10 text-emerald-600" />
              <RecCard icon={Syringe} title="Vaccination" body={result.vaccination} tint="bg-blue-500/10 text-blue-600" />
              <RecCard icon={CalendarClock} title="Next Checkup" body={result.nextCheckup} tint="bg-amber-500/10 text-amber-600" />
            </div>

            <Card className="rounded-2xl border-primary/30 bg-primary/5">
              <CardContent className="flex flex-col items-start justify-between gap-4 p-6 md:flex-row md:items-center">
                <div>
                  <h3 className="font-display text-xl font-semibold">Book a nearby veterinarian</h3>
                  <p className="text-sm text-muted-foreground">Confirm this diagnosis with a licensed vet within 24 hours.</p>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" className="rounded-full"><a href="/vet-contacts">Find Vets</a></Button>
                  <Button asChild className="rounded-full"><a href="/book-vet">Book Appointment</a></Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: string; icon?: any; accent?: string }) {
  return (
    <Card className="rounded-2xl"><CardContent className="flex items-center gap-3 p-4">
      {accent ? (
        <span className={`h-10 w-10 shrink-0 rounded-full ${accent}`} />
      ) : Icon ? (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
      ) : null}
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-display text-lg font-semibold">{value}</p>
      </div>
    </CardContent></Card>
  );
}

function RecCard({ icon: Icon, title, body, tint }: { icon: any; title: string; body: string; tint: string }) {
  return (
    <Card className="rounded-2xl transition hover:-translate-y-0.5 hover:shadow-lg"><CardContent className="p-5">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${tint}`}><Icon className="h-5 w-5" /></div>
      <h4 className="mt-3 font-semibold">{title}</h4>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </CardContent></Card>
  );
}
