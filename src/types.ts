export interface MotorcycleProfile {
  bikeName: string;
  manufacturer: string;
  model: string;
  variant: string;
  year: number;
  purchaseDate: string;
  purchasePrice: number;
  registrationNumber: string;
  vin: string;
  currentOdometer: number;
  color: string;
  fuelType: string;
}

export interface MaintenanceRecord {
  id: string;
  date: string;
  odometer: number;
  category: string; // 'Engine' | 'Chain' | 'Brakes' | 'Electrical' | 'Tires' | 'General'
  type: string;     // e.g., 'Engine Oil Change', 'Chain Cleaning'
  description: string;
  workshopName: string;
  cost: number;
  notes?: string;
}

export interface MaintenanceSchedule {
  id: string;
  name: string;
  category: string;
  intervalKm?: number;
  intervalDays?: number;
  lastPerformedOdo?: number;
  lastPerformedDate?: string;
}

export interface FuelRecord {
  id: string;
  date: string;
  odometer: number;
  liters: number;
  pricePerLiter: number;
  totalAmount: number;
  location: string;
}

export interface ExpenseRecord {
  id: string;
  date: string;
  amount: number;
  category: 'Fuel' | 'Service' | 'Repairs' | 'Accessories' | 'Insurance' | 'Registration' | 'Parking' | 'Tolls' | 'Washing' | 'Other';
  notes: string;
}

export interface ChromePart {
  id: string;
  name: string;
  lastPolishedDate: string;
  lastInspectedDate: string;
}

export interface PartLifecycle {
  id: string;
  name: string;
  brand: string;
  installedOdo: number;
  installedDate: string;
  expectedLifespanKm: number;
}

export interface BikeDocument {
  id: string;
  name: string; // 'Registration Certificate' | 'Insurance Policy' | 'Pollution Certificate'
  documentNumber: string;
  expiryDate: string;
}

export interface FuelAdditiveRecord {
  id: string;
  date: string;
  odometer: number;
  brand: string;
  quantityMl: number;
  cost: number;
}
