export type DemoMilkRate = {
  id: string;
  company: string;
  state: string;
  district: string;
  animal: "Cow" | "Buffalo";
  fat: number;
  snf: number;
  ratePerLiter: number;
  updatedAt: string;
  verified: boolean;
};

const companies = [
  "Heritage", "Amul", "Dodla", "Jersey", "Vijaya Dairy",
  "Mother Dairy", "Milky Mist", "Visakha Dairy", "Thirumala", "Nandini",
];
const states = ["Andhra Pradesh", "Telangana", "Karnataka", "Tamil Nadu", "Maharashtra", "Gujarat"];
const districts: Record<string, string[]> = {
  "Andhra Pradesh": ["Chittoor", "Krishna", "Guntur", "Kurnool"],
  "Telangana": ["Hyderabad", "Warangal", "Karimnagar", "Nizamabad"],
  "Karnataka": ["Bengaluru", "Mysuru", "Hassan", "Kolar"],
  "Tamil Nadu": ["Erode", "Salem", "Coimbatore", "Vellore"],
  "Maharashtra": ["Pune", "Kolhapur", "Nashik", "Ahmednagar"],
  "Gujarat": ["Anand", "Mehsana", "Banaskantha", "Kheda"],
};

function seed(i: number) {
  const state = states[i % states.length];
  const ds = districts[state];
  const animal: "Cow" | "Buffalo" = i % 3 === 0 ? "Buffalo" : "Cow";
  const fat = animal === "Buffalo" ? 6 + (i % 10) * 0.15 : 3.8 + (i % 10) * 0.1;
  const snf = animal === "Buffalo" ? 9 + (i % 6) * 0.1 : 8.3 + (i % 6) * 0.1;
  const rate = +(fat * 6 + snf * 4 + (animal === "Buffalo" ? 4 : 0)).toFixed(2);
  const daysAgo = i % 5;
  return {
    id: `rate-${i}`,
    company: companies[i % companies.length],
    state,
    district: ds[i % ds.length],
    animal,
    fat: +fat.toFixed(1),
    snf: +snf.toFixed(1),
    ratePerLiter: rate,
    updatedAt: new Date(Date.now() - daysAgo * 86400000).toISOString(),
    verified: i % 4 !== 0,
  } as DemoMilkRate;
}

export const demoMilkRates: DemoMilkRate[] = Array.from({ length: 110 }, (_, i) => seed(i));

export const demoMilkPriceTrend = Array.from({ length: 30 }, (_, i) => ({
  day: `D${i + 1}`,
  cow: +(42 + Math.sin(i / 3) * 2 + i * 0.1).toFixed(2),
  buffalo: +(58 + Math.cos(i / 4) * 3 + i * 0.15).toFixed(2),
}));
