import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck, User as UserIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import AuthCarousel from "./AuthCarousel";

const emailSchema = z.string().trim().email("Enter a valid email address").max(255);
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128)
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), "Use letters and at least one number");
const nameSchema = z.string().trim().min(2, "Please enter your full name").max(100);

const REMEMBER_KEY = "sdh_remember_email";

function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "Email or password is incorrect.";
  if (m.includes("email not confirmed")) return "Please verify your email before signing in.";
  if (m.includes("already registered")) return "This email already has an account. Try signing in.";
  if (m.includes("pwned") || m.includes("breach")) return "This password appeared in a data breach. Choose another.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Please wait a minute.";
  return message;
}

const BADGES = [
  "Secure Authentication",
  "End-to-End Encryption",
  "Google Protected",
  "Trusted by Farmers",
  "AI Powered Platform",
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  redirectTo?: string;
}

export default function AuthModal({ open, onOpenChange, redirectTo }: Props) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState<null | "email" | "google">(null);
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_KEY);
      if (saved) setEmail(saved);
    } catch {}
  }, []);

  useEffect(() => {
    if (!open) {
      setErrors({});
      setPassword("");
      setConfirm("");
      setShowPwd(false);
    }
  }, [open]);

  const storeRedirect = () => {
    try {
      const current = window.location.pathname + window.location.search;
      // Landing/root and /login are not useful post-login destinations.
      const fallback = current === "/" || current.startsWith("/login") ? "/dashboard" : current;
      const dest = redirectTo && redirectTo !== "/" ? redirectTo : fallback;
      if (dest.startsWith("/") && !dest.startsWith("//") && dest !== "/login") {
        sessionStorage.setItem("postLoginRedirect", dest);
      }
    } catch {}
  };


  const handleGoogle = async () => {
    setBusy("google");
    try {
      storeRedirect();
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (result.error) {
        toast.error(friendlyAuthError((result.error as any).message || "Google sign-in failed"));
        return;
      }
      if (result.redirected) return;
      onOpenChange(false);
      toast.success("Welcome back!");
    } catch (e: any) {
      toast.error(e?.message || "Google sign-in failed");
    } finally {
      setBusy(null);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    const em = emailSchema.safeParse(email);
    const pw = passwordSchema.safeParse(password);
    if (!em.success) next.email = em.error.issues[0].message;
    if (!pw.success) next.password = pw.error.issues[0].message;
    if (mode === "signup") {
      const nm = nameSchema.safeParse(name);
      if (!nm.success) next.name = nm.error.issues[0].message;
      if (confirm !== password) next.confirm = "Passwords do not match";
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    try {
      localStorage.setItem(REMEMBER_KEY, remember ? em.data! : "");
    } catch {}

    setBusy("email");
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email: em.data!, password: pw.data! });
      setBusy(null);
      if (error) return toast.error(friendlyAuthError(error.message));
      storeRedirect();
      toast.success("Welcome back!");
      onOpenChange(false);
    } else {
      const { error } = await supabase.auth.signUp({
        email: em.data!,
        password: pw.data!,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { full_name: name.trim() },
        },
      });
      setBusy(null);
      if (error) return toast.error(friendlyAuthError(error.message));
      toast.success("Account created! Check your email to verify, then sign in.");
      setMode("signin");
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-md data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 grid max-h-[92svh] w-[calc(100vw-1.5rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[24px] border border-white/50 bg-background/95 shadow-2xl backdrop-blur-2xl duration-300 data-[state=open]:animate-enter md:grid-cols-[45%_1fr]"
        >
          <Dialog.Title className="sr-only">
            {mode === "signin" ? "Sign in to Smart Dairy Hub" : "Create your Smart Dairy Hub account"}
          </Dialog.Title>
          <Dialog.Description className="sr-only">
            Sign in with Google or your email to continue your Smart Dairy Hub experience.
          </Dialog.Description>

          {/* Left — premium carousel (desktop) */}
          <div className="relative hidden min-h-[560px] overflow-hidden md:block lg:min-h-[620px]">
            <AuthCarousel />
            <div className="absolute left-6 top-6 inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-primary shadow-lg backdrop-blur">
              <img src="/logo.png" alt="" className="h-4 w-4 object-contain" /> Smart Dairy Hub
            </div>
          </div>

          {/* Right — authentication */}
          <div className="relative overflow-y-auto">
            <Dialog.Close
              className="absolute right-3 top-3 z-20 rounded-full bg-background/80 p-2 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:bg-transparent md:shadow-none"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>

            {/* Mobile carousel — fixed aspect ratio, no layout shift */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-b-[24px] sm:aspect-[16/10] md:hidden">
              <AuthCarousel />
              <div className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary shadow backdrop-blur">
                <img src="/logo.png" alt="" className="h-3.5 w-3.5 object-contain" /> Smart Dairy Hub
              </div>
            </div>

            <div className="px-6 py-6 sm:px-8 sm:py-7">


            <h2 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-[28px]">
              {mode === "signin" ? "Welcome Back" : "Create your account"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "signin"
                ? "Sign in to continue your Smart Dairy Hub experience."
                : "Join India's next-generation AI dairy platform."}
            </p>

            <Button
              type="button"
              variant="outline"
              onClick={handleGoogle}
              disabled={busy !== null}
              className="mt-6 h-12 w-full rounded-2xl border-border/70 bg-card text-base font-semibold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
            >
              {busy === "google" ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" aria-hidden>
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              Continue with Google
            </Button>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-widest">
                <span className="bg-background px-3 text-muted-foreground">or</span>
              </div>
            </div>

            <form onSubmit={submit} className="space-y-3.5" noValidate>
              {mode === "signup" && (
                <FieldRow label="Full Name" htmlFor="auth-name" error={errors.name} icon={<UserIcon className="h-4 w-4" />}>
                  <Input
                    id="auth-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Rajesh Kumar"
                    autoComplete="name"
                    className="h-12 rounded-2xl pl-10 transition-shadow duration-200 focus-visible:shadow-[0_0_0_4px_hsl(var(--primary)/0.12)]"
                  />
                </FieldRow>
              )}

              <FieldRow label="Email Address" htmlFor="auth-email" error={errors.email} icon={<Mail className="h-4 w-4" />}>
                <Input
                  id="auth-email"
                  type="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="h-12 rounded-2xl pl-10 transition-shadow duration-200 focus-visible:shadow-[0_0_0_4px_hsl(var(--primary)/0.12)]"
                />
              </FieldRow>

              <FieldRow label="Password" htmlFor="auth-password" error={errors.password} icon={<Lock className="h-4 w-4" />}>
                <Input
                  id="auth-password"
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  className="h-12 rounded-2xl pl-10 pr-11 transition-shadow duration-200 focus-visible:shadow-[0_0_0_4px_hsl(var(--primary)/0.12)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  aria-label={showPwd ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </FieldRow>

              {mode === "signup" && (
                <FieldRow label="Confirm Password" htmlFor="auth-confirm" error={errors.confirm} icon={<Lock className="h-4 w-4" />}>
                  <Input
                    id="auth-confirm"
                    type={showPwd ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    className="h-12 rounded-2xl pl-10 transition-shadow duration-200 focus-visible:shadow-[0_0_0_4px_hsl(var(--primary)/0.12)]"
                  />
                </FieldRow>
              )}

              {mode === "signin" && (
                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
                    />
                    Remember me
                  </label>
                  <Link
                    to="/forgot-password"
                    onClick={() => onOpenChange(false)}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}

              <Button
                type="submit"
                disabled={busy !== null}
                className="h-12 w-full rounded-2xl text-base font-semibold shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0"
              >
                {busy === "email" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "signin" ? "Sign In" : "Create Account"}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setErrors({}); }}
                className="font-semibold text-primary hover:underline"
              >
                {mode === "signin" ? "Create Account" : "Sign In"}
              </button>
            </p>

            <ul className="mt-5 flex flex-wrap justify-center gap-1.5 border-t pt-4">
              {BADGES.map((b) => (
                <li
                  key={b}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/8 px-2.5 py-1 text-[11px] font-medium text-primary"
                >
                  <ShieldCheck className="h-3 w-3" /> {b}
                </li>
              ))}
            </ul>
            </div>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function FieldRow({
  label, htmlFor, error, icon, children,
}: { label: string; htmlFor: string; error?: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <Label htmlFor={htmlFor} className="text-xs font-semibold text-muted-foreground">{label}</Label>
      <div className="relative mt-1.5">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
        {children}
      </div>
      {error && <p role="alert" className="mt-1 animate-fade-in text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
