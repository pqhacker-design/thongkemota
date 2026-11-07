import React, { useMemo, useRef, useState } from 'react';
import { Download, ZoomIn, ZoomOut, RotateCcw, Info } from 'lucide-react';
import { DescriptiveStatistics } from '../types/statistics';
import { formatNum } from '../utils/mathStatistics';
import { downloadSvgAsPng } from '../utils/exportUtils';

interface BoxPlotChartProps {
  stats: DescriptiveStatistics;
  digits?: number;
  rawNumbers?: number[];
}

export const BoxPlotChart: React.FC<BoxPlotChartProps> = ({
  stats,
  digits = 4,
  rawNumbers = [],
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<number>(0);
  const [hoveredPoint, setHoveredPoint] = useState<{
    label: string;
    value: number;
    desc?: string;
    x: number;
    y: number;
  } | null>(null);

  // SVG dimensions
  const width = 860;
  const height = 240;
  const padding = { top: 45, right: 55, bottom: 65, left: 55 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const boxHeight = 52;
  const centerY = padding.top + innerHeight / 2 - 8;

  // Calculate domain range
  const { dataMin, dataMax, outliersList } = useMemo(() => {
    let minVal = stats.min;
    let maxVal = stats.max;

    if (!stats.isGrouped && stats.outliers.allOutliers.length > 0) {
      for (const out of stats.outliers.allOutliers) {
        if (out < minVal) minVal = out;
        if (out > maxVal) maxVal = out;
      }
    }

    // Include lower fence and upper fence in visual domain for context
    const domainMin = Math.min(minVal, stats.lowerFence);
    const domainMax = Math.max(maxVal, stats.upperFence);
    const margin = (domainMax - domainMin) * 0.1 || 1;

    return {
      dataMin: domainMin - margin,
      dataMax: domainMax + margin,
      outliersList: stats.outliers.allOutliers,
    };
  }, [stats]);

  // Handle zoom domain
  const domainSpan = (dataMax - dataMin) / zoomLevel;
  const currentMin = dataMin + panOffset;
  const currentMax = currentMin + domainSpan;

  // Scale function: value -> SVG x coordinate
  const scaleX = (val: number) => {
    const ratio = (val - currentMin) / (currentMax - currentMin || 1);
    return padding.left + ratio * innerWidth;
  };

  // Coordinates
  const xMinObs = scaleX(stats.isGrouped ? stats.min : stats.whiskerMin);
  const xQ1 = scaleX(stats.q1);
  const xQ2 = scaleX(stats.q2);
  const xQ3 = scaleX(stats.q3);
  const xMaxObs = scaleX(stats.isGrouped ? stats.max : stats.whiskerMax);

  // Numeric axis ticks
  const ticks = useMemo(() => {
    const count = 7;
    const step = (currentMax - currentMin) / (count - 1);
    return Array.from({ length: count }, (_, i) => currentMin + i * step);
  }, [currentMin, currentMax]);

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.max(0.7, Math.min(prev + delta, 3.5)));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset(0);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 transition-all">
      {/* Header and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            Biểu Đồ Hộp (Box Plot & Whisker)
            {stats.isGrouped && (
              <span className="text-xs font-normal text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                Ước lượng theo khoảng lớp
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Trực quan hóa mức độ phân tán, trung vị, các tứ phân vị và điểm ngoại lệ
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs text-slate-700">
            <button
              onClick={() => handleZoom(0.25)}
              className="p-1.5 hover:bg-white rounded hover:shadow-xs transition-colors"
              title="Phóng to"
            >
              <ZoomIn className="w-3.5 h-3.5 text-slate-600" />
            </button>
            <button
              onClick={() => handleZoom(-0.25)}
              className="p-1.5 hover:bg-white rounded hover:shadow-xs transition-colors"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-3.5 h-3.5 text-slate-600" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 hover:bg-white rounded hover:shadow-xs transition-colors"
              title="Đặt lại chế độ xem"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
            </button>
          </div>

          <button
            onClick={() => downloadSvgAsPng(svgRef.current, `BoxPlot_${stats.isGrouped ? 'GhepNhom' : 'Thuong'}.png`)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải ảnh PNG</span>
          </button>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative overflow-x-auto bg-slate-50/70 rounded-lg border border-slate-100 p-2">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[620px] select-none"
        >
          <defs>
            {/* Gradient for the IQR box */}
            <linearGradient id="iqrGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.15" />
            </linearGradient>

            {/* Pattern for background grid lines */}
            <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f1f5f9" strokeWidth="1" />
            </pattern>
          </defs>

          {/* Grid background */}
          <rect x={padding.left} y={padding.top - 10} width={innerWidth} height={innerHeight + 10} fill="url(#gridPattern)" />

          {/* Axis Line */}
          <line
            x1={padding.left}
            y1={padding.top + innerHeight}
            x2={padding.left + innerWidth}
            y2={padding.top + innerHeight}
            stroke="#94a3b8"
            strokeWidth="1.5"
          />

          {/* Axis Ticks & Numbers */}
          {ticks.map((tickVal, i) => {
            const x = scaleX(tickVal);
            if (x < padding.left || x > padding.left + innerWidth) return null;
            return (
              <g key={i}>
                <line
                  x1={x}
                  y1={padding.top + innerHeight}
                  x2={x}
                  y2={padding.top + innerHeight + 6}
                  stroke="#94a3b8"
                  strokeWidth="1"
                />
                <line
                  x1={x}
                  y1={padding.top - 5}
                  x2={x}
                  y2={padding.top + innerHeight}
                  stroke="#e2e8f0"
                  strokeWidth="0.8"
                  strokeDasharray="2,2"
                />
                <text
                  x={x}
                  y={padding.top + innerHeight + 20}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#64748b"
                  className="font-mono tabular-nums"
                >
                  {formatNum(tickVal, 2)}
                </text>
              </g>
            );
          })}

          {/* Outer Fence Regions (subtle shaded indicators) */}
          {scaleX(stats.lowerFence) >= padding.left && (
            <line
              x1={scaleX(stats.lowerFence)}
              y1={padding.top}
              x2={scaleX(stats.lowerFence)}
              y2={padding.top + innerHeight}
              stroke="#f43f5e"
              strokeWidth="1"
              strokeDasharray="3,3"
            />
          )}
          {scaleX(stats.upperFence) <= padding.left + innerWidth && (
            <line
              x1={scaleX(stats.upperFence)}
              y1={padding.top}
              x2={scaleX(stats.upperFence)}
              y2={padding.top + innerHeight}
              stroke="#f43f5e"
              strokeWidth="1"
              strokeDasharray="3,3"
            />
          )}

          {/* Whisker Line: Lower Whisker (from xMinObs to Q1) */}
          <line
            x1={xMinObs}
            y1={centerY}
            x2={xQ1}
            y2={centerY}
            stroke="#0284c7"
            strokeWidth="2"
          />

          {/* Whisker Line: Upper Whisker (from Q3 to xMaxObs) */}
          <line
            x1={xQ3}
            y1={centerY}
            x2={xMaxObs}
            y2={centerY}
            stroke="#0284c7"
            strokeWidth="2"
          />

          {/* Whisker End Cap: Min */}
          <line
            x1={xMinObs}
            y1={centerY - 14}
            x2={xMinObs}
            y2={centerY + 14}
            stroke="#0284c7"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Whisker End Cap: Max */}
          <line
            x1={xMaxObs}
            y1={centerY - 14}
            x2={xMaxObs}
            y2={centerY + 14}
            stroke="#0284c7"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Box (Q1 to Q3) */}
          <rect
            x={Math.min(xQ1, xQ3)}
            y={centerY - boxHeight / 2}
            width={Math.max(2, Math.abs(xQ3 - xQ1))}
            height={boxHeight}
            fill="url(#iqrGradient)"
            stroke="#0284c7"
            strokeWidth="2"
            rx="4"
            className="cursor-pointer transition-colors hover:stroke-sky-700"
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setHoveredPoint({
                label: 'Hộp tứ phân vị (IQR)',
                value: stats.iqr,
                desc: `Q1: ${formatNum(stats.q1, digits)} · Q3: ${formatNum(stats.q3, digits)} · IQR = ${formatNum(stats.iqr, digits)}`,
                x: (xQ1 + xQ3) / 2,
                y: centerY - boxHeight / 2 - 10,
              });
            }}
            onMouseLeave={() => setHoveredPoint(null)}
          />

          {/* Median Q2 Line (vạch trung vị) */}
          <line
            x1={xQ2}
            y1={centerY - boxHeight / 2}
            x2={xQ2}
            y2={centerY + boxHeight / 2}
            stroke="#0f766e"
            strokeWidth="3.5"
            strokeLinecap="round"
            className="cursor-pointer"
            onMouseEnter={() => {
              setHoveredPoint({
                label: 'Trung vị (Q2)',
                value: stats.q2,
                desc: 'Phân chia 50% số liệu phía dưới và 50% phía trên',
                x: xQ2,
                y: centerY - boxHeight / 2 - 10,
              });
            }}
            onMouseLeave={() => setHoveredPoint(null)}
          />

          {/* Mean point marker (Diamond marker) */}
          <polygon
            points={`${scaleX(stats.mean)},${centerY - 6} ${scaleX(stats.mean) + 6},${centerY} ${scaleX(stats.mean)},${centerY + 6} ${scaleX(stats.mean) - 6},${centerY}`}
            fill="#d97706"
            stroke="#ffffff"
            strokeWidth="1.5"
            className="cursor-pointer hover:scale-125 transition-transform"
            onMouseEnter={() => {
              setHoveredPoint({
                label: 'Trung bình mẫu (x̄)',
                value: stats.mean,
                desc: 'Điểm cân bằng trọng tâm của dữ liệu',
                x: scaleX(stats.mean),
                y: centerY - 14,
              });
            }}
            onMouseLeave={() => setHoveredPoint(null)}
          />

          {/* Outlier Points (Individual red dots for raw data) */}
          {!stats.isGrouped &&
            outliersList.map((val, idx) => {
              const cx = scaleX(val);
              return (
                <g key={`outlier-${idx}`}>
                  <circle
                    cx={cx}
                    cy={centerY}
                    r="5"
                    fill="#ef4444"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="cursor-pointer hover:r-7 transition-all filter drop-shadow-xs"
                    onMouseEnter={() => {
                      setHoveredPoint({
                        label: val < stats.lowerFence ? 'Ngoại lệ phía dưới' : 'Ngoại lệ phía trên',
                        value: val,
                        desc: val < stats.lowerFence ? `< LF (${formatNum(stats.lowerFence, digits)})` : `> UF (${formatNum(stats.upperFence, digits)})`,
                        x: cx,
                        y: centerY - 12,
                      });
                    }}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  {/* Subtle Outlier indicator star or cross */}
                  <text
                    x={cx}
                    y={centerY - 9}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#ef4444"
                    fontWeight="bold"
                  >
                    ×
                  </text>
                </g>
              );
            })}

          {/* Key Value Labels on Top of Box Plot */}
          <g className="text-labels select-none">
            {/* Min Label */}
            <text
              x={xMinObs}
              y={centerY - 22}
              textAnchor="middle"
              fontSize="10"
              fontWeight="600"
              fill="#0369a1"
            >
              x_min
            </text>
            <text
              x={xMinObs}
              y={centerY - 10}
              textAnchor="middle"
              fontSize="9"
              fill="#475569"
              className="font-mono tabular-nums"
            >
              {formatNum(stats.isGrouped ? stats.min : stats.whiskerMin, digits)}
            </text>

            {/* Q1 Label */}
            <text
              x={xQ1}
              y={centerY + boxHeight / 2 + 16}
              textAnchor="middle"
              fontSize="10"
              fontWeight="700"
              fill="#0284c7"
            >
              Q₁
            </text>
            <text
              x={xQ1}
              y={centerY + boxHeight / 2 + 28}
              textAnchor="middle"
              fontSize="9"
              fill="#475569"
              className="font-mono tabular-nums"
            >
              {formatNum(stats.q1, digits)}
            </text>

            {/* Q2 / Median Label */}
            <text
              x={xQ2}
              y={centerY - boxHeight / 2 - 16}
              textAnchor="middle"
              fontSize="11"
              fontWeight="800"
              fill="#0f766e"
            >
              Q₂ (Trung vị)
            </text>
            <text
              x={xQ2}
              y={centerY - boxHeight / 2 - 4}
              textAnchor="middle"
              fontSize="10"
              fontWeight="600"
              fill="#0f766e"
              className="font-mono tabular-nums"
            >
              {formatNum(stats.q2, digits)}
            </text>

            {/* Q3 Label */}
            <text
              x={xQ3}
              y={centerY + boxHeight / 2 + 16}
              textAnchor="middle"
              fontSize="10"
              fontWeight="700"
              fill="#0284c7"
            >
              Q₃
            </text>
            <text
              x={xQ3}
              y={centerY + boxHeight / 2 + 28}
              textAnchor="middle"
              fontSize="9"
              fill="#475569"
              className="font-mono tabular-nums"
            >
              {formatNum(stats.q3, digits)}
            </text>

            {/* Max Label */}
            <text
              x={xMaxObs}
              y={centerY - 22}
              textAnchor="middle"
              fontSize="10"
              fontWeight="600"
              fill="#0369a1"
            >
              x_max
            </text>
            <text
              x={xMaxObs}
              y={centerY - 10}
              textAnchor="middle"
              fontSize="9"
              fill="#475569"
              className="font-mono tabular-nums"
            >
              {formatNum(stats.isGrouped ? stats.max : stats.whiskerMax, digits)}
            </text>
          </g>

          {/* Interactive Tooltip bubble */}
          {hoveredPoint && (
            <g transform={`translate(${Math.max(60, Math.min(hoveredPoint.x, width - 110))}, ${Math.max(15, hoveredPoint.y - 25)})`}>
              <rect
                x="-75"
                y="-32"
                width="150"
                height="38"
                rx="6"
                fill="#0f172a"
                opacity="0.92"
                className="filter drop-shadow-md"
              />
              <text x="0" y="-18" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">
                {hoveredPoint.label}: {formatNum(hoveredPoint.value, digits)}
              </text>
              {hoveredPoint.desc && (
                <text x="0" y="-6" textAnchor="middle" fill="#94a3b8" fontSize="8.5">
                  {hoveredPoint.desc}
                </text>
              )}
            </g>
          )}
        </svg>
      </div>

      {/* Box Plot Legend & Clarification */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 bg-sky-200 border border-sky-500 rounded-xs"></span>
            <span>Hộp IQR (Q1 đến Q3)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-1 bg-teal-600 rounded"></span>
            <span>Trung vị Q2</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rotate-45 bg-amber-500"></span>
            <span>Trung bình x̄</span>
          </span>
          {!stats.isGrouped && (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span>Điểm ngoại lệ</span>
            </span>
          )}
        </div>

        {stats.isGrouped ? (
          <div className="flex items-center gap-1 text-slate-500 italic text-[11px]">
            <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Biểu đồ được xây dựng từ các đại lượng ước lượng của số liệu ghép nhóm.</span>
          </div>
        ) : (
          <div className="text-[11px] text-slate-500">
            Râu biểu đồ kéo dài đến giá trị không phải ngoại lệ gần nhất trong khoảng [LF; UF].
          </div>
        )}
      </div>
    </div>
  );
};
