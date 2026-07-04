export type DemoVet = {
  id: string;
  name: string;
  clinic: string;
  photo: string;
  rating: number;
  reviews: number;
  distanceKm: number;
  openNow: boolean;
  experienceYears: number;
  qualification: string;
  availableToday: boolean;
  emergency: boolean;
  phone: string;
  city: string;
  specialization: string;
  fee: number;
};

const photos = [
  "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=80",
  "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80",
  "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=80",
  "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&q=80",
  "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&q=80",
];
const specs = ["Large Animals", "Dairy Cattle", "Bovine Reproduction", "Surgery", "Nutrition"];
const cities = ["Anand", "Hyderabad", "Pune", "Bengaluru", "Vijayawada", "Coimbatore", "Chennai"];

export const demoVets: DemoVet[] = Array.from({ length: 54 }, (_, i) => ({
  id: `vet-${i}`,
  name: `Dr. ${["Rajesh", "Priya", "Anand", "Suresh", "Kavya", "Mahesh", "Deepa"][i % 7]} ${["Sharma", "Reddy", "Patel", "Kumar", "Iyer"][i % 5]}`,
  clinic: `${["GreenPaws", "AgriCare", "DairyVet", "BovineHealth", "FarmMed"][i % 5]} Clinic`,
  photo: photos[i % photos.length],
  rating: +(4 + (i % 10) * 0.09).toFixed(1),
  reviews: 30 + (i * 13) % 400,
  distanceKm: 1 + (i * 3) % 25,
  openNow: i % 3 !== 0,
  experienceYears: 3 + (i % 25),
  qualification: ["BVSc", "MVSc", "BVSc & AH", "MVSc Surgery"][i % 4],
  availableToday: i % 2 === 0,
  emergency: i % 4 === 0,
  phone: `+91 9${(700000000 + i * 54321).toString().slice(0, 9)}`,
  city: cities[i % cities.length],
  specialization: specs[i % specs.length],
  fee: 200 + (i % 8) * 50,
}));
