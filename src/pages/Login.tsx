import { useState, useEffect } from "react";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Milk, LogIn, UserPlus, Phone } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const emailSchema = z.string().trim().email("Enter a valid email").max(255);
const passwordSchema = z.string().min(6, "Password must be at least 6 characters").max(128);
const nameSchema = z.string().trim().min(2, "Name is too short").max(100);
const phoneSchema = z.string().trim().regex(/^\+?[1-9]\d{7,14}$/, "Enter a valid phone (E.164, e.g. +919876543210)");
const otpSchema = z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code");

export default function Login() {
  const navigate = useNavigate();
  const { user } = useAuth();

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

  // Phone OTP
  const [otpPhone, setOtpPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
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
    if (error) toast.error(error.message);
    else {
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
    if (signupPhone) {
      const phone = phoneSchema.safeParse(signupPhone);
      if (!phone.success) return toast.error(phone.error.issues[0].message);
    }

    setSignupLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.data,
      password: pwd.data,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: name.data, phone: signupPhone },
      },
    });
    setSignupLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Account created! Check your email to verify.");
  };

  const handleGoogleLogin = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/dashboard",
    });
    if (result.error) toast.error("Google login failed");
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const phone = phoneSchema.safeParse(otpPhone);
    if (!phone.success) return toast.error(phone.error.issues[0].message);
    setOtpLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: phone.data });
    setOtpLoading(false);
    if (error) toast.error(error.message);
    else {
      setOtpSent(true);
      toast.success("OTP sent to your phone");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const phone = phoneSchema.safeParse(otpPhone);
    const code = otpSchema.safeParse(otpCode);
    if (!phone.success) return toast.error(phone.error.issues[0].message);
    if (!code.success) return toast.error(code.error.issues[0].message);
    setOtpLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: phone.data,
      token: code.data,
      type: "sms",
    });
    setOtpLoading(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Phone verified!");
      navigate("/dashboard");
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Milk className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="font-display text-2xl">Welcome to DairyPro</CardTitle>
          <p className="text-sm text-muted-foreground">Sign in securely to your account</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="login" className="gap-1.5">
                <LogIn className="h-3.5 w-3.5" /> Login
              </TabsTrigger>
              <TabsTrigger value="signup" className="gap-1.5">
                <UserPlus className="h-3.5 w-3.5" /> Sign Up
              </TabsTrigger>
              <TabsTrigger value="phone" className="gap-1.5">
                <Phone className="h-3.5 w-3.5" /> Phone
              </TabsTrigger>
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
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
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
                  <Label>Phone (optional)</Label>
                  <Input type="tel" placeholder="+919876543210" value={signupPhone} onChange={(e) => setSignupPhone(e.target.value)} maxLength={16} className="mt-1.5" />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input type="password" autoComplete="new-password" placeholder="Min 6 characters" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required maxLength={128} className="mt-1.5" />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={signupLoading}>
                  <UserPlus className="h-4 w-4" />
                  {signupLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="phone">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="mt-4 space-y-4">
                  <div>
                    <Label>Phone Number</Label>
                    <Input type="tel" placeholder="+919876543210" value={otpPhone} onChange={(e) => setOtpPhone(e.target.value)} required maxLength={16} className="mt-1.5" />
                    <p className="mt-1 text-xs text-muted-foreground">Use E.164 format including country code.</p>
                  </div>
                  <Button type="submit" className="w-full gap-2" disabled={otpLoading}>
                    <Phone className="h-4 w-4" />
                    {otpLoading ? "Sending..." : "Send OTP"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="mt-4 space-y-4">
                  <div>
                    <Label>6-digit Code</Label>
                    <Input type="text" inputMode="numeric" pattern="\d{6}" placeholder="123456" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} required maxLength={6} className="mt-1.5" />
                    <p className="mt-1 text-xs text-muted-foreground">Sent to {otpPhone}</p>
                  </div>
                  <Button type="submit" className="w-full" disabled={otpLoading}>
                    {otpLoading ? "Verifying..." : "Verify & Login"}
                  </Button>
                  <Button type="button" variant="ghost" className="w-full" onClick={() => { setOtpSent(false); setOtpCode(""); }}>
                    Change number
                  </Button>
                </form>
              )}
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
