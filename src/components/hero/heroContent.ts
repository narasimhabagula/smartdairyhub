import {
  BadgeCheck, BarChart3, Bolt, Clock, HeartPulse, IndianRupee, Leaf,
  MapPin, Lock, ScanLine, ShieldCheck, Sparkles, Stethoscope, TrendingUp,
  Users, FileText, Timer, ClipboardList, Plus,
} from "lucide-react";
import artMilk from "@/assets/heroart-milk.jpg.asset.json";
import artVet from "@/assets/heroart-vet.jpg.asset.json";
import artSchemes from "@/assets/heroart-schemes.jpg.asset.json";
import artMarket from "@/assets/heroart-market.jpg.asset.json";
import artAiscan from "@/assets/heroart-aiscan.jpg.asset.json";

export type HeroCard = { icon: any; title: string; sub: string };
export type HeroCta = { label: string; to: string; variant?: "primary" | "outline" };
export type HeroContent = {
  key: string;
  to: string;
  eyebrow: string;
  title: string;
  titleAccent: string;
  subtitle: string;
  cards: HeroCard[];
  ctas: HeroCta[];
  side: { title: string; items: string[] };
  img: string;
  alt: string;
};

export const HERO_MILK: HeroContent = {
  key: "milk",
  to: "/milk-rates",
  eyebrow: "Live procurement rates",
  title: "Today's",
  titleAccent: "Milk Rates",
  subtitle: "Live procurement rates from verified dairy companies. Updated in real time.",
  cards: [
    { icon: BarChart3, title: "Real-time", sub: "Updates" },
    { icon: ShieldCheck, title: "Verified", sub: "Companies" },
    { icon: MapPin, title: "Local", sub: "Rates" },
    { icon: IndianRupee, title: "Better Price", sub: "Transparency" },
  ],
  ctas: [{ label: "See today's rates", to: "/milk-rates" }, { label: "Milk calculator", to: "/milk-calculator", variant: "outline" }],
  side: {
    title: "Why Smart Rates?",
    items: ["Compare & get best procurement price", "Save more, earn more", "Direct from local dairy companies"],
  },
  img: artMilk.url,
  alt: "Holstein cow beside steel milk cans on a dairy farm at sunrise",
};

export const HERO_VET: HeroContent = {
  key: "vet",
  to: "/vet-contacts",
  eyebrow: "Verified veterinary network",
  title: "Veterinary Support",
  titleAccent: "You Can Trust",
  subtitle: "Find experienced vets, hospitals & animal clinics near you in Andhra Pradesh.",
  cards: [
    { icon: ShieldCheck, title: "Expert Care", sub: "Certified vets" },
    { icon: Clock, title: "Quick Access", sub: "Nearby support" },
    { icon: HeartPulse, title: "Healthy Animals", sub: "Happy Farms" },
    { icon: Stethoscope, title: "Home Visits", sub: "On request" },
  ],
  ctas: [{ label: "Find a vet near you", to: "/vet-contacts" }, { label: "Suggest a Vet", to: "/feedback", variant: "outline" }],
  side: { title: "Compassionate Care.", items: ["Stronger Farms."] },
  img: artVet.url,
  alt: "Veterinary doctor examining a cow and a buffalo on a green farm",
};

export const HERO_SCHEMES: HeroContent = {
  key: "schemes",
  to: "/schemes",
  eyebrow: "Government subsidies for farmers",
  title: "Government",
  titleAccent: "Schemes",
  subtitle: "Support for dairy farmers, stronger farms, brighter future.",
  cards: [
    { icon: IndianRupee, title: "Financial Assistance", sub: "Loans & Subsidies" },
    { icon: Users, title: "Welfare & Benefits", sub: "Farmer Welfare" },
    { icon: TrendingUp, title: "Growth & Development", sub: "Infrastructure & Training" },
    { icon: FileText, title: "Simple & Transparent", sub: "Easy to Apply" },
  ],
  ctas: [{ label: "Check eligibility", to: "/schemes" }, { label: "Talk to Jerry AI", to: "/ai-chat", variant: "outline" }],
  side: {
    title: "Our Goal",
    items: ["Empowering farmers through government support & schemes"],
  },
  img: artSchemes.url,
  alt: "Indian dairy farmer with smartphone beside cows, buffalo and milk cans",
};

export const HERO_MARKET: HeroContent = {
  key: "market",
  to: "/cattle-market",
  eyebrow: "AI-powered marketplace",
  title: "India's Smartest",
  titleAccent: "Livestock Marketplace",
  subtitle: "Buy and sell verified cows, buffaloes and poultry with confidence. Real data. Real trust.",
  cards: [
    { icon: BadgeCheck, title: "Verified Animals", sub: "AI Health Scores" },
    { icon: Lock, title: "Safe & Secure", sub: "Trusted Buyers" },
    { icon: IndianRupee, title: "Best Prices", sub: "Real Market Value" },
    { icon: Bolt, title: "Easy & Fast", sub: "Quick Transactions" },
  ],
  ctas: [
    { label: "Sell Animals", to: "/cattle/new" },
    { label: "My Listings", to: "/my-listings", variant: "outline" },
  ],
  side: {
    title: "Sell Animals · My Listings",
    items: ["List your animals and find genuine buyers", "Manage your listed animals & track views"],
  },
  img: artMarket.url,
  alt: "Healthy cow and buffalo standing in a green pasture at a livestock market",
};

export const HERO_AISCAN: HeroContent = {
  key: "aiscan",
  to: "/disease-detection",
  eyebrow: "AI powered health scan",
  title: "AI Disease Detection",
  titleAccent: "for Dairy Animals",
  subtitle: "Upload a photo of your cow or buffalo and get AI-based insights about possible diseases, treatment suggestions, and preventive care.",
  cards: [
    { icon: ScanLine, title: "AI-Powered", sub: "Accurate Detection" },
    { icon: Timer, title: "Instant Results", sub: "Quick Analysis" },
    { icon: Stethoscope, title: "Vet Recommended", sub: "Trusted Insights" },
    { icon: ClipboardList, title: "Treatment Plan", sub: "Step by step" },
  ],
  ctas: [{ label: "Scan my animal", to: "/disease-detection" }, { label: "Find a vet", to: "/vet-contacts", variant: "outline" }],
  side: {
    title: "Trusted by veterinarians",
    items: ["10,000+ animals scanned", "95% accuracy rate", "24/7 AI health assistant"],
  },
  img: artAiscan.url,
  alt: "Cow being scanned by a smartphone running AI disease detection",
};

/** Homepage carousel order: Milk Rates → Veterinary → Schemes → Marketplace */
export const HOME_HEROES: HeroContent[] = [HERO_MILK, HERO_VET, HERO_SCHEMES, HERO_MARKET];

export const HERO_ICON_FALLBACK = Sparkles;
export const HERO_LEAF = Leaf;
export const HERO_PLUS = Plus;
