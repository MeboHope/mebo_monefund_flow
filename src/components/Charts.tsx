import { formatKES } from '../utils/financial';

export function TrendChart({ data }: { data: Array<{ month: string; income: number; expenses: number }> }) {
  if (!data.length) {
    return (
      <div className="chart-card chart-card--wide">
        <div className="chart-head">
          <div>
            <p className="eyebrow">Cash-flow trend</p>
            <h3>Income vs expenses</h3>
          </div>
        </div>
        <div className="chart-empty">
          <strong>No cash-flow trend yet</strong>
          <span>Create income and expense transactions to build this chart.</span>
        </div>
      </div>
    );
  }
  const max = Math.max(1, ...data.flatMap((item) => [item.income, item.expenses]));
  const width = 620;
  const height = 210;
  const padding = 26;
  const xStep = (width - padding * 2) / Math.max(1, data.length - 1);
  const pointsFor = (key: 'income' | 'expenses') =>
    data
      .map((item, index) => {
        const x = padding + index * xStep;
        const y = height - padding - (item[key] / max) * (height - padding * 2);
        return `${x},${y}`;
      })
      .join(' ');

  return (
    <div className="chart-card chart-card--wide">
      <div className="chart-head">
        <div>
          <p className="eyebrow">Cash-flow trend</p>
          <h3>Income vs expenses</h3>
        </div>
        <div className="chart-legend">
          <span><i className="dot dot--green" /> Income</span>
          <span><i className="dot dot--orange" /> Expenses</span>
        </div>
      </div>
      <svg className="trend-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Cash flow trend chart">
        <defs>
          <linearGradient id="incomeGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((line) => (
          <line
            key={line}
            x1={padding}
            x2={width - padding}
            y1={padding + line * ((height - padding * 2) / 3)}
            y2={padding + line * ((height - padding * 2) / 3)}
            stroke="#dbe5ef"
            strokeDasharray="4 6"
          />
        ))}
        <polyline points={`${padding},${height - padding} ${pointsFor('income')} ${width - padding},${height - padding}`} fill="url(#incomeGradient)" opacity="0.85" />
        <polyline points={pointsFor('income')} fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={pointsFor('expenses')} fill="none" stroke="#f97316" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((item, index) => (
          <g key={item.month}>
            <text x={padding + index * xStep} y={height - 4} textAnchor="middle" fontSize="12" fill="#64748b">{item.month}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export function DistributionChart({ data }: { data: Array<{ label: string; value: number; color: string }> }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (!data.length || total <= 0) {
    return (
      <div className="chart-card">
        <div className="chart-head">
          <div>
            <p className="eyebrow">Spending distribution</p>
            <h3>Where money went</h3>
          </div>
        </div>
        <div className="chart-empty">
          <strong>No spending distribution yet</strong>
          <span>Record expenses to see categories and percentages.</span>
        </div>
      </div>
    );
  }
  let start = 0;
  return (
    <div className="chart-card">
      <div className="chart-head">
        <div>
          <p className="eyebrow">Spending distribution</p>
          <h3>Where money went</h3>
        </div>
      </div>
      <div className="donut-layout">
        <svg className="donut" viewBox="0 0 42 42" role="img" aria-label="Spending distribution chart">
          <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#e2e8f0" strokeWidth="4" />
          {data.map((item) => {
            const percent = (item.value / total) * 100;
            const dash = `${percent} ${100 - percent}`;
            const offset = 25 - start;
            start += percent;
            return <circle key={item.label} cx="21" cy="21" r="15.915" fill="transparent" stroke={item.color} strokeWidth="4" strokeDasharray={dash} strokeDashoffset={offset} />;
          })}
          <text x="21" y="20" textAnchor="middle" fontSize="4" fontWeight="800" fill="#0f172a">{formatKES(total).replace('Ksh ', '')}</text>
          <text x="21" y="25" textAnchor="middle" fontSize="2.6" fill="#64748b">spent</text>
        </svg>
        <div className="legend-list">
          {data.map((item) => (
            <div className="legend-row" key={item.label}>
              <span><i style={{ background: item.color }} /> {item.label}</span>
              <strong>{formatKES(item.value)}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MiniBars({ values, color = '#2563eb' }: { values: number[]; color?: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className="mini-bars" aria-hidden="true">
      {values.map((value, index) => (
        <span key={`${value}-${index}`} style={{ height: `${Math.max(18, (value / max) * 100)}%`, background: color }} />
      ))}
    </div>
  );
}

export function ProgressRing({ value, label }: { value: number; label: string }) {
  const safeValue = Math.min(100, Math.max(0, value));
  return (
    <div className="progress-ring" style={{ ['--progress' as string]: `${safeValue}` }}>
      <svg viewBox="0 0 44 44">
        <circle cx="22" cy="22" r="17" />
        <circle cx="22" cy="22" r="17" />
      </svg>
      <div>
        <strong>{safeValue}%</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
