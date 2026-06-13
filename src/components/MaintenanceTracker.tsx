import React, { useState } from 'react';
import { MotorcycleProfile, MaintenanceSchedule, MaintenanceRecord } from '../types';
import { getDaysDiff } from '../utils';

interface MaintenanceTrackerProps {
  profile: MotorcycleProfile;
  schedules: MaintenanceSchedule[];
  records: MaintenanceRecord[];
  onAddRecord: (record: Omit<MaintenanceRecord, 'id'>) => void;
  onUpdateSchedule: (scheduleId: string, odo: number, date: string) => void;
}

export const MaintenanceTracker: React.FC<MaintenanceTrackerProps> = ({
  profile,
  schedules,
  records,
  onAddRecord,
  onUpdateSchedule
}) => {
  const [showLogModal, setShowLogModal] = useState(false);
  const [showPerformModal, setShowPerformModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<MaintenanceSchedule | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  // Form fields
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [odometer, setOdometer] = useState(profile.currentOdometer.toString());
  const [category, setCategory] = useState('Engine');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [workshopName, setWorkshopName] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');

  const currentDate = new Date().toISOString().split('T')[0];

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!type || !cost || !odometer) return;

    onAddRecord({
      date,
      odometer: parseInt(odometer),
      category,
      type,
      description,
      workshopName: workshopName || 'Self Service',
      cost: parseFloat(cost),
      notes: notes || undefined
    });

    // Automatically check if this updates any schedules matching the types
    const matchingSchedule = schedules.find(
      s => s.name.toLowerCase().includes(type.toLowerCase()) || 
           type.toLowerCase().includes(s.name.toLowerCase())
    );
    if (matchingSchedule) {
      onUpdateSchedule(matchingSchedule.id, parseInt(odometer), date);
    }

    // Reset Form
    setType('');
    setDescription('');
    setWorkshopName('');
    setCost('');
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

  const getScheduleProgress = (s: MaintenanceSchedule) => {
    let percentage = 100;
    let label = '';
    let statusColor: 'green' | 'amber' | 'crimson' = 'green';

    if (s.intervalKm && s.lastPerformedOdo) {
      const driven = profile.currentOdometer - s.lastPerformedOdo;
      percentage = Math.max(0, 100 - (driven / s.intervalKm) * 100);
      label = `${driven}/${s.intervalKm} km used`;
      if (percentage <= 0) {
        statusColor = 'crimson';
      } else if (percentage < 20) {
        statusColor = 'amber';
      }
    } else if (s.intervalDays && s.lastPerformedDate) {
      const daysPassed = getDaysDiff(s.lastPerformedDate, currentDate);
      percentage = Math.max(0, 100 - (daysPassed / s.intervalDays) * 100);
      label = `${daysPassed}/${s.intervalDays} Days elapsed`;
      if (percentage <= 0) {
        statusColor = 'crimson';
      } else if (percentage < 20) {
        statusColor = 'amber';
      }
    }

    return { percentage, label, statusColor };
  };

  // Filters Past Records
  const filteredRecords = records.filter(rec => {
    const matchesSearch = 
      rec.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.workshopName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || rec.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      {/* Maintenance Preset Schedules Grid */}
      <div className="section-header">
        <h2 className="section-title">Maintenance Schedule Presets</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {schedules.map(s => {
          const { percentage, label, statusColor } = getScheduleProgress(s);
          return (
            <div className="glass-card" key={s.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                      {s.name}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Category: {s.category}
                    </span>
                  </div>
                  <span className={`badge ${
                    statusColor === 'crimson' ? 'badge-danger' : statusColor === 'amber' ? 'badge-warning' : 'badge-success'
                  }`}>
                    {percentage <= 0 ? 'Overdue' : `${Math.round(percentage)}% ok`}
                  </span>
                </div>

                <div className="progress-container" style={{ margin: '1rem 0' }}>
                  <div className="progress-header">
                    <span>Preset Interval: {s.intervalKm ? `${s.intervalKm} km` : `${s.intervalDays} Days`}</span>
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
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ flex: 1, fontSize: '0.8rem', padding: '0.45rem 0.75rem' }}
                  onClick={() => {
                    setType(s.name);
                    setCategory(s.category);
                    setShowLogModal(true);
                  }}
                >
                  📝 Log Custom Bill
                </button>
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 1, fontSize: '0.8rem', padding: '0.45rem 0.75rem' }}
                  onClick={() => {
                    setSelectedSchedule(s);
                    setOdometer(profile.currentOdometer.toString());
                    setDate(currentDate);
                    setDescription('');
                    setShowPerformModal(true);
                  }}
                >
                  ⚡ Perform
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Log Book table */}
      <div className="section-header">
        <h2 className="section-title">Garage Log Book</h2>
        <button className="btn btn-primary" onClick={() => setShowLogModal(true)}>
          🛠️ Log Custom Service Record
        </button>
      </div>

      <div className="glass-card" style={{ padding: '1.25rem' }}>
        {/* Search and Filters */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search service logs..."
            style={{ flex: 1, minWidth: '240px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select 
            className="form-control" 
            style={{ width: '180px' }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="All">All Categories</option>
            <option value="Engine">Engine</option>
            <option value="Chain">Chain</option>
            <option value="Brakes">Brakes</option>
            <option value="Electrical">Electrical</option>
            <option value="Tires">Tires</option>
            <option value="General">General</option>
          </select>
        </div>

        {/* Records Table */}
        <div className="table-container">
          {filteredRecords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              No service logs match your filter criteria.
            </div>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Odometer</th>
                  <th>Category</th>
                  <th>Activity Type</th>
                  <th>Workshop</th>
                  <th>Cost</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map(rec => (
                    <tr key={rec.id}>
                      <td style={{ fontWeight: 500 }}>{rec.date}</td>
                      <td>{rec.odometer.toLocaleString()} km</td>
                      <td>
                        <span className={`badge ${
                          rec.category === 'Engine' ? 'badge-success' :
                          rec.category === 'Chain' ? 'badge-gold' :
                          rec.category === 'Electrical' ? 'badge-cyan' :
                          rec.category === 'Brakes' ? 'badge-danger' : 'badge-info'
                        }`}>
                          {rec.category}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'white' }}>{rec.type}</td>
                      <td>{rec.workshopName}</td>
                      <td style={{ color: 'var(--color-gold)', fontWeight: 700 }}>₹{rec.cost.toLocaleString()}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '280px' }}>
                        {rec.description}
                        {rec.notes && <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem', fontStyle: 'italic' }}>* {rec.notes}</div>}
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Log Service Modal */}
      {showLogModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>🛠️ Log Maintenance Activity</h2>
              <button className="close-btn" onClick={() => setShowLogModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="date">Service Date</label>
                    <input 
                      type="date" 
                      id="date" 
                      className="form-control" 
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="odometer">Odometer (km)</label>
                    <input 
                      type="number" 
                      id="odometer" 
                      className="form-control" 
                      value={odometer}
                      onChange={(e) => setOdometer(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="category">Category</label>
                    <select 
                      id="category" 
                      className="form-control"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="Engine">Engine</option>
                      <option value="Chain">Chain</option>
                      <option value="Brakes">Brakes</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Tires">Tires</option>
                      <option value="General">General</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="cost">Total Bill Amount (₹)</label>
                    <input 
                      type="number" 
                      id="cost" 
                      className="form-control" 
                      placeholder="e.g. 2400"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="type">Activity Type / Service Title</label>
                  <input 
                    type="text" 
                    id="type" 
                    className="form-control" 
                    placeholder="e.g. Engine Oil Change, Chain Replacement"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="workshop">Workshop Name</label>
                  <input 
                    type="text" 
                    id="workshop" 
                    className="form-control" 
                    placeholder="e.g. Classic Jawa Service / Self Service"
                    value={workshopName}
                    onChange={(e) => setWorkshopName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="desc">Work Description</label>
                  <textarea 
                    id="desc" 
                    className="form-control" 
                    rows={3}
                    placeholder="Detailed explanation of parts replaced or adjusted..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  ></textarea>
                </div>

                <div className="form-group">
                  <label htmlFor="notes">Additional Garage Notes</label>
                  <input 
                    type="text" 
                    id="notes" 
                    className="form-control" 
                    placeholder="e.g. Used Motul 7100 10W50 synthetic oil"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
              <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowLogModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Log Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Perform Modal */}
      {showPerformModal && selectedSchedule && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>⏱️ Perform: {selectedSchedule.name}</h2>
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
                    placeholder="E.g. Chain lubed at home..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  ></textarea>
                </div>
              </div>
              <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
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
