import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Star, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function Feedback() {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function submit() {
    if (rating === 0) { toast.error("Please rate your experience"); return; }
    if (message.trim().length < 5) { toast.error("Tell us a little more"); return; }
    if (!user) { toast.error("Please sign in to submit feedback"); return; }
    setSending(true);
    const { error } = await supabase.from("support_tickets").insert({
      user_id: user.id,
      name: (user.user_metadata as any)?.full_name ?? "User",
      email: user.email ?? "",
      category: "General Enquiry",
      subject: `Feedback (${rating}★)`,
      message: message.trim(),
    });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Thanks for the feedback!");
    setMessage(""); setRating(0);
  }

  return (
    <div className="container max-w-2xl py-10">
      <h1 className="text-center font-display text-3xl font-bold md:text-4xl">Share your feedback</h1>
      <p className="mt-2 text-center text-muted-foreground">Your input helps us improve Smart Dairy Hub for every farmer.</p>
      <Card className="mt-8">
        <CardHeader><CardTitle>How was your experience?</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center gap-2">
            {[1,2,3,4,5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} star`}>
                <Star className={`h-9 w-9 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
              </button>
            ))}
          </div>
          <div>
            <Label>Your feedback</Label>
            <Textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="What's working well? What can we improve?" />
          </div>
          <Button onClick={submit} disabled={sending} className="w-full"><Send className="mr-2 h-4 w-4" />{sending ? "Sending…" : "Submit feedback"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
