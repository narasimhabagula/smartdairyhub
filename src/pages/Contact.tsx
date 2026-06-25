import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  subject: z.string().trim().min(3).max(120),
  message: z.string().trim().min(10).max(2000),
});

export default function Contact() {
  const { user } = useAuth();
  const [f, setF] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  async function send() {
    const r = schema.safeParse(f);
    if (!r.success) {
      const e: Record<string, string> = {};
      r.error.issues.forEach((i) => (e[i.path[0] as string] = i.message));
      setErrors(e);
      return;
    }
    setErrors({});
    if (!user) {
      window.location.href = `mailto:contact@smartdairyhub.in?subject=${encodeURIComponent(f.subject)}&body=${encodeURIComponent(f.message + "\n\n" + f.name + " · " + f.email + " · " + f.phone)}`;
      return;
    }
    setSending(true);
    const { error } = await supabase.from("support_tickets").insert({
      user_id: user.id,
      name: f.name.trim(),
      email: f.email.trim(),
      phone: f.phone.trim() || null,
      category: "General Enquiry",
      subject: f.subject.trim(),
      message: f.message.trim(),
    });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Message sent — we'll get back to you soon.");
    setF({ name: f.name, email: f.email, phone: f.phone, subject: "", message: "" });
  }

  return (
    <div className="container max-w-5xl py-8">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold md:text-4xl">Contact Us</h1>
        <p className="mt-2 text-muted-foreground">We'd love to hear from you.</p>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <Card><CardContent className="p-5"><Mail className="h-5 w-5 text-primary" /><p className="mt-2 font-semibold">Company Email</p><a href="mailto:contact@smartdairyhub.in" className="text-sm text-muted-foreground hover:text-primary">contact@smartdairyhub.in</a></CardContent></Card>
        <Card><CardContent className="p-5"><Phone className="h-5 w-5 text-primary" /><p className="mt-2 font-semibold">Customer Care</p><a href="tel:18001801551" className="text-sm text-muted-foreground hover:text-primary">1800-180-1551</a></CardContent></Card>
        <Card><CardContent className="p-5"><Clock className="h-5 w-5 text-primary" /><p className="mt-2 font-semibold">Business Hours</p><p className="text-sm text-muted-foreground">Mon – Sat, 9:00 AM – 7:00 PM</p></CardContent></Card>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Send us a message</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label>Name</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />{errors.name && <p className="text-xs text-destructive">{errors.name}</p>}</div>
            <div className="grid gap-3 md:grid-cols-2">
              <div><Label>Email</Label><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />{errors.email && <p className="text-xs text-destructive">{errors.email}</p>}</div>
              <div><Label>Phone</Label><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
            </div>
            <div><Label>Subject</Label><Input value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} />{errors.subject && <p className="text-xs text-destructive">{errors.subject}</p>}</div>
            <div><Label>Message</Label><Textarea rows={5} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} />{errors.message && <p className="text-xs text-destructive">{errors.message}</p>}</div>
            <Button onClick={send} disabled={sending} className="w-full"><Send className="mr-2 h-4 w-4" />{sending ? "Sending…" : "Send message"}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle><MapPin className="mr-2 inline h-5 w-5 text-primary" />Office Address</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Smart Dairy Hub<br />Plot 42, HITEC City<br />Hyderabad, Telangana 500081<br />India</p>
            <div className="mt-4 overflow-hidden rounded-lg border">
              <iframe
                title="Smart Dairy Hub office location"
                src="https://www.google.com/maps?q=HITEC+City+Hyderabad&output=embed"
                width="100%"
                height="260"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
