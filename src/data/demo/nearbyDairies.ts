// DEMO data for the "Milk Rates Near You" investor demo.
// Shape mirrors the future backend response so the UI needs no redesign later.

export type NearbyRateSource = "demo" | "sample" | "verified";

export type NearbyDairyRate = {
  id: string;
  dairyName: string;
  location: string;
  /** Approximate centre coordinates of the dairy (never the farmer's). */
  latitude: number;
  longitude: number;
  /** Distance in KM from the farmer's approximate area. */
  distance: number;
  cowRate: number;
  cowChange: number;
  buffaloRate: number;
  buffaloChange: number;
  fat: number;
  snf: number;
  session: "morning" | "evening";
  updatedAt: string; // ISO
  verificationStatus: "demo" | "sample";
  source: NearbyRateSource;
};

const minsAgo = (m: number) => new Date(Date.now() - m * 60000).toISOString();

export const DEMO_AREAS = [
  { id: "rajahmundry", label: "Rajahmundry, Andhra Pradesh" },
  { id: "kakinada", label: "Kakinada, Andhra Pradesh" },
  { id: "eluru", label: "Eluru, Andhra Pradesh" },
  { id: "vijayawada", label: "Vijayawada, Andhra Pradesh" },
  { id: "hyderabad", label: "Hyderabad, Telangana" },
];

export const RADIUS_OPTIONS = [5, 10, 25, 50];

export const demoNearbyDairies: NearbyDairyRate[] = [
  {
    id: "nd-heritage",
    dairyName: "Heritage Dairy",
    location: "East Godavari, AP",
    latitude: 16.98,
    longitude: 81.78,
    distance: 8.4,
    cowRate: 39.5,
    cowChange: 0.2,
    buffaloRate: 53.2,
    buffaloChange: 0.3,
    fat: 3.8,
    snf: 8.5,
    session: "morning",
    updatedAt: minsAgo(10),
    verificationStatus: "demo",
    source: "demo",
  },
  {
    id: "nd-vijaya",
    dairyName: "Vijaya Dairy",
    location: "West Godavari, AP",
    latitude: 16.71,
    longitude: 81.65,
    distance: 14.2,
    cowRate: 38.8,
    cowChange: 0.15,
    buffaloRate: 52.8,
    buffaloChange: 0.25,
    fat: 3.6,
    snf: 8.2,
    session: "morning",
    updatedAt: minsAgo(15),
    verificationStatus: "demo",
    source: "demo",
  },
  {
    id: "nd-local",
    dairyName: "Local Milk Collection Centre",
    location: "Rajahmundry Area",
    latitude: 17.0,
    longitude: 81.8,
    distance: 21.5,
    cowRate: 40.2,
    cowChange: 0.2,
    buffaloRate: 54.0,
    buffaloChange: 0.3,
    fat: 3.9,
    snf: 8.6,
    session: "evening",
    updatedAt: minsAgo(25),
    verificationStatus: "sample",
    source: "sample",
  },
  {
    id: "nd-amul",
    dairyName: "Amul Collection Centre",
    location: "Andhra Pradesh",
    latitude: 16.6,
    longitude: 81.4,
    distance: 32,
    cowRate: 40.0,
    cowChange: -0.1,
    buffaloRate: 54.5,
    buffaloChange: -0.2,
    fat: 3.7,
    snf: 8.3,
    session: "morning",
    updatedAt: minsAgo(35),
    verificationStatus: "demo",
    source: "demo",
  },
];

export function timeAgo(iso: string): string {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins} minutes ago`;
  const hrs = Math.round(mins / 60);
  return hrs < 24 ? `${hrs} hours ago` : "Yesterday";
}
