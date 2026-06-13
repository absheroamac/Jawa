import React, { useState } from 'react';
import { ChromePart, FuelAdditiveRecord, MotorcycleProfile } from '../types';
import { getDaysDiff } from '../utils';

interface ChromeAndAdditivesProps {
  profile: MotorcycleProfile;
  chromeParts: ChromePart[];
  additives: FuelAdditiveRecord[];
  onAddAdditive: (record: Omit<FuelAdditiveRecord, 'id'>) => void;
  onPolishChrome: (partId: string) => void;
  onInspectChrome: (partId: string) => void;
}

export const ChromeAndAdditives: React.FC<ChromeAndAdditivesProps> = ({
  profile,
  chromeParts,
  additives,
  onAddAdditive,
  onPolishChrome,
  onInspectChrome
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Additive Form fields
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [odometer, setOdometer] = useState(profile.currentOdometer.toString());
  const [brand, setBrand] = useState('Liqui Moly 4T Additive');
  const [quantityMl, setQuantityMl] = useState('125');
  const [cost, setCost] = useState('380');

  const currentDate = new Date().toISOString().split('T')[0];

  const handleAdditiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand || !quantityMl || !cost || !odometer) return;

    onAddAdditive({
      date,
      odometer: parseInt(odometer),
      brand,
      quantityMl: parseInt(quantityMl),
      cost: parseFloat(cost)
    });

    setShowAddModal(false);
  };

  const getPartStatus = (part: ChromePart) => {
    const daysSincePolish = getDaysDiff(part.lastPolishedDate, currentDate);
    const daysSinceInspect = getDaysDiff(part.lastInspectedDate, currentDate);

    let status = 'Good';
    let statusClass = 'badge-success';
    let recommendations = [];

    if (daysSincePolish >= 30) {
      status = 'Needs Polish';
      statusClass = 'badge-warning';
      recommendations.push('Polishing overdue');
    }
    if (daysSinceInspect >= 45) {
      status = 'Needs Inspection';
      statusClass = 'badge-danger';
      recommendations.push('Rust inspection overdue');
    }

    return {
      daysSincePolish,
      daysSinceInspect,
      status,
      statusClass,
      recommendation: recommendations.join(' & ') || 'Maintained'
    };
  };

  return (
    <div>
      {/* Chrome Detailing Section */}
      <div className="section-header">
        <h2 className="section-title">Classic Chrome Care Module</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-gold)', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
            Chrome Parts Detailing Dashboard
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
            Jawa Classic is famous for its gorgeous dual exhausts and extensive mirror-finish chrome trim. Regular polishing with protective wax and detailed rust checks are essential, especially during the monsoon, to preserve the metallic shine and prevent pit corrosion.
          </p>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Component Name</th>
                  <th>Last Polished</th>
                  <th>Last Inspected</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {chromeParts.map(part => {
                  const { daysSincePolish, daysSinceInspect, status, statusClass, recommendation } = getPartStatus(part);
                  return (
                    <tr key={part.id}>
                      <td style={{ fontWeight: 600, color: 'white' }}>{part.name}</td>
                      <td>
                        <div>{part.lastPolishedDate}</div>
                        <small style={{ color: 'var(--text-muted)' }}>({daysSincePolish} days ago)</small>
                      </td>
                      <td>
                        <div>{part.lastInspectedDate}</div>
                        <small style={{ color: 'var(--text-muted)' }}>({daysSinceInspect} days ago)</small>
                      </td>
                      <td>
                        <span className={`badge ${statusClass}`}>
                          {status}
                        </span>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          {recommendation}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                            onClick={() => onPolishChrome(part.id)}
                          >
                            ✨ Polish
                          </button>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                            onClick={() => onInspectChrome(part.id)}
                          >
                            🔍 Inspect
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Fuel Additive Section */}
      <div className="section-header">
        <h2 className="section-title">BS4 Fuel System Safeguards</h2>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          🧪 Log Additive Usage
        </button>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: '1.2fr 0.8fr' }}>
        {/* History Table */}
        <div className="glass-card">
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-gold)', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
            Additive Refinement Log
          </h3>
          <div className="table-container">
            {additives.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                No additives logged. Use standard fuel cleaners every 4,000 km to protect the injection nozzles.
              </div>
            ) : (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Odometer</th>
                    <th>Additive Brand</th>
                    <th>Quantity (ml)</th>
                    <th>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {additives
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map(add => (
                      <tr key={add.id}>
                        <td style={{ fontWeight: 500 }}>{add.date}</td>
                        <td>{add.odometer.toLocaleString()} km</td>
                        <td style={{ fontWeight: 600, color: 'white' }}>{add.brand}</td>
                        <td>{add.quantityMl} ml</td>
                        <td style={{ color: 'var(--color-gold)', fontWeight: 700 }}>₹{add.cost}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Informative Guidance */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h4 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-gold)', marginBottom: '0.75rem' }}>
            Protecting BS4 Injectors
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '0.75rem' }}>
            Older BS4 compliant Jawa models feature tight injector apertures optimized for clean, lead-free regular petrol. The high levels of moisture, carbon content, and gum-lacquer residues in contemporary ethanol blends can clog fuel injector nozzles quickly.
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            <strong>Recommendation:</strong> Use 100ml to 125ml of concentrated fuel injector cleaners (such as Liqui Moly 4T Additive or Motul System Clean) directly inside the petrol tank every 4,000 km.
          </p>
        </div>
      </div>

      {/* Additive Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>🧪 Log Additive Usage</h2>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleAdditiveSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="add-date">Date</label>
                    <input 
                      type="date" 
                      id="add-date" 
                      className="form-control" 
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="add-odo">Odometer (km)</label>
                    <input 
                      type="number" 
                      id="add-odo" 
                      className="form-control" 
                      value={odometer}
                      onChange={(e) => setOdometer(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="add-brand">Additive Brand Name</label>
                  <input 
                    type="text" 
                    id="add-brand" 
                    className="form-control" 
                    placeholder="e.g. Liqui Moly 4T Additive / System Clean"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="add-qty">Quantity (ml)</label>
                    <input 
                      type="number" 
                      id="add-qty" 
                      className="form-control" 
                      value={quantityMl}
                      onChange={(e) => setQuantityMl(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="add-cost">Additive Cost (₹)</label>
                    <input 
                      type="number" 
                      id="add-cost" 
                      className="form-control" 
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
              <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Additive Log</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
