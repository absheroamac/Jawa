import React, { useState } from 'react';
import { MaintenanceRecord, FuelRecord, FuelAdditiveRecord, ChromePart, MotorcycleProfile } from '../types';
import { getDaysDiff } from '../utils';
import { Wrench, Fuel, Droplet, Sparkles, Plus } from 'lucide-react';

interface LogsProps {
  records: MaintenanceRecord[];
  fuels: FuelRecord[];
  additives: FuelAdditiveRecord[];
  profile: MotorcycleProfile;
  chromeParts: ChromePart[];
  onPolishChrome: (partId: string) => void;
  onInspectChrome: (partId: string) => void;
  onAddAdditive: (record: Omit<FuelAdditiveRecord, 'id'>) => void;
}

interface TimelineEvent {
  date: string;
  type: 'Service' | 'Refuel' | 'Additive' | 'General';
  title: string;
  subtitle: string;
  description: string;
  cost: number;
}

export const Logs: React.FC<LogsProps> = ({
  records,
  fuels,
  additives,
  profile,
  chromeParts,
  onPolishChrome,
  onInspectChrome,
  onAddAdditive
}) => {
  const [logsTab, setLogsTab] = useState<'timeline' | 'chrome' | 'additives'>('timeline');
  const [showAddModal, setShowAddModal] = useState(false);

  // Additive Form fields
  const [addDate, setAddDate] = useState(new Date().toISOString().split('T')[0]);
  const [addOdo, setAddOdo] = useState(profile.currentOdometer.toString());
  const [addBrand, setAddBrand] = useState('Liqui Moly 4T Additive');
  const [addQty, setAddQty] = useState('125');
  const [addCost, setAddCost] = useState('380');

  const currentDate = new Date().toISOString().split('T')[0];

  // Timeline Compiler
  const timelineEvents: TimelineEvent[] = [];

  records.forEach(rec => {
    timelineEvents.push({
      date: rec.date,
      type: rec.type.toLowerCase().includes('lube') || rec.type.toLowerCase().includes('polish') ? 'General' : 'Service',
      title: rec.type,
      subtitle: `${rec.odometer.toLocaleString()} km • ${rec.workshopName}`,
      description: rec.description || 'Routine maintenance check.',
      cost: rec.cost
    });
  });

  fuels.forEach(fuel => {
    timelineEvents.push({
      date: fuel.date,
      type: 'Refuel',
      title: `Refueled ${fuel.liters.toFixed(1)}L`,
      subtitle: `${fuel.odometer.toLocaleString()} km • ${fuel.location}`,
      description: `Filled with petrol at rate ₹${fuel.pricePerLiter.toFixed(2)}/L.`,
      cost: fuel.totalAmount
    });
  });

  additives.forEach(add => {
    timelineEvents.push({
      date: add.date,
      type: 'Additive',
      title: `Added ${add.brand}`,
      subtitle: `${add.odometer.toLocaleString()} km • Personal Garage`,
      description: `Poured ${add.quantityMl}ml of concentrated fuel system additive directly inside fuel tank.`,
      cost: add.cost
    });
  });

  const sortedEvents = timelineEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'Service': return <Wrench size={13} style={{ color: 'var(--color-cyan)', display: 'inline-block' }} />;
      case 'Refuel': return <Fuel size={13} style={{ color: 'var(--color-green)', display: 'inline-block' }} />;
      case 'Additive': return <Droplet size={13} style={{ color: 'var(--color-amber)', display: 'inline-block' }} />;
      default: return <Sparkles size={13} style={{ color: 'var(--color-amber)', display: 'inline-block' }} />;
    }
  };

  const getPartStatus = (part: ChromePart) => {
    const daysSincePolish = getDaysDiff(part.lastPolishedDate, currentDate);
    const daysSinceInspect = getDaysDiff(part.lastInspectedDate, currentDate);

    let status = 'Nominal';
    let statusClass = 'badge-success';

    if (daysSincePolish >= 30 || daysSinceInspect >= 45) {
      status = daysSinceInspect >= 45 ? 'Inspect Due' : 'Polish Due';
      statusClass = daysSinceInspect >= 45 ? 'badge-danger' : 'badge-warning';
    }

    return { daysSincePolish, daysSinceInspect, status, statusClass };
  };

  const handleAdditiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addBrand || !addQty || !addCost || !addOdo) return;

    onAddAdditive({
      date: addDate,
      odometer: parseInt(addOdo),
      brand: addBrand,
      quantityMl: parseInt(addQty),
      cost: parseFloat(addCost)
    });

    setShowAddModal(false);
  };

  return (
    <div>
      {/* Logs Segmented Controls tab */}
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0.25rem', marginBottom: '1.25rem' }}>
        <button 
          style={{ flex: 1, border: 'none', background: logsTab === 'timeline' ? '#ffffff' : 'transparent', color: logsTab === 'timeline' ? '#09090b' : 'var(--text-secondary)', padding: '0.45rem', borderRadius: '8px', cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: '0.75rem', fontWeight: 600, transition: 'var(--transition-smooth)' }}
          onClick={() => setLogsTab('timeline')}
        >
          Timeline
        </button>
        <button 
          style={{ flex: 1, border: 'none', background: logsTab === 'chrome' ? '#ffffff' : 'transparent', color: logsTab === 'chrome' ? '#09090b' : 'var(--text-secondary)', padding: '0.45rem', borderRadius: '8px', cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: '0.75rem', fontWeight: 600, transition: 'var(--transition-smooth)' }}
          onClick={() => setLogsTab('chrome')}
        >
          Chrome Care
        </button>
        <button 
          style={{ flex: 1, border: 'none', background: logsTab === 'additives' ? '#ffffff' : 'transparent', color: logsTab === 'additives' ? '#09090b' : 'var(--text-secondary)', padding: '0.45rem', borderRadius: '8px', cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: '0.75rem', fontWeight: 600, transition: 'var(--transition-smooth)' }}
          onClick={() => setLogsTab('additives')}
        >
          Additives
        </button>
      </div>

      {/* RENDER CHOSEN LOG FEED */}
      {logsTab === 'timeline' && (
        <div>
          <div className="section-header">
            <h2 className="section-title">Timeline feed</h2>
          </div>
          <div className="timeline-container">
            {sortedEvents.map((event, idx) => (
              <div className="timeline-item" key={idx}>
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <div className="timeline-meta">
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{event.date}</span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {event.cost > 0 ? `₹${event.cost.toLocaleString()}` : 'Nominal check'}
                    </span>
                  </div>
                  <div className="timeline-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center' }}>{getEventIcon(event.type)}</span>
                    <strong style={{ fontSize: '0.85rem' }}>{event.title}</strong>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-cyan)', marginTop: '0.1rem' }}>
                    {event.subtitle}
                  </div>
                  <div className="timeline-desc" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {event.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {logsTab === 'chrome' && (
        <div>
          <div className="section-header">
            <h2 className="section-title">Chrome Detailing Logs</h2>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.4' }}>
            Classic Jawa trims feature hand-polished metal elements. Track individual components' polish schedules below:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {chromeParts.map(part => {
              const { daysSincePolish, daysSinceInspect, status, statusClass } = getPartStatus(part);
              return (
                <div className="glass-card" key={part.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.85rem', color: 'white' }}>{part.name}</strong>
                    <span className={`badge ${statusClass}`} style={{ fontSize: '0.6rem' }}>{status}</span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <div>✨ Polished: <strong>{part.lastPolishedDate}</strong> ({daysSincePolish}d ago)</div>
                    <div>🔍 Inspected: <strong>{part.lastInspectedDate}</strong> ({daysSinceInspect}d ago)</div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.5rem', marginTop: '0.2rem' }}>
                    <button 
                      className="btn btn-secondary" 
                      style={{ flex: 1, padding: '0.3rem 0.5rem', fontSize: '0.7rem' }}
                      onClick={() => onPolishChrome(part.id)}
                    >
                      ✨ Polish
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      style={{ flex: 1, padding: '0.3rem 0.5rem', fontSize: '0.7rem' }}
                      onClick={() => onInspectChrome(part.id)}
                    >
                      🔍 Inspect
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {logsTab === 'additives' && (
        <div>
          <div className="section-header">
            <h2 className="section-title">BS4 Additive Safeguards</h2>
            <button className="btn btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }} onClick={() => setShowAddModal(true)}>
              <Plus size={13} />
              <span>Add Additive</span>
            </button>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.4' }}>
            Older Jawa engines running on modern high-ethanol (E10/E20) fuel mixtures require dedicated injector protection additives every 4,000 km to dissolve gum and lacquer deposits.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {additives.map(add => (
              <div className="glass-card" key={add.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.85rem', color: 'white' }}>{add.brand}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 700 }}>₹{add.cost}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  <span>📅 Date: {add.date}</span>
                  <span>Odo: {add.odometer.toLocaleString()} km</span>
                  <span>Qty: {add.quantityMl} ml poured</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additive Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>🧪 Log Fuel System Additive</h2>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleAdditiveSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="add-d">Date Poured</label>
                    <input 
                      type="date" 
                      id="add-d" 
                      className="form-control" 
                      value={addDate}
                      onChange={(e) => setAddDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="add-o">Odometer (km)</label>
                    <input 
                      type="number" 
                      id="add-o" 
                      className="form-control" 
                      value={addOdo}
                      onChange={(e) => setAddOdo(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="add-b">Additive Brand Name</label>
                  <input 
                    type="text" 
                    id="add-b" 
                    className="form-control" 
                    value={addBrand}
                    onChange={(e) => setAddBrand(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="add-q">Quantity (ml)</label>
                    <input 
                      type="number" 
                      id="add-q" 
                      className="form-control" 
                      value={addQty}
                      onChange={(e) => setAddQty(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="add-c">Cost (₹)</label>
                    <input 
                      type="number" 
                      id="add-c" 
                      className="form-control" 
                      value={addCost}
                      onChange={(e) => setAddCost(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
              <div style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
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
