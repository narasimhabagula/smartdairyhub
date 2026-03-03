import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Milk, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Demo: navigate to dashboard
    navigate("/dashboard");
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Milk className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="font-display text-2xl">Farmer Login</CardTitle>
          <p className="text-sm text-muted-foreground">Enter your details to access your dashboard</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label>Phone Number</Label>
              <Input type="tel" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5" />
            </div>
            <Button type="submit" className="w-full gap-2">
              <LogIn className="h-4 w-4" />
              Login
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Demo: Click login to access dashboard
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
