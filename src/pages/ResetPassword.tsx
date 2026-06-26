import { useState, useEffect } from "react";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128)
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), "Use letters and at least one number");

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Mark as recovery flow so AuthContext does not auto-redirect.
    try { sessionStorage.setItem("inPasswordRecovery", "1"); } catch {}

    // The recovery link uses a hash like #access_token=...&type=recovery.
    // Supabase parses it and emits PASSWORD_RECOVERY; only then is updateUser allowed.
    const hashOk = window.location.hash.includes("type=recovery");
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });

    // Fallback: if a session already exists and the hash signals recovery, allow.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session && hashOk) setReady(true);
      if (!data.session && !hashOk) {
        toast.error("Invalid or expired reset link");
        navigate("/forgot-password", { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (password !== confirm) return toast.error("Passwords don't match");

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data });
    setLoading(false);
    if (error) {
      const m = error.message.toLowerCase();
      if (m.includes("pwned") || m.includes("compromised"))
        toast.error("This password has appeared in a known data breach. Please choose a different one.");
      else if (m.includes("same as the old"))
        toast.error("New password must be different from the current one.");
      else toast.error(error.message);
      return;
    }
    try { sessionStorage.removeItem("inPasswordRecovery"); } catch {}
    toast.success("Password updated. Please log in with the new password.");
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-display text-2xl">Set New Password</CardTitle>
          <p className="text-sm text-muted-foreground">Enter your new password below</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <Label>New Password</Label>
              <Input type="password" autoComplete="new-password" placeholder="8+ chars, letters & number" value={password} onChange={(e) => setPassword(e.target.value)} required maxLength={128} className="mt-1.5" />
            </div>
            <div>
              <Label>Confirm Password</Label>
              <Input type="password" autoComplete="new-password" placeholder="Re-enter password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required maxLength={128} className="mt-1.5" />
            </div>
            <Button type="submit" className="w-full gap-2" disabled={loading || !ready}>
              <KeyRound className="h-4 w-4" />
              {loading ? "Updating..." : ready ? "Update Password" : "Verifying link..."}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
