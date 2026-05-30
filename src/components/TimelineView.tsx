import React, { useState } from 'react';
import { MaintenanceRecord, FuelRecord, FuelAdditiveRecord } from '../types';

interface TimelineViewProps {
  records: MaintenanceRecord[];
  fuels: FuelRecord[];
  additives: FuelAdditiveRecord[];
}

interface TimelineEvent {
  date: string;
  type: 'Service' | 'Refuel' | 'Additive' | 'General';
  title: string;
  subtitle: string;
  description: string;
  cost: number;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  records,
  fuels,
  additives
}) => {
  const [filterType, setFilterType] = useState<'All' | 'Service' | 'Refuel' | 'Additive'>('All');

  // Convert disparate logs into unified Timeline events
  const timelineEvents: TimelineEvent[] = [];

  records.forEach(rec => {
    timelineEvents.push({
      date: rec.date,
      type: rec.type.toLowerCase().includes('lube') || rec.type.toLowerCase().includes('polish') ? 'General' : 'Service',
      title: rec.type,
      subtitle: `${rec.odometer.toLocaleString()} km • ${rec.workshopName}`,
      description: rec.description || 'Routine maintenance performed.',
      cost: rec.cost
    });
  });

  fuels.forEach(fuel => {
    timelineEvents.push({
      date: fuel.date,
      type: 'Refuel',
      title: `Refueled ${fuel.liters.toFixed(1)}L`,
      subtitle: `${fuel.odometer.toLocaleString()} km • ${fuel.location}`,
      description: `Filled with petrol at price ₹${fuel.pricePerLiter.toFixed(2)}/L.`,
      cost: fuel.totalAmount
    });
  });

  additives.forEach(add => {
    timelineEvents.push({
      date: add.date,
      type: 'Additive',
      title: `Added ${add.brand}`,
      subtitle: `${add.odometer.toLocaleString()} km • Self Garage`,
      description: `Poured ${add.quantityMl}ml of concentrated fuel system additive directly to full tank.`,
      cost: add.cost
    });
  });

  // Sort chronologically (most recent first)
  const sortedEvents = timelineEvents
    .filter(e => filterType === 'All' || e.type === filterType)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getEventEmoji = (type: string) => {
    switch (type) {
      case 'Service': return '🛠️';
      case 'Refuel': return '⛽';
      case 'Additive': return '🧪';
      default: return '✨';
    }
  };

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">Ownership History Timeline</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['All', 'Service', 'Refuel', 'Additive'] as const).map(type => (
            <button 
              key={type}
              className={`btn ${filterType === type ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
              onClick={() => setFilterType(type)}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card" style={{ padding: '2rem' }}>
        {sortedEvents.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
            No timeline logs found matching the filter type.
          </div>
        ) : (
          <div className="timeline-container">
            {sortedEvents.map((event, idx) => (
              <div className="timeline-item" key={idx}>
                <div className="timeline-dot" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem' }}>
                  {/* Small dots on the timeline */}
                </div>
                <div className="timeline-content">
                  <div className="timeline-meta">
                    <span style={{ fontWeight: 600, color: 'var(--color-gold)' }}>{event.date}</span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {event.cost > 0 ? `Cost: ₹${event.cost.toLocaleString()}` : 'Free/Included'}
                    </span>
                  </div>
                  <div className="timeline-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>{getEventEmoji(event.type)}</span>
                    <span style={{ fontSize: '1rem', fontWeight: 700 }}>{event.title}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-cyan)', marginBottom: '0.4rem', fontWeight: 500 }}>
                    {event.subtitle}
                  </div>
                  <div className="timeline-desc">
                    {event.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
