import { 
  MotorcycleProfile, 
  MaintenanceSchedule, 
  MaintenanceRecord, 
  FuelRecord, 
  ExpenseRecord,
  BikeDocument,
  PartLifecycle
} from './types';

// Get difference in days between two dates
export const getDaysDiff = (dateStr1: string, dateStr2: string): number => {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Calculate cost per kilometer
export const calculateCostPerKm = (
  currentOdo: number,
  expenses: ExpenseRecord[],
  records: MaintenanceRecord[],
  fuels: FuelRecord[]
): number => {
  if (currentOdo <= 0) return 0;
  
  const totalExpenses = expenses
    .filter(e => e.category !== 'Registration') // Exclude initial purchase registration
    .reduce((sum, e) => sum + e.amount, 0);
    
  const totalMaint = records.reduce((sum, r) => sum + r.cost, 0);
  const totalFuel = fuels.reduce((sum, f) => sum + f.totalAmount, 0);
  
  return (totalExpenses + totalMaint + totalFuel) / currentOdo;
};

// Mileage is only trustworthy between two fills where the tank was brought back
// to the same level — liters added then equals fuel actually consumed since the
// last such reference point. Fills not marked "same level" are skipped from the
// math (but still logged for cost tracking).
export const calculateAverageMileage = (fuels: FuelRecord[]): number | null => {
  const sorted = [...fuels].sort((a, b) => a.odometer - b.odometer);
  if (sorted.length < 2) return null;

  let refOdo = sorted[0].odometer;
  let litersSinceRef = 0;
  let totalDistance = 0;
  let totalLiters = 0;

  for (let i = 1; i < sorted.length; i++) {
    litersSinceRef += sorted[i].liters;
    if (sorted[i].sameLevel) {
      const distance = sorted[i].odometer - refOdo;
      if (distance > 0 && litersSinceRef > 0) {
        totalDistance += distance;
        totalLiters += litersSinceRef;
      }
      refOdo = sorted[i].odometer;
      litersSinceRef = 0;
    }
  }

  if (totalLiters === 0) return null;
  return totalDistance / totalLiters;
};

// Per-fill mileage, sorted by odometer ascending. Only fills marked
// "sameLevel" get a mileage value (km since last same-level reference,
// divided by total liters added since then).
export const calculateMileagePerFill = (fuels: FuelRecord[]): (FuelRecord & { mileage: number | null })[] => {
  const sorted = [...fuels].sort((a, b) => a.odometer - b.odometer);
  let refOdo = sorted.length ? sorted[0].odometer : 0;
  let litersSinceRef = 0;

  return sorted.map((f, index) => {
    if (index === 0) return { ...f, mileage: null };
    litersSinceRef += f.liters;
    if (f.sameLevel) {
      const distance = f.odometer - refOdo;
      const mileage = distance > 0 && litersSinceRef > 0 ? distance / litersSinceRef : null;
      refOdo = f.odometer;
      litersSinceRef = 0;
      return { ...f, mileage };
    }
    return { ...f, mileage: null };
  });
};

// Calculate detailed bike health scores
export interface HealthBreakdown {
  engine: number;
  chain: number;
  chrome: number;
  electrical: number;
  documents: number;
  parts: number;
  overall: number;
}

export const calculateHealthScore = (
  profile: MotorcycleProfile,
  schedules: MaintenanceSchedule[],
  documents: BikeDocument[],
  parts: PartLifecycle[] = [],
  currentDateStr: string = new Date().toISOString().split('T')[0]
): HealthBreakdown => {
  // 1. Engine Health Score (Engine Oil, Oil Filter, Coolant, Spark Plug)
  let engineScore = 100;
  const oilSchedule = schedules.find(s => s.id === "sch-oil");
  if (oilSchedule && oilSchedule.lastPerformedOdo && oilSchedule.lastPerformedDate) {
    const kmSinceOil = profile.currentOdometer - oilSchedule.lastPerformedOdo;
    const daysSinceOil = getDaysDiff(oilSchedule.lastPerformedDate, currentDateStr);
    
    const odoOverdue = kmSinceOil - (oilSchedule.intervalKm || 5000);
    const daysOverdue = daysSinceOil - (oilSchedule.intervalDays || 180);
    
    if (odoOverdue > 0) {
      engineScore -= Math.min(odoOverdue * 0.05, 40); // Max 40% penalty for oil odo
    }
    if (daysOverdue > 0) {
      engineScore -= Math.min(daysOverdue * 0.2, 40); // Max 40% penalty for oil days
    }
  }

  const coolantSchedule = schedules.find(s => s.id === "sch-coolant");
  if (coolantSchedule && coolantSchedule.lastPerformedDate) {
    const daysSinceCoolant = getDaysDiff(coolantSchedule.lastPerformedDate, currentDateStr);
    const overdueDays = daysSinceCoolant - (coolantSchedule.intervalDays || 730);
    if (overdueDays > 0) {
      engineScore -= Math.min(overdueDays * 0.1, 20); // Max 20% penalty
    }
  }

  engineScore = Math.max(0, Math.min(100, engineScore));

  // 2. Chain Health Score (Cleaning, Lube, Tension)
  let chainScore = 100;
  const cleanSchedule = schedules.find(s => s.id === "sch-clean");
  if (cleanSchedule && cleanSchedule.lastPerformedOdo) {
    const kmSinceClean = profile.currentOdometer - cleanSchedule.lastPerformedOdo;
    const cleanOverdue = kmSinceClean - (cleanSchedule.intervalKm || 500);
    if (cleanOverdue > 0) {
      chainScore -= Math.min(cleanOverdue * 0.2, 50); // Max 50% penalty
    }
  }

  const adjustSchedule = schedules.find(s => s.id === "sch-adjust");
  if (adjustSchedule && adjustSchedule.lastPerformedOdo) {
    const kmSinceAdjust = profile.currentOdometer - adjustSchedule.lastPerformedOdo;
    const adjustOverdue = kmSinceAdjust - (adjustSchedule.intervalKm || 1000);
    if (adjustOverdue > 0) {
      chainScore -= Math.min(adjustOverdue * 0.1, 30); // Max 30% penalty
    }
  }
  
  chainScore = Math.max(0, Math.min(100, chainScore));

  // 3. Chrome Health Score (Polishing & Inspections)
  let chromeScore = 100;
  const polishSchedule = schedules.find(s => s.id === "sch-polish");
  if (polishSchedule && polishSchedule.lastPerformedDate) {
    const daysSincePolish = getDaysDiff(polishSchedule.lastPerformedDate, currentDateStr);
    const polishOverdue = daysSincePolish - (polishSchedule.intervalDays || 30);
    if (polishOverdue > 0) {
      chromeScore -= Math.min(polishOverdue * 1.5, 60); // Max 60% penalty
    }
  }

  const rustSchedule = schedules.find(s => s.id === "sch-rust");
  if (rustSchedule && rustSchedule.lastPerformedDate) {
    const daysSinceRust = getDaysDiff(rustSchedule.lastPerformedDate, currentDateStr);
    const rustOverdue = daysSinceRust - (rustSchedule.intervalDays || 45);
    if (rustOverdue > 0) {
      chromeScore -= Math.min(rustOverdue * 1.0, 40); // Max 40% penalty
    }
  }
  chromeScore = Math.max(0, Math.min(100, chromeScore));

  // 4. Electrical Health Score (Battery Checks)
  let electricalScore = 100;
  const batterySchedule = schedules.find(s => s.id === "sch-battery");
  if (batterySchedule && batterySchedule.lastPerformedDate) {
    const daysSinceBattery = getDaysDiff(batterySchedule.lastPerformedDate, currentDateStr);
    const batteryOverdue = daysSinceBattery - (batterySchedule.intervalDays || 90);
    if (batteryOverdue > 0) {
      electricalScore -= Math.min(batteryOverdue * 0.8, 50); // Max 50% penalty
    }
  }
  electricalScore = Math.max(0, Math.min(100, electricalScore));

  // 5. Documents Health Score (Validity)
  let documentsScore = 100;
  documents.forEach(doc => {
    const daysToExpiry = getDaysDiff(currentDateStr, doc.expiryDate);
    if (daysToExpiry < 0) {
      documentsScore -= 40; // Overdue documents carry heavy penalty
    } else if (daysToExpiry < 15) {
      documentsScore -= 15; // Warning penalty
    } else if (daysToExpiry < 30) {
      documentsScore -= 5;
    }
  });
  documentsScore = Math.max(0, Math.min(100, documentsScore));

  // 6. Parts Wear Health Score (chain/sprocket, brake pads, spark plug, tyres etc.)
  let partsScore = 100;
  if (parts.length > 0) {
    const wearPenalties = parts.map(part => {
      const installedOdo = part.installedDate ? part.installedOdo : 0;
      const kmDriven = profile.currentOdometer - installedOdo;
      const usagePercent = Math.min(100, (kmDriven / part.expectedLifespanKm) * 100);
      if (usagePercent >= 90) return 25 as number; // overdue replacement
      if (usagePercent >= 70) return 10 as number; // monitor
      return 0 as number;
    });
    partsScore -= wearPenalties.reduce((sum, p) => sum + p, 0);
  }
  partsScore = Math.max(0, Math.min(100, partsScore));

  // 7. Overall Health Score
  const overall = Math.round(
    engineScore * 0.3 +
    chainScore * 0.2 +
    chromeScore * 0.1 +
    electricalScore * 0.1 +
    documentsScore * 0.1 +
    partsScore * 0.2
  );

  return {
    engine: Math.round(engineScore),
    chain: Math.round(chainScore),
    chrome: Math.round(chromeScore),
    electrical: Math.round(electricalScore),
    documents: Math.round(documentsScore),
    parts: Math.round(partsScore),
    overall
  };
};
