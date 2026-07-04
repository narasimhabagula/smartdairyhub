export type DemoScheme = {
  id: string;
  title: string;
  category: string;
  ministry: string;
  benefit: string;
  eligibility: string[];
  documents: string[];
  applyUrl: string;
  image: string;
  deadline?: string;
};

const images = [
  "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80",
  "https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?w=800&q=80",
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80",
];

export const demoSchemes: DemoScheme[] = [
  {
    id: "pm-kisan", title: "PM Kisan Samman Nidhi",
    category: "Central", ministry: "Ministry of Agriculture",
    benefit: "₹6,000/year direct cash transfer to farmer bank account",
    eligibility: ["Landholding farmer family", "Aadhaar linked bank account"],
    documents: ["Aadhaar", "Bank passbook", "Land records"],
    applyUrl: "https://pmkisan.gov.in", image: images[0],
  },
  {
    id: "nabard-ddm", title: "NABARD Dairy Development",
    category: "Loan", ministry: "NABARD",
    benefit: "Up to ₹7 lakh subsidy for setting up dairy unit (25-33%)",
    eligibility: ["Individual farmer or SHG", "Project report needed"],
    documents: ["Aadhaar", "PAN", "Land documents", "Project report"],
    applyUrl: "https://nabard.org", image: images[1],
  },
  {
    id: "ahidf", title: "Animal Husbandry Infra Development Fund",
    category: "Central", ministry: "Ministry of AH & Dairying",
    benefit: "3% interest subvention + ₹15,000 Cr fund for dairy processing",
    eligibility: ["FPOs, Individual entrepreneurs", "MSME registered"],
    documents: ["Udyam", "Bank statements", "DPR"],
    applyUrl: "https://dahd.nic.in", image: images[2],
  },
  {
    id: "kcc", title: "Kisan Credit Card",
    category: "Loan", ministry: "Ministry of Finance",
    benefit: "Loan up to ₹3 lakh @ 4% for dairy/animal husbandry",
    eligibility: ["Farmer with land or animals", "Age 18-75"],
    documents: ["Aadhaar", "Land/animal ownership proof"],
    applyUrl: "https://pmkisan.gov.in/kcc.aspx", image: images[0],
  },
  {
    id: "insurance", title: "Livestock Insurance Scheme",
    category: "Insurance", ministry: "Ministry of AH & Dairying",
    benefit: "50% premium subsidy for insuring milch animals",
    eligibility: ["Owner of milch cattle/buffalo", "Aadhaar mandatory"],
    documents: ["Aadhaar", "Animal health certificate"],
    applyUrl: "https://dahd.nic.in", image: images[1],
  },
  {
    id: "women-dairy", title: "Mahila Kisan Sashaktikaran",
    category: "Women", ministry: "Ministry of Rural Development",
    benefit: "₹50,000 grant + training for women-led dairy SHGs",
    eligibility: ["Women-led SHG", "Registered under NRLM"],
    documents: ["SHG registration", "Aadhaar of members"],
    applyUrl: "https://nrlm.gov.in", image: images[2],
  },
  {
    id: "youth", title: "Dairy Entrepreneurship (Youth)",
    category: "Youth", ministry: "NABARD",
    benefit: "25% back-ended capital subsidy for youth (up to 35 yrs)",
    eligibility: ["Age 18-35", "Trained in dairy management"],
    documents: ["Age proof", "Training certificate", "Bank details"],
    applyUrl: "https://nabard.org", image: images[0],
  },
  {
    id: "ap-dairy", title: "AP Amul Project",
    category: "State", ministry: "Govt of Andhra Pradesh",
    benefit: "₹4/L bonus + free vet care for enrolled farmers",
    eligibility: ["Resident of AP", "Registered with Amul collection centre"],
    documents: ["Aadhaar", "Ration card"],
    applyUrl: "https://ap.gov.in", image: images[1],
  },
  {
    id: "ts-dairy", title: "Telangana Dairy Support",
    category: "State", ministry: "Govt of Telangana",
    benefit: "50% subsidy on milking machines + free vaccination",
    eligibility: ["Telangana farmer", "Own at least 2 milch animals"],
    documents: ["Aadhaar", "Land records"],
    applyUrl: "https://telangana.gov.in", image: images[2],
  },
  {
    id: "rgm", title: "Rashtriya Gokul Mission",
    category: "Central", ministry: "Ministry of AH & Dairying",
    benefit: "Free AI services, breed improvement, ₹5,000 incentive",
    eligibility: ["All dairy farmers", "Indigenous breeds preferred"],
    documents: ["Aadhaar", "Animal ownership proof"],
    applyUrl: "https://dahd.nic.in/rgm", image: images[0],
  },
];
