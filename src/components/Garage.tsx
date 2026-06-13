import React, { useState } from 'react';
import { MotorcycleProfile, MaintenanceSchedule, PartLifecycle, MaintenanceRecord } from '../types';
import { getDaysDiff } from '../utils';
import { Wrench, FileText, Clock } from 'lucide-react';

interface GarageProps {
  profile: MotorcycleProfile;
  schedules: MaintenanceSchedule[];
  parts: PartLifecycle[];
  onReplacePart: (partId: string, brand: string, cost: number, odo: number, date: string) => void;
  onUpdateSchedule: (scheduleId: string, odo: number, date: string) => void;
  onAddRecord: (record: Omit<MaintenanceRecord, 'id'>) => void;
}

export const Garage: React.FC<GarageProps> = ({
  profile,
  schedules,
  parts,
  onReplacePart,
  onUpdateSchedule,
  onAddRecord
}) => {
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [selectedPart, setSelectedPart] = useState<PartLifecycle | null>(null);
  
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<MaintenanceSchedule | null>(null);

  const [showPerformModal, setShowPerformModal] = useState(false);

  // Form Fields
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [odometer, setOdometer] = useState(profile.currentOdometer.toString());
  const [brand, setBrand] = useState('');
  const [cost, setCost] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  const currentDate = new Date().toISOString().split('T')[0];

  const getPartLifecycle = (part: PartLifecycle) => {
    const notSet = !part.installedDate || part.installedOdo === 0;
    if (notSet) {
      return { kmDriven: 0, remainingKm: null, usagePercent: 0, status: 'Not Set', statusClass: 'badge-neutral', barColor: 'progress-green', notSet: true };
    }
    const kmDriven = profile.currentOdometer - part.installedOdo;
    const remainingKm = Math.max(0, part.expectedLifespanKm - kmDriven);
    const usagePercent = Math.min(100, (kmDriven / part.expectedLifespanKm) * 100);

    let status = 'Good';
    let statusClass = 'badge-success';
    let barColor = 'progress-green';

    if (usagePercent >= 90) {
      status = 'Replace Now';
      statusClass = 'badge-danger';
      barColor = 'progress-crimson';
    } else if (usagePercent >= 70) {
      status = 'Monitor';
      statusClass = 'badge-warning';
      barColor = 'progress-amber';
    }

    return { kmDriven, remainingKm, usagePercent, status, statusClass, barColor, notSet: false };
  };

  const getScheduleProgress = (s: MaintenanceSchedule) => {
    const notSet = !s.lastPerformedOdo && !s.lastPerformedDate;
    if (notSet) {
      return { percentage: 100, label: 'Never performed', statusColor: 'amber' as const, notSet: true };
    }

    let percentage = 100;
    let label = '';
    let statusColor: 'green' | 'amber' | 'crimson' = 'green';

    if (s.intervalKm && s.lastPerformedOdo) {
      const driven = profile.currentOdometer - s.lastPerformedOdo;
      percentage = Math.max(0, 100 - (driven / s.intervalKm) * 100);
      label = `${driven}/${s.intervalKm} km driven`;
      if (percentage <= 0) statusColor = 'crimson';
      else if (percentage < 20) statusColor = 'amber';
    } else if (s.intervalDays && s.lastPerformedDate) {
      const daysPassed = getDaysDiff(s.lastPerformedDate, currentDate);
      percentage = Math.max(0, 100 - (daysPassed / s.intervalDays) * 100);
      label = `${daysPassed}/${s.intervalDays} days passed`;
      if (percentage <= 0) statusColor = 'crimson';
      else if (percentage < 20) statusColor = 'amber';
    }

    return { percentage, label, statusColor, notSet: false };
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

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchedule || !cost || !odometer) return;

    onAddRecord({
      date,
      odometer: parseInt(odometer),
      category: selectedSchedule.category,
      type: selectedSchedule.name,
      description: description || `Routine maintenance check: ${selectedSchedule.name}`,
      workshopName: notes || 'Self Garage',
      cost: parseFloat(cost)
    });

    onUpdateSchedule(selectedSchedule.id, parseInt(odometer), date);

    setSelectedSchedule(null);
    setCost('');
    setDescription('');
    setNotes('');
    setShowLogModal(false);
  };



  const handlePerformSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchedule || !odometer) return;

    onAddRecord({
      date,
      odometer: parseInt(odometer),
      category: selectedSchedule.category,
      type: `${selectedSchedule.name} (Performed)`,
      description: description || `Performed scheduled maintenance for: ${selectedSchedule.name}.`,
      workshopName: 'Self Service',
      cost: 0,
    });

    onUpdateSchedule(selectedSchedule.id, parseInt(odometer), date);

    setSelectedSchedule(null);
    setDescription('');
    setShowPerformModal(false);
  };

  return (
    <div>
      {/* SECTION 1: WEAR & TEAR PARTS MONITOR */}
      <div className="section-header">
        <h2 className="section-title">Component Lifespan Monitor</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2.5rem' }}>
        {parts.map(part => {
          const { kmDriven, remainingKm, usagePercent, status, statusClass, barColor, notSet } = getPartLifecycle(part);
          return (
            <div className="glass-card" key={part.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: 'white' }}>
                    {part.name}
                  </h4>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {notSet ? 'Brand not set — log a swap to track lifespan' : `Brand: ${part.brand}`}
                  </span>
                </div>
                <span className={`badge ${statusClass}`} style={{ fontSize: '0.65rem' }}>
                  {status}
                </span>
              </div>

              {notSet ? (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '0.6rem 0.75rem' }}>
                  Tap <strong style={{ color: 'var(--text-secondary)' }}>Log Swap</strong> to record when this part was installed and start tracking its lifespan.
                </div>
              ) : (
                <div className="progress-container">
                  <div className="progress-header">
                    <span>Target lifespan: {part.expectedLifespanKm.toLocaleString()} km</span>
                    <span>{kmDriven.toLocaleString()} km used ({Math.round(usagePercent)}%)</span>
                  </div>
                  <div className="progress-track">
                    <div className={`progress-bar ${barColor}`} style={{ width: `${usagePercent}%` }}></div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                {!notSet && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={11} style={{ opacity: 0.6 }} />
                    <span>Remaining: <strong style={{ color: (remainingKm ?? 0) < 1500 ? 'var(--color-crimson-bright)' : 'white' }}>{remainingKm?.toLocaleString()} km</strong></span>
                  </div>
                )}
                <button
                  className="btn btn-secondary"
                  style={{ padding: '0.3rem 0.65rem', fontSize: '0.7rem', marginLeft: 'auto' }}
                  onClick={() => {
                    setSelectedPart(part);
                    setBrand(notSet ? '' : part.brand);
                    setOdometer(profile.currentOdometer.toString());
                    setShowReplaceModal(true);
                  }}
                >
                  {notSet ? '+ Log Swap' : 'Swap Part'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* SECTION 2: PERIODIC MAINTENANCE SCHEDULES */}
      <div className="section-header">
        <h2 className="section-title">Scheduled Presets & Adjustments</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {schedules.map(s => {
          const { percentage, label, statusColor, notSet } = getScheduleProgress(s);
          return (
            <div className="glass-card" key={s.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: 'white' }}>
                    {s.name}
                  </h4>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {s.category} · every {s.intervalKm ? `${s.intervalKm} km` : `${s.intervalDays} days`}
                  </span>
                </div>
                <span className={`badge ${
                  notSet ? 'badge-neutral' : percentage <= 0 ? 'badge-danger' : statusColor === 'amber' ? 'badge-warning' : 'badge-success'
                }`} style={{ fontSize: '0.65rem' }}>
                  {notSet ? 'Pending' : percentage <= 0 ? 'Overdue' : `${Math.round(percentage)}% Ok`}
                </span>
              </div>

              {notSet ? (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '0.6rem 0.75rem' }}>
                  Not performed yet. Hit <strong style={{ color: 'var(--text-secondary)' }}>Perform</strong> when done or <strong style={{ color: 'var(--text-secondary)' }}>Log Bill</strong> to record a past service.
                </div>
              ) : (
                <div className="progress-container">
                  <div className="progress-header">
                    <span>Interval: {s.intervalKm ? `${s.intervalKm} km` : `${s.intervalDays} days`}</span>
                    <span>{label}</span>
                  </div>
                  <div className="progress-track">
                    <div
                      className={`progress-bar ${
                        statusColor === 'crimson' ? 'progress-crimson' : statusColor === 'amber' ? 'progress-amber' : 'progress-green'
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.7rem' }}
                  onClick={() => {
                    setSelectedSchedule(s);
                    setOdometer(profile.currentOdometer.toString());
                    setShowLogModal(true);
                  }}
                >
                  Log Bill
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.7rem' }}
                  onClick={() => {
                    setSelectedSchedule(s);
                    setOdometer(profile.currentOdometer.toString());
                    setDate(currentDate);
                    setDescription('');
                    setShowPerformModal(true);
                  }}
                >
                  Perform
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Part Replacement Form Modal */}
      {showReplaceModal && selectedPart && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Wrench size={20} style={{ color: 'var(--color-cyan)' }} />
                <span>Log Replacement: {selectedPart.name}</span>
              </h2>
              <button className="close-btn" onClick={() => setShowReplaceModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleReplacementSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="r-date">Replacement Date</label>
                    <input 
                      type="date" 
                      id="r-date" 
                      className="form-control" 
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="r-odo">Current Odometer (km)</label>
                    <input 
                      type="number" 
                      id="r-odo" 
                      className="form-control" 
                      value={odometer}
                      onChange={(e) => setOdometer(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="r-brand">New Component Brand & Type</label>
                  <input 
                    type="text" 
                    id="r-brand" 
                    className="form-control" 
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="r-cost">Replacement Cost (₹)</label>
                  <input 
                    type="number" 
                    id="r-cost" 
                    className="form-control" 
                    placeholder="e.g. 4500"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowReplaceModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Confirm Swap</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preset Custom Invoice Modal */}
      {showLogModal && selectedSchedule && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={20} style={{ color: 'var(--color-cyan)' }} />
                <span>Log Custom Bill: {selectedSchedule.name}</span>
              </h2>
              <button className="close-btn" onClick={() => setShowLogModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleScheduleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="s-date">Service Date</label>
                    <input 
                      type="date" 
                      id="s-date" 
                      className="form-control" 
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="s-odo">Odometer Reading (km)</label>
                    <input 
                      type="number" 
                      id="s-odo" 
                      className="form-control" 
                      value={odometer}
                      onChange={(e) => setOdometer(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="s-cost">Service Cost (₹)</label>
                  <input 
                    type="number" 
                    id="s-cost" 
                    className="form-control" 
                    placeholder="e.g. 1800"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="s-desc">Service Description</label>
                  <textarea 
                    id="s-desc" 
                    className="form-control" 
                    rows={2}
                    placeholder="Details about items checked, replaced or tweaked..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  ></textarea>
                </div>

                <div className="form-group">
                  <label htmlFor="s-notes">Garage/Workshop Name</label>
                  <input 
                    type="text" 
                    id="s-notes" 
                    className="form-control" 
                    placeholder="e.g. Self Service / Moto Garage"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
              <div style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowLogModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Confirm Log</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Quick Perform Modal */}
      {showPerformModal && selectedSchedule && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={20} style={{ color: 'var(--color-cyan)' }} />
                <span>Perform: {selectedSchedule.name}</span>
              </h2>
              <button className="close-btn" onClick={() => setShowPerformModal(false)}>&times;</button>
            </div>
            <form onSubmit={handlePerformSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="p-date">Date</label>
                    <input 
                      type="date" 
                      id="p-date" 
                      className="form-control" 
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="p-odo">Odometer (km)</label>
                    <input 
                      type="number" 
                      id="p-odo" 
                      className="form-control" 
                      value={odometer}
                      onChange={(e) => setOdometer(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="p-desc">Optional Description</label>
                  <textarea 
                    id="p-desc" 
                    className="form-control" 
                    rows={2}
                    placeholder="E.g. Changed oil at home..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  ></textarea>
                </div>
              </div>
              <div style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowPerformModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Activity</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
