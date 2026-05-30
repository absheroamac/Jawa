import { 
  MotorcycleProfile, 
  MaintenanceRecord, 
  MaintenanceSchedule, 
  FuelRecord, 
  ExpenseRecord, 
  ChromePart, 
  PartLifecycle, 
  BikeDocument,
  FuelAdditiveRecord
} from './types';

export const initialProfile: MotorcycleProfile = {
  bikeName: "Classic 300",
  manufacturer: "Jawa",
  model: "Classic",
  variant: "BS4 (Dual Channel ABS)",
  year: 2020,
  purchaseDate: "2020-03-15",
  purchasePrice: 185000,
  registrationNumber: "MH-12-JS-3000",
  vin: "MJE3K54A7LK003921",
  currentOdometer: 24320,
  color: "Classic Maroon",
  fuelType: "Petrol (E10/E20 Compatible)"
};

export const initialSchedules: MaintenanceSchedule[] = [
  {
    id: "sch-oil",
    name: "Engine Oil Change",
    category: "Engine",
    intervalKm: 5000,
    intervalDays: 180,
    lastPerformedOdo: 21500,
    lastPerformedDate: "2026-01-10"
  },
  {
    id: "sch-filter",
    name: "Oil Filter Change",
    category: "Engine",
    intervalKm: 8000,
    lastPerformedOdo: 16000,
    lastPerformedDate: "2025-05-12"
  },
  {
    id: "sch-clean",
    name: "Chain Cleaning",
    category: "Chain",
    intervalKm: 500,
    lastPerformedOdo: 24100,
    lastPerformedDate: "2026-05-18"
  },
  {
    id: "sch-lube",
    name: "Chain Lubrication",
    category: "Chain",
    intervalKm: 500,
    lastPerformedOdo: 24100,
    lastPerformedDate: "2026-05-18"
  },
  {
    id: "sch-adjust",
    name: "Chain Tension Adjustment",
    category: "Chain",
    intervalKm: 1000,
    lastPerformedOdo: 23600,
    lastPerformedDate: "2026-04-12"
  },
  {
    id: "sch-coolant",
    name: "Coolant Replacement",
    category: "Engine",
    intervalDays: 730,
    lastPerformedOdo: 16000,
    lastPerformedDate: "2025-05-12"
  },
  {
    id: "sch-battery",
    name: "Battery Inspection",
    category: "Electrical",
    intervalDays: 90,
    lastPerformedOdo: 23600,
    lastPerformedDate: "2026-04-12"
  },
  {
    id: "sch-wash",
    name: "Full Bike Wash",
    category: "General",
    intervalDays: 14,
    lastPerformedOdo: 24250,
    lastPerformedDate: "2026-05-25"
  },
  {
    id: "sch-polish",
    name: "Chrome Polish",
    category: "General",
    intervalDays: 30,
    lastPerformedOdo: 23600,
    lastPerformedDate: "2026-04-12" // Overdue! Current date is 2026-05-30
  },
  {
    id: "sch-rust",
    name: "Rust & Corrosion Inspection",
    category: "General",
    intervalDays: 45,
    lastPerformedOdo: 23600,
    lastPerformedDate: "2026-04-12" // Overdue! 48 days ago
  },
  {
    id: "sch-fuel-sys",
    name: "Fuel System Cleaner (Additive)",
    category: "Engine",
    intervalKm: 4000,
    lastPerformedOdo: 20500,
    lastPerformedDate: "2025-11-05"
  }
];

export const initialMaintenanceRecords: MaintenanceRecord[] = [
  {
    id: "rec-1",
    date: "2020-04-20",
    odometer: 1000,
    category: "Engine",
    type: "1st Free Service",
    description: "First service performed at official Jawa service center. Replaced engine oil and oil filter. Chain cleaned and adjusted.",
    workshopName: "Classic Jawa Service, Pune",
    cost: 1650,
    notes: "Complimentary service, charged only for oil and consumables."
  },
  {
    id: "rec-2",
    date: "2021-02-15",
    odometer: 5200,
    category: "Engine",
    type: "2nd Paid Service",
    description: "Engine oil change, chain cleaning, general checkup.",
    workshopName: "Classic Jawa Service, Pune",
    cost: 2400,
    notes: "Everything in good condition."
  },
  {
    id: "rec-3",
    date: "2022-03-10",
    odometer: 10500,
    category: "Engine",
    type: "3rd Paid Service",
    description: "Engine oil and filter change. Air filter replaced. Spark plug replaced. Front brake pad replaced.",
    workshopName: "Classic Jawa Service, Pune",
    cost: 4800
  },
  {
    id: "rec-4",
    date: "2023-05-12",
    odometer: 16000,
    category: "Engine",
    type: "Major Service & Coolant Flush",
    description: "Flushed coolant and refilled. Replaced engine oil, oil filter, and spark plug. Replaced brake fluid.",
    workshopName: "Speedy Moto Garage",
    cost: 6500,
    notes: "Coolant flushed for the first time."
  },
  {
    id: "rec-5",
    date: "2024-11-20",
    odometer: 20000,
    category: "Tires",
    type: "Tire Replacement",
    description: "Replaced stock MRF tires with premium Ceat Zoom Cruz tires (Front & Rear).",
    workshopName: "Wheelz Point, Pune",
    cost: 7200,
    notes: "Traction improved significantly."
  },
  {
    id: "rec-6",
    date: "2025-05-18",
    odometer: 21500,
    category: "Engine",
    type: "Engine Oil Change",
    description: "Changed engine oil with Motul 7100 10W50 Synthetic Oil.",
    workshopName: "Self Service",
    cost: 1400,
    notes: "DIY in personal garage."
  },
  {
    id: "rec-7",
    date: "2026-01-10",
    odometer: 23600,
    category: "General",
    type: "Battery & Chrome Polish",
    description: "Replaced battery with Exide Xplore. Polished all chrome pipes, exhausts, and badges. Conducted full rust inspection.",
    workshopName: "Speedy Moto Garage",
    cost: 3200
  }
];

export const initialFuelRecords: FuelRecord[] = [
  {
    id: "fuel-1",
    date: "2026-03-05",
    odometer: 23600,
    liters: 12.0,
    pricePerLiter: 104.5,
    totalAmount: 1254.0,
    location: "Indian Oil, Senapati Bapat Road"
  },
  {
    id: "fuel-2",
    date: "2026-03-22",
    odometer: 23960,
    liters: 11.2,
    pricePerLiter: 104.5,
    totalAmount: 1170.4,
    location: "BPCL, Shivaji Nagar"
  },
  {
    id: "fuel-3",
    date: "2026-04-10",
    odometer: 24290,
    liters: 10.5,
    pricePerLiter: 105.2,
    totalAmount: 1104.6,
    location: "HPCL, Kothrud"
  },
  {
    id: "fuel-4",
    date: "2026-04-28",
    odometer: 24610,
    liters: 10.8,
    pricePerLiter: 105.2,
    totalAmount: 1136.2,
    location: "Indian Oil, Senapati Bapat Road"
  },
  {
    id: "fuel-5",
    date: "2026-05-15",
    odometer: 24940,
    liters: 11.4,
    pricePerLiter: 106.0,
    totalAmount: 1208.4,
    location: "BPCL, Shivaji Nagar"
  }
];

export const initialExpenses: ExpenseRecord[] = [
  {
    id: "exp-1",
    date: "2020-03-15",
    amount: 185000,
    category: "Registration",
    notes: "Initial Motorcycle Purchase & Registration Cost"
  },
  {
    id: "exp-2",
    date: "2020-03-16",
    amount: 8500,
    category: "Accessories",
    notes: "Premium Leg Guard, Tank Cover, and Backrest"
  },
  {
    id: "exp-3",
    date: "2025-03-10",
    amount: 2200,
    category: "Insurance",
    notes: "Annual Comprehensive Insurance Renewal - United India"
  },
  {
    id: "exp-4",
    date: "2026-01-10",
    amount: 3200,
    category: "Repairs",
    notes: "Exide Battery replacement & full professional polishing"
  },
  {
    id: "exp-5",
    date: "2026-05-10",
    amount: 1500,
    category: "Accessories",
    notes: "Mobile Mount with vibration dampener"
  }
];

export const initialChromeParts: ChromePart[] = [
  {
    id: "chr-exhaust",
    name: "Dual Exhaust Silencers (Left & Right)",
    lastPolishedDate: "2026-04-12",
    lastInspectedDate: "2026-04-12"
  },
  {
    id: "chr-mirrors",
    name: "Chrome Round Rearview Mirrors",
    lastPolishedDate: "2026-04-12",
    lastInspectedDate: "2026-04-12"
  },
  {
    id: "chr-engine",
    name: "Engine Side Covers & Crankcase",
    lastPolishedDate: "2026-04-12",
    lastInspectedDate: "2026-04-12"
  },
  {
    id: "chr-tank",
    name: "Fuel Tank Chrome Grills & Badges",
    lastPolishedDate: "2026-05-02",
    lastInspectedDate: "2026-05-02"
  },
  {
    id: "chr-headlight",
    name: "Headlight Ring Rim",
    lastPolishedDate: "2026-04-12",
    lastInspectedDate: "2026-04-12"
  }
];

export const initialPartsLifecycle: PartLifecycle[] = [
  {
    id: "prt-chain",
    name: "Chain & Sprocket Kit",
    brand: "Rolon Brass Chain Kit",
    installedOdo: 16000,
    installedDate: "2023-05-12",
    expectedLifespanKm: 20000
  },
  {
    id: "prt-brake-f",
    name: "Front Brake Pads",
    brand: "Brembo Sintered Pads",
    installedOdo: 21500,
    installedDate: "2025-05-18",
    expectedLifespanKm: 8000
  },
  {
    id: "prt-brake-r",
    name: "Rear Brake Shoes",
    brand: "Jawa Genuine Parts",
    installedOdo: 10500,
    installedDate: "2022-03-10",
    expectedLifespanKm: 15000
  },
  {
    id: "prt-spark",
    name: "Spark Plug",
    brand: "NGK Iridium Spark Plug",
    installedOdo: 16000,
    installedDate: "2023-05-12",
    expectedLifespanKm: 12000
  },
  {
    id: "prt-tires",
    name: "Tire Set (Ceat Zoom Cruz)",
    brand: "Ceat Zoom Cruz Tubeless",
    installedOdo: 20000,
    installedDate: "2024-11-20",
    expectedLifespanKm: 25000
  }
];

export const initialDocuments: BikeDocument[] = [
  {
    id: "doc-rc",
    name: "Registration Certificate (RC)",
    documentNumber: "MH12JS3000",
    expiryDate: "2035-03-14"
  },
  {
    id: "doc-ins",
    name: "Insurance Policy (Comprehensive)",
    documentNumber: "UI-9832810239-12",
    expiryDate: "2027-03-09"
  },
  {
    id: "doc-puc",
    name: "Pollution Under Control (PUC)",
    documentNumber: "MH00700923019",
    expiryDate: "2026-06-15" // Expires soon! Current date is 2026-05-30
  }
];

export const initialAdditives: FuelAdditiveRecord[] = [
  {
    id: "add-1",
    date: "2025-04-20",
    odometer: 16800,
    brand: "Liqui Moly 4T Additive",
    quantityMl: 125,
    cost: 350
  },
  {
    id: "add-2",
    date: "2025-11-05",
    odometer: 20500,
    brand: "Liqui Moly 4T Additive",
    quantityMl: 125,
    cost: 380
  }
];

// ─── FRESH SEED DATA (for new cloud users — structure only, no fake history) ───

export const freshSchedules: MaintenanceSchedule[] = [
  { id: "sch-oil",      name: "Engine Oil Change",              category: "Engine",     intervalKm: 5000,  intervalDays: 180 },
  { id: "sch-filter",   name: "Oil Filter Change",              category: "Engine",     intervalKm: 8000 },
  { id: "sch-clean",    name: "Chain Cleaning",                 category: "Chain",      intervalKm: 500 },
  { id: "sch-lube",     name: "Chain Lubrication",              category: "Chain",      intervalKm: 500 },
  { id: "sch-adjust",   name: "Chain Tension Adjustment",       category: "Chain",      intervalKm: 1000 },
  { id: "sch-coolant",  name: "Coolant Replacement",            category: "Engine",     intervalDays: 730 },
  { id: "sch-battery",  name: "Battery Inspection",             category: "Electrical", intervalDays: 90 },
  { id: "sch-wash",     name: "Full Bike Wash",                 category: "General",    intervalDays: 14 },
  { id: "sch-polish",   name: "Chrome Polish",                  category: "General",    intervalDays: 30 },
  { id: "sch-rust",     name: "Rust & Corrosion Inspection",    category: "General",    intervalDays: 45 },
  { id: "sch-fuel-sys", name: "Fuel System Cleaner (Additive)", category: "Engine",     intervalKm: 4000 },
];

export const freshChromeParts: ChromePart[] = [
  { id: "chr-exhaust",   name: "Dual Exhaust Silencers (Left & Right)", lastPolishedDate: "", lastInspectedDate: "" },
  { id: "chr-mirrors",   name: "Chrome Round Rearview Mirrors",          lastPolishedDate: "", lastInspectedDate: "" },
  { id: "chr-engine",    name: "Engine Side Covers & Crankcase",         lastPolishedDate: "", lastInspectedDate: "" },
  { id: "chr-tank",      name: "Fuel Tank Chrome Grills & Badges",       lastPolishedDate: "", lastInspectedDate: "" },
  { id: "chr-headlight", name: "Headlight Ring Rim",                     lastPolishedDate: "", lastInspectedDate: "" },
];

export const freshPartsLifecycle: PartLifecycle[] = [
  { id: "prt-chain",   name: "Chain & Sprocket Kit",  brand: "—", installedOdo: 0, installedDate: "", expectedLifespanKm: 20000 },
  { id: "prt-brake-f", name: "Front Brake Pads",      brand: "—", installedOdo: 0, installedDate: "", expectedLifespanKm: 8000 },
  { id: "prt-brake-r", name: "Rear Brake Shoes",      brand: "—", installedOdo: 0, installedDate: "", expectedLifespanKm: 15000 },
  { id: "prt-spark",   name: "Spark Plug",             brand: "—", installedOdo: 0, installedDate: "", expectedLifespanKm: 12000 },
  { id: "prt-tires",   name: "Tire Set",               brand: "—", installedOdo: 0, installedDate: "", expectedLifespanKm: 25000 },
];

export const freshDocuments: BikeDocument[] = [
  { id: "doc-rc",  name: "Registration Certificate (RC)",      documentNumber: "", expiryDate: "" },
  { id: "doc-ins", name: "Insurance Policy (Comprehensive)",   documentNumber: "", expiryDate: "" },
  { id: "doc-puc", name: "Pollution Under Control (PUC)",      documentNumber: "", expiryDate: "" },
];
