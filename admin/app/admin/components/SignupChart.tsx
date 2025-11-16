import styles from "../admin.module.css";

type ChartPoint = {
  month: string;
  label: string;
  signups: number;
  totalPlayers: number;
};

type SignupChartProps = {
  series: ChartPoint[];
};

const CHART_WIDTH = 720;
const CHART_HEIGHT = 200;
const PADDING_X = 56;
const PADDING_Y = 30;

const yFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function buildPolyline(points: number[][]): string {
  return points.map(([x, y]) => `${x},${y}`).join(" ");
}

export function SignupChart({ series }: SignupChartProps) {
  const usableSeries =
    series.length > 0
      ? series
      : [{ label: "Jan", month: "placeholder", signups: 0, totalPlayers: 0 }];

  const rawMax = Math.max(
    0,
    ...usableSeries.map((point) => Math.max(point.signups, point.totalPlayers))
  );

  const maxValue = rawMax > 0 ? rawMax : 1;
  const stepCount = Math.max(usableSeries.length - 1, 1);
  const chartWidth = CHART_WIDTH - PADDING_X * 2;
  const chartHeight = CHART_HEIGHT - PADDING_Y * 2;

  const pointsSignups: number[][] = [];
  const pointsPlayers: number[][] = [];

  usableSeries.forEach((point, index) => {
    const x = PADDING_X + (chartWidth / stepCount) * index;
    const signupY =
      PADDING_Y + chartHeight - (chartHeight * point.signups) / maxValue;
    const playerY =
      PADDING_Y + chartHeight - (chartHeight * point.totalPlayers) / maxValue;

    pointsSignups.push([x, signupY]);
    pointsPlayers.push([x, playerY]);
  });

  const areaPath =
    pointsSignups.length > 0
      ? [
          `M ${pointsSignups[0][0]} ${PADDING_Y + chartHeight}`,
          ...pointsSignups.map(([x, y]) => `L ${x} ${y}`),
          `L ${pointsSignups[pointsSignups.length - 1]?.[0] ?? PADDING_X} ${PADDING_Y + chartHeight}`,
          "Z",
        ].join(" ")
      : "";

  return (
    <div>
      <svg
        className={styles.chartSvg}
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        role="img"
        aria-label="Monthly user signups and total players"
      >
        <defs>
          <linearGradient id="signupGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#2ec4ff" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#1b6b8a" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
          const y = PADDING_Y + chartHeight * fraction;
          const value = rawMax > 0 ? (1 - fraction) * maxValue : 0;
          return (
            <g key={fraction}>
              <line
                x1={PADDING_X}
                y1={y}
                x2={PADDING_X + chartWidth}
                y2={y}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth={1}
              />
              <text
                x={PADDING_X - 8}
                y={y + 4}
                fontSize={12}
                fill="#7da8b6"
                textAnchor="end"
              >
                {yFormatter.format(Math.max(0, value))}
              </text>
            </g>
          );
        })}

        <line
          x1={PADDING_X}
          y1={PADDING_Y}
          x2={PADDING_X}
          y2={PADDING_Y + chartHeight}
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth={1.5}
        />

        {areaPath ? (
          <path d={areaPath} fill="url(#signupGradient)" />
        ) : null}

        <polyline
          points={buildPolyline(pointsSignups)}
          fill="none"
          stroke="#58d9ff"
          strokeWidth={3}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        <polyline
          points={buildPolyline(pointsPlayers)}
          fill="none"
          stroke="#ff7a2b"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {pointsSignups.map(([x, y], index) => (
          <circle key={`signup-${usableSeries[index].month}`} cx={x} cy={y} r={4} fill="#58d9ff" />
        ))}

        {pointsPlayers.map(([x, y], index) => (
          <circle key={`players-${usableSeries[index].month}`} cx={x} cy={y} r={3} fill="#ff7a2b" />
        ))}

        {usableSeries.map((point, index) => {
          const x = PADDING_X + (chartWidth / stepCount) * index;
          const labelY = PADDING_Y + chartHeight + 18;
          return (
            <text
              key={`label-${point.month}`}
              x={x}
              y={labelY}
              textAnchor="middle"
              fontSize={12}
              fill="#7da8b6"
            >
              {point.label}
            </text>
          );
        })}
      </svg>
      <div className={styles.chartLegend}>
        <span className={styles.legendItem}>
          <span className={`${styles.legendSwatch} ${styles.legendSignups}`} />
          Monthly signups
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.legendSwatch} ${styles.legendPlayers}`} />
          Total players
        </span>
      </div>
    </div>
  );
}
