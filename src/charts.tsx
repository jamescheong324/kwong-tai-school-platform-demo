type LineChartProps = {
  values: number[];
  min: number;
  max: number;
  reference?: number;
};

export function LineChart({ values, min, max, reference }: LineChartProps) {
  const w = 640;
  const h = 180;
  const pad = 24;
  const xs = values.map((_, i) => pad + (i * (w - pad * 2)) / (values.length - 1));
  const y = (v: number) => pad + ((max - v) / (max - min)) * (h - pad * 2);
  const d = values.map((v, i) => `${i === 0 ? "M" : "L"} ${xs[i]} ${y(v)}`).join(" ");
  const refY = reference !== undefined ? y(reference) : null;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="chart" role="img" aria-label="出勤趨勢">
      {refY !== null && (
        <line x1={pad} x2={w - pad} y1={refY} y2={refY} className="chart-ref" />
      )}
      <path d={d} className="chart-line" />
      {values.map((v, i) => (
        <circle key={i} cx={xs[i]} cy={y(v)} r={i === values.length - 1 ? 4 : 2.5} />
      ))}
    </svg>
  );
}

type BarGroup = { label: string; a: number; b: number };

export function GroupedBars({ rows }: { rows: BarGroup[] }) {
  const w = 640;
  const h = 220;
  const pad = 36;
  const max = Math.max(1, ...rows.flatMap((r) => [r.a, r.b])) * 1.08;
  const groupW = (w - pad * 2) / rows.length;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="chart" role="img" aria-label="各科班平均">
      {rows.map((row, i) => {
        const x = pad + i * groupW;
        const ah = ((row.a / max) * (h - pad * 2));
        const bh = ((row.b / max) * (h - pad * 2));
        return (
          <g key={row.label}>
            <rect x={x + 8} y={h - pad - ah} width={groupW * 0.32} height={ah} className="bar-a" />
            <rect x={x + 8 + groupW * 0.36} y={h - pad - bh} width={groupW * 0.32} height={bh} className="bar-b" />
            <text x={x + groupW / 2} y={h - 12} textAnchor="middle" className="chart-label">
              {row.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

type MultiLine = { term: string; [k: string]: string | number };

export function MultiLineChart({
  rows,
  keys,
}: {
  rows: MultiLine[];
  keys: string[];
}) {
  const w = 640;
  const h = 220;
  const pad = 28;
  const min = 40;
  const max = 95;
  const xs = rows.map((_, i) => pad + (i * (w - pad * 2)) / Math.max(rows.length - 1, 1));
  const y = (v: number) => pad + ((max - v) / (max - min)) * (h - pad * 2);
  const colors = ["#0071e3", "#34c759", "#af52de", "#ff9500"];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="chart" role="img" aria-label="成績趨勢">
      {keys.map((key, ki) => {
        const d = rows
          .map((row, i) => `${i === 0 ? "M" : "L"} ${xs[i]} ${y(Number(row[key]))}`)
          .join(" ");
        return <path key={key} d={d} className="chart-line" style={{ stroke: colors[ki % colors.length] }} />;
      })}
      {rows.map((row, i) => (
        <text key={row.term} x={xs[i]} y={h - 6} textAnchor="middle" className="chart-label">
          {row.term}
        </text>
      ))}
    </svg>
  );
}
