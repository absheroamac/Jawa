import React, { useState } from 'react';
import { BikeDocument } from '../types';
import { getDaysDiff } from '../utils';

interface DocumentVaultProps {
  documents: BikeDocument[];
  onUpdateDocument: (docId: string, docNum: string, expiry: string) => void;
}

export const DocumentVault: React.FC<DocumentVaultProps> = ({
  documents,
  onUpdateDocument
}) => {
  const [editingDoc, setEditingDoc] = useState<BikeDocument | null>(null);
  const [docNum, setDocNum] = useState('');
  const [expiry, setExpiry] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const currentDate = "2026-05-30";

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc || !docNum || !expiry) return;

    onUpdateDocument(editingDoc.id, docNum, expiry);
    setEditingDoc(null);
  };

  const getDocStatus = (doc: BikeDocument) => {
    const daysLeft = getDaysDiff(currentDate, doc.expiryDate);
    
    let status = 'Valid';
    let statusClass = 'badge-success';
    let cardHighlight = '';

    if (daysLeft < 0) {
      status = 'Expired';
      statusClass = 'badge-danger';
      cardHighlight = 'highlight'; // activates red neon borders
    } else if (daysLeft <= 30) {
      status = 'Expiring Soon';
      statusClass = 'badge-warning';
    }

    return { daysLeft, status, statusClass, cardHighlight };
  };

  // Drag and drop mock
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    }
  };

  const handleFileSelect = () => {
    setUploadSuccess(true);
    setTimeout(() => setUploadSuccess(false), 3000);
  };

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">Ownership Document Vault</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {documents.map(doc => {
          const { daysLeft, status, statusClass, cardHighlight } = getDocStatus(doc);
          return (
            <div className={`glass-card ${cardHighlight}`} key={doc.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>
                    {doc.name.includes('Registration') ? '📄' : doc.name.includes('Insurance') ? '🛡️' : '💨'}
                  </span>
                  <span className={`badge ${statusClass}`}>{status}</span>
                </div>

                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, margin: '0.5rem 0' }}>
                  {doc.name}
                </h3>
                
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.4rem', margin: '0.8rem 0' }}>
                  <div>Number: <strong style={{ color: 'white' }}>{doc.documentNumber}</strong></div>
                  <div>Expiry: <strong style={{ color: 'white' }}>{doc.expiryDate}</strong></div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.85rem', marginTop: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {daysLeft < 0 ? `${Math.abs(daysLeft)} days expired` : `${daysLeft.toLocaleString()} days left`}
                  </span>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                    onClick={() => {
                      setEditingDoc(doc);
                      setDocNum(doc.documentNumber);
                      setExpiry(doc.expiryDate);
                    }}
                  >
                    ✏️ Update Record
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Simulated Document Upload Dropzone */}
      <div className="section-header">
        <h2 className="section-title">Upload Digital Bills & Receipts</h2>
      </div>

      <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
        <div 
          style={{
            border: dragActive ? '2px dashed var(--color-gold)' : '2px dashed rgba(255,255,255,0.1)',
            borderRadius: '8px',
            padding: '3rem 1.5rem',
            backgroundColor: dragActive ? 'rgba(212,175,55,0.02)' : 'rgba(0,0,0,0.15)',
            cursor: 'pointer',
            transition: 'var(--transition-smooth)'
          }}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload-input')?.click()}
        >
          <input 
            type="file" 
            id="file-upload-input" 
            style={{ display: 'none' }} 
            onChange={handleFileSelect}
          />
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📥</span>
          <h4 style={{ fontFamily: 'var(--font-display)', marginBottom: '0.5rem', color: dragActive ? 'var(--color-gold)' : 'white' }}>
            {dragActive ? 'Drop your files here!' : 'Drag & drop your service bills or PDF insurance copies'}
          </h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Supports PDF, JPG, PNG up to 10MB. Document details will be automatically read by the local dashboard context.
          </p>
          {uploadSuccess && (
            <div style={{ color: 'var(--color-green)', marginTop: '1.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
              ✓ File uploaded and secured in local sandbox vault!
            </div>
          )}
        </div>
      </div>

      {/* Edit Document Modal */}
      {editingDoc && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>🛡️ Update Document Details</h2>
              <button className="close-btn" onClick={() => setEditingDoc(null)}>&times;</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="doc-title">Document Name</label>
                  <input 
                    type="text" 
                    id="doc-title" 
                    className="form-control" 
                    value={editingDoc.name}
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="doc-num">Document / Certificate ID</label>
                  <input 
                    type="text" 
                    id="doc-num" 
                    className="form-control" 
                    value={docNum}
                    onChange={(e) => setDocNum(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="doc-exp">Expiry Date</label>
                  <input 
                    type="date" 
                    id="doc-exp" 
                    className="form-control" 
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingDoc(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Document</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
