import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, Camera, ImageIcon, X, Sparkles, Activity, Pill, Utensils, Syringe, CalendarClock, ShieldAlert, AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, RadialBarChart, RadialBar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { demoDiseaseResults, USE_DEMO_DATA } from "@/data/demo";
import heroImg from "@/assets/disease-hero.jpg";

type Result = {
  animal: string; breed: string; disease: string;
  confidence: number; severity: "Mild" | "Moderate" | "Severe";
  recoveryChance: number; symptoms: string[];
  medicines: { name: string; dosage: string; duration: string }[];
  isolation: string; nutrition: string[]; vaccination: string; nextCheckup: string;
  affectedArea: { x: number; y: number; w: number; h: number };
};

const severityColor: Record<string, string> = {
  Mild: "bg-emerald-500", Moderate: "bg-amber-500", Severe: "bg-red-500",
};

const healthTrend = Array.from({ length: 12 }, (_, i) => ({
  month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
  health: 70 + Math.round(Math.sin(i / 2) * 15) + (i > 8 ? -10 : 0),
  yield: 18 + Math.round(Math.cos(i / 2) * 4),
}));

export default function DiseaseDetection() {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const camInput = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.type.startsWith("image/")) { toast.error("Please upload an image"); return; }
    if (f.size > 10 * 1024 * 1024) { toast.error("Max 10 MB"); return; }
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const clearImg = () => { setFile(null); setPreview(null); setResult(null); };

  const saveReport = async (r: Result, imageUrl: string | null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      // Never persist raw base64/data-URL images — they can be up to ~13 MB and
      // will bloat the DB and break the Dashboard listing. Only store real https
      // URLs (e.g. demo images or uploaded storage URLs).
      const safeImageUrl =
        imageUrl && /^https?:\/\//i.test(imageUrl) ? imageUrl : null;
      const { error } = await supabase.from("disease_reports").insert({
        user_id: user.id,
        animal: r.animal, breed: r.breed, disease: r.disease,
        confidence: r.confidence, severity: r.severity,
        recovery_chance: r.recoveryChance,
        symptoms: r.symptoms as any,
        treatment: {
          medicines: r.medicines, isolation: r.isolation,
          nutrition: r.nutrition, vaccination: r.vaccination,
          nextCheckup: r.nextCheckup,
        } as any,
        image_url: safeImageUrl,
      });
      if (error) {
        console.warn("Failed to save disease report:", error.message);
        toast.error("Could not save report to history");
      }
    } catch (e) {
      console.warn("saveReport error", e);
    }
  };

  const finalizeResult = (r: Result, imageUrl: string | null) => {
    setResult(r);
    saveReport(r, imageUrl);
  };

  const analyze = async () => {
    if (!file || !preview) return;
    setAnalyzing(true); setProgress(5); setResult(null);

    const tick = setInterval(() => setProgress((p) => Math.min(p + 7, 90)), 300);

    try {
      const base64 = preview.split(",")[1];
      const { data, error } = await supabase.functions.invoke("analyze-animal-health", {
        body: { imageBase64: base64, mimeType: file.type },
      });

      clearInterval(tick); setProgress(100);

      if (error || data?.error) {
        if (USE_DEMO_DATA) {
          toast.info("Using demo analysis (AI unavailable)");
          finalizeResult(demoDiseaseResults[Math.floor(Math.random() * demoDiseaseResults.length)] as Result, preview);
        } else {
          toast.error(error?.message || data?.error || "Analysis failed");
        }
      } else {
        finalizeResult(data as Result, preview);
        toast.success("Analysis complete");
      }
    } catch (e) {
      clearInterval(tick);
      if (USE_DEMO_DATA) {
        toast.info("Using demo analysis");
        finalizeResult(demoDiseaseResults[0] as Result, preview);
      } else {
        toast.error((e as Error).message);
      }
    } finally {
      setTimeout(() => { setAnalyzing(false); setProgress(0); }, 500);
    }
  };

  const runDemo = () => {
    const img = "https://images.unsplash.com/photo-1546445317-29f4545e9d53?w=1200&q=80";
    setPreview(img);
    finalizeResult(demoDiseaseResults[Math.floor(Math.random() * demoDiseaseResults.length)] as Result, img);
    toast.success("Demo analysis loaded");
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <img src={heroImg} alt="AI vet examining cow" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-background/20" />
        <div className="container relative py-16 md:py-24">
          <Badge className="mb-4 gap-1.5 bg-primary/10 text-primary hover:bg-primary/20"><Sparkles className="h-3 w-3" /> AI-Powered · Instant</Badge>
          <h1 className="font-display text-4xl font-bold md:text-6xl max-w-2xl">AI Disease Detection for Dairy Animals</h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            Snap a photo of your cow or buffalo. Get an AI diagnosis in seconds — disease, severity, treatment plan, and nearest vet.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => fileInput.current?.click()} className="gap-2">
              <Upload className="h-4 w-4" /> Upload Photo
            </Button>
            <Button size="lg" variant="outline" onClick={runDemo} className="gap-2 backdrop-blur">
              <Sparkles className="h-4 w-4" /> Try Demo
            </Button>
          </div>
        </div>
      </section>

      <div className="container py-10 space-y-8">
        {/* Upload zone */}
        <Card className="overflow-hidden">
          <CardContent className="p-6 md:p-8">
            {!preview ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault(); setDragOver(false);
                  const f = e.dataTransfer.files?.[0]; if (f) handleFile(f);
                }}
                className={`rounded-2xl border-2 border-dashed p-10 text-center transition ${dragOver ? "border-primary bg-primary/5" : "border-border"}`}
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <ImageIcon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mt-4 font-display text-xl font-semibold">Drop animal photo here</h3>
                <p className="mt-1 text-sm text-muted-foreground">JPG, PNG · up to 10 MB · one animal per photo works best</p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Button onClick={() => fileInput.current?.click()} className="gap-2"><Upload className="h-4 w-4" /> Choose file</Button>
                  <Button variant="outline" onClick={() => camInput.current?.click()} className="gap-2"><Camera className="h-4 w-4" /> Camera</Button>
                </div>
                <input ref={fileInput} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                <input ref={camInput} type="file" accept="image/*" capture="environment" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-[1fr,auto]">
                <div className="relative overflow-hidden rounded-xl border bg-muted">
                  <img src={preview} alt="Preview" className="h-auto w-full object-cover" />
                  {analyzing && (
                    <>
                      <div className="pointer-events-none absolute inset-0 bg-primary/5">
                        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-[scan_2s_linear_infinite]" style={{ top: `${progress}%` }} />
                      </div>
                      <style>{`@keyframes scan { 0% { top: 0% } 100% { top: 100% } }`}</style>
                    </>
                  )}
                  {result && (
                    <div
                      className="pointer-events-none absolute rounded-lg border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)]"
                      style={{
                        left: `${result.affectedArea?.x ?? 40}%`,
                        top: `${result.affectedArea?.y ?? 50}%`,
                        width: `${result.affectedArea?.w ?? 25}%`,
                        height: `${result.affectedArea?.h ?? 20}%`,
                        background: "radial-gradient(circle, rgba(239,68,68,0.35), transparent 70%)",
                      }}
                    >
                      <span className="absolute -top-6 left-0 whitespace-nowrap rounded bg-red-500 px-2 py-0.5 text-xs font-medium text-white">
                        Affected: {result.disease}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-between gap-3 md:w-64">
                  <div className="space-y-2">
                    <Button className="w-full gap-2" onClick={analyze} disabled={analyzing}>
                      {analyzing ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing…</> : <><Sparkles className="h-4 w-4" /> Analyze with AI</>}
                    </Button>
                    <Button variant="outline" className="w-full gap-2" onClick={clearImg} disabled={analyzing}>
                      <X className="h-4 w-4" /> Replace
                    </Button>
                    {analyzing && <Progress value={progress} className="h-2" />}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    AI results are advisory. Always confirm with a licensed veterinarian.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <div className="animate-fade-up space-y-6">
            {/* Summary strip */}
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard label="Animal" value={`${result.animal} · ${result.breed}`} icon={Activity} />
              <StatCard label="Disease" value={result.disease} icon={ShieldAlert} />
              <StatCard label="Severity" value={result.severity} accent={severityColor[result.severity]} />
              <StatCard label="Recovery" value={`${result.recoveryChance}%`} icon={RefreshCw} />
            </div>

            {/* Gauges */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card><CardContent className="p-6">
                <h3 className="font-display text-lg font-semibold">Confidence</h3>
                <div className="mt-2 h-48">
                  <ResponsiveContainer><RadialBarChart innerRadius="65%" outerRadius="100%" data={[{ v: result.confidence, fill: "hsl(var(--primary))" }]} startAngle={90} endAngle={-270}>
                    <RadialBar background dataKey="v" cornerRadius={12} />
                  </RadialBarChart></ResponsiveContainer>
                </div>
                <p className="text-center font-display text-3xl font-bold">{result.confidence}%</p>
              </CardContent></Card>

              <Card><CardContent className="p-6">
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

              <Card><CardContent className="p-6">
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

            {/* Symptoms + Treatment */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card><CardContent className="p-6">
                <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold"><AlertCircle className="h-5 w-5 text-amber-500" /> Symptoms Observed</h3>
                <ul className="space-y-2">
                  {result.symptoms.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />{s}</li>
                  ))}
                </ul>
              </CardContent></Card>

              <Card><CardContent className="p-6">
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

            {/* Recommendations grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <RecCard icon={ShieldAlert} title="Isolation" body={result.isolation} tint="bg-red-500/10 text-red-600" />
              <RecCard icon={Utensils} title="Nutrition" body={result.nutrition.join(" · ")} tint="bg-emerald-500/10 text-emerald-600" />
              <RecCard icon={Syringe} title="Vaccination" body={result.vaccination} tint="bg-blue-500/10 text-blue-600" />
              <RecCard icon={CalendarClock} title="Next Checkup" body={result.nextCheckup} tint="bg-amber-500/10 text-amber-600" />
            </div>

            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="flex flex-col items-start justify-between gap-4 p-6 md:flex-row md:items-center">
                <div>
                  <h3 className="font-display text-xl font-semibold">Book a nearby veterinarian</h3>
                  <p className="text-sm text-muted-foreground">Confirm this diagnosis with a licensed vet within 24 hours.</p>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline"><a href="/vet-contacts">Find Vets</a></Button>
                  <Button asChild><a href="/book-vet">Book Appointment</a></Button>
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
    <Card><CardContent className="flex items-center gap-3 p-4">
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
    <Card><CardContent className="p-5">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${tint}`}><Icon className="h-5 w-5" /></div>
      <h4 className="mt-3 font-semibold">{title}</h4>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </CardContent></Card>
  );
}
