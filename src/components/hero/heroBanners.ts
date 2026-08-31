import { IMG } from "@/components/home/homeData";
import schemesAsset from "@/assets/hero-schemes.jpg.asset.json";
import vetAsset from "@/assets/hero-vet.jpg.asset.json";
import marketAsset from "@/assets/hero-market.jpg.asset.json";

export type HeroBanner = {
  key: string;
  to: string;
  title: string;
  subtitle: string;
  cta: string;
  img: string;
  alt: string;
  /** Button accent class (semantic tokens only). */
  accent: string;
};

/** Homepage hero banners: Milk Rates → Schemes → Veterinary → Marketplace */
export const HERO_BANNERS: HeroBanner[] = [
  {
    key: "milk-rates",
    to: "/milk-rates",
    title: "Today's Milk Rates",
    subtitle: "FAT & SNF prices from top dairies",
    cta: "See rates",
    img: IMG.banner2,
    alt: "Fresh milk pouring into steel dairy cans",
    accent: "bg-primary text-primary-foreground",
  },
  {
    key: "schemes",
    to: "/schemes",
    title: "Government Schemes",
    subtitle: "Support for Dairy Farmers, Stronger Farms, Brighter Future",
    cta: "Explore Schemes",
    img: schemesAsset.url,
    alt: "Indian dairy farmer with cattle reviewing government scheme benefits",
    accent: "bg-primary text-primary-foreground",
  },
  {
    key: "vet",
    to: "/vet-contacts",
    title: "Veterinary Support",
    subtitle: "AI-powered cattle health help and verified vets near you",
    cta: "Find a vet",
    img: vetAsset.url,
    alt: "Veterinary doctor examining a healthy cow on a dairy farm",
    accent: "bg-primary text-primary-foreground",
  },
  {
    key: "market",
    to: "/cattle-market",
    title: "Livestock Marketplace",
    subtitle: "Buy & sell verified cows and buffaloes with health details",
    cta: "Explore livestock",
    img: marketAsset.url,
    alt: "Cows and buffaloes at a verified livestock marketplace",
    accent: "bg-primary text-primary-foreground",
  },
];
