import React, { useState } from 'react';
import { PartLifecycle, MotorcycleProfile } from '../types';

interface PartsLifecycleProps {
  profile: MotorcycleProfile;
  parts: PartLifecycle[];
  onReplacePart: (partId: string, brand: string, cost: number, odo: number, date: string) => void;
}

export const PartsLifecycle: React.FC<PartsLifecycleProps> = ({
  profile,
  parts,
  onReplacePart
}) => {
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [selectedPart, setSelectedPart] = useState<PartLifecycle | null>(null);

  // Form Fields
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [odometer, setOdometer] = useState(profile.currentOdometer.toString());
  const [brand, setBrand] = useState('');
  const [cost, setCost] = useState('');

  const getPartLifecycle = (part: PartLifecycle) => {
    const kmDriven = profile.currentOdometer - part.installedOdo;
    const remainingKm = Math.max(0, part.expectedLifespanKm - kmDriven);
    const usagePercent = Math.min(100, (kmDriven / part.expectedLifespanKm) * 100);

    let status = 'Good';
    let statusClass = 'badge-success';
    let barColor = 'progress-green';

    if (usagePercent >= 90) {
      status = 'Replace Immediate';
      statusClass = 'badge-danger';
      barColor = 'progress-crimson';
    } else if (usagePercent >= 70) {
      status = 'Monitor Closely';
      statusClass = 'badge-warning';
      barColor = 'progress-amber';
    }

    return { kmDriven, remainingKm, usagePercent, status, statusClass, barColor };
  };

  const handleReplacementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPart || !brand || !cost || !odometer) return;

    onReplacePart(
      selectedPart.id,
      brand,
      parseFloat(cost),
      parseInt(odometer),
      date
    );

    setSelectedPart(null);
    setBrand('');
    setCost('');
    setShowReplaceModal(false);
  };

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">Critical Components Wear Monitor</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {parts.map(part => {
          const { kmDriven, remainingKm, usagePercent, status, statusClass, barColor } = getPartLifecycle(part);
          return (
            <div className="glass-card" key={part.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: 'white' }}>
                      {part.name}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Current: {part.brand}
                    </span>
                  </div>
                  <span className={`badge ${statusClass}`}>
                    {status}
                  </span>
                </div>

                <div className="progress-container" style={{ margin: '1rem 0' }}>
                  <div className="progress-header">
                    <span>Lifespan: {part.expectedLifespanKm.toLocaleString()} km</span>
                    <span>{kmDriven.toLocaleString()} km used ({Math.round(usagePercent)}%)</span>
                  </div>
                  <div className="progress-track">
                    <div className={`progress-bar ${barColor}`} style={{ width: `${usagePercent}%` }}></div>
                  </div>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.3rem', margin: '0.75rem 0' }}>
                  <div>📅 Installed: <strong>{part.installedDate}</strong> @ <strong>{part.installedOdo.toLocaleString()} km</strong></div>
                  <div>⏳ Estimated Remaining: <strong style={{ color: remainingKm < 1500 ? 'var(--color-crimson-bright)' : 'white' }}>{remainingKm.toLocaleString()} km</strong></div>
                </div>
              </div>

              <button 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '0.75rem', fontSize: '0.8rem', padding: '0.5rem' }}
                onClick={() => {
                  setSelectedPart(part);
                  setBrand(part.brand);
                  setOdometer(profile.currentOdometer.toString());
                  setShowReplaceModal(true);
                }}
              >
                ⚙️ Replace Component
              </button>
            </div>
          );
        })}
      </div>

      {/* Replacement Modal */}
      {showReplaceModal && selectedPart && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>🛠️ Log Replacement: {selectedPart.name}</h2>
              <button className="close-btn" onClick={() => setShowReplaceModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleReplacementSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="rep-date">Installation Date</label>
                    <input 
                      type="date" 
                      id="rep-date" 
                      className="form-control" 
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="rep-odo">Installation Odometer (km)</label>
                    <input 
                      type="number" 
                      id="rep-odo" 
                      className="form-control" 
                      value={odometer}
                      onChange={(e) => setOdometer(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="rep-brand">New Part Brand / Model</label>
                  <input 
                    type="text" 
                    id="rep-brand" 
                    className="form-control" 
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="rep-cost">Cost of Part & Service (₹)</label>
                  <input 
                    type="number" 
                    id="rep-cost" 
                    className="form-control" 
                    placeholder="e.g. 3500"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowReplaceModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Confirm Replacement</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
