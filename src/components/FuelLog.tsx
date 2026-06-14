import React, { useState } from 'react';
import { MotorcycleProfile, FuelRecord } from '../types';
import { calculateMileagePerFill } from '../utils';
import { Plus, Calendar, Pencil } from 'lucide-react';

interface FuelLogProps {
  profile: MotorcycleProfile;
  fuels: FuelRecord[];
  onAddFuel: (record: Omit<FuelRecord, 'id'>) => void;
  onUpdateFuel: (record: FuelRecord) => void;
}

export const FuelLog: React.FC<FuelLogProps> = ({
  profile,
  fuels,
  onAddFuel,
  onUpdateFuel
}) => {
  const [showLogModal, setShowLogModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [odometer, setOdometer] = useState(profile.currentOdometer.toString());
  const [liters, setLiters] = useState('');
  const [pricePerLiter, setPricePerLiter] = useState('106.0');
  const [location, setLocation] = useState('');
  const [sameLevel, setSameLevel] = useState(true);

  const totalLiters = fuels.reduce((sum, f) => sum + f.liters, 0);

  const resetForm = () => {
    setEditingId(null);
    setDate(new Date().toISOString().split('T')[0]);
    setOdometer(profile.currentOdometer.toString());
    setLiters('');
    setPricePerLiter('106.0');
    setLocation('');
    setSameLevel(true);
  };

  const openEditModal = (rec: FuelRecord) => {
    setEditingId(rec.id);
    setDate(rec.date);
    setOdometer(rec.odometer.toString());
    setLiters(rec.liters.toString());
    setPricePerLiter(rec.pricePerLiter.toString());
    setLocation(rec.location);
    setSameLevel(rec.sameLevel);
    setShowLogModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liters || !pricePerLiter || !odometer) return;

    const litVal = parseFloat(liters);
    const priceVal = parseFloat(pricePerLiter);
    const odoVal = parseInt(odometer);

    if (editingId) {
      onUpdateFuel({
        id: editingId,
        date,
        odometer: odoVal,
        liters: litVal,
        pricePerLiter: priceVal,
        totalAmount: parseFloat((litVal * priceVal).toFixed(2)),
        location: location || 'Local Petrol Pump',
        sameLevel
      });
    } else {
      onAddFuel({
        date,
        odometer: odoVal,
        liters: litVal,
        pricePerLiter: priceVal,
        totalAmount: parseFloat((litVal * priceVal).toFixed(2)),
        location: location || 'Local Petrol Pump',
        sameLevel
      });
    }

    resetForm();
    setShowLogModal(false);
  };

  const mileagePerFill = calculateMileagePerFill(fuels);

  const refuelsWithMileage = mileagePerFill
    .map(f => ({ ...f, mileage: f.mileage !== null ? parseFloat(f.mileage.toFixed(1)) : null }))
    .reverse();

  // SVG Line Chart dimensions
  const chartWidth = 500;
  const chartHeight = 180;
  const padding = 30;

  const mileagePoints = mileagePerFill
    .filter(f => f.mileage !== null)
    .map(f => ({
      date: f.date.split('-').slice(1).join('/'),
      value: f.mileage as number
    }));

  const renderSVGChart = () => {
    if (mileagePoints.length < 1) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Log at least 2 refuels to view mileage trends
        </div>
      );
    }

    const minVal = 25;
    const maxVal = 40;
    
    const coords = mileagePoints.map((p, i) => {
      const x = padding + (i / Math.max(1, mileagePoints.length - 1)) * (chartWidth - padding * 2);
      const normVal = (p.value - minVal) / (maxVal - minVal);
      const y = chartHeight - padding - normVal * (chartHeight - padding * 2);
      return { x, y, label: p.date, value: p.value };
    });

    const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
    const areaPath = coords.length > 0 
      ? `${linePath} L ${coords[coords.length - 1].x} ${chartHeight - padding} L ${coords[0].x} ${chartHeight - padding} Z`
      : '';

    return (
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        <defs>
          <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-cyan)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--color-cyan)" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        
        <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="rgba(255,255,255,0.05)" />
        <line x1={padding} y1={(chartHeight) / 2} x2={chartWidth - padding} y2={(chartHeight) / 2} stroke="rgba(255,255,255,0.05)" />
        <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="rgba(255,255,255,0.1)" />

        <text x={padding - 5} y={padding + 4} fill="var(--text-muted)" fontSize="8" textAnchor="end">40 km/l</text>
        <text x={padding - 5} y={(chartHeight) / 2 + 4} fill="var(--text-muted)" fontSize="8" textAnchor="end">32 km/l</text>
        <text x={padding - 5} y={chartHeight - padding + 4} fill="var(--text-muted)" fontSize="8" textAnchor="end">25 km/l</text>

        {areaPath && <path d={areaPath} fill="url(#chartGlow)" />}
        <path d={linePath} fill="none" stroke="var(--color-cyan)" strokeWidth="2.5" strokeLinecap="round" />

        {coords.map((c, i) => (
          <g key={i}>
            <circle cx={c.x} cy={c.y} r="4" fill="var(--bg-primary)" stroke="var(--color-cyan)" strokeWidth="2" />
            <text x={c.x} y={c.y - 8} fill="white" fontSize="9" fontWeight="600" textAnchor="middle">
              {c.value.toFixed(1)}
            </text>
            <text x={c.x} y={chartHeight - padding + 12} fill="var(--text-muted)" fontSize="8" textAnchor="middle">
              {c.label}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">Fuel Efficiency Tracker</h2>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.75rem', fontSize: '0.75rem' }} onClick={() => { resetForm(); setShowLogModal(true); }}>
          <Plus size={13} />
          <span>Log Refuel</span>
        </button>
      </div>

      {/* Mini metric counters */}
      <div className="mini-metric-grid" style={{ marginBottom: '1.25rem' }}>
        <div className="mini-metric-box">
          <span className="mini-metric-lbl">Total Liters</span>
          <span className="mini-metric-val">{totalLiters.toFixed(1)} L</span>
        </div>
        <div className="mini-metric-box">
          <span className="mini-metric-lbl">Latest Mileage</span>
          <span className="mini-metric-val">{refuelsWithMileage.find(r => r.mileage !== null)?.mileage ? `${refuelsWithMileage.find(r => r.mileage !== null)!.mileage} km/L` : '--'}</span>
        </div>
        <div className="mini-metric-box">
          <span className="mini-metric-lbl">Tank Range</span>
          <span className="mini-metric-val">{(() => {
            const latest = refuelsWithMileage.find(r => r.mileage !== null)?.mileage;
            return latest ? `${Math.round(latest * 14)} km` : '--';
          })()}</span>
        </div>
      </div>

      {/* SVG line performance chart */}
      <div className="glass-card">
        <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1rem', color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.4rem' }}>
          Mileage coordinates trend
        </h3>
        <div className="chart-card-content">
          {renderSVGChart()}
        </div>
      </div>

      {/* Refueling Station History */}
      <div className="section-header">
        <h2 className="section-title">Refueling Archives</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {refuelsWithMileage.map(rec => (
          <div className="glass-card" key={rec.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '0.85rem', color: 'white' }}>{rec.location}</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 700 }}>₹{rec.totalAmount.toLocaleString()}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Calendar size={11} style={{ opacity: 0.6 }} />
                <span>{rec.date}</span>
              </span>
              <span>Odo: {rec.odometer.toLocaleString()} km</span>
              <span>Liters: {rec.liters.toFixed(2)} L (@₹{rec.pricePerLiter})</span>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.4rem', marginTop: '0.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Fuel Efficiency rating:</span>
              {rec.mileage ? (
                <span className={`badge ${rec.mileage >= 32 ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.65rem' }}>
                  {rec.mileage} km/L
                </span>
              ) : (
                <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>
                  {rec.sameLevel ? 'First Refill' : 'Partial Fill'}
                </span>
              )}
            </div>

            <button
              className="btn btn-secondary"
              style={{ alignSelf: 'flex-end', padding: '0.25rem 0.6rem', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              onClick={() => openEditModal(rec)}
            >
              <Pencil size={11} />
              <span>Edit</span>
            </button>
          </div>
        ))}
      </div>

      {/* Fuel Log Modal */}
      {showLogModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>⛽ {editingId ? 'Edit Fuel Refill' : 'Log Fuel Refill'}</h2>
              <button className="close-btn" onClick={() => { resetForm(); setShowLogModal(false); }}>&times;</button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="f-date">Refuel Date</label>
                    <input 
                      type="date" 
                      id="f-date" 
                      className="form-control" 
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="f-odo">Odometer Reading (km)</label>
                    <input 
                      type="number" 
                      id="f-odo" 
                      className="form-control" 
                      value={odometer}
                      onChange={(e) => setOdometer(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="f-lit">Liters Filled</label>
                    <input 
                      type="number" 
                      step="0.01"
                      id="f-lit" 
                      className="form-control" 
                      placeholder="e.g. 10.2"
                      value={liters}
                      onChange={(e) => setLiters(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="f-prc">Price per Liter (₹)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      id="f-prc" 
                      className="form-control" 
                      value={pricePerLiter}
                      onChange={(e) => setPricePerLiter(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="f-sameLevel"
                    checked={sameLevel}
                    onChange={(e) => setSameLevel(e.target.checked)}
                    style={{ width: 'auto' }}
                  />
                  <label htmlFor="f-sameLevel" style={{ margin: 0, fontSize: '0.8rem' }}>
                    Filled to same level as last time? (needed for accurate mileage)
                  </label>
                </div>

                <div className="form-group">
                  <label htmlFor="f-loc">Refuel Petrol Station Location</label>
                  <input 
                    type="text" 
                    id="f-loc" 
                    className="form-control" 
                    placeholder="e.g. Indian Oil, S.B. Road"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>
              <div style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { resetForm(); setShowLogModal(false); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingId ? 'Save Changes' : 'Confirm Log'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
