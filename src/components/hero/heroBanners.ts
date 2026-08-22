import { IMG } from "@/components/home/homeData";
import schemesAsset from "@/assets/hero-schemes.jpg.asset.json";

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

/** Homepage hero banners: 1) Milk Rates  2) Government Schemes */
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
];
