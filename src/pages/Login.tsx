import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, Cpu, Loader2, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/contexts/AuthContext";
import LoginHeroSlider from "@/components/login/LoginHeroSlider";

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
  "h-14 w-full rounded-2xl border-[1.5px] border-slate-200 bg-white pl-12 pr-4 text-[15px] font-medium text-slate-900 outline-none transition-all placeholder:font-normal placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/12";
const BTN =
  "flex h-[56px] w-full items-center justify-center gap-2.5 rounded-2xl text-[15px] font-bold tracking-wide transition-all duration-300 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/20";

export default function Login() {
  const navigate = useNavigate();
  const { user } = useAuth();

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
    toast.success("Welcome back! Redirecting…");
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

  return (
    <div className="relative min-h-[100svh] w-full overflow-x-hidden bg-white text-slate-900 antialiased">
      {/* Ambient premium backdrop */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(120%_80%_at_50%_-20%,#F0F9FF_0%,#FFFFFF_50%,#F5FBF6_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed -bottom-40 -left-40 z-0 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(22,163,74,0.14),transparent_65%)] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed -right-40 top-0 z-0 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.14),transparent_65%)] blur-3xl"
      />

      <main className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[1400px] flex-col lg:grid lg:grid-cols-[1.05fr_1fr] lg:items-stretch lg:gap-0 lg:px-8 lg:py-8">
        {/* ── VISUAL PANEL: top on mobile, left on desktop ── */}
        <section className="relative h-[42svh] min-h-[280px] w-full overflow-hidden rounded-b-[32px] shadow-[0_18px_40px_-18px_rgba(7,26,11,0.4)] sm:h-[46svh] sm:min-h-[340px] lg:h-auto lg:min-h-0 lg:rounded-[32px] lg:shadow-[0_30px_80px_-30px_rgba(7,26,11,0.35)]">
          <LoginHeroSlider />

          <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/78 via-black/12 to-black/35" />

          <div className="pointer-events-none relative z-10 flex h-full flex-col justify-between p-4 text-white sm:p-6 lg:p-9">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-3.5 py-1.5 backdrop-blur-md">
                <img src="/logo.png" alt="Smart Dairy Hub logo" className="h-5 w-5 object-contain" />
                <span className="text-sm font-extrabold tracking-tight">
                  Smart Dairy <span className="text-emerald-400">Hub</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-md backdrop-blur-md">
                <Cpu className="h-3 w-3" />
                <span>AI v3.4</span>
              </div>
            </div>

            <div className="mb-12 max-w-[92%] sm:mb-14 lg:mb-0 lg:max-w-[30rem]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
                Trusted by 140,000+ Farmers
              </p>
              <h1 className="mt-1.5 text-xl font-extrabold leading-[1.15] tracking-tight text-white sm:text-2xl lg:text-4xl">
                Next-Gen Precision Dairy Management
              </h1>
              <p className="mt-2 hidden text-sm leading-relaxed text-white/85 lg:block">
                AI disease detection, live milk rates, verified livestock marketplace and government
                schemes — all in one premium platform.
              </p>
              <div className="mt-4 hidden items-center gap-2 lg:flex">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold backdrop-blur-md">
                  <Sparkles className="h-3 w-3 text-emerald-300" /> Jerry AI Assistant
                </span>
                <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold backdrop-blur-md">
                  12 Indian Languages
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── LOGIN CARD: below on mobile, right on desktop ── */}
        <section className="relative z-20 -mt-9 px-4 pb-8 sm:px-6 lg:mt-0 lg:flex lg:items-center lg:justify-center lg:px-0 lg:pb-0 lg:pl-8">
          <div className="mx-auto w-full max-w-[460px] rounded-[28px] border border-white/90 bg-white/92 p-5 shadow-[0_24px_60px_-16px_rgba(7,26,11,0.22),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl sm:p-7 lg:p-8">
            <div className="mb-6 text-center lg:text-left">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 lg:text-[28px]">Welcome Back</h2>
              <p className="mt-1.5 text-[13px] text-slate-500">
                Sign in to continue your Smart Dairy Hub journey.
              </p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label htmlFor="sdh-email" className="mb-1.5 block text-[12px] font-bold text-slate-700">
                  Email / Farmer ID
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <Mail className="h-5 w-5" />
                  </span>
                  <input
                    id="sdh-email"
                    type="text"
                    required
                    autoComplete="email"
                    maxLength={255}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ramesh.patel@dairyhub.in"
                    className={FIELD}
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="sdh-password" className="text-[12px] font-bold text-slate-700">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-[12px] font-bold text-emerald-700 hover:underline">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
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
                    placeholder="••••••••••••"
                    className={`${FIELD} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    aria-label={showPwd ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 transition hover:text-slate-600"
                  >
                    {showPwd ? <EyeOff className="h-5 w-5 text-emerald-700" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2.5 py-0.5">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-[18px] w-[18px] cursor-pointer rounded accent-emerald-600"
                />
                <span className="text-[13px] font-medium text-slate-600">Remember this device</span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className={`${BTN} bg-gradient-to-br from-emerald-700 to-emerald-500 text-white shadow-[0_14px_30px_-10px_rgba(22,163,74,0.6)] hover:-translate-y-px hover:brightness-[1.06] disabled:opacity-70`}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> Authenticating…
                  </>
                ) : (
                  <>
                    Continue with Email <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                or continue with
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

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
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              onClick={continueAsGuest}
              className={`${BTN} mt-3 border border-emerald-100 bg-emerald-50/70 text-emerald-800 hover:bg-emerald-50`}
            >
              Continue as Guest
            </button>

            <div className="mt-6 border-t border-slate-100 pt-4 text-center">
              <p className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                Encrypted with 256-Bit SSL Security • ISO 27001 Certified
              </p>
              <div className="mt-2 flex items-center justify-center gap-3 text-[12px] font-semibold text-slate-600">
                <Link to="/privacy" className="hover:text-emerald-700">Privacy</Link>
                <span className="text-slate-300">•</span>
                <Link to="/terms" className="hover:text-emerald-700">Terms</Link>
                <span className="text-slate-300">•</span>
                <a href="tel:18001801551" className="text-emerald-700 hover:underline">Support</a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
