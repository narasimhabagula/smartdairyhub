import { useState, useEffect } from "react";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogIn, UserPlus } from "lucide-react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { normalizeIndianPhone } from "@/lib/phone";
import { readChosenRole } from "@/lib/roles";
import { Sprout, Handshake, Factory, Stethoscope } from "lucide-react";

const ROLE_META: Record<string, { label: string; Icon: any }> = {
  farmer: { label: "Farmer", Icon: Sprout },
  mediator: { label: "Mediator / Trader", Icon: Handshake },
  industry: { label: "Dairy Industry", Icon: Factory },
  vet: { label: "Veterinary Doctor", Icon: Stethoscope },
};


const emailSchema = z.string().trim().email("Enter a valid email").max(255);
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128)
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), "Use letters and at least one number");
const nameSchema = z.string().trim().min(2, "Name is too short").max(100);

function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "Email or password is incorrect. If you just signed up, create the account first.";
  if (m.includes("email not confirmed")) return "Please verify your email before logging in.";
  if (m.includes("user already registered")) return "An account with this email already exists. Try logging in.";
  if (m.includes("pwned") || m.includes("compromised") || m.includes("breach"))
    return "This password has appeared in a known data breach. Please choose a different one.";
  if (m.includes("weak password") || m.includes("password should")) return "Password is too weak. Use 8+ chars with letters and numbers.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Please wait a minute and try again.";
  return message;
}

function safePostLoginDest(): string {
  try {
    const dest = sessionStorage.getItem("postLoginRedirect");
    sessionStorage.removeItem("postLoginRedirect");
    if (dest && dest.startsWith("/") && !dest.startsWith("//")) return dest;
  } catch {}
  return "/dashboard";
}

export default function Login() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // Role chosen on the previous screen (or via query string)
  const role = (searchParams.get("role") || readChosenRole() || "farmer") as keyof typeof ROLE_META;
  useEffect(() => {
    if (ROLE_META[role]) localStorage.setItem("sdh_chosen_role", role);
  }, [role]);
  const RoleIcon = ROLE_META[role]?.Icon ?? Sprout;



  // Email login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupAcceptTerms, setSignupAcceptTerms] = useState(false);

  useEffect(() => {
    if (user) navigate(safePostLoginDest(), { replace: true });
  }, [user, navigate]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailParsed = emailSchema.safeParse(loginEmail);
    const pwdParsed = passwordSchema.safeParse(loginPassword);
    if (!emailParsed.success) return toast.error(emailParsed.error.issues[0].message);
    if (!pwdParsed.success) return toast.error(pwdParsed.error.issues[0].message);

    setLoginLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: emailParsed.data,
      password: pwdParsed.data,
    });
    setLoginLoading(false);
    if (error) {
      console.error("[login] sign-in failed", error);
      toast.error(friendlyAuthError(error.message));
    } else {
      toast.success("Welcome back!");
      navigate("/dashboard");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = nameSchema.safeParse(signupName);
    const email = emailSchema.safeParse(signupEmail);
    const pwd = passwordSchema.safeParse(signupPassword);
    if (!name.success) return toast.error(name.error.issues[0].message);
    if (!email.success) return toast.error(email.error.issues[0].message);
    if (!pwd.success) return toast.error(pwd.error.issues[0].message);
    if (!signupAcceptTerms) return toast.error("Please accept the Terms & Conditions to continue");

    let canonicalPhone = "";
    if (signupPhone.trim()) {
      const normalized = normalizeIndianPhone(signupPhone);
      if (!normalized) return toast.error("Enter a valid 10-digit Indian mobile number");
      canonicalPhone = normalized;
    }

    setSignupLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.data,
      password: pwd.data,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: name.data, phone: canonicalPhone, role },
      },
    });

    setSignupLoading(false);
    if (error) {
      console.error("[signup] failed", error);
      toast.error(friendlyAuthError(error.message));
    } else {
      toast.success("Account created! You can log in now.");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // Persist intended destination; navigate after session is hydrated
      sessionStorage.setItem("postLoginRedirect", "/dashboard");
      const result = await lovable.auth.signInWithOAuth("google", {
        // Must be a public same-origin URL, NOT a protected route
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        console.error("[google] sign-in failed", result.error);
        toast.error(friendlyAuthError((result.error as any).message || "Google login failed"));
        return;
      }
      if (result.redirected) return; // browser will redirect
      // Popup flow: session is set, go to dashboard
      navigate(safePostLoginDest());
    } catch (e: any) {
      console.error("[google] unexpected", e);
      toast.error("Google login failed. Please try again.");
    }
  };


  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src="/logo.png" alt="Smart Dairy Hub logo" className="mx-auto mb-2 h-16 w-16 rounded-lg object-contain" />
          <CardTitle className="font-display text-2xl">Welcome to Smart Dairy Hub</CardTitle>
          <p className="text-sm text-muted-foreground">Sign in securely to your account</p>
          <div className="mt-3 inline-flex items-center justify-center gap-2 rounded-full border bg-muted/50 px-3 py-1.5 text-xs">
            <RoleIcon className="h-3.5 w-3.5 text-primary" />
            Continuing as <span className="font-semibold">{ROLE_META[role]?.label ?? "Farmer"}</span>
            <Link to="/select-role" className="ml-1 text-primary hover:underline">change</Link>
          </div>
        </CardHeader>
        <CardContent>

          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" className="gap-1.5"><LogIn className="h-3.5 w-3.5" /> Login</TabsTrigger>
              <TabsTrigger value="signup" className="gap-1.5"><UserPlus className="h-3.5 w-3.5" /> Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="mt-4 space-y-4">
                <div>
                  <Label>Email</Label>
                  <Input type="email" autoComplete="email" placeholder="you@example.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required maxLength={255} className="mt-1.5" />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input type="password" autoComplete="current-password" placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required maxLength={128} className="mt-1.5" />
                </div>
                <div className="text-right">
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline">Forgot password?</Link>
                </div>
                <Button type="submit" className="w-full gap-2" disabled={loginLoading}>
                  <LogIn className="h-4 w-4" />
                  {loginLoading ? "Logging in..." : "Login"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="mt-4 space-y-4">
                <div>
                  <Label>Full Name</Label>
                  <Input placeholder="Rajesh Kumar" value={signupName} onChange={(e) => setSignupName(e.target.value)} required maxLength={100} className="mt-1.5" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" autoComplete="email" placeholder="you@example.com" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} required maxLength={255} className="mt-1.5" />
                </div>
                <div>
                  <Label>Mobile (optional, India)</Label>
                  <Input type="tel" inputMode="numeric" placeholder="9876543210" value={signupPhone} onChange={(e) => setSignupPhone(e.target.value)} maxLength={16} className="mt-1.5" />
                  <p className="mt-1 text-xs text-muted-foreground">10-digit number, we'll add +91 automatically.</p>
                </div>
                <div>
                  <Label>Password</Label>
                  <Input type="password" autoComplete="new-password" placeholder="8+ chars, letters & number" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required maxLength={128} className="mt-1.5" />
                  <p className="mt-1 text-xs text-muted-foreground">Min 8 characters, must include letters and a number. Breached passwords are blocked.</p>
                </div>
                <label className="flex items-start gap-2 text-xs text-muted-foreground">
                  <input type="checkbox" checked={signupAcceptTerms} onChange={(e) => setSignupAcceptTerms(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-input" />
                  <span>I agree to the <Link to="/terms" target="_blank" className="text-primary hover:underline">Terms &amp; Conditions</Link> and <Link to="/privacy" target="_blank" className="text-primary hover:underline">Privacy Policy</Link>.</span>
                </label>
                <Button type="submit" className="w-full gap-2" disabled={signupLoading || !signupAcceptTerms}>
                  <UserPlus className="h-4 w-4" />
                  {signupLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>


          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or continue with</span></div>
          </div>

          <Button variant="outline" className="w-full gap-2" onClick={handleGoogleLogin}>
            <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
