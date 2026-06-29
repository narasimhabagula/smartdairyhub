export type SearchCategory =
  | "Milk Rates"
  | "Veterinary Doctors"
  | "Cattle Market"
  | "Marketplace"
  | "Government Schemes"
  | "Customer Support"
  | "Dashboard"
  | "Profile"
  | "Orders"
  | "Settings";

export type SearchEntry = {
  label: string;
  description: string;
  to: string;
  category: SearchCategory;
  keywords: string[];
};

export const SEARCH_ENTRIES: SearchEntry[] = [
  // Milk Rates
  { label: "Today's Milk Rates", description: "Live cow & buffalo milk prices by industry", to: "/milk-rates", category: "Milk Rates",
    keywords: ["milk", "rate", "price", "today", "fat", "snf", "industry", "పాలు", "దర", "दूध", "रेट", "कीमत"] },
  { label: "Milk Price Calculator", description: "Compute milk price from FAT & SNF", to: "/milk-calculator", category: "Milk Rates",
    keywords: ["calculator", "calc", "fat", "snf", "milk price calculator"] },

  // Veterinary Doctors
  { label: "Veterinary Doctors Near Me", description: "Find vets with ratings, fees & maps", to: "/vet-contacts", category: "Veterinary Doctors",
    keywords: ["vet", "veterinary", "doctor", "near me", "hospital", "clinic", "డాక్టర్", "पशु", "डॉक्टर"] },
  { label: "Book a Vet Appointment", description: "Schedule an in-person or video consult", to: "/book-vet", category: "Veterinary Doctors",
    keywords: ["book vet", "appointment", "consult", "vet appointment"] },
  { label: "My Appointments", description: "View & manage your vet appointments", to: "/my-appointments", category: "Veterinary Doctors",
    keywords: ["appointments", "my appointments"] },

  // Cattle Market
  { label: "Cattle Market", description: "Buy & sell cows, buffaloes, hens, cocks", to: "/cattle-market", category: "Cattle Market",
    keywords: ["cattle", "cow", "buffalo", "buy", "sell", "jersey", "hen", "cock", "ఆవు", "గేదె", "गाय", "भैंस"] },
  { label: "Sell Your Cattle", description: "Post a new listing with photos & video", to: "/cattle-market/new", category: "Cattle Market",
    keywords: ["sell cow", "sell buffalo", "list cattle", "post cattle", "new listing"] },
  { label: "My Listings", description: "Edit, mark sold or delete your listings", to: "/my-listings", category: "Cattle Market",
    keywords: ["my listings", "listings", "sold"] },

  // Marketplace
  { label: "Marketplace - Cattle Feed", description: "Browse premium cattle feed products", to: "/marketplace", category: "Marketplace",
    keywords: ["marketplace", "feed", "cattle feed", "shop", "products"] },
  { label: "Cart", description: "Review items in your cart", to: "/cart", category: "Marketplace",
    keywords: ["cart", "checkout", "basket"] },
  { label: "Seller Dashboard", description: "Manage inventory, orders & enquiries", to: "/seller", category: "Marketplace",
    keywords: ["seller", "inventory", "sell products"] },

  // Government Schemes
  { label: "Government Schemes", description: "PM Kisan, NABARD subsidies, loans & more", to: "/schemes", category: "Government Schemes",
    keywords: ["scheme", "subsidy", "loan", "government", "pm kisan", "nabard", "సబ్సిడీ", "योजना", "सब्सिडी"] },

  // Customer Support
  { label: "Customer Support", description: "Raise a ticket or chat with our team", to: "/support", category: "Customer Support",
    keywords: ["support", "customer care", "help", "contact", "ticket"] },
  { label: "Help Center / FAQ", description: "Answers to common questions", to: "/help", category: "Customer Support",
    keywords: ["help", "faq", "questions"] },
  { label: "Contact Us", description: "Reach out by email or phone", to: "/contact", category: "Customer Support",
    keywords: ["contact", "email", "phone"] },
  { label: "Feedback", description: "Rate us & share suggestions", to: "/feedback", category: "Customer Support",
    keywords: ["feedback", "review", "rate us"] },

  // Dashboard
  { label: "Farmer Dashboard", description: "Your overview & quick actions", to: "/dashboard", category: "Dashboard",
    keywords: ["dashboard", "home", "overview"] },
  { label: "Notifications", description: "Recent alerts & messages", to: "/notifications", category: "Dashboard",
    keywords: ["notifications", "alerts"] },

  // Profile
  { label: "My Profile", description: "View your account information", to: "/dashboard", category: "Profile",
    keywords: ["profile", "my account", "account"] },

  // Orders
  { label: "My Orders", description: "Track purchases & order history", to: "/orders", category: "Orders",
    keywords: ["orders", "my orders", "purchases", "track"] },

  // Settings
  { label: "Settings", description: "Language & preferences", to: "/dashboard", category: "Settings",
    keywords: ["settings", "preferences", "language", "theme"] },
];

export function scoreEntry(entry: SearchEntry, q: string): number {
  const text = (entry.label + " " + entry.description + " " + entry.category + " " + entry.keywords.join(" ")).toLowerCase();
  const query = q.toLowerCase().trim();
  if (!query) return 0;
  if (text.includes(query)) return 100;
  const tokens = query.split(/\s+/).filter(Boolean);
  let s = 0;
  for (const t of tokens) if (text.includes(t)) s += 10;
  return s;
}

export function searchAll(q: string): SearchEntry[] {
  const query = q.trim();
  if (!query) return [];
  return SEARCH_ENTRIES
    .map((e) => ({ e, s: scoreEntry(e, query) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((r) => r.e);
}
