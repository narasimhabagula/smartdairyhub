import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, Cpu, Loader2, ArrowRight, ShieldCheck } from "lucide-react";
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

/** Gently floating leaves & light particles behind the card. */
function AmbientCanvas() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 16 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 10 + 4,
      speedY: Math.random() * 0.3 + 0.1,
      speedX: (Math.random() - 0.5) * 0.25,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 0.8,
      leaf: Math.random() > 0.45,
    }));

    let raf = 0;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotSpeed;
        if (p.y > canvas.height + 15) {
          p.y = -15;
          p.x = Math.random() * canvas.width;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        if (p.leaf) {
          ctx.beginPath();
          ctx.fillStyle = "rgba(67, 160, 71, 0.16)";
          ctx.ellipse(0, 0, p.size, p.size / 2.2, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 4, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(102, 187, 106, 0.35)";
          ctx.shadowBlur = 6;
          ctx.shadowColor = "rgba(67, 160, 71, 0.4)";
          ctx.fill();
        }
        ctx.restore();
      }
      raf = requestAnimationFrame(render);
    };
    render();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return <canvas ref={ref} className="pointer-events-none absolute inset-0 z-[1] h-full w-full" />;
}

const FIELD =
  "h-14 w-full rounded-2xl border-[1.5px] border-gray-200 bg-white pl-12 pr-4 text-[15px] font-medium text-gray-900 outline-none transition-all placeholder:font-normal placeholder:text-gray-400 focus:border-[#2E7D32] focus:ring-4 focus:ring-[#2E7D32]/15";
const BTN =
  "flex h-[58px] w-full items-center justify-center gap-2.5 rounded-2xl text-[15px] font-bold tracking-wide transition-all duration-300 active:scale-[0.985]";

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
    <div className="relative min-h-[100svh] w-full overflow-x-hidden bg-[#FFFCF7] text-gray-900 antialiased">
      {/* Premium ambient background: soft green gradient, cream white, emerald glow */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(120%_90%_at_50%_-10%,#EAF6EB_0%,#FFFCF7_55%,#F4FAF4_100%)]" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 z-0 h-80 w-80 rounded-full bg-gradient-to-tr from-[#B9E2BC]/45 via-emerald-100/25 to-transparent blur-3xl" />
      <AmbientCanvas />

      <main className="relative z-10 mx-auto w-full max-w-[520px] pb-6">
        {/* HERO: fills the top of the screen, full photos, no crop */}
        <header className="relative h-[46svh] min-h-[300px] w-full overflow-hidden rounded-b-[34px] shadow-[0_18px_40px_-18px_rgba(7,26,11,0.45)] sm:h-[48svh] sm:min-h-[360px]">
          <LoginHeroSlider />

          <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/75 via-black/15 to-black/35" />

          <div className="pointer-events-none relative z-10 flex h-full flex-col justify-between p-4 text-white sm:p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-3.5 py-1.5 backdrop-blur-md">
                <img src="/logo.png" alt="Smart Dairy Hub logo" className="h-5 w-5 object-contain" />
                <span className="font-heading text-sm font-extrabold tracking-tight">
                  Smart Dairy <span className="text-emerald-400">Hub</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-md backdrop-blur-md">
                <Cpu className="h-3 w-3" />
                <span>AI v3.4</span>
              </div>
            </div>

            <div className="mb-6 max-w-[86%]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-200">
                Trusted by 140,000+ Farmers
              </p>
              <h1 className="font-heading mt-1 text-xl font-extrabold leading-tight tracking-tight text-white sm:text-2xl">
                Next-Gen Precision Dairy Management
              </h1>
            </div>
          </div>
        </header>

        {/* LOGIN CARD: overlaps the hero naturally */}
        <section className="relative z-20 -mt-9 px-4 sm:px-6">
          <div className="rounded-[28px] border border-white/90 bg-white/90 p-5 shadow-[0_24px_60px_-16px_rgba(7,26,11,0.22),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl sm:p-7">
            <div className="mb-5 text-center">
              <h2 className="font-heading text-2xl font-extrabold tracking-tight text-gray-900">Welcome Back</h2>
              <p className="mt-1 text-[13px] text-gray-500">Sign in to continue your Smart Dairy Hub journey.</p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label htmlFor="sdh-email" className="mb-1.5 block text-[12px] font-bold text-gray-700">
                  Email / Farmer ID
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
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
                  <label htmlFor="sdh-password" className="text-[12px] font-bold text-gray-700">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-[12px] font-bold text-[#2E7D32] hover:underline">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
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
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-gray-400 hover:text-gray-600"
                  >
                    {showPwd ? <EyeOff className="h-5 w-5 text-[#2E7D32]" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2.5 py-0.5">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-[18px] w-[18px] cursor-pointer rounded accent-[#2E7D32]"
                />
                <span className="text-[13px] font-medium text-gray-600">Remember this device</span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className={`${BTN} bg-gradient-to-br from-[#2E7D32] to-[#43A047] text-white shadow-[0_12px_26px_-8px_rgba(46,125,50,0.55)] hover:-translate-y-px hover:from-[#1B5E20] hover:to-[#2E7D32] disabled:opacity-70`}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> Authenticating…
                  </>
                ) : (
                  <>
                    Sign In <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">or continue with</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className={`${BTN} border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:shadow`}
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
              className={`${BTN} mt-3 border border-emerald-100 bg-emerald-50/70 text-[#1B5E20] hover:bg-emerald-50`}
            >
              Continue as Guest
            </button>
          </div>
        </section>

        <footer className="mt-5 px-4 text-center">
          <p className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-gray-500">
            <ShieldCheck className="h-3.5 w-3.5 text-[#2E7D32]" />
            Encrypted with 256-Bit SSL Security • ISO 27001 Certified
          </p>
          <div className="mt-2 flex items-center justify-center gap-3 text-[12px] font-semibold text-gray-600">
            <Link to="/privacy" className="hover:text-[#1B5E20]">Privacy</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-[#1B5E20]">Terms</Link>
            <span>•</span>
            <a href="tel:18001801551" className="text-[#1B5E20] hover:underline">Support</a>
          </div>
        </footer>
      </main>
    </div>
  );
}
