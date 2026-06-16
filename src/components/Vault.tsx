import React, { useState } from 'react';
import { MotorcycleProfile, BikeDocument, MaintenanceRecord, FuelRecord, ExpenseRecord } from '../types';
import { getDaysDiff } from '../utils';
import { Bike, FileText, ShieldCheck, Activity, Edit2, LogOut } from 'lucide-react';

interface VaultProps {
  profile: MotorcycleProfile;
  setProfile: React.Dispatch<React.SetStateAction<MotorcycleProfile>>;
  documents: BikeDocument[];
  onUpdateDocument: (docId: string, docNum: string, expiry: string) => void;
  records: MaintenanceRecord[];
  fuels: FuelRecord[];
  expenses: ExpenseRecord[];
  user?: any;
  onSignOut?: () => void;
}

export const Vault: React.FC<VaultProps> = ({
  profile,
  setProfile,
  documents,
  onUpdateDocument,
  records,
  fuels,
  expenses,
  user,
  onSignOut
}) => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  // Document updates fields
  const [editingDoc, setEditingDoc] = useState<BikeDocument | null>(null);
  const [docNum, setDocNum] = useState('');
  const [expiry, setExpiry] = useState('');
  const currentDate = new Date().toISOString().split('T')[0];

  // Expense Aggregation for Donut
  // fuels[] and records[] are the source of truth for Fuel/Service/Repairs/Washing.
  // expenses[] only contributes the remaining manual categories (Insurance, Accessories, etc.)
  // to avoid double-counting (every fuel/service auto-creates an expense entry).
  const AUTO_CATEGORIES = new Set(['Fuel', 'Service', 'Repairs', 'Washing']);
  const categoriesMap: Record<string, number> = {};

  expenses.forEach(e => {
    if (!AUTO_CATEGORIES.has(e.category)) {
      categoriesMap[e.category] = (categoriesMap[e.category] || 0) + e.amount;
    }
  });

  const totalFuelCost = fuels.reduce((sum, f) => sum + f.totalAmount, 0);
  if (totalFuelCost > 0) categoriesMap['Fuel'] = totalFuelCost;

  records.forEach(r => {
    if (r.cost <= 0) return;
    const isRepair = r.type.toLowerCase().includes('repair') || r.description?.toLowerCase().includes('repair');
    const isWash = r.category === 'General' && r.type.toLowerCase().includes('wash');
    const bucket = isRepair ? 'Repairs' : isWash ? 'Washing' : 'Service';
    categoriesMap[bucket] = (categoriesMap[bucket] || 0) + r.cost;
  });

  const categoryEntries = Object.entries(categoriesMap)
    .sort((a, b) => b[1] - a[1]);

  const totalSpent = categoryEntries.reduce((sum, [, val]) => sum + val, 0);

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Registration': return '#06b6d4';
      case 'Fuel': return '#0ea5e9';
      case 'Service': return '#10b981';
      case 'Repairs': return '#f43f5e';
      case 'Accessories': return '#8b5cf6';
      case 'Insurance': return '#ec4899';
      default: return '#f59e0b';
    }
  };

  // SVG Donut Calculations
  let accumulatedAngle = 0;
  const radius = 60;
  const cx = 80;
  const cy = 80;

  const donutSlices = categoryEntries
    .filter(([, val]) => val > 0)
    .map(([cat, val]) => {
      const percentage = (val / totalSpent) * 100;
      const angle = (val / totalSpent) * 360;
      
      const startAngle = accumulatedAngle;
      accumulatedAngle += angle;
      const endAngle = accumulatedAngle;

      const startRad = ((startAngle - 90) * Math.PI) / 180;
      const endRad = ((endAngle - 90) * Math.PI) / 180;

      const x1 = cx + radius * Math.cos(startRad);
      const y1 = cy + radius * Math.sin(startRad);
      const x2 = cx + radius * Math.cos(endRad);
      const y2 = cy + radius * Math.sin(endRad);

      const largeArc = angle > 180 ? 1 : 0;
      const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

      return {
        category: cat,
        cost: val,
        percentage,
        pathData,
        color: getCategoryColor(cat)
      };
    });

  const getDocStatus = (doc: BikeDocument) => {
    const daysLeft = getDaysDiff(currentDate, doc.expiryDate);
    
    let status = 'Valid';
    let statusClass = 'badge-success';
    let cardHighlight = '';

    if (daysLeft < 0) {
      status = 'Expired';
      statusClass = 'badge-danger';
      cardHighlight = 'highlight';
    } else if (daysLeft <= 30) {
      status = 'Expiring Soon';
      statusClass = 'badge-warning';
    }

    return { daysLeft, status, statusClass, cardHighlight };
  };

  const handleEditDocSubmit = (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!editingDoc || !docNum || !expiry) return;

    onUpdateDocument(editingDoc.id, docNum, expiry);
    setEditingDoc(null);
  };

  return (
    <div>
      {/* SECTION 1: PROFILE SPECS */}
      <div className="section-header">
        <h2 className="section-title">Machine Specs</h2>
        <button className="btn btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }} onClick={() => setIsEditingProfile(!isEditingProfile)}>
          <Edit2 size={11} />
          <span>{isEditingProfile ? 'Done' : 'Edit Profile'}</span>
        </button>
      </div>

      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {isEditingProfile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div className="form-group">
              <label>Machine Model Name</label>
              <input type="text" className="form-control" value={profile.bikeName} onChange={(e) => setProfile(prev => ({ ...prev, bikeName: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Registration Number</label>
              <input type="text" className="form-control" value={profile.registrationNumber} onChange={(e) => setProfile(prev => ({ ...prev, registrationNumber: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Chassis/VIN Number</label>
              <input type="text" className="form-control" value={profile.vin} onChange={(e) => setProfile(prev => ({ ...prev, vin: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Specification Color</label>
              <input type="text" className="form-control" value={profile.color} onChange={(e) => setProfile(prev => ({ ...prev, color: e.target.value }))} />
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', marginBottom: '0.4rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bike size={20} style={{ color: 'var(--color-cyan)' }} />
              </div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.15rem' }}>{profile.manufacturer} {profile.bikeName}</h3>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{profile.variant} • Year {profile.year}</span>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.65rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <div>Registration No: <strong style={{ color: 'white' }}>{profile.registrationNumber}</strong></div>
              <div>Chassis VIN: <strong style={{ color: 'white' }}>{profile.vin}</strong></div>
              <div>Purchase Date: <strong style={{ color: 'white' }}>{profile.purchaseDate}</strong></div>
              <div>Initial Price: <strong style={{ color: 'white' }}>₹{profile.purchasePrice.toLocaleString()}</strong></div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: DOCUMENTS VAULT */}
      <div className="section-header">
        <h2 className="section-title">Critical Papers Vault</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2.5rem' }}>
        {documents.map(doc => {
          const { daysLeft, status, statusClass, cardHighlight } = getDocStatus(doc);
          return (
            <div className={`glass-card ${cardHighlight}`} key={doc.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '0.85rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  {doc.name.includes('Registration') ? (
                    <FileText size={14} style={{ color: 'var(--color-cyan)' }} />
                  ) : doc.name.includes('Insurance') ? (
                    <ShieldCheck size={14} style={{ color: 'var(--color-green)' }} />
                  ) : (
                    <Activity size={14} style={{ color: 'var(--color-amber)' }} />
                  )}
                  <span>{doc.name.includes('Registration') ? 'RC Book' : doc.name.includes('Insurance') ? 'Policy' : 'PUC Certificate'}</span>
                </strong>
                <span className={`badge ${statusClass}`} style={{ fontSize: '0.65rem' }}>{status}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <div>ID: <strong style={{ color: 'white' }}>{doc.documentNumber}</strong></div>
                <div>Expiry: <strong style={{ color: 'white' }}>{doc.expiryDate}</strong></div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.4rem', marginTop: '0.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  {daysLeft < 0 ? `${Math.abs(daysLeft)} days expired!` : `${daysLeft.toLocaleString()} days remaining`}
                </span>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '0.25rem 0.55rem', fontSize: '0.65rem' }}
                  onClick={() => {
                    setEditingDoc(doc);
                    setDocNum(doc.documentNumber);
                    setExpiry(doc.expiryDate);
                  }}
                >
                  Edit
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* SECTION 3: EXPENSE ANALYTICS (AUXILIARY) */}
      <div className="section-header">
        <h2 className="section-title">Ownership Expense Audit</h2>
      </div>

      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1rem', color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.4rem' }}>
          TCO Breakdown (Sum: ₹{totalSpent.toLocaleString()})
        </h3>
        
        {totalSpent === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '1rem 0' }}>No bills logged</div>
        ) : (
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="150" height="150" viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
              {donutSlices.map((slice, i) => (
                <path key={i} d={slice.pathData} fill={slice.color} stroke="var(--bg-secondary)" strokeWidth="1.5" />
              ))}
              <circle cx={cx} cy={cy} r="40" fill="var(--bg-secondary)" />
            </svg>

            <div style={{ flex: 1, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {donutSlices.slice(0, 5).map((slice, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: slice.color }}></span>
                    <span>{slice.category}</span>
                  </div>
                  <strong style={{ color: 'white' }}>₹{slice.cost.toLocaleString()} ({Math.round(slice.percentage)}%)</strong>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit Papers Modal */}
      {editingDoc && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>🛡️ Update Expiration Certificate</h2>
              <button className="close-btn" onClick={() => setEditingDoc(null)}>&times;</button>
            </div>
            <form onSubmit={handleEditDocSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Document Certificate Name</label>
                  <input type="text" className="form-control" value={editingDoc.name} disabled />
                </div>
                <div className="form-group">
                  <label>Document ID / Serial No</label>
                  <input type="text" className="form-control" value={docNum} onChange={(e) => setDocNum(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input type="date" className="form-control" value={expiry} onChange={(e) => setExpiry(e.target.value)} required />
                </div>
              </div>
              <div style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingDoc(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* SECTION 4: SECURITY SYSTEM (TERMINATE SECURE LINK) */}
      {user && onSignOut && (
        <div style={{ marginTop: '2.5rem', paddingBottom: '1rem' }}>
          <button 
            className="btn btn-danger" 
            style={{ width: '100%', borderRadius: '12px', padding: '0.65rem', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }} 
            onClick={onSignOut}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
          <div style={{ textAlign: 'center', fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Session security: {user.email} (Encrypted)
          </div>
        </div>
      )}
    </div>
  );
};
