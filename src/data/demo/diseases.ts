export type DiseaseSample = {
  id: string;
  animal: string;
  breed: string;
  disease: string;
  confidence: number;
  severity: "Mild" | "Moderate" | "Severe";
  recoveryChance: number;
  symptoms: string[];
  medicines: { name: string; dosage: string; duration: string }[];
  isolation: string;
  nutrition: string[];
  vaccination: string;
  nextCheckup: string;
  affectedArea: { x: number; y: number; w: number; h: number }; // % of image
};

export const demoDiseaseResults: DiseaseSample[] = [
  {
    id: "mastitis",
    animal: "Cow",
    breed: "HF Cross",
    disease: "Mastitis",
    confidence: 98.7,
    severity: "Moderate",
    recoveryChance: 92,
    symptoms: [
      "Udder swelling and redness",
      "Clotted or watery milk",
      "Reduced milk yield (~35%)",
      "Mild fever (39.5°C)",
    ],
    medicines: [
      { name: "Cephalonium (intramammary)", dosage: "1 tube/quarter", duration: "3 days" },
      { name: "Meloxicam 20mg", dosage: "1 injection", duration: "Once" },
    ],
    isolation: "Isolate for 5 days; discard milk from affected quarter for 96 hours.",
    nutrition: ["Green fodder 25kg/day", "Mineral mixture 100g", "Vitamin E supplement"],
    vaccination: "Booster J-Vac recommended after recovery",
    nextCheckup: "7 days",
    affectedArea: { x: 45, y: 62, w: 22, h: 18 },
  },
  {
    id: "fmd",
    animal: "Cow",
    breed: "Gir",
    disease: "Foot & Mouth Disease (Early)",
    confidence: 94.2,
    severity: "Severe",
    recoveryChance: 78,
    symptoms: ["Blisters on tongue", "Lameness", "Excessive salivation", "High fever"],
    medicines: [
      { name: "Oxytetracycline LA", dosage: "10ml IM", duration: "3 days" },
      { name: "Borax + Glycerine mouth wash", dosage: "Twice daily", duration: "7 days" },
    ],
    isolation: "Strict quarantine 21 days; notify veterinary authority.",
    nutrition: ["Soft mash feed", "Warm water", "Jaggery + salt electrolyte"],
    vaccination: "FMD vaccine to herd (unaffected animals)",
    nextCheckup: "3 days",
    affectedArea: { x: 30, y: 55, w: 30, h: 25 },
  },
];
