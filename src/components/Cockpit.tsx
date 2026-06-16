import React from 'react';
import { 
  MotorcycleProfile, 
  MaintenanceSchedule, 
  MaintenanceRecord, 
  FuelRecord, 
  ExpenseRecord,
  BikeDocument,
  PartLifecycle
} from '../types';
import { 
  calculateAverageMileage, 
  calculateHealthScore, 
  getDaysDiff,
  calculateCostPerKm
} from '../utils';
import { 
  Activity, 
  Fuel, 
  Link, 
  Sparkles, 
  Wrench, 
  Lock, 
  Unlock, 
  ShieldCheck, 
  Cpu, 
  Zap,
  Gauge,
  TrendingUp,
  Coins
} from 'lucide-react';

interface CockpitProps {
  profile: MotorcycleProfile;
  schedules: MaintenanceSchedule[];
  records: MaintenanceRecord[];
  fuels: FuelRecord[];
  expenses: ExpenseRecord[];
  documents: BikeDocument[];
  parts: PartLifecycle[];
  onQuickLube: () => void;
  onQuickPolish: () => void;
  onNavigate: (tab: string) => void;
}

export const Cockpit: React.FC<CockpitProps> = ({
  profile,
  schedules,
  records,
  fuels,
  expenses,
  documents,
  parts,
  onQuickLube,
  onQuickPolish,
  onNavigate
}) => {
  const currentDate = new Date().toISOString().split('T')[0];

  // Calculations
  const avgMileage = calculateAverageMileage(fuels);
  const health = calculateHealthScore(profile, schedules, documents, parts, currentDate);
  const costPerKm = calculateCostPerKm(profile.currentOdometer, expenses, records, fuels);
  
  // Same logic as Vault TCO — fuels[] and records[] are source of truth;
  // expenses[] only contributes manual categories to avoid double-counting.
  const AUTO_EXPENSE_CATEGORIES = new Set(['Fuel', 'Service', 'Repairs', 'Washing']);
  const totalFuel = fuels.reduce((sum, f) => sum + f.totalAmount, 0);
  const totalMaint = records.reduce((sum, r) => sum + r.cost, 0);
  const totalOtherExpenses = expenses
    .filter(e => !AUTO_EXPENSE_CATEGORIES.has(e.category))
    .reduce((sum, e) => sum + e.amount, 0);
  const totalTCO = totalFuel + totalMaint + totalOtherExpenses;

  // Predictive remaining range: (avg km/L × full-tank capacity) − km driven since last full fill
  const TANK_CAPACITY = 14;
  const sortedFuels = [...fuels].sort((a, b) => a.odometer - b.odometer);
  const lastFullFill = [...sortedFuels].reverse().find(f => f.sameLevel);
  const kmSinceLastFill = lastFullFill ? profile.currentOdometer - lastFullFill.odometer : null;
  const predictiveRange = avgMileage && kmSinceLastFill !== null
    ? Math.max(0, Math.round(avgMileage * TANK_CAPACITY - kmSinceLastFill))
    : avgMileage
      ? Math.round(avgMileage * TANK_CAPACITY)
      : null;

  // ECU fault codes generator
  interface FaultCode {
    code: string;
    description: string;
    severity: 'ERROR' | 'WARNING';
    action: () => void;
    actionLabel: string;
  }

  const faultCodes: FaultCode[] = [];

  // Helper: km-based schedule overdue check
  const checkKmSchedule = (
    id: string, code: string, label: string,
    action: () => void, actionLabel: string,
    severity: 'ERROR' | 'WARNING' = 'ERROR'
  ) => {
    const sch = schedules.find(s => s.id === id);
    if (!sch?.lastPerformedOdo) return;
    const interval = sch.intervalKm || 0;
    const overdue = (profile.currentOdometer - sch.lastPerformedOdo) - interval;
    if (overdue >= 0) {
      faultCodes.push({ code, description: `${label} overdue by ${overdue} km`, severity, action, actionLabel });
    }
  };

  // Helper: day-based schedule overdue check
  const checkDaySchedule = (
    id: string, code: string, label: string,
    action: () => void, actionLabel: string,
    severity: 'ERROR' | 'WARNING' = 'WARNING'
  ) => {
    const sch = schedules.find(s => s.id === id);
    if (!sch?.lastPerformedDate) return;
    const interval = sch.intervalDays || 0;
    const overdue = getDaysDiff(sch.lastPerformedDate, currentDate) - interval;
    if (overdue >= 0) {
      faultCodes.push({ code, description: `${label} overdue by ${overdue} days`, severity, action, actionLabel });
    }
  };

  checkKmSchedule('sch-oil',      'ERR-ENG-010', 'Engine oil change',          () => onNavigate('garage'), 'Open Garage');
  checkKmSchedule('sch-filter',   'ERR-ENG-020', 'Oil filter change',           () => onNavigate('garage'), 'Open Garage');
  checkKmSchedule('sch-lube',     'ERR-CHN-500', 'Chain clean & lubrication',   onQuickLube,                'Lube Chain');
  checkKmSchedule('sch-adjust',   'WARN-CHN-100','Chain tension adjustment',    () => onNavigate('garage'), 'Open Garage', 'WARNING');
  checkKmSchedule('sch-fuel-sys', 'WARN-FUL-400','Fuel system cleaner (additive)', () => onNavigate('fuel'), 'Fuel Log', 'WARNING');
  checkDaySchedule('sch-polish',  'WARN-CHM-030','Chrome polish',               onQuickPolish,              'Polish Chrome');
  checkDaySchedule('sch-rust',    'WARN-CHM-045','Rust & corrosion inspection', () => onNavigate('logs'),   'View Logs');
  checkDaySchedule('sch-battery', 'WARN-ELC-090','Battery inspection',          () => onNavigate('garage'), 'Open Garage');

  // Parts wear check — warn when any part hits 90%+ of lifespan
  parts.forEach(part => {
    const kmDriven = profile.currentOdometer - part.installedOdo;
    const usagePercent = Math.min(100, (kmDriven / part.expectedLifespanKm) * 100);
    if (usagePercent >= 90) {
      faultCodes.push({
        code: 'WARN-PRT-090',
        description: `${part.name} at ${Math.round(usagePercent)}% life — replacement due soon`,
        severity: 'WARNING',
        action: () => onNavigate('garage'),
        actionLabel: 'Open Garage'
      });
    }
  });

  // Documents check
  documents.forEach(doc => {
    const daysLeft = getDaysDiff(currentDate, doc.expiryDate);
    if (daysLeft < 0) {
      faultCodes.push({
        code: "ERR-DOC-999",
        description: `CRITICAL: ${doc.name} has EXPIRED!`,
        severity: 'ERROR',
        action: () => onNavigate('vault'),
        actionLabel: "Expiry Vault"
      });
    } else if (daysLeft <= 15) {
      faultCodes.push({
        code: "WARN-DOC-015",
        description: `Certificate ${doc.name} expiring in ${daysLeft} days`,
        severity: 'WARNING',
        action: () => onNavigate('vault'),
        actionLabel: "Review Vault"
      });
    }
  });

  const getDialColor = (score: number) => {
    if (score >= 90) return '#10b981'; // Green
    if (score >= 70) return '#f59e0b'; // Amber
    return '#ff3e3e'; // Crimson
  };

  return (
    <div>
      {/* 1. SEAMLESS BIKE HERO PLATFORM */}
      <div style={{ padding: '0 0.25rem', marginBottom: '0.5rem', position: 'relative' }}>
        <div className="hero-bike-container" style={{ margin: '0.5rem 0 1.25rem 0', height: '285px' }}>
          <svg className="bike-platform-svg" viewBox="0 0 500 100">
            <defs>
              <linearGradient id="platformBorderGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={getDialColor(health.overall)} stopOpacity="0.05" />
                <stop offset="100%" stopColor={getDialColor(health.overall)} stopOpacity="1.0" />
              </linearGradient>
              <linearGradient id="platformFillGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={getDialColor(health.overall)} stopOpacity="0.0" />
                <stop offset="100%" stopColor={getDialColor(health.overall)} stopOpacity="0.15" />
              </linearGradient>
            </defs>
            <ellipse cx="250" cy="50" rx="240" ry="46" fill="url(#platformFillGrad)" stroke="url(#platformBorderGrad)" strokeWidth="3" />
          </svg>
          <img 
            src="/Adobe Express - file.png" 
            className="hero-bike-image" 
            alt="Motorcycle Specs" 
            style={{ maxHeight: '265px', transform: 'translateY(-4px) scale(1.02)' }}
          />
        </div>
      </div>

      {/* 2. STAT INDICATOR GRID (Styled exactly like reference design: Battery & Range) */}
      <div className="premium-stat-grid">
        <div className="premium-stat-card">
          <div className="premium-stat-info">
            <span className="premium-stat-lbl">Bike Health</span>
            <span className="premium-stat-val" style={{ color: getDialColor(health.overall) }}>{health.overall}%</span>
          </div>
          <div className="premium-icon-badge" style={{ color: getDialColor(health.overall) }}>
            <Activity size={18} />
          </div>
        </div>

        <div className="premium-stat-card">
          <div className="premium-stat-info">
            <span className="premium-stat-lbl">Predictive Range</span>
            <span className="premium-stat-val">{predictiveRange !== null ? `${predictiveRange} km` : 'N/A'}</span>
          </div>
          <div className="premium-icon-badge" style={{ color: 'var(--color-cyan)' }}>
            <Fuel size={18} />
          </div>
        </div>
      </div>

      {/* 3. THREE IMPORTANT METRICS GRID */}
      <div className="premium-action-grid">
        {/* Metric 1: Average Mileage */}
        <div className="premium-action-card" onClick={() => onNavigate('fuel')} style={{ cursor: 'pointer', padding: '1.25rem 0.5rem', height: '110px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="premium-action-icon" style={{ color: 'var(--color-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Gauge size={22} />
          </span>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'white', marginTop: '0.35rem' }}>
            {avgMileage ? avgMileage.toFixed(1) : 'N/A'}
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginLeft: '0.15rem' }}> km/L</span>
          </span>
          <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase' }}>Avg Mileage</span>
        </div>

        {/* Metric 2: Cost Per Kilometer */}
        <div className="premium-action-card" onClick={() => onNavigate('logs')} style={{ cursor: 'pointer', padding: '1.25rem 0.5rem', height: '110px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="premium-action-icon" style={{ color: 'var(--color-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={22} />
          </span>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'white', marginTop: '0.35rem' }}>
            ₹{costPerKm ? costPerKm.toFixed(2) : '0.00'}
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginLeft: '0.15rem' }}> / km</span>
          </span>
          <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase' }}>Cost / km</span>
        </div>

        {/* Metric 3: Total TCO */}
        <div className="premium-action-card" onClick={() => onNavigate('vault')} style={{ cursor: 'pointer', padding: '1.25rem 0.5rem', height: '110px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="premium-action-icon" style={{ color: 'var(--color-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Coins size={22} />
          </span>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'white', marginTop: '0.35rem' }}>
            ₹{(totalTCO / 1000).toFixed(1)}k
          </span>
          <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase' }}>Total TCO</span>
        </div>
      </div>

      {/* 4. PRIMARY CONTROLS SEGMENTED BAR (Circular Bell buttons + Massive pill button) */}
      <div className="premium-control-bar">
        {/* Left Circular Button - Headlight/Diagnostic shortcut */}
        <button 
          className="control-circle-btn" 
          onClick={() => onNavigate('garage')}
          title="Check Periodic Schedules"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Wrench size={18} />
        </button>

        {/* Center Pill Primary Action Button - Turn On Style */}
        <button 
          className="control-pill-btn" 
          onClick={() => onNavigate('fuel')}
        >
          <Fuel size={16} />
          <span>Log Fuel Refill</span>
        </button>

        {/* Right Circular Button - Lock secure state indicator based on fault count */}
        <button 
          className="control-circle-btn" 
          onClick={() => onNavigate('vault')}
          title="Security Validity Count"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: faultCodes.length === 0 ? 'var(--color-green)' : 'var(--color-amber)' }}
        >
          {faultCodes.length === 0 ? <Lock size={18} /> : <Unlock size={18} />}
        </button>
      </div>

      {/* 5. SYSTEM NOTIFICATIONS BOARD (Clean modern replacements for ugly blocky terminal) */}
      <div className="ecu-console">
        {/* Modern Title bar inside the card */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.45rem', borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Quick Status
          </span>
          <span className="badge" style={{ background: faultCodes.length === 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', color: faultCodes.length === 0 ? 'var(--color-green)' : 'var(--color-crimson)', fontSize: '0.6rem', padding: '0.15rem 0.45rem', borderRadius: '8px' }}>
            {faultCodes.length === 0 ? 'Nominal' : `${faultCodes.length} Alerts`}
          </span>
        </div>

        {faultCodes.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.5rem 0' }}>
            <ShieldCheck size={20} style={{ color: 'var(--color-green)' }} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Everything looks good. Your bike is in great shape.
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {faultCodes.map((f, idx) => (
              <div key={idx} className="ecu-fault-line">
                <div className="ecu-fault-info">
                  <span className={`ecu-fault-dot ${f.severity === 'ERROR' ? 'error' : 'warning'}`}></span>
                  <span className="ecu-fault-message">{f.description}</span>
                </div>
                <button 
                  className="ecu-fault-btn" 
                  onClick={f.action}
                >
                  {f.actionLabel}
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Simple metadata count to ensure compliance with records/expenses props in CockpitProps */}
        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.75rem', textAlign: 'right', opacity: 0.7 }}>
          {records.length} service logs • {expenses.filter(e => e.category !== 'Fuel').length} expense entries
        </div>
      </div>

      {/* 6. DIAGNOSTICS SUB-SYSTEM GRID CARDS */}
      <div className="section-header">
        <h2 className="section-title">Status Overview</h2>
      </div>

      <div className="diagnostic-sub-grid">
        {/* Engine Diagnostics */}
        <div className="diagnostic-sub-card" style={{ borderRadius: '20px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '125px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Cpu size={18} style={{ color: 'var(--color-cyan)' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: getDialColor(health.engine) }}>{health.engine}%</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.65rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, fontFamily: 'var(--font-display)', color: 'white' }}>Engine & Spark</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                {(() => {
                  const sch = schedules.find(s => s.id === "sch-oil");
                  if (!sch?.lastPerformedOdo) return 'Oil change: never logged';
                  const interval = sch.intervalKm || 5000;
                  const kmLeft = interval - (profile.currentOdometer - sch.lastPerformedOdo);
                  return kmLeft > 0 ? `Oil change: ${kmLeft} km left` : `Oil change: ${Math.abs(kmLeft)} km overdue`;
                })()}
              </span>
            </div>
          </div>
          {health.engine < 90 && (
            <button 
              className="btn btn-secondary" 
              style={{ fontSize: '0.7rem', padding: '0.35rem 0.5rem', width: '100%', marginTop: '0.75rem', borderRadius: '12px' }}
              onClick={() => onNavigate('garage')}
            >
              View Garage
            </button>
          )}
        </div>

        {/* Sprockets & Chain Diagnostics */}
        <div className="diagnostic-sub-card" style={{ borderRadius: '20px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '125px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link size={18} style={{ color: 'var(--color-green)' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: getDialColor(health.chain) }}>{health.chain}%</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.65rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, fontFamily: 'var(--font-display)', color: 'white' }}>Sprocket & Chain</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                {(() => {
                  const lube = schedules.find(s => s.id === "sch-lube");
                  const adjust = schedules.find(s => s.id === "sch-adjust");
                  const lubeLine = lube?.lastPerformedOdo
                    ? `Lube: ${profile.currentOdometer - lube.lastPerformedOdo} km ago`
                    : 'Lube: never logged';
                  const adjustInterval = adjust?.intervalKm || 1000;
                  const adjustLeft = adjust?.lastPerformedOdo
                    ? adjustInterval - (profile.currentOdometer - adjust.lastPerformedOdo)
                    : null;
                  const tensionLine = adjustLeft === null
                    ? 'Tension: never logged'
                    : adjustLeft > 0
                      ? `Tension: ${adjustLeft} km left`
                      : `Tension: ${Math.abs(adjustLeft)} km overdue`;
                  return `${lubeLine} · ${tensionLine}`;
                })()}
              </span>
            </div>
          </div>
          {health.chain < 90 && (
            <button 
              className="btn btn-primary" 
              style={{ fontSize: '0.7rem', padding: '0.35rem 0.5rem', width: '100%', marginTop: '0.75rem', borderRadius: '12px' }}
              onClick={onQuickLube}
            >
              Quick Clean & Lube
            </button>
          )}
        </div>

        {/* Chrome & Metal Detailing */}
        <div className="diagnostic-sub-card" style={{ borderRadius: '20px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '125px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Sparkles size={18} style={{ color: 'var(--color-amber)' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: getDialColor(health.chrome) }}>{health.chrome}%</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.65rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, fontFamily: 'var(--font-display)', color: 'white' }}>Chrome & Metal</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                {(() => {
                  const sch = schedules.find(s => s.id === "sch-polish");
                  if (!sch?.lastPerformedDate) return 'Polish: never logged';
                  return `Last polish: ${getDaysDiff(sch.lastPerformedDate, currentDate)} days ago`;
                })()}
              </span>
            </div>
          </div>
          {health.chrome < 90 && (
            <button 
              className="btn btn-primary" 
              style={{ fontSize: '0.7rem', padding: '0.35rem 0.5rem', width: '100%', marginTop: '0.75rem', borderRadius: '12px' }}
              onClick={onQuickPolish}
            >
              Quick Detailing Wax
            </button>
          )}
        </div>

        {/* Battery & Spark */}
        <div className="diagnostic-sub-card" style={{ borderRadius: '20px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '125px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Zap size={18} style={{ color: 'var(--color-cyan)' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: getDialColor(health.electrical) }}>{health.electrical}%</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.65rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, fontFamily: 'var(--font-display)', color: 'white' }}>Battery & Spark</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                {(() => {
                  const sch = schedules.find(s => s.id === "sch-battery");
                  if (!sch?.lastPerformedDate) return 'Battery: never inspected';
                  const daysSince = getDaysDiff(sch.lastPerformedDate, currentDate);
                  const interval = sch.intervalDays || 90;
                  const daysLeft = interval - daysSince;
                  return daysLeft > 0
                    ? `Battery inspection: ${daysLeft} days left`
                    : `Battery inspection: ${Math.abs(daysLeft)} days overdue`;
                })()}
              </span>
            </div>
          </div>
          {health.electrical < 90 && (
            <button 
              className="btn btn-secondary" 
              style={{ fontSize: '0.7rem', padding: '0.35rem 0.5rem', width: '100%', marginTop: '0.75rem', borderRadius: '12px' }}
              onClick={() => onNavigate('garage')}
            >
              Check Garage
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
