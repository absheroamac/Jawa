import React, { useState } from 'react';
import { MaintenanceRecord, FuelRecord, FuelAdditiveRecord, ChromePart, MotorcycleProfile } from '../types';
import { getDaysDiff } from '../utils';
import { Wrench, Fuel, Droplet, Sparkles, Plus, Pencil } from 'lucide-react';

interface LogsProps {
  records: MaintenanceRecord[];
  fuels: FuelRecord[];
  additives: FuelAdditiveRecord[];
  profile: MotorcycleProfile;
  chromeParts: ChromePart[];
  onPolishChrome: (partId: string) => void;
  onInspectChrome: (partId: string) => void;
  onAddAdditive: (record: Omit<FuelAdditiveRecord, 'id'>) => void;
  onUpdateRecord: (record: MaintenanceRecord) => void;
  onUpdateFuel: (record: FuelRecord) => void;
  onUpdateAdditive: (record: FuelAdditiveRecord) => void;
}

interface TimelineEvent {
  id: string;
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
  onAddAdditive,
  onUpdateRecord,
  onUpdateFuel,
  onUpdateAdditive
}) => {
  const [logsTab, setLogsTab] = useState<'timeline' | 'chrome' | 'additives'>('timeline');
  const [showAddModal, setShowAddModal] = useState(false);

  // Additive Form fields
  const [addDate, setAddDate] = useState(new Date().toISOString().split('T')[0]);
  const [addOdo, setAddOdo] = useState(profile.currentOdometer.toString());
  const [addBrand, setAddBrand] = useState('Liqui Moly 4T Additive');
  const [addQty, setAddQty] = useState('125');
  const [addCost, setAddCost] = useState('380');
  const [editingAdditiveId, setEditingAdditiveId] = useState<string | null>(null);

  // Maintenance record edit modal fields
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null);
  const [recDate, setRecDate] = useState('');
  const [recOdo, setRecOdo] = useState('');
  const [recType, setRecType] = useState('');
  const [recDesc, setRecDesc] = useState('');
  const [recWorkshop, setRecWorkshop] = useState('');
  const [recCost, setRecCost] = useState('');

  // Fuel record edit modal fields
  const [editingFuel, setEditingFuel] = useState<FuelRecord | null>(null);
  const [fuelDate, setFuelDate] = useState('');
  const [fuelOdo, setFuelOdo] = useState('');
  const [fuelLiters, setFuelLiters] = useState('');
  const [fuelPrice, setFuelPrice] = useState('');
  const [fuelLocation, setFuelLocation] = useState('');
  const [fuelSameLevel, setFuelSameLevel] = useState(true);

  const currentDate = new Date().toISOString().split('T')[0];

  // Timeline Compiler
  const timelineEvents: TimelineEvent[] = [];

  records.forEach(rec => {
    timelineEvents.push({
      id: rec.id,
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
      id: fuel.id,
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
      id: add.id,
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

    if (editingAdditiveId) {
      onUpdateAdditive({
        id: editingAdditiveId,
        date: addDate,
        odometer: parseInt(addOdo),
        brand: addBrand,
        quantityMl: parseInt(addQty),
        cost: parseFloat(addCost)
      });
    } else {
      onAddAdditive({
        date: addDate,
        odometer: parseInt(addOdo),
        brand: addBrand,
        quantityMl: parseInt(addQty),
        cost: parseFloat(addCost)
      });
    }

    setEditingAdditiveId(null);
    setShowAddModal(false);
  };

  const openEditForEvent = (event: TimelineEvent) => {
    if (event.type === 'Refuel') {
      const fuel = fuels.find(f => f.id === event.id);
      if (!fuel) return;
      setEditingFuel(fuel);
      setFuelDate(fuel.date);
      setFuelOdo(fuel.odometer.toString());
      setFuelLiters(fuel.liters.toString());
      setFuelPrice(fuel.pricePerLiter.toString());
      setFuelLocation(fuel.location);
      setFuelSameLevel(fuel.sameLevel);
    } else if (event.type === 'Additive') {
      const add = additives.find(a => a.id === event.id);
      if (!add) return;
      setEditingAdditiveId(add.id);
      setAddDate(add.date);
      setAddOdo(add.odometer.toString());
      setAddBrand(add.brand);
      setAddQty(add.quantityMl.toString());
      setAddCost(add.cost.toString());
      setShowAddModal(true);
    } else {
      const rec = records.find(r => r.id === event.id);
      if (!rec) return;
      setEditingRecord(rec);
      setRecDate(rec.date);
      setRecOdo(rec.odometer.toString());
      setRecType(rec.type);
      setRecDesc(rec.description);
      setRecWorkshop(rec.workshopName);
      setRecCost(rec.cost.toString());
    }
  };

  const handleRecordEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord || !recOdo || !recType) return;
    onUpdateRecord({
      ...editingRecord,
      date: recDate,
      odometer: parseInt(recOdo),
      type: recType,
      description: recDesc,
      workshopName: recWorkshop,
      cost: parseFloat(recCost) || 0
    });
    setEditingRecord(null);
  };

  const handleFuelEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFuel || !fuelOdo || !fuelLiters || !fuelPrice) return;
    const litVal = parseFloat(fuelLiters);
    const priceVal = parseFloat(fuelPrice);
    onUpdateFuel({
      ...editingFuel,
      date: fuelDate,
      odometer: parseInt(fuelOdo),
      liters: litVal,
      pricePerLiter: priceVal,
      totalAmount: parseFloat((litVal * priceVal).toFixed(2)),
      location: fuelLocation,
      sameLevel: fuelSameLevel
    });
    setEditingFuel(null);
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
                  <button
                    className="btn btn-secondary"
                    style={{ marginTop: '0.4rem', padding: '0.25rem 0.6rem', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.25rem', alignSelf: 'flex-start' }}
                    onClick={() => openEditForEvent(event)}
                  >
                    <Pencil size={11} />
                    <span>Edit</span>
                  </button>
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
            <button className="btn btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }} onClick={() => {
              setEditingAdditiveId(null);
              setAddDate(new Date().toISOString().split('T')[0]);
              setAddOdo(profile.currentOdometer.toString());
              setAddBrand('Liqui Moly 4T Additive');
              setAddQty('125');
              setAddCost('380');
              setShowAddModal(true);
            }}>
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
                <button
                  className="btn btn-secondary"
                  style={{ alignSelf: 'flex-end', padding: '0.25rem 0.6rem', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  onClick={() => {
                    setEditingAdditiveId(add.id);
                    setAddDate(add.date);
                    setAddOdo(add.odometer.toString());
                    setAddBrand(add.brand);
                    setAddQty(add.quantityMl.toString());
                    setAddCost(add.cost.toString());
                    setShowAddModal(true);
                  }}
                >
                  <Pencil size={11} />
                  <span>Edit</span>
                </button>
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
              <h2>🧪 {editingAdditiveId ? 'Edit Fuel System Additive' : 'Log Fuel System Additive'}</h2>
              <button className="close-btn" onClick={() => { setEditingAdditiveId(null); setShowAddModal(false); }}>&times;</button>
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
                <button type="button" className="btn btn-secondary" onClick={() => { setEditingAdditiveId(null); setShowAddModal(false); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingAdditiveId ? 'Save Changes' : 'Save Additive Log'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Maintenance Record Edit Modal */}
      {editingRecord && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>✏️ Edit Log: {editingRecord.type}</h2>
              <button className="close-btn" onClick={() => setEditingRecord(null)}>&times;</button>
            </div>
            <form onSubmit={handleRecordEditSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="er-date">Date</label>
                    <input type="date" id="er-date" className="form-control" value={recDate} onChange={(e) => setRecDate(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="er-odo">Odometer (km)</label>
                    <input type="number" id="er-odo" className="form-control" value={recOdo} onChange={(e) => setRecOdo(e.target.value)} required />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="er-type">Type</label>
                  <input type="text" id="er-type" className="form-control" value={recType} onChange={(e) => setRecType(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label htmlFor="er-desc">Description</label>
                  <textarea id="er-desc" className="form-control" rows={2} value={recDesc} onChange={(e) => setRecDesc(e.target.value)}></textarea>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="er-workshop">Workshop / Garage</label>
                    <input type="text" id="er-workshop" className="form-control" value={recWorkshop} onChange={(e) => setRecWorkshop(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="er-cost">Cost (₹)</label>
                    <input type="number" id="er-cost" className="form-control" value={recCost} onChange={(e) => setRecCost(e.target.value)} />
                  </div>
                </div>
              </div>
              <div style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingRecord(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fuel Record Edit Modal */}
      {editingFuel && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>✏️ Edit Refuel Log</h2>
              <button className="close-btn" onClick={() => setEditingFuel(null)}>&times;</button>
            </div>
            <form onSubmit={handleFuelEditSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="ef-date">Date</label>
                    <input type="date" id="ef-date" className="form-control" value={fuelDate} onChange={(e) => setFuelDate(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="ef-odo">Odometer (km)</label>
                    <input type="number" id="ef-odo" className="form-control" value={fuelOdo} onChange={(e) => setFuelOdo(e.target.value)} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="ef-lit">Liters Filled</label>
                    <input type="number" step="0.01" id="ef-lit" className="form-control" value={fuelLiters} onChange={(e) => setFuelLiters(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="ef-prc">Price per Liter (₹)</label>
                    <input type="number" step="0.01" id="ef-prc" className="form-control" value={fuelPrice} onChange={(e) => setFuelPrice(e.target.value)} required />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="ef-loc">Location</label>
                  <input type="text" id="ef-loc" className="form-control" value={fuelLocation} onChange={(e) => setFuelLocation(e.target.value)} />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" id="ef-sameLevel" checked={fuelSameLevel} onChange={(e) => setFuelSameLevel(e.target.checked)} style={{ width: 'auto' }} />
                  <label htmlFor="ef-sameLevel" style={{ margin: 0, fontSize: '0.8rem' }}>Filled to same level as last time?</label>
                </div>
              </div>
              <div style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingFuel(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
