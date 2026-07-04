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
  deliveryDays: number;
  stock: number;
  description: string;
};

const categories = [
  "Cattle Feed", "Minerals", "Medicines", "Milking Machines",
  "Milking Buckets", "Grass Cutters", "Water Troughs", "Feed Mixers",
  "Vaccines", "Supplements", "AI Devices", "GPS Tags",
];

const catImages: Record<string, string> = {
  "Cattle Feed": "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=600&q=80",
  "Minerals": "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&q=80",
  "Medicines": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80",
  "Milking Machines": "https://images.unsplash.com/photo-1595877244574-e90ce41ce089?w=600&q=80",
  "Milking Buckets": "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80",
  "Grass Cutters": "https://images.unsplash.com/photo-1592982537447-5f0aad3c003a?w=600&q=80",
  "Water Troughs": "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=600&q=80",
  "Feed Mixers": "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&q=80",
  "Vaccines": "https://images.unsplash.com/photo-1584362917165-526a968579e8?w=600&q=80",
  "Supplements": "https://images.unsplash.com/photo-1550572017-edd951b55104?w=600&q=80",
  "AI Devices": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80",
  "GPS Tags": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&q=80",
};

const sellers = ["AgroMart", "DairyPro Store", "FarmKing", "BharatDairy", "GreenAgro"];
const cities = ["Anand", "Hyderabad", "Pune", "Bengaluru", "Chennai", "Vijayawada"];

export const demoProducts: DemoProduct[] = Array.from({ length: 108 }, (_, i) => {
  const cat = categories[i % categories.length];
  const mrp = 500 + (i % 20) * 250;
  const price = Math.round(mrp * (0.7 + (i % 5) * 0.05));
  return {
    id: `prod-${i}`,
    name: `${cat} Premium ${["Grade A", "Pro", "Ultra", "Max", "Plus"][i % 5]}`,
    category: cat,
    image: catImages[cat],
    price, mrp,
    rating: +(3.8 + (i % 10) * 0.12).toFixed(1),
    reviews: 40 + (i * 17) % 900,
    seller: sellers[i % sellers.length],
    location: cities[i % cities.length],
    deliveryDays: 1 + (i % 5),
    stock: 5 + (i * 3) % 90,
    description: `High-quality ${cat.toLowerCase()} designed for Indian dairy farms. Trusted by 10,000+ farmers nationwide.`,
  };
});
