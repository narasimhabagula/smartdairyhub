import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (!hash.includes("type=recovery")) {
      toast.error("Invalid or expired reset link");
      navigate("/login");
    }
  }, [navigate]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords don't match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully!");
      navigate("/dashboard");
    }
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
              <Input type="password" placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1.5" />
            </div>
            <div>
              <Label>Confirm Password</Label>
              <Input type="password" placeholder="Re-enter password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required className="mt-1.5" />
            </div>
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              <KeyRound className="h-4 w-4" />
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
