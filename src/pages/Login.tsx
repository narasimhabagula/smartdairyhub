import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, Leaf, ShieldCheck, TrendingUp, Sprout, Smartphone, User } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/contexts/AuthContext";
import { useUiStrings } from "@/lib/uiStrings";

const emailSchema = z.string().trim().email("Enter a valid email").max(255);
const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(128);

function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "Email or password is incorrect.";
  if (m.includes("email not confirmed")) return "Please verify your email before logging in.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Please wait a minute.";
  return message;
}

/** After signing in a farmer always lands on Home first — never straight on the dashboard. */
function safePostLoginDest(): string {
  try {
    const dest = sessionStorage.getItem("postLoginRedirect");
    sessionStorage.removeItem("postLoginRedirect");
    if (dest && dest.startsWith("/") && !dest.startsWith("//")) return dest;
  } catch {}
  return "/";
}

const FIELD =
  "h-[52px] w-full rounded-xl border-[1.5px] border-slate-200 bg-white pl-11 pr-4 text-[15px] font-medium text-slate-900 outline-none transition-all placeholder:font-normal placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10";
const BTN =
  "flex h-[52px] w-full items-center justify-center gap-2.5 rounded-xl text-[15px] font-bold tracking-tight transition-all duration-200 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/20";

/** Soft agricultural backdrop: hills, leaves and a faint barn/cow silhouette — CSS/SVG only. */
function AgriBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#F7FBF6]">
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-15%,#FFFFFF_0%,#F6FBF4_55%,#EAF6E6_100%)]" />

      {/* Leaves — corners, subtle */}
      <Leaf className="absolute -left-6 -top-4 h-32 w-32 rotate-[18deg] text-emerald-500/[0.10] sm:h-44 sm:w-44" />
      <Leaf className="absolute -right-6 top-6 h-28 w-28 -rotate-[24deg] text-emerald-500/[0.10] sm:h-40 sm:w-40" />
      <Sprout className="absolute -left-4 bottom-24 h-24 w-24 text-emerald-600/[0.10] sm:h-32 sm:w-32" />
      <Sprout className="absolute -right-3 bottom-28 h-20 w-20 text-emerald-600/[0.09] sm:h-28 sm:w-28" />

      {/* Rolling hills + farm silhouette */}
      <svg className="absolute inset-x-0 bottom-0 h-[46%] w-full" viewBox="0 0 1440 420" preserveAspectRatio="none">
        <path d="M0 210 C 240 150 420 250 720 200 C 1010 152 1210 240 1440 190 V420 H0Z" fill="rgba(22,163,74,0.08)" />
        <path d="M0 268 C 300 214 560 296 880 250 C 1150 212 1300 282 1440 250 V420 H0Z" fill="rgba(22,163,74,0.12)" />
        <path d="M0 340 C 320 300 620 360 960 322 C 1200 296 1330 340 1440 322 V420 H0Z" fill="rgba(22,163,74,0.16)" />
        {/* barn */}
        <g fill="rgba(22,163,74,0.16)">
          <path d="M1180 250 h96 v78 h-96z" />
          <path d="M1172 250 l52 -34 l52 34z" />
          <rect x="1292" y="228" width="30" height="100" rx="14" />
        </g>
        {/* cow */}
        <g fill="rgba(22,163,74,0.16)">
          <ellipse cx="180" cy="318" rx="52" ry="24" />
          <rect x="140" y="330" width="9" height="26" />
          <rect x="164" y="330" width="9" height="26" />
          <rect x="196" y="330" width="9" height="26" />
          <rect x="216" y="330" width="9" height="26" />
          <path d="M228 306 q26 -6 30 14 q-16 12 -34 4z" />
        </g>
      </svg>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const s = useUiStrings();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [pwdStep, setPwdStep] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate(safePostLoginDest(), { replace: true });
  }, [user, navigate]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const em = emailSchema.safeParse(email);
    if (!em.success) return toast.error(em.error.issues[0].message);

    // Step 1: reveal the password field for the existing email/password auth.
    if (!pwdStep) {
      setPwdStep(true);
      return;
    }

    const pw = passwordSchema.safeParse(password);
    if (!pw.success) return toast.error(pw.error.issues[0].message);

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: em.data, password: pw.data });
    setLoading(false);
    if (error) return toast.error(friendlyAuthError(error.message));
    navigate(safePostLoginDest(), { replace: true });
  };

  const handleGoogleSignIn = async () => {
    try {
      sessionStorage.setItem("postLoginRedirect", "/");
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(friendlyAuthError((result.error as any).message || "Google login failed"));
        return;
      }
      if (result.redirected) return;
      navigate(safePostLoginDest(), { replace: true });
    } catch {
      toast.error("Google login failed. Please try again.");
    }
  };

  const continueAsGuest = () => {
    try {
      sessionStorage.setItem("sdh_guest_mode", "1");
    } catch {}
    navigate("/", { replace: true });
  };

  const TRUST = [
    { icon: ShieldCheck, label: s.trust1 },
    { icon: Leaf, label: s.trust2 },
    { icon: TrendingUp, label: s.trust3 },
    { icon: Sprout, label: s.trust4 },
  ];

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-x-hidden px-4 py-5 text-slate-900 antialiased sm:px-6 md:min-h-[100svh] md:py-10">
      <AgriBackdrop />

      {/* ── LOGIN CARD (mobile compact · desktop centered premium) ── */}
      <section className="relative z-10 w-[92%] max-w-[430px] rounded-[22px] border border-white/80 bg-white/95 p-5 shadow-[0_20px_60px_-24px_rgba(7,26,11,0.22)] backdrop-blur-xl sm:w-full sm:p-6 md:max-w-[560px] md:rounded-[26px] md:p-9 lg:max-w-[600px]">
        {/* Brand */}
        <div className="flex flex-col items-center text-center">
          <img
            src="/logo.png"
            alt="Smart Dairy Hub"
            width={96}
            height={96}
            fetchPriority="high"
            decoding="sync"
            className="h-14 w-14 object-contain md:h-20 md:w-20"
          />
          <p className="mt-2.5 font-display text-[19px] font-extrabold leading-tight tracking-tight text-slate-900 md:text-[24px]">
            {s.welcomeTo}
          </p>
          <h1
            className="font-display text-[24px] font-extrabold leading-tight tracking-tight text-emerald-700 md:text-[32px]"
            data-no-translate
          >
            {s.brand}
          </h1>
          <p className="mt-1 text-[12.5px] font-medium text-slate-500 md:text-sm">{s.tagline}</p>
        </div>

        {/* 1 · Google */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className={`${BTN} mt-5 border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50 md:mt-7`}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>{s.google}</span>
        </button>

        <Divider label={s.orWord} />

        {/* 2 · Email */}
        <form onSubmit={handleEmailSubmit} className="space-y-3">
          <div className="relative">
            <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-emerald-600">
              <Mail className="h-5 w-5" />
            </span>
            <input
              type="email"
              required
              autoComplete="email"
              maxLength={255}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={s.emailPlaceholder}
              aria-label={s.emailLabel}
              className={FIELD}
            />
          </div>

          {pwdStep && (
            <div className="relative animate-fade-in">
              <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-emerald-600">
                <Lock className="h-5 w-5" />
              </span>
              <input
                type={showPwd ? "text" : "password"}
                required
                autoFocus
                autoComplete="current-password"
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={s.passwordPlaceholder}
                aria-label={s.passwordLabel}
                className={`${FIELD} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                aria-label={showPwd ? s.hidePassword : s.showPassword}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 hover:text-slate-600"
              >
                {showPwd ? <EyeOff className="h-5 w-5 text-emerald-700" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`${BTN} bg-emerald-700 text-white shadow-[0_12px_28px_-12px_rgba(4,120,87,0.7)] hover:bg-emerald-800 disabled:opacity-70`}
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> {s.signingIn}
              </>
            ) : (
              <>
                <span>{pwdStep ? s.signIn : s.continueEmail}</span>
                <ArrowRight className="h-[18px] w-[18px]" aria-hidden />
              </>
            )}
          </button>

          {pwdStep && (
            <div className="flex items-center justify-between text-[12px] font-semibold">
              <Link to="/forgot-password" className="text-emerald-700 hover:underline">{s.forgot}</Link>
              <Link to="/select-role" className="text-emerald-700 hover:underline">{s.createAccount}</Link>
            </div>
          )}
        </form>

        <Divider label={s.orWord} />

        {/* 3 · Guest */}
        <button
          type="button"
          onClick={continueAsGuest}
          className={`${BTN} border-[1.5px] border-emerald-600/70 bg-white text-emerald-800 hover:bg-emerald-50`}
        >
          <User className="h-[18px] w-[18px]" aria-hidden />
          <span>{s.guest}</span>
        </button>

        {/* Legal */}
        <p className="mt-4 text-center text-[11.5px] leading-relaxed text-slate-500 md:text-[12.5px]">
          {s.byContinuing}{" "}
          <Link to="/terms" className="font-semibold text-emerald-700 hover:underline">{s.terms}</Link>{" "}
          {s.andWord}{" "}
          <Link to="/privacy" className="font-semibold text-emerald-700 hover:underline">{s.privacy}</Link>
        </p>
      </section>

      {/* ── Below the card: quote, trust row, Play Store note ── */}
      <div className="relative z-10 mt-5 w-full max-w-[720px] text-center md:mt-7">
        <p className="text-[13px] font-semibold text-slate-700 md:text-[15px]">“{s.quote}”</p>
        <p className="mt-0.5 text-[11.5px] text-slate-500 md:text-[13px]">{s.quoteSub}</p>

        <ul className="mt-3 hidden flex-wrap items-center justify-center gap-x-6 gap-y-2 md:flex">
          {TRUST.map((tr) => (
            <li key={tr.label} className="flex items-center gap-2 text-[12.5px] font-semibold text-slate-600">
              <tr.icon className="h-4 w-4 text-emerald-600" aria-hidden />
              {tr.label}
            </li>
          ))}
        </ul>

        <div className="mx-auto mt-4 inline-flex items-center gap-2.5 rounded-full border border-emerald-600/20 bg-white/80 px-3.5 py-2 backdrop-blur">
          <Smartphone className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden />
          <span className="text-left leading-tight">
            <span className="block text-[11.5px] font-bold text-slate-700">{s.playComingSoon}</span>
            <span className="block text-[10.5px] text-slate-500">{s.playAvailable}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="my-3.5 flex items-center gap-3 md:my-4">
      <div className="h-px flex-1 bg-slate-200" />
      <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-slate-400">{label}</span>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  );
}
