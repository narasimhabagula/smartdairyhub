// Shared home-screen content used by both the mobile app shell and the desktop layout.
import heroCows from "@/assets/hero-cows.jpg";
import bannerMilk from "@/assets/banner-milk.jpg";
import bannerAiScan from "@/assets/banner-ai-scan.jpg";
import bannerSchemes from "@/assets/banner-schemes.jpg";
import cardMilk from "@/assets/card-milk.jpg";
import cardCow from "@/assets/card-cow.jpg";
import cardVet from "@/assets/card-vet.jpg";
import cardMarket from "@/assets/card-market.jpg";
import cardFeed from "@/assets/card-feed.jpg";

// Premium 3D icons
import ic_cattle from "@/assets/icons3d/cattle.jpg";
import ic_feed from "@/assets/icons3d/feed.jpg";
import ic_schemes from "@/assets/icons3d/schemes.jpg";
import ic_jerry from "@/assets/icons3d/jerry.jpg";
import ic_milkPrices from "@/assets/icons3d/milk-prices.jpg";
import ic_diseaseScan from "@/assets/icons3d/disease-scan.jpg";
import ic_vet from "@/assets/icons3d/vet.jpg";
import ic_milkCollection from "@/assets/icons3d/milk-collection.jpg";
import ic_milkTransport from "@/assets/icons3d/milk-transport.jpg";
import ic_medicalStores from "@/assets/icons3d/medical-stores.jpg";
import ic_customerCare from "@/assets/icons3d/customer-care.jpg";
import ic_buffalo from "@/assets/icons3d/buffalo.jpg";
import ic_cow from "@/assets/icons3d/cow.jpg";
import ic_analytics from "@/assets/icons3d/analytics.jpg";
import ic_alerts from "@/assets/icons3d/alerts.jpg";
import ic_profile from "@/assets/icons3d/profile.jpg";
import ic_language from "@/assets/icons3d/language.jpg";
import ic_settings from "@/assets/icons3d/settings.jpg";

export const IMG = {
  banner1: heroCows,
  banner2: bannerMilk,
  banner3: bannerAiScan,
  milk: cardMilk,
  cow: cardCow,
  vet: cardVet,
  market: cardMarket,
  feed: cardFeed,
  schemes: bannerSchemes,
};

export const QUICK_ACTIONS = [
  { to: "/milk-rates", label: "Live Milk Prices", img: ic_milkPrices },
  { to: "/disease-detection", label: "AI Disease Scan", img: ic_diseaseScan },
  { to: "/vet-contacts", label: "Veterinary", img: ic_vet },
  { to: "/cattle-market", label: "Buy & Sell Cattle", img: ic_cattle },
  { to: "/marketplace?category=feed", label: "Feed & Supplies", img: ic_feed },
  { to: "/schemes", label: "Govt Schemes", img: ic_schemes },
  { to: "/ai-chat", label: "Jerry AI", img: ic_jerry },
  { to: "/cattle-market?type=cow", label: "Cow Marketplace", img: ic_cow },
  { to: "/cattle-market?type=buffalo", label: "Buffalo Marketplace", img: ic_buffalo },
  { to: "/dashboard", label: "Dairy Analytics", img: ic_analytics },
  { to: "/notifications", label: "Smart Alerts", img: ic_alerts },
  { to: "/marketplace?category=medicine", label: "Medical Store", img: ic_medicalStores },
  { to: "/dashboard", label: "Milk Collection", img: ic_milkCollection },
  { to: "/dashboard", label: "Milk Transport", img: ic_milkTransport },
  { to: "/support", label: "Customer Care", img: ic_customerCare },
  { to: "/welcome/language", label: "Language", img: ic_language },
  { to: "/profile", label: "Farmer Profile", img: ic_profile },
  { to: "/settings", label: "Settings", img: ic_settings },
];

export const BANNERS = [
  {
    to: "/milk-rates",
    title: "Today's Milk Rates",
    subtitle: "FAT & SNF prices from top dairies",
    cta: "See rates",
    img: IMG.banner2,
    accent: "bg-emerald-600",
  },
  {
    to: "/disease-detection",
    title: "Snap. Scan. Save your cow.",
    subtitle: "AI diagnosis in seconds — free",
    cta: "Scan now",
    img: IMG.banner1,
    accent: "bg-blue-600",
  },
  {
    to: "/schemes",
    title: "Govt Subsidies for Farmers",
    subtitle: "PM Kisan · NABARD · Insurance",
    cta: "Check eligibility",
    img: IMG.banner3,
    accent: "bg-amber-600",
  },
];

export const FEATURE_CARDS = [
  { to: "/milk-rates", title: "Milk Rates", desc: "Live prices from collection centres", img: IMG.milk },
  { to: "/disease-detection", title: "Disease Detection", desc: "Instant AI diagnosis for your cattle", img: IMG.cow, badge: "AI" },
  { to: "/vet-contacts", title: "Veterinary", desc: "Verified doctors near you", img: IMG.vet },
  { to: "/cattle-market", title: "Cattle Marketplace", desc: "Buy & sell cows and buffaloes", img: IMG.market },
  { to: "/marketplace?category=feed", title: "Feed Store", desc: "Feed, minerals & fodder", img: IMG.feed },
  { to: "/schemes", title: "Government Schemes", desc: "Loans, subsidies & insurance", img: IMG.schemes },
];

export const DESKTOP_NAV = [
  { to: "/milk-rates", label: "Rates" },
  { to: "/vet-contacts", label: "Vets" },
  { to: "/schemes", label: "Schemes" },
  { to: "/marketplace", label: "Market" },
  { to: "/cattle-market", label: "Cattle" },
  { to: "/disease-detection", label: "AI Scan" },
];

