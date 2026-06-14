import { useState, useEffect } from 'react';
import { Gauge, Wrench, FileText, Fuel, FolderOpen } from 'lucide-react';
import {
  initialProfile,
  freshSchedules,
  freshChromeParts,
  freshPartsLifecycle,
  freshDocuments,
} from './mockData';
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
} from './types';

// Import Supabase service & client configuration
import { supabase, hasSupabaseConfig } from './supabaseClient';
import { dbService } from './services/dbService';

// Import Feature Components
import { AuthGate } from './components/AuthGate';
import { Cockpit } from './components/Cockpit';
import { Garage } from './components/Garage';
import { Logs } from './components/Logs';
import { FuelLog } from './components/FuelLog';
import { Vault } from './components/Vault';

function App() {
  // --- AUTH STATES (PERSISTENT CLOUD SESSIONS) ---
  const [user, setUser] = useState<any>(null);

  // --- STATE INITIALIZATION (Starts with fallback seeds) ---
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<MotorcycleProfile>(initialProfile);
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>(freshSchedules);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [fuels, setFuels] = useState<FuelRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [chromeParts, setChromeParts] = useState<ChromePart[]>(freshChromeParts);
  const [parts, setParts] = useState<PartLifecycle[]>(freshPartsLifecycle);
  const [documents, setDocuments] = useState<BikeDocument[]>(freshDocuments);
  const [additives, setAdditives] = useState<FuelAdditiveRecord[]>([]);

  // Navigation tab: 'cockpit' | 'garage' | 'logs' | 'fuel' | 'vault'
  const [activeTab, setActiveTab] = useState('cockpit');
  const [odoInput, setOdoInput] = useState('');
  const [showOdoModal, setShowOdoModal] = useState(false);
  const currentDateStr = new Date().toISOString().split('T')[0];

  // --- 1. AUTH STATE PERSISTENT LISTENER ---
  useEffect(() => {
    if (!hasSupabaseConfig()) {
      setLoading(false);
      return;
    }

    // Load initial session
    supabase.auth.getSession().then((result: any) => {
      setUser(result.data?.session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state modifications
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- 2. DUAL-ENGINE SYNCHRONIZATION EFFECT ---
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        if (hasSupabaseConfig()) {
          // If in cloud mode but not authorized yet, wait for session
          if (!user) {
            setLoading(false);
            return;
          }

          console.log("Supabase session detected. Linking cloud engine for user: ", user.email);
          
          let dbProfile = await dbService.getProfile();

          // Seed profile if first login
          if (!dbProfile) {
            console.log("No profile found. Seeding from signup metadata...");
            const meta = user.user_metadata || {};
            const profileSeed: MotorcycleProfile = {
              bikeName: meta.bike_name || initialProfile.bikeName,
              manufacturer: meta.manufacturer || initialProfile.manufacturer,
              model: meta.model || initialProfile.model,
              variant: meta.variant || initialProfile.variant,
              year: meta.year || initialProfile.year,
              color: meta.color || initialProfile.color,
              fuelType: meta.fuel_type || initialProfile.fuelType,
              currentOdometer: meta.current_odometer ?? initialProfile.currentOdometer,
              registrationNumber: meta.registration_number || initialProfile.registrationNumber,
              vin: meta.vin || initialProfile.vin,
              purchaseDate: meta.purchase_date || initialProfile.purchaseDate,
              purchasePrice: meta.purchase_price ?? initialProfile.purchasePrice,
            };
            await dbService.updateProfile(profileSeed);
            dbProfile = profileSeed;
          }

          // Fetch all data concurrently
          const [
            dbSchedules,
            dbRecords,
            dbFuels,
            dbExpenses,
            dbChrome,
            dbParts,
            dbDocs,
            dbAdditives
          ] = await Promise.all([
            dbService.getSchedules(),
            dbService.getRecords(),
            dbService.getFuels(),
            dbService.getExpenses(),
            dbService.getChromeParts(),
            dbService.getPartsLifecycle(),
            dbService.getDocuments(),
            dbService.getAdditives(),
          ]);

          // Seed structure tables if empty (handles wiped DB or first login)
          if (!dbSchedules?.length) {
            await dbService.upsertSchedules(freshSchedules);
            setSchedules(freshSchedules);
          } else {
            setSchedules(dbSchedules);
          }
          if (!dbChrome?.length) {
            await dbService.upsertChromeParts(freshChromeParts);
            setChromeParts(freshChromeParts);
          } else {
            setChromeParts(dbChrome);
          }
          if (!dbParts?.length) {
            await dbService.upsertPartsLifecycle(freshPartsLifecycle);
            setParts(freshPartsLifecycle);
          } else if (dbParts.some(p => p.id === 'prt-tires') && !dbParts.some(p => p.id === 'prt-tire-f')) {
            const migratedParts = [
              ...dbParts.filter(p => p.id !== 'prt-tires'),
              ...freshPartsLifecycle.filter(p => p.id === 'prt-tire-f' || p.id === 'prt-tire-r')
            ];
            await dbService.upsertPartsLifecycle(migratedParts);
            setParts(migratedParts);
          } else {
            setParts(dbParts);
          }
          if (!dbDocs?.length) {
            await dbService.upsertDocuments(freshDocuments);
            setDocuments(freshDocuments);
          } else {
            setDocuments(dbDocs);
          }

          if (dbProfile) setProfile(dbProfile);
          if (dbRecords?.length) setRecords(dbRecords);
          if (dbFuels?.length) setFuels(dbFuels);
          if (dbExpenses?.length) setExpenses(dbExpenses);
          if (dbAdditives?.length) setAdditives(dbAdditives);
          
        } else {
          console.log("No Supabase configuration. Running offline LocalStorage engine...");
          
          const localProfile = localStorage.getItem('jawa_profile');
          const localSchedules = localStorage.getItem('jawa_schedules');
          const localRecords = localStorage.getItem('jawa_records');
          const localFuels = localStorage.getItem('jawa_fuels');
          const localExpenses = localStorage.getItem('jawa_expenses');
          const localChrome = localStorage.getItem('jawa_chrome');
          const localParts = localStorage.getItem('jawa_parts');
          const localDocs = localStorage.getItem('jawa_documents');
          const localAdditives = localStorage.getItem('jawa_additives');
          
          if (localProfile) setProfile(JSON.parse(localProfile));
          if (localSchedules) setSchedules(JSON.parse(localSchedules));
          if (localRecords) setRecords(JSON.parse(localRecords));
          if (localFuels) setFuels(JSON.parse(localFuels));
          if (localExpenses) setExpenses(JSON.parse(localExpenses));
          if (localChrome) setChromeParts(JSON.parse(localChrome));
          if (localParts) {
            const parsedParts: PartLifecycle[] = JSON.parse(localParts);
            if (parsedParts.some(p => p.id === 'prt-tires') && !parsedParts.some(p => p.id === 'prt-tire-f')) {
              setParts([
                ...parsedParts.filter(p => p.id !== 'prt-tires'),
                ...freshPartsLifecycle.filter(p => p.id === 'prt-tire-f' || p.id === 'prt-tire-r')
              ]);
            } else {
              setParts(parsedParts);
            }
          }
          if (localDocs) setDocuments(JSON.parse(localDocs));
          if (localAdditives) setAdditives(JSON.parse(localAdditives));
        }
      } catch (err) {
        console.error("Failed to load diagnostic telemetry: ", err);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [user]);

  // --- OFFLINE PERSISTENCE BACKUPS ---
  useEffect(() => {
    localStorage.setItem('jawa_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('jawa_schedules', JSON.stringify(schedules));
  }, [schedules]);

  useEffect(() => {
    localStorage.setItem('jawa_records', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('jawa_fuels', JSON.stringify(fuels));
  }, [fuels]);

  useEffect(() => {
    localStorage.setItem('jawa_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('jawa_chrome', JSON.stringify(chromeParts));
  }, [chromeParts]);

  useEffect(() => {
    localStorage.setItem('jawa_parts', JSON.stringify(parts));
  }, [parts]);

  useEffect(() => {
    localStorage.setItem('jawa_documents', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('jawa_additives', JSON.stringify(additives));
  }, [additives]);

  // --- STATE ACTION HANDLERS ---
  const handleLogOdo = (odo: number) => {
    const updated = { ...profile, currentOdometer: odo };
    setProfile(updated);
    dbService.updateProfile(updated).catch(err => console.error("Database update error:", err));
  };

  const handleQuickLube = () => {
    const targetIds = ['sch-clean', 'sch-lube'];
    const updatedSchedules = schedules.map(s => 
      targetIds.includes(s.id) 
        ? { ...s, lastPerformedOdo: profile.currentOdometer, lastPerformedDate: currentDateStr }
        : s
    );
    setSchedules(updatedSchedules);

    // Create service records
    const newRecords: MaintenanceRecord[] = [
      {
        id: `rec-ql-${Date.now()}-1`,
        date: currentDateStr,
        odometer: profile.currentOdometer,
        category: 'Chain',
        type: 'Chain Cleaning',
        description: 'Standard quick chain cleaning in personal garage.',
        workshopName: 'Self Service',
        cost: 0,
        notes: 'Quick garage maintenance'
      },
      {
        id: `rec-ql-${Date.now()}-2`,
        date: currentDateStr,
        odometer: profile.currentOdometer,
        category: 'Chain',
        type: 'Chain Lubrication',
        description: 'Applied standard drive chain lubricant spray.',
        workshopName: 'Self Service',
        cost: 0,
        notes: 'Quick garage maintenance'
      }
    ];

    setRecords(prev => [...prev, ...newRecords]);

    // Database Sync
    dbService.updateSchedulePerformance('sch-clean', profile.currentOdometer, currentDateStr);
    dbService.updateSchedulePerformance('sch-lube', profile.currentOdometer, currentDateStr);
    for (const r of newRecords) dbService.insertRecord(r);
  };

  const handleQuickPolish = () => {
    const targetIds = ['sch-polish', 'sch-rust'];
    const updatedSchedules = schedules.map(s => 
      targetIds.includes(s.id) 
        ? { ...s, lastPerformedOdo: profile.currentOdometer, lastPerformedDate: currentDateStr }
        : s
    );
    setSchedules(updatedSchedules);

    // Reset all chrome components' dates
    const updatedChrome = chromeParts.map(part => ({
      ...part,
      lastPolishedDate: currentDateStr,
      lastInspectedDate: currentDateStr
    }));
    setChromeParts(updatedChrome);

    const newRec: MaintenanceRecord = {
      id: `rec-qp-${Date.now()}`,
      date: currentDateStr,
      odometer: profile.currentOdometer,
      category: 'General',
      type: 'Chrome Polish & Rust Check',
      description: 'Polished all custom metal exhaust pipelines and mirror plates. Conducted rust inspection.',
      workshopName: 'Self Service',
      cost: 0,
      notes: 'Garage detailing reset'
    };

    setRecords(prev => [...prev, newRec]);

    // Database Sync
    dbService.updateSchedulePerformance('sch-polish', profile.currentOdometer, currentDateStr);
    dbService.updateSchedulePerformance('sch-rust', profile.currentOdometer, currentDateStr);
    dbService.upsertChromeParts(updatedChrome);
    dbService.insertRecord(newRec);
  };

  const handleAddMaintRecord = (newRec: Omit<MaintenanceRecord, 'id'>) => {
    const record: MaintenanceRecord = {
      ...newRec,
      id: `rec-${Date.now()}`
    };
    setRecords(prev => [...prev, record]);

    // Also update expenses under Service / Repairs categories
    const expense: ExpenseRecord = {
      id: `exp-m-${Date.now()}`,
      date: newRec.date,
      amount: newRec.cost,
      category: newRec.category === 'General' ? 'Washing' : newRec.type.toLowerCase().includes('repair') ? 'Repairs' : 'Service',
      notes: `Service Bill: ${newRec.type}`
    };
    setExpenses(prev => [...prev, expense]);

    // Database Sync
    dbService.insertRecord(record);
    dbService.insertExpense(expense);
  };

  const handleUpdateSchedule = (id: string, odo: number, date: string) => {
    setSchedules(prev => 
      prev.map(s => s.id === id ? { ...s, lastPerformedOdo: odo, lastPerformedDate: date } : s)
    );
    dbService.updateSchedulePerformance(id, odo, date);
  };

  const handleAddFuel = (newFuel: Omit<FuelRecord, 'id'>) => {
    const fuel: FuelRecord = {
      ...newFuel,
      id: `fuel-${Date.now()}`
    };
    setFuels(prev => [...prev, fuel]);

    let updatedProfile = profile;
    // Automatically adjust profile Odometer if refuel is higher
    if (newFuel.odometer > profile.currentOdometer) {
      updatedProfile = { ...profile, currentOdometer: newFuel.odometer };
      setProfile(updatedProfile);
      dbService.updateProfile(updatedProfile);
    }

    // Record under Expenses
    const expense: ExpenseRecord = {
      id: `exp-f-${Date.now()}`,
      date: newFuel.date,
      amount: newFuel.totalAmount,
      category: 'Fuel',
      notes: `Refuel ${newFuel.liters}L @ ${newFuel.location}`
    };
    setExpenses(prev => [...prev, expense]);

    // Database Sync
    dbService.insertFuel(fuel);
    dbService.insertExpense(expense);
  };

  const handleAddAdditive = (newAdd: Omit<FuelAdditiveRecord, 'id'>) => {
    const additive: FuelAdditiveRecord = {
      ...newAdd,
      id: `add-${Date.now()}`
    };
    setAdditives(prev => [...prev, additive]);

    // Reset Fuel Additive Schedule preset
    setSchedules(prev => 
      prev.map(s => s.id === 'sch-fuel-sys' ? { ...s, lastPerformedOdo: newAdd.odometer, lastPerformedDate: newAdd.date } : s)
    );

    // Record under Expenses
    const expense: ExpenseRecord = {
      id: `exp-a-${Date.now()}`,
      date: newAdd.date,
      amount: newAdd.cost,
      category: 'Accessories',
      notes: `Ethanol protector: ${newAdd.brand}`
    };
    setExpenses(prev => [...prev, expense]);

    // Database Sync
    dbService.insertAdditive(additive);
    dbService.updateSchedulePerformance('sch-fuel-sys', newAdd.odometer, newAdd.date);
    dbService.insertExpense(expense);
  };

  const handlePolishChrome = (partId: string) => {
    const updatedChrome = chromeParts.map(p => p.id === partId ? { ...p, lastPolishedDate: currentDateStr } : p);
    setChromeParts(updatedChrome);
    
    // Update polish schedule
    setSchedules(prev => 
      prev.map(s => s.id === 'sch-polish' ? { ...s, lastPerformedDate: currentDateStr } : s)
    );

    // Database Sync
    dbService.upsertChromeParts(updatedChrome);
    dbService.updateSchedulePerformance('sch-polish', profile.currentOdometer, currentDateStr);
  };

  const handleInspectChrome = (partId: string) => {
    const updatedChrome = chromeParts.map(p => p.id === partId ? { ...p, lastInspectedDate: currentDateStr } : p);
    setChromeParts(updatedChrome);
    
    // Update rust inspection schedule
    setSchedules(prev => 
      prev.map(s => s.id === 'sch-rust' ? { ...s, lastPerformedDate: currentDateStr } : s)
    );

    // Database Sync
    dbService.upsertChromeParts(updatedChrome);
    dbService.updateSchedulePerformance('sch-rust', profile.currentOdometer, currentDateStr);
  };

  const handleReplacePart = (partId: string, brand: string, cost: number, odo: number, date: string, lifespanKm: number) => {
    const updatedParts = parts.map(p => p.id === partId ? { ...p, brand, installedOdo: odo, installedDate: date, expectedLifespanKm: lifespanKm } : p);
    setParts(updatedParts);

    // Add to maintenance records
    handleAddMaintRecord({
      date,
      odometer: odo,
      category: partId === 'prt-spark' || partId === 'prt-chain' ? 'Engine' : partId.includes('brake') ? 'Brakes' : partId.includes('tire') ? 'Tires' : 'General',
      type: `Swapped: ${parts.find(p => p.id === partId)?.name}`,
      description: `Swapped worn out item for brand new: ${brand}.`,
      workshopName: 'Self Garage',
      cost,
      notes: 'Component Lifecycle Overhaul'
    });

    // Database Sync
    dbService.upsertPartsLifecycle(updatedParts);
  };

  const handleUpdateDocument = (docId: string, documentNumber: string, expiryDate: string) => {
    const updatedDocs = documents.map(d => d.id === docId ? { ...d, documentNumber, expiryDate } : d);
    setDocuments(updatedDocs);
    dbService.upsertDocuments(updatedDocs);
  };

  const handleOdoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newOdo = parseInt(odoInput);
    if (newOdo > profile.currentOdometer) {
      handleLogOdo(newOdo);
      setShowOdoModal(false);
      setOdoInput('');
    } else {
      alert(`Odometer reading must be higher than ${profile.currentOdometer} km`);
    }
  };

  // --- RENDERING TABS SWITCHING LOGIC ---
  const renderTabContent = () => {
    switch (activeTab) {
      case 'cockpit':
        return (
          <Cockpit 
            profile={profile}
            schedules={schedules}
            records={records}
            fuels={fuels}
            expenses={expenses}
            documents={documents}
            onQuickLube={handleQuickLube}
            onQuickPolish={handleQuickPolish}
            onNavigate={setActiveTab}
          />
        );
      case 'garage':
        return (
          <Garage 
            profile={profile}
            schedules={schedules}
            parts={parts}
            onReplacePart={handleReplacePart}
            onUpdateSchedule={handleUpdateSchedule}
            onAddRecord={handleAddMaintRecord}
          />
        );
      case 'logs':
        return (
          <Logs 
            records={records}
            fuels={fuels}
            additives={additives}
            profile={profile}
            chromeParts={chromeParts}
            onPolishChrome={handlePolishChrome}
            onInspectChrome={handleInspectChrome}
            onAddAdditive={handleAddAdditive}
          />
        );
      case 'fuel':
        return (
          <FuelLog 
            profile={profile}
            fuels={fuels}
            onAddFuel={handleAddFuel}
          />
        );
      case 'vault':
        return (
          <Vault 
            profile={profile}
            setProfile={setProfile}
            documents={documents}
            onUpdateDocument={handleUpdateDocument}
            records={records}
            fuels={fuels}
            expenses={expenses}
            user={user}
            onSignOut={async () => {
              setLoading(true);
              await supabase.auth.signOut();
              setProfile(initialProfile);
              setSchedules(freshSchedules);
              setRecords([]);
              setFuels([]);
              setExpenses([]);
              setChromeParts(freshChromeParts);
              setParts(freshPartsLifecycle);
              setDocuments(freshDocuments);
              setAdditives([]);
              setLoading(false);
            }}
          />
        );
      default:
        return <div>Tab under construction.</div>;
    }
  };

  // --- LOADING ECU LINK SKELETON DIAGNOSTICS ---
  if (loading) {
    return (
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1.25rem', padding: '2rem', textAlign: 'center' }}>
        <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="ecu-spinner" style={{ position: 'absolute', width: '100%', height: '100%', border: '3px dashed var(--color-cyan)', borderRadius: '50%', animation: 'spin 1.8s linear infinite' }}></div>
          <Gauge size={32} style={{ color: 'var(--color-cyan)', opacity: 0.8 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Loading your ride data...
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            Syncing with the cloud
          </span>
        </div>
        <style>{`
          @keyframes spin {
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // --- AUTHENTICATION GATE (Only activated in Cloud mode if no session is active) ---
  if (hasSupabaseConfig() && !user) {
    return <AuthGate onAuthSuccess={() => {}} />;
  }

  return (
    <div className="app-container">
      {/* Elegantly minimal Sticky Top Header */}
      <header className="app-header">
        <div className="brand-section" style={{ gap: '0' }}>
          <div className="brand-text">
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700, display: 'block', marginBottom: '0.15rem' }}>Good Evening!</span>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.3px', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{profile.bikeName}</h1>
          </div>
        </div>

        {/* Minimalist circular odometer trigger on the right side, styled like reference */}
        <div className="header-bell" style={{ width: 'auto', borderRadius: '20px', padding: '0 0.85rem', gap: '0.45rem', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center' }} onClick={() => setShowOdoModal(true)}>
          <Gauge size={13} style={{ color: 'var(--color-cyan)' }} />
          <span>{profile.currentOdometer.toLocaleString()} km</span>
          <span className="bell-dot" style={{ top: '6px', right: '6px', width: '5px', height: '5px' }}></span>
        </div>
      </header>

      {/* Primary view workspace */}
      <main className="main-content">
        {renderTabContent()}
      </main>

      {/* Floating PWA Bottom Navigation Bar */}
      <nav className="bottom-navbar">
        <button 
          className={`bottom-nav-btn ${activeTab === 'cockpit' ? 'active' : ''}`} 
          onClick={() => setActiveTab('cockpit')}
        >
          <span className="bottom-nav-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Gauge size={20} />
          </span>
          <span>Cockpit</span>
        </button>
        <button 
          className={`bottom-nav-btn ${activeTab === 'garage' ? 'active' : ''}`} 
          onClick={() => setActiveTab('garage')}
        >
          <span className="bottom-nav-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wrench size={20} />
          </span>
          <span>Garage</span>
        </button>
        <button 
          className={`bottom-nav-btn ${activeTab === 'logs' ? 'active' : ''}`} 
          onClick={() => setActiveTab('logs')}
        >
          <span className="bottom-nav-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={20} />
          </span>
          <span>Logs</span>
        </button>
        <button 
          className={`bottom-nav-btn ${activeTab === 'fuel' ? 'active' : ''}`} 
          onClick={() => setActiveTab('fuel')}
        >
          <span className="bottom-nav-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Fuel size={20} />
          </span>
          <span>Fuel</span>
        </button>
        <button 
          className={`bottom-nav-btn ${activeTab === 'vault' ? 'active' : ''}`} 
          onClick={() => setActiveTab('vault')}
        >
          <span className="bottom-nav-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FolderOpen size={20} />
          </span>
          <span>More</span>
        </button>
      </nav>

      {/* Global Odometer Modal */}
      {showOdoModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Gauge size={20} style={{ color: 'var(--color-cyan)' }} />
                <span>Update Mechanical Odometer</span>
              </h2>
              <button className="close-btn" onClick={() => setShowOdoModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleOdoSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="global-odo">New Odometer Reading (km)</label>
                  <input 
                    type="number" 
                    id="global-odo" 
                    className="form-control" 
                    placeholder={`Must be higher than ${profile.currentOdometer}`}
                    value={odoInput}
                    onChange={(e) => setOdoInput(e.target.value)}
                    required
                  />
                  <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.4rem', lineHeight: '1.4' }}>
                    Adjusting this value triggers updates across all wear parts and mileage calculations.
                  </small>
                </div>
              </div>
              <div style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowOdoModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
