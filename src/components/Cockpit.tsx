import React from 'react';
import { 
  MotorcycleProfile, 
  MaintenanceSchedule, 
  MaintenanceRecord, 
  FuelRecord, 
  ExpenseRecord,
  BikeDocument
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
  onQuickLube,
  onQuickPolish,
  onNavigate
}) => {
  const currentDate = new Date().toISOString().split('T')[0];

  // Calculations
  const avgMileage = calculateAverageMileage(fuels);
  const health = calculateHealthScore(profile, schedules, documents, currentDate);
  const costPerKm = calculateCostPerKm(profile.currentOdometer, expenses, records, fuels);
  
  const totalFuel = fuels.reduce((sum, f) => sum + f.totalAmount, 0);
  const totalMaint = records.reduce((sum, r) => sum + r.cost, 0);
  const totalOtherExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalTCO = totalOtherExpenses + totalMaint + totalFuel;

  // ECU fault codes generator
  interface FaultCode {
    code: string;
    description: string;
    severity: 'ERROR' | 'WARNING';
    action: () => void;
    actionLabel: string;
  }

  const faultCodes: FaultCode[] = [];

  // Lube fault check
  const lubeSchedule = schedules.find(s => s.id === "sch-lube");
  if (lubeSchedule && lubeSchedule.lastPerformedOdo) {
    const kmSinceLube = profile.currentOdometer - lubeSchedule.lastPerformedOdo;
    if (kmSinceLube >= (lubeSchedule.intervalKm || 500)) {
      faultCodes.push({
        code: "ERR-CHN-500",
        description: `Chain clean & lubrication overdue by ${kmSinceLube - 500} km`,
        severity: 'ERROR',
        action: onQuickLube,
        actionLabel: "🔧 Lube Chain"
      });
    }
  }

  // Oil fault check
  const oilSchedule = schedules.find(s => s.id === "sch-oil");
  if (oilSchedule && oilSchedule.lastPerformedOdo) {
    const kmSinceOil = profile.currentOdometer - oilSchedule.lastPerformedOdo;
    if (kmSinceOil >= (oilSchedule.intervalKm || 5000)) {
      faultCodes.push({
        code: "ERR-ENG-010",
        description: `Engine oil change overdue by ${kmSinceOil - 5000} km`,
        severity: 'ERROR',
        action: () => onNavigate('garage'),
        actionLabel: "🛠️ Open Garage"
      });
    }
  }

  // Chrome polish check
  const polishSchedule = schedules.find(s => s.id === "sch-polish");
  if (polishSchedule && polishSchedule.lastPerformedDate) {
    const daysSincePolish = getDaysDiff(polishSchedule.lastPerformedDate, currentDate);
    if (daysSincePolish >= (polishSchedule.intervalDays || 30)) {
      faultCodes.push({
        code: "WARN-CHM-030",
        description: `Chrome polish overdue (${daysSincePolish} days since last wax)`,
        severity: 'WARNING',
        action: onQuickPolish,
        actionLabel: "✨ Polish Chrome"
      });
    }
  }

  // Documents check
  documents.forEach(doc => {
    const daysLeft = getDaysDiff(currentDate, doc.expiryDate);
    if (daysLeft < 0) {
      faultCodes.push({
        code: "ERR-DOC-999",
        description: `CRITICAL: ${doc.name} has EXPIRED!`,
        severity: 'ERROR',
        action: () => onNavigate('vault'),
        actionLabel: "📄 Expiry Vault"
      });
    } else if (daysLeft <= 15) {
      faultCodes.push({
        code: "WARN-DOC-015",
        description: `Certificate ${doc.name} expiring in ${daysLeft} days`,
        severity: 'WARNING',
        action: () => onNavigate('vault'),
        actionLabel: "📄 Review Vault"
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
            <span className="premium-stat-val">{avgMileage ? `${Math.round(avgMileage * 14)} km` : 'N/A'}</span>
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
                  {f.actionLabel.replace(/[^\w\s]/g, '').trim()}
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Simple metadata count to ensure compliance with records/expenses props in CockpitProps */}
        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.75rem', textAlign: 'right', opacity: 0.7 }}>
          {records.length} service logs • {expenses.length} expense entries
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
                Oil Change: {5000 - (profile.currentOdometer - (schedules.find(s => s.id === "sch-oil")?.lastPerformedOdo || 0))} km left
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
                Last clean/lube: {profile.currentOdometer - (schedules.find(s => s.id === "sch-lube")?.lastPerformedOdo || 0)} km ago
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
                Last polish: {getDaysDiff(schedules.find(s => s.id === "sch-polish")?.lastPerformedDate || currentDate, currentDate)} days ago
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
                Exide Battery: Healthy (Swapped Jan 2026)
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
