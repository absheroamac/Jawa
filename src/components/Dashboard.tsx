import React, { useState } from 'react';
import { 
  MotorcycleProfile, 
  MaintenanceSchedule, 
  MaintenanceRecord, 
  FuelRecord, 
  ExpenseRecord,
  BikeDocument
} from '../types';
import { 
  calculateCostPerKm, 
  calculateAverageMileage, 
  calculateHealthScore, 
  getDaysDiff 
} from '../utils';

interface DashboardProps {
  profile: MotorcycleProfile;
  schedules: MaintenanceSchedule[];
  records: MaintenanceRecord[];
  fuels: FuelRecord[];
  expenses: ExpenseRecord[];
  documents: BikeDocument[];
  onQuickLube: () => void;
  onQuickPolish: () => void;
  onLogOdo: (odo: number) => void;
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  profile,
  schedules,
  records,
  fuels,
  expenses,
  documents,
  onQuickLube,
  onQuickPolish,
  onLogOdo,
  onNavigate
}) => {
  const [odoInput, setOdoInput] = useState('');
  const [showOdoModal, setShowOdoModal] = useState(false);
  const currentDate = new Date().toISOString().split('T')[0];

  // Calculations
  const totalFuel = fuels.reduce((sum, f) => sum + f.totalAmount, 0);
  const totalMaint = records.reduce((sum, r) => sum + r.cost, 0);
  const totalOtherExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalCostOfOwnership = totalOtherExpenses + totalMaint + totalFuel;
  
  const costPerKm = calculateCostPerKm(profile.currentOdometer, expenses, records, fuels);
  const avgMileage = calculateAverageMileage(fuels);
  const healthBreakdown = calculateHealthScore(profile, schedules, documents, currentDate);

  // Identify high-priority alerts
  const alerts: string[] = [];
  
  // 1. Chain lube alert
  const lubeSchedule = schedules.find(s => s.id === "sch-lube");
  if (lubeSchedule && lubeSchedule.lastPerformedOdo) {
    const kmSinceLube = profile.currentOdometer - lubeSchedule.lastPerformedOdo;
    if (kmSinceLube >= (lubeSchedule.intervalKm || 500)) {
      alerts.push(`Chain Lubrication is overdue! (${kmSinceLube} km driven since last lubing)`);
    } else if (kmSinceLube >= (lubeSchedule.intervalKm || 500) - 100) {
      alerts.push(`Chain Lubrication due soon in ${500 - kmSinceLube} km.`);
    }
  }

  // 2. Oil alert
  const oilSchedule = schedules.find(s => s.id === "sch-oil");
  if (oilSchedule && oilSchedule.lastPerformedOdo) {
    const kmSinceOil = profile.currentOdometer - oilSchedule.lastPerformedOdo;
    if (kmSinceOil >= (oilSchedule.intervalKm || 5000)) {
      alerts.push(`Engine Oil Change is overdue! (${kmSinceOil} km since last oil change)`);
    } else if (kmSinceOil >= (oilSchedule.intervalKm || 5000) - 500) {
      alerts.push(`Engine Oil Change due in ${5000 - kmSinceOil} km.`);
    }
  }

  // 3. Document alerts
  documents.forEach(doc => {
    const daysToExpiry = getDaysDiff(currentDate, doc.expiryDate);
    if (daysToExpiry < 0) {
      alerts.push(`CRITICAL: ${doc.name} has EXPIRED!`);
    } else if (daysToExpiry <= 15) {
      alerts.push(`WARNING: ${doc.name} expires in ${daysToExpiry} days (${doc.expiryDate}).`);
    }
  });

  // 4. Chrome polish alert
  const polishSchedule = schedules.find(s => s.id === "sch-polish");
  if (polishSchedule && polishSchedule.lastPerformedDate) {
    const daysSincePolish = getDaysDiff(polishSchedule.lastPerformedDate, currentDate);
    if (daysSincePolish >= (polishSchedule.intervalDays || 30)) {
      alerts.push(`Chrome Polish is overdue! (${daysSincePolish} days since last polish)`);
    }
  }

  const handleOdoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newOdo = parseInt(odoInput);
    if (newOdo > profile.currentOdometer) {
      onLogOdo(newOdo);
      setShowOdoModal(false);
      setOdoInput('');
    } else {
      alert(`Odometer must be greater than current odometer (${profile.currentOdometer} km)`);
    }
  };

  // SVG Gauge calculations
  const strokeDash = 2 * Math.PI * 60; // radius = 60
  const strokeOffset = strokeDash - (strokeDash * healthBreakdown.overall) / 100;

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'var(--color-green)';
    if (score >= 75) return 'var(--color-amber)';
    return 'var(--color-crimson-bright)';
  };

  return (
    <div>
      {/* Dynamic Alerts Banner */}
      {alerts.length > 0 && (
        <div className="action-banner">
          <div className="action-banner-info">
            <div className="alert-pulse-circle"></div>
            <div>
              <h4 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-crimson-bright)', fontWeight: 700 }}>
                CRITICAL REMINDERS
              </h4>
              <ul style={{ listStyleType: 'none', marginTop: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {alerts.map((alert, idx) => (
                  <li key={idx} style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--color-amber)' }}>⚠️</span> {alert}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <button className="btn btn-danger" onClick={() => onNavigate('schedules')}>
            View Schedule
          </button>
        </div>
      )}

      {/* Metrics Counter Dashboard */}
      <div className="metrics-row">
        <div className="metric-box">
          <span className="metric-label">Odometer</span>
          <div className="metric-value">
            {profile.currentOdometer.toLocaleString()} <span>km</span>
          </div>
          <span className="metric-footer">Last logged: 2026-05-15</span>
        </div>
        <div className="metric-box">
          <span className="metric-label">Total Spent</span>
          <div className="metric-value">
            ₹{totalCostOfOwnership.toLocaleString()}
          </div>
          <span className="metric-footer">Includes purchase: ₹1.85L</span>
        </div>
        <div className="metric-box">
          <span className="metric-label">Fuel Expenses</span>
          <div className="metric-value">
            ₹{totalFuel.toLocaleString()} <span>({fuels.length} Refuels)</span>
          </div>
          <span className="metric-footer">Avg: ₹{Math.round(totalFuel / (fuels.length || 1))} / fill</span>
        </div>
        <div className="metric-box">
          <span className="metric-label">Maintenance Costs</span>
          <div className="metric-value">
            ₹{totalMaint.toLocaleString()}
          </div>
          <span className="metric-footer">{records.length} Service entries logged</span>
        </div>
        <div className="metric-box">
          <span className="metric-label">Average Mileage</span>
          <div className="metric-value">
            {avgMileage.toFixed(1)} <span>km/L</span>
          </div>
          <span className="metric-footer">Jawa Target: 32 - 35 km/L</span>
        </div>
        <div className="metric-box">
          <span className="metric-label">Running Cost</span>
          <div className="metric-value">
            ₹{costPerKm.toFixed(2)} <span>/ km</span>
          </div>
          <span className="metric-footer">Excluding purchase price</span>
        </div>
      </div>

      {/* Quick Action Operations */}
      <div className="section-header">
        <h2 className="section-title">Quick Garage Operations</h2>
      </div>
      <div className="quick-actions-bar">
        <button className="btn btn-primary" onClick={() => setShowOdoModal(true)}>
          ⚡ Update Odometer
        </button>
        <button className="btn btn-secondary" onClick={onQuickLube}>
          ⚙️ Clean & Lube Chain
        </button>
        <button className="btn btn-secondary" onClick={onQuickPolish}>
          ✨ Chrome Polish & Rust Check
        </button>
        <button className="btn btn-secondary" onClick={() => onNavigate('fuel')}>
          ⛽ Log Fuel Refill
        </button>
        <button className="btn btn-secondary" onClick={() => onNavigate('maintenance')}>
          🛠️ Log Service Invoice
        </button>
      </div>

      {/* Dashboard Primary Grid: Cockpit + Schedules */}
      <div className="dashboard-grid">
        {/* Cockpit Card (Health score) */}
        <div className="glass-card">
          <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', color: 'var(--color-gold)' }}>
            Motorcycle Health Cockpit
          </h3>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-around' }}>
            <div className="gauge-chart">
              <svg className="gauge-svg" viewBox="0 0 140 140">
                <circle className="gauge-bg" cx="70" cy="70" r="60" />
                <circle 
                  className="gauge-fill" 
                  cx="70" 
                  cy="70" 
                  r="60" 
                  stroke={getHealthColor(healthBreakdown.overall)}
                  strokeDasharray={strokeDash}
                  strokeDashoffset={strokeOffset}
                />
              </svg>
              <div className="gauge-center-text">
                <div className="gauge-percentage">{healthBreakdown.overall}%</div>
                <div className="gauge-label">Health</div>
              </div>
            </div>

            <div style={{ flex: 1, minWidth: '240px' }}>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Sub-System Status Checks
              </h4>
              
              <div className="progress-container" style={{ marginBottom: '0.8rem' }}>
                <div className="progress-header">
                  <span>Engine & Fuel Delivery</span>
                  <span>{healthBreakdown.engine}%</span>
                </div>
                <div className="progress-track">
                  <div 
                    className="progress-bar progress-green" 
                    style={{ width: `${healthBreakdown.engine}%`, background: getHealthColor(healthBreakdown.engine) }}
                  ></div>
                </div>
              </div>

              <div className="progress-container" style={{ marginBottom: '0.8rem' }}>
                <div className="progress-header">
                  <span>Sprockets & Drive Chain</span>
                  <span>{healthBreakdown.chain}%</span>
                </div>
                <div className="progress-track">
                  <div 
                    className="progress-bar progress-gold" 
                    style={{ width: `${healthBreakdown.chain}%`, background: getHealthColor(healthBreakdown.chain) }}
                  ></div>
                </div>
              </div>

              <div className="progress-container" style={{ marginBottom: '0.8rem' }}>
                <div className="progress-header">
                  <span>Exposed Chrome Polish</span>
                  <span>{healthBreakdown.chrome}%</span>
                </div>
                <div className="progress-track">
                  <div 
                    className="progress-bar progress-amber" 
                    style={{ width: `${healthBreakdown.chrome}%`, background: getHealthColor(healthBreakdown.chrome) }}
                  ></div>
                </div>
              </div>

              <div className="progress-container" style={{ marginBottom: '0.8rem' }}>
                <div className="progress-header">
                  <span>Electrical & Battery</span>
                  <span>{healthBreakdown.electrical}%</span>
                </div>
                <div className="progress-track">
                  <div 
                    className="progress-bar progress-cyan" 
                    style={{ width: `${healthBreakdown.electrical}%`, background: getHealthColor(healthBreakdown.electrical) }}
                  ></div>
                </div>
              </div>

              <div className="progress-container">
                <div className="progress-header">
                  <span>Vault Documents Validity</span>
                  <span>{healthBreakdown.documents}%</span>
                </div>
                <div className="progress-track">
                  <div 
                    className="progress-bar progress-crimson" 
                    style={{ width: `${healthBreakdown.documents}%`, background: getHealthColor(healthBreakdown.documents) }}
                  ></div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Upcoming Schedules Brief */}
        <div className="glass-card">
          <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', color: 'var(--color-gold)' }}>
            Upcoming Tasks
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {schedules
              .map(s => {
                let status: 'good' | 'due' | 'overdue' = 'good';
                let reason = '';
                
                if (s.intervalKm && s.lastPerformedOdo) {
                  const kmPassed = profile.currentOdometer - s.lastPerformedOdo;
                  const kmLeft = s.intervalKm - kmPassed;
                  if (kmLeft <= 0) {
                    status = 'overdue';
                    reason = `${Math.abs(kmLeft)} km overdue`;
                  } else if (kmLeft <= 100) {
                    status = 'due';
                    reason = `due in ${kmLeft} km`;
                  } else {
                    reason = `${kmLeft} km remaining`;
                  }
                } else if (s.intervalDays && s.lastPerformedDate) {
                  const daysPassed = getDaysDiff(s.lastPerformedDate, currentDate);
                  const daysLeft = s.intervalDays - daysPassed;
                  if (daysLeft <= 0) {
                    status = 'overdue';
                    reason = `${Math.abs(daysLeft)} days overdue`;
                  } else if (daysLeft <= 7) {
                    status = 'due';
                    reason = `due in ${daysLeft} days`;
                  } else {
                    reason = `${daysLeft} days remaining`;
                  }
                }
                
                return { ...s, status, reason };
              })
              .sort((a, b) => {
                const priorityOrder = { overdue: 0, due: 1, good: 2 };
                return priorityOrder[a.status] - priorityOrder[b.status];
              })
              .slice(0, 4)
              .map(s => (
                <div 
                  key={s.id} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '0.65rem 0.85rem', 
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.03)'
                  }}
                >
                  <div>
                    <h5 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.85rem' }}>
                      {s.name}
                    </h5>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Category: {s.category}
                    </span>
                  </div>
                  <span className={`badge ${
                    s.status === 'overdue' ? 'badge-danger' : s.status === 'due' ? 'badge-warning' : 'badge-success'
                  }`}>
                    {s.reason}
                  </span>
                </div>
              ))
            }
          </div>
          <button 
            className="btn btn-secondary" 
            style={{ width: '100%', marginTop: '1.25rem', fontSize: '0.8rem' }}
            onClick={() => onNavigate('schedules')}
          >
            Manage All {schedules.length} Tasks
          </button>
        </div>
      </div>

      {/* Odometer Modal */}
      {showOdoModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>⚡ Update Odometer</h2>
              <button className="close-btn" onClick={() => setShowOdoModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleOdoSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="odo">Current Odometer Value (km)</label>
                  <input 
                    type="number" 
                    id="odo" 
                    className="form-control" 
                    placeholder={`Must be > ${profile.currentOdometer}`}
                    value={odoInput}
                    onChange={(e) => setOdoInput(e.target.value)}
                    required
                  />
                  <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.4rem' }}>
                    Updating odometer will adjust due distances for all maintenance presets.
                  </small>
                </div>
              </div>
              <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowOdoModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Odometer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
