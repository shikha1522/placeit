// DonutChart.jsx
// Pure SVG donut chart — no external chart library needed
// Shows Easy (green), Medium (yellow), Hard (red) DSA progress
// Center displays total solved count

const DonutChart = ({ easy, medium, hard, total }) => {
  // ── Donut geometry ──
  const size   = 160;  // SVG canvas size (px)
  const cx     = 80;   // center X
  const cy     = 80;   // center Y
  const radius = 60;   // circle radius
  const stroke = 14;   // thickness of the donut ring

  // Circumference of the circle = 2 * π * r
  const circumference = 2 * Math.PI * radius;

  // Total questions solved (sum of all difficulties)
  const totalSolved = easy + medium + hard;

  // ── Calculate stroke-dasharray for each segment ──
  // Each segment: (count / totalSolved) × circumference = arc length
  // If nothing solved yet, show empty grey ring

  const easyArc   = totalSolved > 0 ? (easy   / totalSolved) * circumference : 0;
  const mediumArc = totalSolved > 0 ? (medium / totalSolved) * circumference : 0;
  const hardArc   = totalSolved > 0 ? (hard   / totalSolved) * circumference : 0;

  // ── Calculate rotation offset for each segment ──
  // SVG circles start at 3 o'clock. We rotate -90° to start at 12 o'clock.
  // Each segment starts where the previous one ended.
  const easyOffset   = 0;                                    // starts at top
  const mediumOffset = easyArc;                              // after easy
  const hardOffset   = easyArc + mediumArc;                  // after medium

  // ── Helper: render one donut segment ──
  // dasharray: [arc_length, rest_of_circle] → only arc_length is colored
  // dashoffset: negative to rotate to correct start position
  const Segment = ({ arcLength, offset, color }) => {
    if (arcLength === 0) return null; // don't render zero-length segments

    return (
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        // dasharray: colored part + transparent gap
        strokeDasharray={`${arcLength} ${circumference - arcLength}`}
        // dashoffset: shift starting point by offset (negative = clockwise from top)
        strokeDashoffset={-(offset)}
        // Rotate entire circle -90° so 0° is at top (12 o'clock)
        transform={`rotate(-90, ${cx}, ${cy})`}
        strokeLinecap="round"  // rounded segment ends like in your screenshot
      />
    );
  };

  return (
    <div className="donut-chart">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        // Accessible label
        aria-label={`DSA progress: ${easy} easy, ${medium} medium, ${hard} hard`}
      >
        {/* ── Background track ring (dark grey) ── */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="#2a2a2a"        // matches --border CSS variable
          strokeWidth={stroke}
        />

        {/* ── Colored segments ── */}
        {/* Easy: green */}
        <Segment arcLength={easyArc}   offset={easyOffset}   color="#22c55e" />
        {/* Medium: yellow/amber */}
        <Segment arcLength={mediumArc} offset={mediumOffset} color="#f59e0b" />
        {/* Hard: red */}
        <Segment arcLength={hardArc}   offset={hardOffset}   color="#ef4444" />

        {/* ── Center text: total solved ── */}
        {/* Number */}
        <text
          x={cx}
          y={cy - 5}
          textAnchor="middle"
          fill="#ffffff"
          fontSize="24"
          fontWeight="700"
          fontFamily="inherit"
        >
          {totalSolved}
        </text>
        {/* "Solved" label below number */}
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          fill="#a1a1aa"    // --text-secondary
          fontSize="11"
          fontFamily="inherit"
        >
          Solved
        </text>
      </svg>
    </div>
  );
};

export default DonutChart;