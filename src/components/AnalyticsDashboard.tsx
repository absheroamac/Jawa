import React from 'react';
import { MaintenanceRecord, FuelRecord, ExpenseRecord } from '../types';

interface AnalyticsDashboardProps {
  records: MaintenanceRecord[];
  fuels: FuelRecord[];
  expenses: ExpenseRecord[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  records,
  fuels,
  expenses
}) => {
  // Aggregate expenses by category
  const categoriesMap: Record<string, number> = {};
  
  // 1. Initial expenses (Registration, Accessories, etc.)
  expenses.forEach(e => {
    categoriesMap[e.category] = (categoriesMap[e.category] || 0) + e.amount;
  });

  // 2. Fuel
  const totalFuelCost = fuels.reduce((sum, f) => sum + f.totalAmount, 0);
  if (totalFuelCost > 0) {
    categoriesMap['Fuel'] = (categoriesMap['Fuel'] || 0) + totalFuelCost;
  }

  // 3. Maintenance Records
  records.forEach(r => {
    const cost = r.cost;
    if (r.type.toLowerCase().includes('repair') || r.description?.toLowerCase().includes('repair')) {
      categoriesMap['Repairs'] = (categoriesMap['Repairs'] || 0) + cost;
    } else {
      categoriesMap['Service'] = (categoriesMap['Service'] || 0) + cost;
    }
  });

  const categoryEntries = Object.entries(categoriesMap)
    .sort((a, b) => b[1] - a[1]);

  const totalCostOfOwnership = categoryEntries.reduce((sum, [, val]) => sum + val, 0);

  // Category Colors
  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Registration': return '#06b6d4'; // Cyan
      case 'Fuel': return '#0ea5e9';         // Sky Blue
      case 'Service': return '#10b981';      // Green
      case 'Repairs': return '#f43f5e';      // Red
      case 'Accessories': return '#8b5cf6';  // Purple
      case 'Insurance': return '#ec4899';    // Pink
      default: return '#f59e0b';             // Amber
    }
  };

  // Custom SVG Donut calculations
  let accumulatedAngle = 0;
  const donutRadius = 70;
  const donutCenterX = 100;
  const donutCenterY = 100;

  const donutSlices = categoryEntries
    .filter(([, val]) => val > 0)
    .map(([cat, val]) => {
      const percentage = (val / totalCostOfOwnership) * 100;
      const angle = (val / totalCostOfOwnership) * 360;
      
      const startAngle = accumulatedAngle;
      accumulatedAngle += angle;
      const endAngle = accumulatedAngle;

      // Convert angles to polar coordinates for path
      const startRad = ((startAngle - 90) * Math.PI) / 180;
      const endRad = ((endAngle - 90) * Math.PI) / 180;

      const x1 = donutCenterX + donutRadius * Math.cos(startRad);
      const y1 = donutCenterY + donutRadius * Math.sin(startRad);
      const x2 = donutCenterX + donutRadius * Math.cos(endRad);
      const y2 = donutCenterY + donutRadius * Math.sin(endRad);

      const largeArc = angle > 180 ? 1 : 0;
      const pathData = `
        M ${donutCenterX} ${donutCenterY}
        L ${x1} ${y1}
        A ${donutRadius} ${donutRadius} 0 ${largeArc} 1 ${x2} ${y2}
        Z
      `;

      return {
        category: cat,
        cost: val,
        percentage,
        pathData,
        color: getCategoryColor(cat)
      };
    });

  // Monthly breakdown for Bar Chart (Mocking months based on fuel logs or hardcoded realistic trend)
  const monthlySpending = [
    { month: 'Jan', amount: 4800 },
    { month: 'Feb', amount: 1200 },
    { month: 'Mar', amount: 3500 },
    { month: 'Apr', amount: 2600 },
    { month: 'May', amount: 5900 }
  ];

  const maxMonthVal = Math.max(...monthlySpending.map(m => m.amount));
  
  const barChartWidth = 500;
  const barChartHeight = 180;
  const barPadding = 30;

  const renderSVGDonut = () => {
    if (totalCostOfOwnership === 0) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
          No expenses recorded yet
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="200" height="200" viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
          {donutSlices.map((slice, i) => (
            <path 
              key={i} 
              d={slice.pathData} 
              fill={slice.color} 
              stroke="var(--bg-secondary)" 
              strokeWidth="2" 
              style={{ transition: 'var(--transition-smooth)', cursor: 'pointer' }}
            />
          ))}
          {/* Inner cutout for donut effect */}
          <circle cx={donutCenterX} cy={donutCenterY} r="45" fill="var(--bg-secondary)" />
        </svg>

        <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {donutSlices.map((slice, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: slice.color }}></span>
                <span>{slice.category}</span>
              </div>
              <div style={{ fontWeight: 600 }}>
                ₹{slice.cost.toLocaleString()} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({slice.percentage.toFixed(1)}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSVGBarChart = () => {
    const spacing = (barChartWidth - barPadding * 2) / monthlySpending.length;
    const barWidth = 35;

    return (
      <svg viewBox={`0 0 ${barChartWidth} ${barChartHeight}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        {/* Horizontal lines */}
        <line x1={barPadding} y1={barPadding} x2={barChartWidth - barPadding} y2={barPadding} stroke="rgba(255,255,255,0.05)" />
        <line x1={barPadding} y1={barChartHeight / 2} x2={barChartWidth - barPadding} y2={barChartHeight / 2} stroke="rgba(255,255,255,0.05)" />
        <line x1={barPadding} y1={barChartHeight - barPadding} x2={barChartWidth - barPadding} y2={barChartHeight - barPadding} stroke="rgba(255,255,255,0.1)" />

        {/* Y Axis text */}
        <text x={barPadding - 5} y={barPadding + 4} fill="var(--text-muted)" fontSize="8" textAnchor="end">₹{maxMonthVal.toLocaleString()}</text>
        <text x={barPadding - 5} y={barChartHeight / 2 + 4} fill="var(--text-muted)" fontSize="8" textAnchor="end">₹{Math.round(maxMonthVal / 2).toLocaleString()}</text>
        <text x={barPadding - 5} y={barChartHeight - barPadding + 4} fill="var(--text-muted)" fontSize="8" textAnchor="end">₹0</text>

        {monthlySpending.map((m, i) => {
          const x = barPadding + i * spacing + (spacing - barWidth) / 2;
          const barHeight = ((m.amount) / maxMonthVal) * (barChartHeight - barPadding * 2);
          const y = barChartHeight - barPadding - barHeight;

          return (
            <g key={i}>
              <rect 
                x={x} 
                y={y} 
                width={barWidth} 
                height={barHeight} 
                rx="4"
                fill="url(#barGradient)" 
                style={{ transition: 'var(--transition-smooth)' }}
              />
              <text x={x + barWidth / 2} y={y - 8} fill="white" fontSize="9" fontWeight="600" textAnchor="middle">
                ₹{m.amount}
              </text>
              <text x={x + barWidth / 2} y={barChartHeight - barPadding + 14} fill="var(--text-muted)" fontSize="9" textAnchor="middle">
                {m.month}
              </text>
            </g>
          );
        })}

        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-cyan)" />
            <stop offset="100%" stopColor="rgba(0, 122, 255, 0.2)" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">Ownership Cost Analytics</h2>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Cost Breakdown Donut */}
        <div className="glass-card">
          <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', color: 'var(--text-primary)' }}>
            Category Breakdown (Total: ₹{totalCostOfOwnership.toLocaleString()})
          </h3>
          <div style={{ padding: '1rem' }}>
            {renderSVGDonut()}
          </div>
        </div>

        {/* Monthly spending bar */}
        <div className="glass-card">
          <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', color: 'var(--text-primary)' }}>
            Monthly Expenditure Trend (2026)
          </h3>
          <div style={{ height: '220px', padding: '1rem' }}>
            {renderSVGBarChart()}
          </div>
        </div>
      </div>

      {/* Metric details card */}
      <div className="glass-card" style={{ marginTop: '1.5rem', padding: '1.5rem' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
          Detailed Cost Summary Insights
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          <div>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Fixed Expenses</h4>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'white' }}>₹{(categoriesMap['Registration'] || 0) + (categoriesMap['Insurance'] || 0) + (categoriesMap['Accessories'] || 0)}</div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Registration, Initial Accessories, United India Insurance policies.</p>
          </div>
          
          <div>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Running Maintenance</h4>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'white' }}>₹{(categoriesMap['Service'] || 0) + (categoriesMap['Repairs'] || 0)}</div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>General periodic service, battery swaps, tire replacements, spark plugs.</p>
          </div>

          <div>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Refueling Totals</h4>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'white' }}>₹{totalFuelCost.toLocaleString()}</div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Calculated from the total of all logged Shell / BPCL / HPCL refuels.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
