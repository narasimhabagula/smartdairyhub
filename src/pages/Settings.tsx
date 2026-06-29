import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sun, Moon, Monitor, Volume2, Mic, Languages as LangIcon, User as UserIcon, Bell,
  Shield, HelpCircle, Bot, Headset, FileText, Info, LogOut, ChevronRight, Lock,
  Trash2, BugPlay,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme, type ThemeMode } from "@/contexts/ThemeContext";
import { LANGUAGES, type LanguageCode } from "@/locales";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { loadVoiceSettings, saveVoiceSettings, speak, type VoiceSettings } from "@/lib/tts";

const NOTIF_KEY = "sdh_notif_prefs_v1";
type NotifPrefs = { push: boolean; sms: boolean; email: boolean };
const DEFAULT_NOTIF: NotifPrefs = { push: true, sms: false, email: true };

const VOICE_LANGS = [
  { code: "en-IN", label: "English (India)" },
  { code: "te-IN", label: "తెలుగు" },
  { code: "hi-IN", label: "हिन्दी" },
  { code: "ta-IN", label: "தமிழ்" },
  { code: "ml-IN", label: "മലയാളം" },
  { code: "kn-IN", label: "ಕನ್ನಡ" },
  { code: "mr-IN", label: "मराठी" },
  { code: "bn-IN", label: "বাংলা" },
  { code: "pa-IN", label: "ਪੰਜਾਬੀ" },
  { code: "gu-IN", label: "ગુજરાતી" },
  { code: "or-IN", label: "ଓଡ଼ିଆ" },
  { code: "as-IN", label: "অসমীয়া" },
];

const SAMPLES: Record<string, string> = {
  "en-IN": "Hello! This is your Smart Dairy Hub assistant.",
  "te-IN": "నమస్తే! నేను స్మార్ట్ డెయిరీ హబ్ సహాయకుడిని.",
  "hi-IN": "नमस्ते! मैं स्मार्ट डेयरी हब सहायक हूँ।",
  "ta-IN": "வணக்கம்! நான் ஸ்மார்ட் டெய்ரி ஹப் உதவியாளர்.",
  "ml-IN": "നമസ്കാരം! ഞാൻ സ്മാർട്ട് ഡെയറി ഹബ് സഹായിയാണ്.",
  "kn-IN": "ನಮಸ್ಕಾರ! ನಾನು ಸ್ಮಾರ್ಟ್ ಡೈರಿ ಹಬ್ ಸಹಾಯಕ.",
};

export default function Settings() {
  const navigate = useNavigate();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const { i18n, t } = useTranslation();

  const [voice, setVoice] = useState<VoiceSettings>(() => loadVoiceSettings());
  const [notif, setNotif] = useState<NotifPrefs>(() => {
    try { const r = localStorage.getItem(NOTIF_KEY); return r ? { ...DEFAULT_NOTIF, ...JSON.parse(r) } : DEFAULT_NOTIF; }
    catch { return DEFAULT_NOTIF; }
  });
  const [micState, setMicState] = useState<"idle" | "ok" | "denied">("idle");
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [savingPwd, setSavingPwd] = useState(false);
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(profile?.phone || "");

  useEffect(() => { setEmail(user?.email || ""); setPhone(profile?.phone || ""); }, [user, profile]);
  useEffect(() => { saveVoiceSettings(voice); }, [voice]);
  useEffect(() => { try { localStorage.setItem(NOTIF_KEY, JSON.stringify(notif)); } catch {} }, [notif]);

  const switchLang = async (lng: LanguageCode) => {
    await i18n.changeLanguage(lng);
    localStorage.setItem("sdh_language_picked", "1");
    if (user) await supabase.from("profiles").update({ language: lng } as any).eq("user_id", user.id);
    await refreshProfile();
    toast.success("Language updated");
  };

  const testMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicState("ok");
      toast.success("Microphone is working");
    } catch {
      setMicState("denied");
      toast.error("Microphone access blocked. Allow permission in your browser.");
    }
  };

  const testVoice = () => {
    speak(SAMPLES[voice.preferredLang] || SAMPLES["en-IN"], voice.preferredLang);
  };

  const changePassword = async () => {
    if (pwd.next.length < 8) return toast.error("New password must be at least 8 characters");
    if (pwd.next !== pwd.confirm) return toast.error("Passwords do not match");
    setSavingPwd(true);
    const { error } = await supabase.auth.updateUser({ password: pwd.next });
    setSavingPwd(false);
    if (error) return toast.error(error.message);
    setPwd({ current: "", next: "", confirm: "" });
    toast.success("Password updated");
  };

  const updateEmail = async () => {
    if (!email || !email.includes("@")) return toast.error("Enter a valid email");
    const { error } = await supabase.auth.updateUser({ email });
    if (error) return toast.error(error.message);
    toast.success("Confirmation email sent — check your inbox.");
  };

  const updatePhone = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ phone } as any).eq("user_id", user.id);
    if (error) return toast.error(error.message);
    await refreshProfile();
    toast.success("Mobile number updated");
  };

  const deleteAccount = () => {
    if (!confirm("Delete your account? This cannot be undone. Contact support to permanently remove your data.")) return;
    navigate("/support");
  };

  return (
    <div className="container max-w-3xl py-6">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account, appearance, voice and notifications.</p>
      </header>

      <div className="space-y-5">
        {/* Account */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><UserIcon className="h-4 w-4" /> Account</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <SettingRow to="/profile" label="Edit Profile" hint={profile?.full_name || "Add your details"} icon={<UserIcon className="h-4 w-4" />} />
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm"><Lock className="h-4 w-4" /> Change Password</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input type="password" placeholder="New password" value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} />
                <Input type="password" placeholder="Confirm new password" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} />
              </div>
              <Button size="sm" disabled={savingPwd} onClick={changePassword}>Update password</Button>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Mobile Number</Label>
              <div className="flex gap-2">
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile" />
                <Button size="sm" variant="outline" onClick={updatePhone}>Save</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Email</Label>
              <div className="flex gap-2">
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email" />
                <Button size="sm" variant="outline" onClick={updateEmail}>Update</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Language */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><LangIcon className="h-4 w-4" /> Language</CardTitle></CardHeader>
          <CardContent>
            <Select value={(i18n.language?.slice(0, 2) || "en")} onValueChange={(v) => switchLang(v as LanguageCode)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.code} value={l.code}>{l.native} <span className="ml-2 text-xs text-muted-foreground">{l.label}</span></SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Sun className="h-4 w-4" /> Appearance</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {([
                { v: "light", label: "Light", icon: Sun },
                { v: "dark", label: "Dark", icon: Moon },
                { v: "system", label: "System", icon: Monitor },
              ] as { v: ThemeMode; label: string; icon: any }[]).map(({ v, label, icon: Icon }) => (
                <button
                  key={v}
                  onClick={() => setTheme(v)}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-sm font-medium transition ${
                    theme === v ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted"
                  }`}
                >
                  <Icon className="h-5 w-5" /> {label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Voice */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Volume2 className="h-4 w-4" /> Voice Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Toggle label="Enable Voice Chat" desc="Talk to Jerry and hear spoken replies." checked={voice.enabled} onCheckedChange={(v) => setVoice({ ...voice, enabled: v })} />
            <div className="space-y-2">
              <Label className="text-sm">Preferred Voice Language</Label>
              <Select value={voice.preferredLang} onValueChange={(v) => setVoice({ ...voice, preferredLang: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{VOICE_LANGS.map((l) => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span>Voice Speed</span><span className="text-muted-foreground">{voice.rate.toFixed(2)}x</span></div>
              <Slider value={[voice.rate]} min={0.5} max={1.5} step={0.05} onValueChange={([v]) => setVoice({ ...voice, rate: v })} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span>Voice Volume</span><span className="text-muted-foreground">{Math.round(voice.volume * 100)}%</span></div>
              <Slider value={[voice.volume]} min={0} max={1} step={0.05} onValueChange={([v]) => setVoice({ ...voice, volume: v })} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={testVoice}><Volume2 className="mr-2 h-4 w-4" /> Test voice</Button>
              <Button size="sm" variant="outline" onClick={testMic}>
                <Mic className="mr-2 h-4 w-4" />
                {micState === "ok" ? "Mic working ✓" : micState === "denied" ? "Mic blocked" : "Test microphone"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Bell className="h-4 w-4" /> Notifications</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Toggle label="Push Notifications" desc="In-app alerts (orders, milk rates, appointments)." checked={notif.push} onCheckedChange={(v) => setNotif({ ...notif, push: v })} />
            <Toggle label="SMS Alerts" desc="Receive important updates by SMS." checked={notif.sms} onCheckedChange={(v) => setNotif({ ...notif, sms: v })} />
            <Toggle label="Email Notifications" desc="Receive weekly summary & critical alerts via email." checked={notif.email} onCheckedChange={(v) => setNotif({ ...notif, email: v })} />
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Shield className="h-4 w-4" /> Privacy</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <SettingRow to="/privacy" label="Privacy Settings" icon={<Shield className="h-4 w-4" />} />
            <SettingRow to="/terms" label="Permissions & Terms" icon={<FileText className="h-4 w-4" />} />
            <button onClick={deleteAccount} className="flex w-full items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-3 text-left text-sm text-destructive hover:bg-destructive/10">
              <span className="flex items-center gap-2"><Trash2 className="h-4 w-4" /> Delete Account</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </CardContent>
        </Card>

        {/* Help */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><HelpCircle className="h-4 w-4" /> Help</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <SettingRow to="/ai-chat" label="AI Help Center" hint="Ask anything in your language" icon={<Bot className="h-4 w-4" />} />
            <SettingRow to="/support" label="Customer Care" icon={<Headset className="h-4 w-4" />} />
            <SettingRow to="/help" label="FAQ" icon={<HelpCircle className="h-4 w-4" />} />
            <SettingRow to="/feedback" label="Report Bug / Feedback" icon={<BugPlay className="h-4 w-4" />} />
            <SettingRow to="/contact" label="Contact Support" icon={<Headset className="h-4 w-4" />} />
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Info className="h-4 w-4" /> About</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <SettingRow to="/about" label="About Smart Dairy Hub" icon={<Info className="h-4 w-4" />} />
            <SettingRow to="/terms" label="Terms & Conditions" icon={<FileText className="h-4 w-4" />} />
            <SettingRow to="/privacy" label="Privacy Policy" icon={<Shield className="h-4 w-4" />} />
            <div className="rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">Version 1.0.0</div>
          </CardContent>
        </Card>

        {user && (
          <Button variant="destructive" className="w-full" onClick={async () => { await signOut(); navigate("/"); }}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        )}
      </div>
    </div>
  );
}

function SettingRow({ to, label, hint, icon }: { to: string; label: string; hint?: string; icon: React.ReactNode }) {
  return (
    <Link to={to} className="flex items-center justify-between rounded-lg border bg-card px-3 py-3 text-sm hover:border-primary hover:bg-primary/5">
      <span className="flex items-center gap-2 font-medium">{icon} {label}</span>
      <span className="flex items-center gap-2 text-xs text-muted-foreground">{hint}<ChevronRight className="h-4 w-4" /></span>
    </Link>
  );
}

function Toggle({ label, desc, checked, onCheckedChange }: { label: string; desc?: string; checked: boolean; onCheckedChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border bg-card px-3 py-3">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {desc && <div className="text-xs text-muted-foreground">{desc}</div>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
