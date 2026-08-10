import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, Loader2, LogIn, ShieldCheck, Sparkles, TrendingUp, ShieldCheck as Shield2, Cpu } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/contexts/AuthContext";
import { useUiStrings } from "@/lib/uiStrings";
import LoginHeroSlider from "@/components/login/LoginHeroSlider";
import bgFarm from "@/assets/bg-language-farm.jpg";


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
  "h-12 w-full rounded-xl border-[1.5px] border-slate-200 bg-white pl-11 pr-4 text-[15px] font-medium text-slate-900 outline-none transition-all placeholder:font-normal placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/12 md:h-13";
const BTN =
  "flex h-12 w-full items-center justify-center gap-2.5 rounded-xl text-[15px] font-bold tracking-wide transition-all duration-300 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/20";


export default function Login() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const s = useUiStrings();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate(safePostLoginDest(), { replace: true });
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const em = emailSchema.safeParse(email);
    const pw = passwordSchema.safeParse(password);
    if (!em.success) return toast.error(em.error.issues[0].message);
    if (!pw.success) return toast.error(pw.error.issues[0].message);

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: em.data, password: pw.data });
    setLoading(false);
    if (error) {
      toast.error(friendlyAuthError(error.message));
      return;
    }
    navigate("/", { replace: true });
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

  const BENEFITS = [
    { icon: Cpu, title: s.benefit1, sub: s.benefit1Sub },
    { icon: TrendingUp, title: s.benefit2, sub: s.benefit2Sub },
    { icon: Shield2, title: s.benefit3, sub: s.benefit3Sub },
  ];

  return (
    <div className="relative h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-white text-slate-900 antialiased md:h-auto md:min-h-[100svh] md:max-h-none md:overflow-x-hidden md:overflow-y-auto">
      {/* Premium blended dairy/agri backdrop (mobile-first, merged not stacked) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <img
          src={bgFarm}
          alt=""
          className="h-full w-full object-cover object-center opacity-[0.55] md:opacity-40"
          loading="eager"
          decoding="async"
        />
        <div className="absolute inset-0 bg-[radial-gradient(120%_85%_at_50%_-10%,rgba(240,249,255,0.95)_0%,rgba(255,255,255,0.9)_45%,rgba(236,253,245,0.92)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/45 to-emerald-50/85" />
        <div className="absolute -bottom-32 -left-32 h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,rgba(22,163,74,0.18),transparent_65%)] blur-3xl" />
        <div className="absolute -right-32 top-0 h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.16),transparent_65%)] blur-3xl" />
      </div>

      <main className="relative z-10 mx-auto flex h-full w-full max-w-[1500px] flex-col md:grid md:h-auto md:min-h-[100svh] md:grid-cols-[1.05fr_1fr] md:items-stretch md:gap-0 md:px-6 md:py-6 lg:px-10 lg:py-10">

        {/* ── HERO PANEL: desktop / laptop / tablet only ── */}
        <section className="relative hidden overflow-hidden rounded-[32px] shadow-[0_30px_80px_-30px_rgba(7,26,11,0.35)] md:block">
          <LoginHeroSlider />
          <div aria-hidden className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/25 to-black/45" />

          <div className="relative z-10 flex h-full flex-col justify-between p-7 text-white lg:p-10">
            <div className="flex items-center gap-2.5 rounded-full border border-white/20 bg-black/35 px-4 py-2 backdrop-blur-md w-fit">
              <img src="/logo.png" alt="" width={28} height={28} className="h-6 w-6 object-contain" />
              <span className="text-sm font-extrabold tracking-tight" data-no-translate>
                Smart Dairy <span className="text-emerald-300">Hub</span>
              </span>
            </div>

            <div className="max-w-[34rem]">
              <h1 className="font-display text-3xl font-extrabold leading-[1.1] tracking-tight lg:text-[44px]">
                {s.brand}
              </h1>
              <p className="mt-2 text-lg font-bold text-emerald-300 lg:text-xl">{s.tagline}</p>
              <p className="mt-3 text-sm leading-relaxed text-white/85 lg:text-[15px]">{s.heroLead}</p>

              <ul className="mt-7 space-y-3.5">
                {BENEFITS.map((b) => (
                  <li key={b.title} className="flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/20 bg-white/10 backdrop-blur">
                      <b.icon className="h-5 w-5 text-emerald-300" aria-hidden />
                    </span>
                    <span>
                      <span className="block text-[15px] font-bold leading-tight">{b.title}</span>
                      <span className="block text-[12.5px] text-white/75">{b.sub}</span>
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 inline-flex items-center gap-2.5 rounded-2xl border border-white/20 bg-black/35 px-4 py-3 backdrop-blur-md">
                <Sparkles className="h-4 w-4 shrink-0 text-emerald-300" aria-hidden />
                <span className="text-[13px] font-semibold leading-snug">{s.footerBadge}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── LOGIN CARD ── */}
        <section className="relative z-20 flex min-h-0 flex-1 items-center justify-center px-4 py-3 sm:px-6 md:py-0 md:pl-8 lg:pl-12">
          <div className="mx-auto w-full max-w-[440px] rounded-3xl border border-white/90 bg-white/92 p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_24px_60px_-16px_rgba(7,26,11,0.18),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl sm:p-6 md:pb-6 lg:p-8">
            {/* Brand — mobile leads with the logo, no heavy hero image */}
            <div className="mb-4 flex flex-col items-center text-center">
              <img
                src="/logo.png"
                alt="Smart Dairy Hub"
                width={72}
                height={72}
                fetchPriority="high"
                decoding="sync"
                className="h-12 w-12 object-contain sm:h-14 sm:w-14"
              />
              <h2 className="mt-2 font-display text-[20px] font-extrabold tracking-tight text-slate-900 sm:text-[24px]" data-no-translate>
                Smart Dairy Hub
              </h2>
              <p className="mt-0.5 text-[12px] font-semibold text-emerald-700">{s.tagline}</p>
            </div>


            {/* 1. Google */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className={`${BTN} border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:shadow`}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>{s.google}</span>
            </button>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{s.orEmail}</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {/* 2. Email  3. Password  4. Sign In */}
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label htmlFor="sdh-email" className="mb-1.5 block text-[12px] font-bold text-slate-700">
                  {s.emailLabel}
                </label>
                <div className="relative">
                  <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <Mail className="h-5 w-5" />
                  </span>
                  <input
                    id="sdh-email"
                    type="email"
                    required
                    autoComplete="email"
                    maxLength={255}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={s.emailPlaceholder}
                    className={FIELD}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="sdh-password" className="mb-1.5 block text-[12px] font-bold text-slate-700">
                  {s.passwordLabel}
                </label>
                <div className="relative">
                  <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <Lock className="h-5 w-5" />
                  </span>
                  <input
                    id="sdh-password"
                    type={showPwd ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    maxLength={128}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={s.passwordPlaceholder}
                    className={`${FIELD} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    aria-label={showPwd ? s.hidePassword : s.showPassword}
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 transition hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                  >
                    {showPwd ? <EyeOff className="h-5 w-5 text-emerald-700" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <label className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-[18px] w-[18px] cursor-pointer rounded accent-emerald-600"
                  />
                  <span className="text-[13px] font-medium text-slate-600">{s.remember}</span>
                </label>
                <Link to="/forgot-password" className="text-[12px] font-bold text-emerald-700 hover:underline">
                  {s.forgot}
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`${BTN} bg-gradient-to-br from-emerald-700 to-emerald-600 text-white shadow-[0_14px_30px_-10px_rgba(22,163,74,0.6)] hover:-translate-y-px hover:brightness-[1.06] disabled:opacity-70`}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> {s.signingIn}
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" aria-hidden /> {s.signIn}
                  </>
                )}
              </button>
            </form>

            <p className="mt-4 text-center text-[13px] text-slate-500">
              {s.newHere}{" "}
              <Link to="/select-role" className="font-bold text-emerald-700 hover:underline">
                {s.createAccount}
              </Link>
            </p>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{s.or}</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {/* 5. Guest */}
            <button
              type="button"
              onClick={continueAsGuest}
              className={`${BTN} border border-emerald-100 bg-emerald-50/70 text-emerald-800 hover:bg-emerald-50`}
            >
              {s.guest}
            </button>

            <div className="mt-6 border-t border-slate-100 pt-4 text-center">
              <p className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
                {s.secure}
              </p>
              <div className="mt-2 flex items-center justify-center gap-3 text-[12px] font-semibold text-slate-600">
                <Link to="/privacy" className="hover:text-emerald-700">{s.privacy}</Link>
                <span aria-hidden className="text-slate-300">•</span>
                <Link to="/terms" className="hover:text-emerald-700">{s.terms}</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
