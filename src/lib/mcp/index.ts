import { defineMcp } from "@lovable.dev/mcp-js";
import searchMilkRates from "./tools/search-milk-rates";
import calculateMilkPrice from "./tools/calculate-milk-price";
import findVets from "./tools/find-vets";
import listSchemes from "./tools/list-schemes";
import searchCattleListings from "./tools/search-cattle-listings";
import searchFaqs from "./tools/search-faqs";

export default defineMcp({
  name: "smart-dairy-hub-mcp",
  title: "Smart Dairy Hub",
  version: "0.1.0",
  instructions:
    "Tools for Smart Dairy Hub — India's dairy farming platform. Use these tools to look up milk procurement rates, calculate milk pricing from FAT/SNF, find veterinary doctors, browse government dairy schemes and subsidies, search the cattle marketplace, and answer common dairy farming questions from the platform FAQ. All tools are read-only and return public data.",
  tools: [
    searchMilkRates,
    calculateMilkPrice,
    findVets,
    listSchemes,
    searchCattleListings,
    searchFaqs,
  ],
});
