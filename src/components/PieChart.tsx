import React, { useMemo, useRef, useState } from 'react';
import { Download, PieChart as PieIcon, Info } from 'lucide-react';
import { DescriptiveStatistics, GroupInterval } from '../types/statistics';
import { formatNum } from '../utils/mathStatistics';
import { downloadSvgAsPng } from '../utils/exportUtils';

interface PieChartProps {
  stats: DescriptiveStatistics;
  dataType: 'ungrouped' | 'grouped';
  groups?: GroupInterval[];
  rawNumbers?: number[];
  digits?: number;
}

interface SliceData {
  label: string;
  sublabel?: string;
  value: number;
  percentage: number;
  startAngle: number;
  endAngle: number;
  color: string;
}

// Harmonious educational color palette (Azure, Teal, Emerald, Amber, Indigo, Rose, Violet, Cyan)
const SLICE_COLORS = [
  '#0284c7', // Sky-600
  '#0d9488', // Teal-600
  '#059669', // Emerald-600
  '#d97706', // Amber-600
  '#4f46e5', // Indigo-600
  '#e11d48', // Rose-600
  '#7c3aed', // Violet-600
  '#0891b2', // Cyan-600
  '#65a30d', // Lime-600
  '#ea580c', // Orange-600
];

export const PieChart: React.FC<PieChartProps> = ({
  stats,
  dataType,
  groups = [],
  rawNumbers = [],
  digits = 2,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [chartType, setChartType] = useState<'donut' | 'pie'>('donut');
  const [ungroupedMode, setUngroupedMode] = useState<'quartiles' | 'values'>('quartiles');

  // Compute slices based on data
  const slices: SliceData[] = useMemo(() => {
    let rawItems: { label: string; sublabel?: string; count: number }[] = [];

    if (dataType === 'grouped') {
      // Grouped frequency intervals
      rawItems = groups
        .filter((g) => g.frequency > 0)
        .map((g) => ({
          label: `[${g.lower}; ${g.upper})`,
          sublabel: `xᵢ = ${(g.lower + g.upper) / 2}`,
          count: g.frequency,
        }));
    } else {
      // Ungrouped data
      if (ungroupedMode === 'quartiles') {
        // Group by 4 quartile segments
        const q1 = stats.q1;
        const q2 = stats.q2;
        const q3 = stats.q3;

        const part1 = rawNumbers.filter((x) => x <= q1).length;
        const part2 = rawNumbers.filter((x) => x > q1 && x <= q2).length;
        const part3 = rawNumbers.filter((x) => x > q2 && x <= q3).length;
        const part4 = rawNumbers.filter((x) => x > q3).length;

        rawItems = [
          { label: `Phần 1 (x ≤ Q₁)`, sublabel: `x ≤ ${formatNum(q1, 2)}`, count: part1 },
          { label: `Phần 2 (Q₁ < x ≤ Q₂)`, sublabel: `${formatNum(q1, 2)} < x ≤ ${formatNum(q2, 2)}`, count: part2 },
          { label: `Phần 3 (Q₂ < x ≤ Q₃)`, sublabel: `${formatNum(q2, 2)} < x ≤ ${formatNum(q3, 2)}`, count: part3 },
          { label: `Phần 4 (x > Q₃)`, sublabel: `x > ${formatNum(q3, 2)}`, count: part4 },
        ].filter((item) => item.count > 0);
      } else {
        // Frequency of distinct values
        const freqMap: Record<number, number> = {};
        for (const num of rawNumbers) {
          freqMap[num] = (freqMap[num] || 0) + 1;
        }

        const sortedKeys = Object.keys(freqMap)
          .map(Number)
          .sort((a, b) => a - b);

        rawItems = sortedKeys.map((val) => ({
          label: `Giá trị ${val}`,
          sublabel: `${freqMap[val]} lần xuất hiện`,
          count: freqMap[val],
        }));
      }
    }

    const total = rawItems.reduce((acc, curr) => acc + curr.count, 0);
    if (total === 0) return [];

    let currentAngle = -Math.PI / 2; // Start from 12 o'clock
    return rawItems.map((item, idx) => {
      const percentage = (item.count / total) * 100;
      const angleSpan = (item.count / total) * 2 * Math.PI;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angleSpan;
      currentAngle = endAngle;

      return {
        label: item.label,
        sublabel: item.sublabel,
        value: item.count,
        percentage,
        startAngle,
        endAngle,
        color: SLICE_COLORS[idx % SLICE_COLORS.length],
      };
    });
  }, [dataType, groups, rawNumbers, ungroupedMode, stats]);

  // SVG dimensions
  const size = 320;
  const center = size / 2;
  const radius = 120;
  const innerRadius = chartType === 'donut' ? 68 : 0;

  // Helper to generate SVG path for arc slice
  const createArcPath = (startAngle: number, endAngle: number, rOut: number, rIn: number) => {
    // If arc is full 360 circle
    const isFullCircle = endAngle - startAngle >= 2 * Math.PI - 0.001;
    if (isFullCircle) {
      if (rIn === 0) {
        return `M ${center} ${center - rOut} A ${rOut} ${rOut} 0 1 1 ${center} ${center + rOut} A ${rOut} ${rOut} 0 1 1 ${center} ${center - rOut} Z`;
      }
      return `M ${center} ${center - rOut} A ${rOut} ${rOut} 0 1 1 ${center} ${center + rOut} A ${rOut} ${rOut} 0 1 1 ${center} ${center - rOut} M ${center} ${center - rIn} A ${rIn} ${rIn} 0 1 0 ${center} ${center + rIn} A ${rIn} ${rIn} 0 1 0 ${center} ${center - rIn} Z`;
    }

    const x1 = center + rOut * Math.cos(startAngle);
    const y1 = center + rOut * Math.sin(startAngle);
    const x2 = center + rOut * Math.cos(endAngle);
    const y2 = center + rOut * Math.sin(endAngle);

    const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

    if (rIn === 0) {
      return `M ${center} ${center} L ${x1} ${y1} A ${rOut} ${rOut} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
    }

    const x3 = center + rIn * Math.cos(endAngle);
    const y3 = center + rIn * Math.sin(endAngle);
    const x4 = center + rIn * Math.cos(startAngle);
    const y4 = center + rIn * Math.sin(startAngle);

    return `M ${x1} ${y1} A ${rOut} ${rOut} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${rIn} ${rIn} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`;
  };

  const handleDownload = () => {
    downloadSvgAsPng(svgRef.current, `BieuDoPhanTram_${dataType}_StatisticsPro.png`);
  };

  const activeSlice = hoveredIdx !== null ? slices[hoveredIdx] : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 transition-all">
      {/* Header and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-sky-600" />
            <span>Biểu Đồ Phần Trăm (Pie & Donut Chart)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {dataType === 'grouped'
              ? 'Tỷ lệ cơ cấu tần số phần trăm của các khoảng lớp ghép nhóm'
              : 'Trực quan hóa tỷ lệ phần trăm phân bố số liệu'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Ungrouped Mode Switch */}
          {dataType === 'ungrouped' && (
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs text-slate-700">
              <button
                onClick={() => setUngroupedMode('quartiles')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  ungroupedMode === 'quartiles'
                    ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                4 Khoảng Tứ phân vị
              </button>
              <button
                onClick={() => setUngroupedMode('values')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  ungroupedMode === 'values'
                    ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tần số giá trị
              </button>
            </div>
          )}

          {/* Chart Style Switch: Donut vs Pie */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs text-slate-700">
            <button
              onClick={() => setChartType('donut')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                chartType === 'donut'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hình vành khăn (Donut)
            </button>
            <button
              onClick={() => setChartType('pie')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                chartType === 'pie'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hình quạt tròn (Pie)
            </button>
          </div>

          {/* Download PNG */}
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors cursor-pointer"
            title="Tải biểu đồ hình quạt tròn dạng ảnh PNG"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải ảnh PNG</span>
          </button>
        </div>
      </div>

      {/* Main Visual Display: Chart + Legend Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left: SVG Chart Canvas */}
        <div className="md:col-span-5 flex justify-center relative">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${size} ${size}`}
            className="w-[260px] sm:w-[280px] h-[260px] sm:h-[280px] select-none"
          >
            <defs>
              <filter id="shadowEffect" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
              </filter>
            </defs>

            {/* Slices */}
            {slices.map((slice, idx) => {
              const isHovered = hoveredIdx === idx;
              const currentR = isHovered ? radius + 6 : radius;
              const pathD = createArcPath(
                slice.startAngle,
                slice.endAngle,
                currentR,
                innerRadius
              );

              // Position for percentage text inside slice
              const midAngle = (slice.startAngle + slice.endAngle) / 2;
              const textR = innerRadius > 0 ? (radius + innerRadius) / 2 : radius * 0.65;
              const textX = center + textR * Math.cos(midAngle);
              const textY = center + textR * Math.sin(midAngle);

              return (
                <g
                  key={idx}
                  className="cursor-pointer transition-transform duration-200"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  <path
                    d={pathD}
                    fill={slice.color}
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    className="transition-all duration-200"
                    style={{
                      transformOrigin: `${center}px ${center}px`,
                      filter: isHovered ? 'url(#shadowEffect)' : 'none',
                    }}
                  />
                  {/* Show % text on slice if slice is wide enough (> 6%) */}
                  {slice.percentage >= 6 && (
                    <text
                      x={textX}
                      y={textY}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#ffffff"
                      fontSize="10.5"
                      fontWeight="bold"
                      className="font-mono pointer-events-none drop-shadow-xs"
                    >
                      {slice.percentage.toFixed(1)}%
                    </text>
                  )}
                </g>
              );
            })}

            {/* Center Label for Donut Chart */}
            {chartType === 'donut' && (
              <g className="pointer-events-none text-center">
                {activeSlice ? (
                  <>
                    <text
                      x={center}
                      y={center - 12}
                      textAnchor="middle"
                      fontSize="11"
                      fill="#64748b"
                      fontWeight="600"
                    >
                      {activeSlice.label.length > 14
                        ? activeSlice.label.slice(0, 12) + '...'
                        : activeSlice.label}
                    </text>
                    <text
                      x={center}
                      y={center + 8}
                      textAnchor="middle"
                      fontSize="18"
                      fill="#0f172a"
                      fontWeight="800"
                      className="font-mono tabular-nums"
                    >
                      {activeSlice.percentage.toFixed(1)}%
                    </text>
                    <text
                      x={center}
                      y={center + 24}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#94a3b8"
                      className="font-mono"
                    >
                      n = {activeSlice.value}
                    </text>
                  </>
                ) : (
                  <>
                    <text
                      x={center}
                      y={center - 6}
                      textAnchor="middle"
                      fontSize="11"
                      fill="#64748b"
                      fontWeight="500"
                    >
                      Tổng cộng (n)
                    </text>
                    <text
                      x={center}
                      y={center + 14}
                      textAnchor="middle"
                      fontSize="19"
                      fill="#0284c7"
                      fontWeight="800"
                      className="font-mono tabular-nums"
                    >
                      {stats.n}
                    </text>
                  </>
                )}
              </g>
            )}
          </svg>
        </div>

        {/* Right: Detailed Legend Table */}
        <div className="md:col-span-7 space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Bảng phân bố tỷ lệ phần trăm</span>
            <span>Tần số & Tỷ trọng</span>
          </div>

          <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
            {slices.map((slice, idx) => {
              const isHovered = hoveredIdx === idx;
              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer ${
                    isHovered
                      ? 'bg-sky-50/70 border-sky-300 shadow-xs'
                      : 'bg-slate-50/50 border-slate-200/70 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3.5 h-3.5 rounded-sm shrink-0"
                      style={{ backgroundColor: slice.color }}
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-800 truncate">
                        {slice.label}
                      </div>
                      {slice.sublabel && (
                        <div className="text-xs text-slate-400 truncate">
                          {slice.sublabel}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-3">
                    <div className="font-mono font-extrabold text-sm sm:text-base text-slate-900 tabular-nums">
                      {slice.percentage.toFixed(2)}%
                    </div>
                    <div className="text-xs font-mono font-medium text-slate-500">
                      n = {slice.value}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Educational Note */}
          <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-1.5 border-t border-slate-100">
            <Info className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span>
              {dataType === 'grouped'
                ? 'Góc ở tâm của mỗi hình quạt tròn được tính theo công thức: αᵢ = (nᵢ / n) × 360°'
                : 'Mỗi cung tròn thể hiện tỷ lệ % số lượng quan sát tương ứng trên tổng cỡ mẫu n'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
