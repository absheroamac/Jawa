import { supabase, hasSupabaseConfig } from '../supabaseClient';
import { 
  MotorcycleProfile, 
  MaintenanceSchedule, 
  MaintenanceRecord, 
  FuelRecord, 
  ExpenseRecord, 
  ChromePart, 
  PartLifecycle, 
  BikeDocument,
  FuelAdditiveRecord 
} from '../types';

// ==========================================
// 1. DATA MAPPING HELPERS (camelCase <-> snake_case)
// ==========================================

const mapProfileFromDb = (row: any): MotorcycleProfile => ({
  bikeName: row.bike_name,
  manufacturer: row.manufacturer,
  model: row.model,
  variant: row.variant,
  year: Number(row.year),
  purchaseDate: row.purchase_date,
  purchasePrice: Number(row.purchase_price),
  registrationNumber: row.registration_number,
  vin: row.vin,
  currentOdometer: Number(row.current_odometer),
  color: row.color,
  fuelType: row.fuel_type,
});

const mapProfileToDb = (p: MotorcycleProfile) => ({
  bike_name: p.bikeName,
  manufacturer: p.manufacturer,
  model: p.model,
  variant: p.variant,
  year: p.year,
  purchase_date: p.purchaseDate,
  purchase_price: p.purchasePrice,
  registration_number: p.registrationNumber,
  vin: p.vin,
  current_odometer: p.currentOdometer,
  color: p.color,
  fuel_type: p.fuelType,
});

const mapScheduleFromDb = (row: any): MaintenanceSchedule => ({
  id: row.id,
  name: row.name,
  category: row.category,
  intervalKm: row.interval_km !== null ? Number(row.interval_km) : undefined,
  intervalDays: row.interval_days !== null ? Number(row.interval_days) : undefined,
  lastPerformedOdo: row.last_performed_odo !== null ? Number(row.last_performed_odo) : undefined,
  lastPerformedDate: row.last_performed_date !== null ? row.last_performed_date : undefined,
});

const mapScheduleToDb = (s: MaintenanceSchedule) => ({
  id: s.id,
  name: s.name,
  category: s.category,
  interval_km: s.intervalKm ?? null,
  interval_days: s.intervalDays ?? null,
  last_performed_odo: s.lastPerformedOdo ?? null,
  last_performed_date: s.lastPerformedDate ?? null,
});

const mapRecordFromDb = (row: any): MaintenanceRecord => ({
  id: row.id,
  date: row.date,
  odometer: Number(row.odometer),
  category: row.category,
  type: row.type,
  description: row.description,
  workshopName: row.workshop_name,
  cost: Number(row.cost),
  notes: row.notes !== null ? row.notes : undefined,
});

const mapRecordToDb = (r: MaintenanceRecord) => ({
  id: r.id,
  date: r.date,
  odometer: r.odometer,
  category: r.category,
  type: r.type,
  description: r.description,
  workshop_name: r.workshopName,
  cost: r.cost,
  notes: r.notes ?? null,
});

const mapFuelFromDb = (row: any): FuelRecord => ({
  id: row.id,
  date: row.date,
  odometer: Number(row.odometer),
  liters: Number(row.liters),
  pricePerLiter: Number(row.price_per_liter),
  totalAmount: Number(row.total_amount),
  location: row.location,
});

const mapFuelToDb = (f: FuelRecord) => ({
  id: f.id,
  date: f.date,
  odometer: f.odometer,
  liters: f.liters,
  price_per_liter: f.pricePerLiter,
  total_amount: f.totalAmount,
  location: f.location,
});

const mapExpenseFromDb = (row: any): ExpenseRecord => ({
  id: row.id,
  date: row.date,
  amount: Number(row.amount),
  category: row.category,
  notes: row.notes,
});

const mapExpenseToDb = (e: ExpenseRecord) => ({
  id: e.id,
  date: e.date,
  amount: e.amount,
  category: e.category,
  notes: e.notes,
});

const mapChromeFromDb = (row: any): ChromePart => ({
  id: row.id,
  name: row.name,
  lastPolishedDate: row.last_polished_date,
  lastInspectedDate: row.last_inspected_date,
});

const mapChromeToDb = (c: ChromePart) => ({
  id: c.id,
  name: c.name,
  last_polished_date: c.lastPolishedDate,
  last_inspected_date: c.lastInspectedDate,
});

const mapLifecycleFromDb = (row: any): PartLifecycle => ({
  id: row.id,
  name: row.name,
  brand: row.brand,
  installedOdo: Number(row.installed_odo),
  installedDate: row.installed_date,
  expectedLifespanKm: Number(row.expected_lifespan_km),
});

const mapLifecycleToDb = (l: PartLifecycle) => ({
  id: l.id,
  name: l.name,
  brand: l.brand,
  installed_odo: l.installedOdo,
  installed_date: l.installedDate,
  expected_lifespan_km: l.expectedLifespanKm,
});

const mapDocFromDb = (row: any): BikeDocument => ({
  id: row.id,
  name: row.name,
  documentNumber: row.document_number,
  expiryDate: row.expiry_date,
});

const mapDocToDb = (d: BikeDocument) => ({
  id: d.id,
  name: d.name,
  document_number: d.documentNumber,
  expiry_date: d.expiryDate,
});

const mapAdditiveFromDb = (row: any): FuelAdditiveRecord => ({
  id: row.id,
  date: row.date,
  odometer: Number(row.odometer),
  brand: row.brand,
  quantityMl: Number(row.quantity_ml),
  cost: Number(row.cost),
});

const mapAdditiveToDb = (a: FuelAdditiveRecord) => ({
  id: a.id,
  date: a.date,
  odometer: a.odometer,
  brand: a.brand,
  quantity_ml: a.quantityMl,
  cost: a.cost,
});

// ==========================================
// 2. CRITICAL API QUERY WRAPPERS
// ==========================================

export const dbService = {
  // --- Profile ---
  async getProfile(): Promise<MotorcycleProfile | null> {
    if (!hasSupabaseConfig()) return null;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('motorcycle_profile')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Supabase profile fetch error:', error);
      return null;
    }
    return data ? mapProfileFromDb(data) : null;
  },

  async updateProfile(profile: MotorcycleProfile): Promise<boolean> {
    if (!hasSupabaseConfig()) return false;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('motorcycle_profile')
      .upsert({ id: 'profile-main', ...mapProfileToDb(profile), user_id: user.id });

    if (error) {
      console.error('Supabase profile upsert error:', error);
      return false;
    }
    return true;
  },

  // --- Schedules ---
  async getSchedules(): Promise<MaintenanceSchedule[] | null> {
    if (!hasSupabaseConfig()) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('maintenance_schedules')
      .select('*')
      .eq('user_id', user.id)
      .order('id');

    if (error) {
      console.error('Supabase schedules fetch error:', error);
      return null;
    }
    return data ? data.map(mapScheduleFromDb) : [];
  },

  async upsertSchedules(schedules: MaintenanceSchedule[]): Promise<boolean> {
    if (!hasSupabaseConfig()) return false;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const rows = schedules.map(s => ({ ...mapScheduleToDb(s), user_id: user.id }));
    const { error } = await supabase
      .from('maintenance_schedules')
      .upsert(rows);

    if (error) {
      console.error('Supabase schedules upsert error:', error);
      return false;
    }
    return true;
  },

  async updateSchedulePerformance(id: string, odo: number, date: string): Promise<boolean> {
    if (!hasSupabaseConfig()) return false;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('maintenance_schedules')
      .update({ last_performed_odo: odo, last_performed_date: date })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error(`Supabase schedule update error for ${id}:`, error);
      return false;
    }
    return true;
  },

  // --- Maintenance Records ---
  async getRecords(): Promise<MaintenanceRecord[] | null> {
    if (!hasSupabaseConfig()) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('maintenance_records')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Supabase records fetch error:', error);
      return null;
    }
    return data ? data.map(mapRecordFromDb) : [];
  },

  async insertRecord(record: MaintenanceRecord): Promise<boolean> {
    if (!hasSupabaseConfig()) return false;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('maintenance_records')
      .insert({ ...mapRecordToDb(record), user_id: user.id });

    if (error) {
      console.error('Supabase record insert error:', error);
      return false;
    }
    return true;
  },

  // --- Fuel Records ---
  async getFuels(): Promise<FuelRecord[] | null> {
    if (!hasSupabaseConfig()) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('fuel_records')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Supabase fuel fetch error:', error);
      return null;
    }
    return data ? data.map(mapFuelFromDb) : [];
  },

  async insertFuel(fuel: FuelRecord): Promise<boolean> {
    if (!hasSupabaseConfig()) return false;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('fuel_records')
      .insert({ ...mapFuelToDb(fuel), user_id: user.id });

    if (error) {
      console.error('Supabase fuel insert error:', error);
      return false;
    }
    return true;
  },

  // --- Expense Records ---
  async getExpenses(): Promise<ExpenseRecord[] | null> {
    if (!hasSupabaseConfig()) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('expense_records')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Supabase expenses fetch error:', error);
      return null;
    }
    return data ? data.map(mapExpenseFromDb) : [];
  },

  async insertExpense(expense: ExpenseRecord): Promise<boolean> {
    if (!hasSupabaseConfig()) return false;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('expense_records')
      .insert({ ...mapExpenseToDb(expense), user_id: user.id });

    if (error) {
      console.error('Supabase expense insert error:', error);
      return false;
    }
    return true;
  },

  // --- Chrome Parts ---
  async getChromeParts(): Promise<ChromePart[] | null> {
    if (!hasSupabaseConfig()) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('chrome_parts')
      .select('*')
      .eq('user_id', user.id)
      .order('id');

    if (error) {
      console.error('Supabase chrome parts fetch error:', error);
      return null;
    }
    return data ? data.map(mapChromeFromDb) : [];
  },

  async upsertChromeParts(parts: ChromePart[]): Promise<boolean> {
    if (!hasSupabaseConfig()) return false;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const rows = parts.map(c => ({ ...mapChromeToDb(c), user_id: user.id }));
    const { error } = await supabase
      .from('chrome_parts')
      .upsert(rows);

    if (error) {
      console.error('Supabase chrome upsert error:', error);
      return false;
    }
    return true;
  },

  // --- Parts Lifecycle ---
  async getPartsLifecycle(): Promise<PartLifecycle[] | null> {
    if (!hasSupabaseConfig()) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('parts_lifecycle')
      .select('*')
      .eq('user_id', user.id)
      .order('id');

    if (error) {
      console.error('Supabase parts fetch error:', error);
      return null;
    }
    return data ? data.map(mapLifecycleFromDb) : [];
  },

  async upsertPartsLifecycle(parts: PartLifecycle[]): Promise<boolean> {
    if (!hasSupabaseConfig()) return false;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const rows = parts.map(l => ({ ...mapLifecycleToDb(l), user_id: user.id }));
    const { error } = await supabase
      .from('parts_lifecycle')
      .upsert(rows);

    if (error) {
      console.error('Supabase parts lifecycle upsert error:', error);
      return false;
    }
    return true;
  },

  // --- Bike Documents ---
  async getDocuments(): Promise<BikeDocument[] | null> {
    if (!hasSupabaseConfig()) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('bike_documents')
      .select('*')
      .eq('user_id', user.id)
      .order('id');

    if (error) {
      console.error('Supabase documents fetch error:', error);
      return null;
    }
    return data ? data.map(mapDocFromDb) : [];
  },

  async upsertDocuments(docs: BikeDocument[]): Promise<boolean> {
    if (!hasSupabaseConfig()) return false;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const rows = docs.map(d => ({ ...mapDocToDb(d), user_id: user.id }));
    const { error } = await supabase
      .from('bike_documents')
      .upsert(rows);

    if (error) {
      console.error('Supabase documents upsert error:', error);
      return false;
    }
    return true;
  },

  // --- Additives ---
  async getAdditives(): Promise<FuelAdditiveRecord[] | null> {
    if (!hasSupabaseConfig()) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('fuel_additive_records')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Supabase additives fetch error:', error);
      return null;
    }
    return data ? data.map(mapAdditiveFromDb) : [];
  },

  async insertAdditive(additive: FuelAdditiveRecord): Promise<boolean> {
    if (!hasSupabaseConfig()) return false;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('fuel_additive_records')
      .insert({ ...mapAdditiveToDb(additive), user_id: user.id });

    if (error) {
      console.error('Supabase additive insert error:', error);
      return false;
    }
    return true;
  },
};
