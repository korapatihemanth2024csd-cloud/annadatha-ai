import paddy from "@/assets/paddy.jpg";
import tomato from "@/assets/tomato.jpg";
import banana from "@/assets/banana.jpg";
import cotton from "@/assets/cotton.jpg";
import sugarcane from "@/assets/sugarcane.jpg";

export const CROPS = [
  { name: "Paddy", variety: "ADT 45", stage: "Flowering", planted: "2026-06-12", health: "Healthy", disease: "None", severity: 4, yield: 6.2, img: paddy },
  { name: "Tomato", variety: "PKM 1", stage: "Fruiting", planted: "2026-07-02", health: "Needs Attention", disease: "Early Blight", severity: 32, yield: 8.2, img: tomato },
  { name: "Banana", variety: "Grand Naine", stage: "Bunch formation", planted: "2026-01-20", health: "Healthy", disease: "None", severity: 6, yield: 28, img: banana },
  { name: "Cotton", variety: "MCU 5", stage: "Boll development", planted: "2026-05-28", health: "Needs Attention", disease: "Leaf Curl", severity: 21, yield: 3.1, img: cotton },
  { name: "Sugarcane", variety: "Co 86032", stage: "Grand growth", planted: "2025-12-10", health: "Healthy", disease: "None", severity: 3, yield: 45, img: sugarcane },
] as const;

export const CROP_IMG: Record<string, string> = { paddy, tomato, banana, cotton, sugarcane };

export type MarketRow = {
  crop: string; variety: string; state: string; district: string; market: string;
  min: number; max: number; modal: number; change: number;
  arrivalDate?: string;
};

export const MARKET: MarketRow[] = [
  { crop: "Paddy", variety: "Common", state: "Tamil Nadu", district: "Thanjavur", market: "Thanjavur", min: 2150, max: 2420, modal: 2300, change: 1.8 },
  { crop: "Paddy", variety: "Sona Masuri", state: "Andhra Pradesh", district: "Guntur", market: "Tenali", min: 2280, max: 2650, modal: 2480, change: 0.6 },
  { crop: "Tomato", variety: "Hybrid", state: "Karnataka", district: "Kolar", market: "Kolar", min: 900, max: 1800, modal: 1350, change: -6.2 },
  { crop: "Tomato", variety: "Local", state: "Andhra Pradesh", district: "Chittoor", market: "Madanapalle", min: 1100, max: 2100, modal: 1600, change: 4.1 },
  { crop: "Tomato", variety: "Hybrid", state: "Tamil Nadu", district: "Coimbatore", market: "Coimbatore", min: 1200, max: 2000, modal: 1500, change: 2.3 },
  { crop: "Banana", variety: "Robusta", state: "Tamil Nadu", district: "Tiruchirappalli", market: "Trichy", min: 1400, max: 2200, modal: 1800, change: -1.1 },
  { crop: "Banana", variety: "Nendran", state: "Kerala", district: "Thrissur", market: "Thrissur", min: 3200, max: 4100, modal: 3700, change: 3.4 },
  { crop: "Cotton", variety: "Medium Staple", state: "Telangana", district: "Adilabad", market: "Adilabad", min: 6800, max: 7450, modal: 7120, change: 0.9 },
  { crop: "Cotton", variety: "Long Staple", state: "Maharashtra", district: "Yavatmal", market: "Yavatmal", min: 7000, max: 7600, modal: 7300, change: -0.4 },
  { crop: "Sugarcane", variety: "Co 86032", state: "Uttar Pradesh", district: "Muzaffarnagar", market: "Muzaffarnagar", min: 350, max: 380, modal: 370, change: 0 },
  { crop: "Wheat", variety: "Lokwan", state: "Madhya Pradesh", district: "Indore", market: "Indore", min: 2400, max: 2780, modal: 2600, change: 1.2 },
  { crop: "Onion", variety: "Red", state: "Maharashtra", district: "Nashik", market: "Lasalgaon", min: 1600, max: 2500, modal: 2100, change: -3.5 },
  { crop: "Maize", variety: "Yellow", state: "Karnataka", district: "Davangere", market: "Davangere", min: 2000, max: 2250, modal: 2150, change: 0.7 },
  { crop: "Chilli", variety: "Teja", state: "Andhra Pradesh", district: "Guntur", market: "Guntur", min: 14500, max: 19000, modal: 17200, change: 2.9 },
];

export const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
