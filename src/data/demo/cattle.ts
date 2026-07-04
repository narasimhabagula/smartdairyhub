export type DemoCattle = {
  id: string;
  breed: string;
  animal: "Cow" | "Buffalo";
  age: number; // years
  milkPerDay: number;
  pregnant: boolean;
  vaccinated: boolean;
  healthStatus: "Excellent" | "Good" | "Fair";
  price: number;
  negotiable: boolean;
  distanceKm: number;
  verifiedSeller: boolean;
  location: string;
  image: string;
  seller: string;
  phone: string;
};

const breeds = ["Gir", "Sahiwal", "HF Cross", "Jersey", "Murrah Buffalo", "Red Sindhi", "Ongole", "Kankrej"];
const images = [
  "https://images.unsplash.com/photo-1546445317-29f4545e9d53?w=800&q=80",
  "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800&q=80",
  "https://images.unsplash.com/photo-1584935385294-b3a11ba2ac68?w=800&q=80",
  "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=800&q=80",
  "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=800&q=80",
];
const cities = ["Anand, GJ", "Hyderabad, TS", "Pune, MH", "Bengaluru, KA", "Vijayawada, AP", "Coimbatore, TN"];

export const demoCattle: DemoCattle[] = Array.from({ length: 54 }, (_, i) => {
  const breed = breeds[i % breeds.length];
  const isBuff = breed.includes("Buffalo");
  return {
    id: `cattle-${i}`,
    breed,
    animal: isBuff ? "Buffalo" : "Cow",
    age: 2 + (i % 6),
    milkPerDay: isBuff ? 8 + (i % 8) : 12 + (i % 10),
    pregnant: i % 3 === 0,
    vaccinated: i % 4 !== 0,
    healthStatus: (["Excellent", "Good", "Fair"] as const)[i % 3],
    price: 35000 + (i * 2500) % 90000,
    negotiable: i % 2 === 0,
    distanceKm: 2 + (i * 7) % 80,
    verifiedSeller: i % 3 !== 0,
    location: cities[i % cities.length],
    image: images[i % images.length],
    seller: ["Ramesh Patel", "Suresh Reddy", "Kumar Singh", "Ravi Sharma", "Anil Kumar"][i % 5],
    phone: `+91 9${(800000000 + i * 12345).toString().slice(0, 9)}`,
  };
});
