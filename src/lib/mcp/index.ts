import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchMilkRates from "./tools/search-milk-rates";
import calculateMilkPrice from "./tools/calculate-milk-price";
import findVets from "./tools/find-vets";
import listSchemes from "./tools/list-schemes";
import searchCattleListings from "./tools/search-cattle-listings";
import searchFaqs from "./tools/search-faqs";

// The OAuth issuer must be the direct Supabase host, built from the project ref
// (inlined by Vite at build time so this stays import-safe).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "smart-dairy-hub",
  title: "Smart Dairy Hub",
  version: "0.1.0",
  instructions:
    "Tools for Smart Dairy Hub — India's dairy farming platform. Use these tools to look up milk procurement rates, calculate milk pricing from FAT/SNF, find veterinary doctors, browse government dairy schemes and subsidies, search the cattle marketplace, and answer common dairy farming questions from the platform FAQ. All tools are read-only and run as the signed-in Smart Dairy Hub user.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    searchMilkRates,
    calculateMilkPrice,
    findVets,
    listSchemes,
    searchCattleListings,
    searchFaqs,
  ],
});
