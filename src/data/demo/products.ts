export type DemoProduct = {
  id: string;
  name: string;
  category: string;
  image: string;
  price: number;
  mrp: number;
  rating: number;
  reviews: number;
  seller: string;
  location: string;
  state: string;
  deliveryDays: number;
  stock: number;
  unit: string;
  description: string;
};

// Dairy-focused catalog matching the user's requested product mix
const CATALOG: Array<{
  name: string; category: string; image: string; base: number; unit: string; desc: string;
}> = [
  { name: "Farm-Fresh Cow Milk", category: "milk", image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&q=80", base: 60, unit: "litre", desc: "Chilled, unadulterated A2 cow milk from morning collection. FAT 4.2 · SNF 8.6." },
  { name: "Buffalo Milk (Rich)", category: "milk", image: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800&q=80", base: 80, unit: "litre", desc: "Creamy buffalo milk, ideal for sweets & curd. FAT 6.5 · SNF 9.2." },
  { name: "Desi Cow A2 Ghee", category: "ghee", image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&q=80", base: 1450, unit: "kg", desc: "Bilona-method A2 ghee from Gir cows. Aromatic, grainy texture." },
  { name: "Buffalo Milk Ghee", category: "ghee", image: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=800&q=80", base: 1200, unit: "kg", desc: "Pure buffalo ghee, slow-simmered. Great for cooking & sweets." },
  { name: "Malai Paneer (Fresh)", category: "paneer", image: "https://images.unsplash.com/photo-1631452180775-df4c1a34da79?w=800&q=80", base: 380, unit: "kg", desc: "Soft, non-crumbling paneer. Made twice daily. Delivered chilled." },
  { name: "Low-Fat Paneer", category: "paneer", image: "https://images.unsplash.com/photo-1631452181723-0a41c0aef437?w=800&q=80", base: 340, unit: "kg", desc: "Skimmed cow milk paneer. Firm, protein-rich, 20% less fat." },
  { name: "Thick Set Dahi (Curd)", category: "curd", image: "https://images.unsplash.com/photo-1571212515416-fca325bbf29a?w=800&q=80", base: 90, unit: "kg", desc: "Traditional earthen-set curd. Mild tang, spoon-thick." },
  { name: "Probiotic Yogurt", category: "curd", image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80", base: 140, unit: "kg", desc: "Live-culture yogurt with L. acidophilus. Gut-friendly, low sugar." },
  { name: "White Butter (Makhan)", category: "butter", image: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=800&q=80", base: 480, unit: "kg", desc: "Hand-churned white butter from malai. Unsalted, no preservatives." },
  { name: "Salted Table Butter", category: "butter", image: "https://images.unsplash.com/photo-1608650020862-a72d1c00f5eb?w=800&q=80", base: 520, unit: "kg", desc: "Golden salted butter, dairy-fresh. Perfect for breads & bakes." },
  { name: "Premium Cattle Feed 50kg", category: "feed", image: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800&q=80", base: 1350, unit: "bag", desc: "Balanced pellet feed with 22% protein. Boosts milk yield." },
  { name: "Green Silage Bales", category: "feed", image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80", base: 950, unit: "bale", desc: "Fermented maize silage. Rich in energy for high-yield cows." },
  { name: "Dry Hay (Jowar)", category: "feed", image: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800&q=80", base: 480, unit: "bundle", desc: "Sun-cured jowar hay bundles. Fiber-rich roughage." },
  { name: "Mineral Mixture 5kg", category: "minerals", image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&q=80", base: 780, unit: "pack", desc: "Chelated calcium, phosphorus & trace minerals. Improves fertility." },
  { name: "Calcium Supplement Liquid", category: "supplements", image: "https://images.unsplash.com/photo-1550572017-edd951b55104?w=800&q=80", base: 620, unit: "bottle", desc: "1 litre calcium tonic. Prevents milk fever post-calving." },
  { name: "Buffalo Milk Peda", category: "sweets", image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80", base: 560, unit: "kg", desc: "Traditional peda from thickened buffalo milk. Cardamom flavour." },
  { name: "Milking Machine (Single)", category: "equipment", image: "https://images.unsplash.com/photo-1595877244574-e90ce41ce089?w=800&q=80", base: 24500, unit: "unit", desc: "Portable single-cluster milking machine. 1-cow capacity, 240V." },
  { name: "Stainless Steel Milk Can 40L", category: "equipment", image: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=800&q=80", base: 3200, unit: "unit", desc: "Food-grade SS304 milk can. FSSAI compliant, leak-proof lid." },
];

const sellers = [
  "Anand Dairy Co-op", "Sunrise Farms", "Green Valley Dairy", "Heritage Milk Producers",
  "BharatDairy Direct", "GirGold Farms", "FreshMoo Dairy", "Krishna Milk Union",
];
const locations = [
  { city: "Anand", state: "Gujarat" },
  { city: "Hyderabad", state: "Telangana" },
  { city: "Pune", state: "Maharashtra" },
  { city: "Bengaluru", state: "Karnataka" },
  { city: "Chennai", state: "Tamil Nadu" },
  { city: "Vijayawada", state: "Andhra Pradesh" },
  { city: "Ludhiana", state: "Punjab" },
  { city: "Karnal", state: "Haryana" },
];

export const demoProducts: DemoProduct[] = Array.from({ length: 48 }, (_, i) => {
  const base = CATALOG[i % CATALOG.length];
  const loc = locations[i % locations.length];
  const mrp = Math.round(base.base * (1 + ((i % 4) * 0.08)));
  const price = Math.round(mrp * (0.82 + (i % 5) * 0.03));
  return {
    id: `demo-prod-${i}`,
    name: base.name,
    category: base.category,
    image: base.image,
    price,
    mrp,
    rating: +(4.1 + (i % 9) * 0.09).toFixed(1),
    reviews: 42 + (i * 23) % 1200,
    seller: sellers[i % sellers.length],
    location: loc.city,
    state: loc.state,
    deliveryDays: 1 + (i % 4),
    stock: 8 + (i * 5) % 120,
    unit: base.unit,
    description: base.desc,
  };
});
