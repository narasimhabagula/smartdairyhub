import { useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, Mic, MicOff, LifeBuoy, MessageCircle, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const FAQS: { q: string; a: string; tags: string[] }[] = [
  { q: "How do I create an account?", a: "Tap Login, choose your role (Farmer or Industry), then sign up with email & password or Google. Phone OTP is also supported.", tags: ["account", "signup", "register"] },
  { q: "How do I buy cattle?", a: "Open Cattle Market, filter by animal type, breed and location, open a listing and use Call or WhatsApp to contact the seller.", tags: ["cattle", "buy"] },
  { q: "How do I sell cattle?", a: "Go to Cattle Market → Sell. Pick the animal (Cow, Buffalo, Hen, Cock), fill the dynamic form with photos and price, and publish.", tags: ["cattle", "sell", "listing"] },
  { q: "How do I buy cattle feed?", a: "Open the Marketplace, browse Cattle Feed, view details and contact the seller or place an order.", tags: ["feed", "marketplace", "buy"] },
  { q: "How do I sell cattle feed?", a: "Open Seller Dashboard → Add Product, add up to 3 photos, pricing and seller details. Listings go live after admin approval.", tags: ["feed", "sell", "seller"] },
  { q: "How do I update milk rates? (Industry only)", a: "After your Industry account is verified by admin, open Industry Panel → Milk Rates to publish morning/evening rates for cow and buffalo milk.", tags: ["milk", "rates", "industry"] },
  { q: "How do I contact a veterinarian?", a: "Open Vet Contacts, allow location, choose an animal type and search nearby. Use Call, WhatsApp or Directions on any doctor card.", tags: ["vet", "doctor"] },
  { q: "How do I reset my password?", a: "On the Login screen, tap Forgot password and follow the email link to set a new password.", tags: ["password", "reset"] },
  { q: "How do I verify my account?", a: "Industry accounts: submit GST and business details from Industry Panel — admin reviews and approves. Email accounts are verified via the confirmation email.", tags: ["verify", "industry"] },
  { q: "How do I report a fake listing?", a: "Open the listing, scroll to the bottom and use Report — or raise a ticket from Customer Support → Report Fake Listings.", tags: ["report", "fraud", "fake"] },
];

export default function HelpCenter() {
  const [query, setQuery] = useState("");
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FAQS;
    return FAQS.filter(
      (f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q) || f.tags.some((t) => t.includes(q))
    );
  }, [query]);

  function toggleVoice() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error("Voice search isn't supported in this browser");
      return;
    }
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new SR();
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => setQuery(e.results[0][0].transcript);
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
    recRef.current = rec;
    setListening(true);
  }

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <LifeBuoy className="h-6 w-6" />
        </div>
        <h1 className="font-display text-3xl font-bold md:text-4xl">Help Center</h1>
        <p className="mt-2 text-muted-foreground">Find quick answers to common questions about Smart Dairy Hub.</p>

        <div className="mt-6 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search help articles…"
              className="pl-10 pr-12 h-12"
            />
            <Button
              type="button"
              size="icon"
              variant={listening ? "default" : "ghost"}
              className="absolute right-1 top-1/2 -translate-y-1/2"
              onClick={toggleVoice}
              aria-label="Voice search"
            >
              {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      <Card id="faqs" className="mx-auto mt-8 max-w-3xl">
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No articles matched your search.</p>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {filtered.map((f, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      <div className="mx-auto mt-8 grid max-w-3xl gap-4 md:grid-cols-3">
        <Link to="/support"><Card className="h-full transition hover:border-primary"><CardContent className="flex items-center gap-3 p-4"><MessageCircle className="h-5 w-5 text-primary" /><div><p className="font-semibold">Live Support</p><p className="text-xs text-muted-foreground">Chat with our team</p></div></CardContent></Card></Link>
        <a href="mailto:support@smartdairyhub.in"><Card className="h-full transition hover:border-primary"><CardContent className="flex items-center gap-3 p-4"><Mail className="h-5 w-5 text-primary" /><div><p className="font-semibold">Email us</p><p className="text-xs text-muted-foreground">support@smartdairyhub.in</p></div></CardContent></Card></a>
        <a href="tel:18001801551"><Card className="h-full transition hover:border-primary"><CardContent className="flex items-center gap-3 p-4"><Phone className="h-5 w-5 text-primary" /><div><p className="font-semibold">Call Helpline</p><p className="text-xs text-muted-foreground">1800-180-1551</p></div></CardContent></Card></a>
      </div>
    </div>
  );
}
