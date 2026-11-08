import React, { useRef, useState } from 'react';
import { Camera, Eye, EyeOff, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { SimpleDataPoint, SimpleRegressionResult } from '../../types/regression';
import { formatNum } from '../../utils/mathStatistics';

interface SimpleScatterPlotProps {
  points: SimpleDataPoint[];
  result: SimpleRegressionResult | null;
  digits?: number;
}

export const SimpleScatterPlot: React.FC<SimpleScatterPlotProps> = ({
  points,
  result,
  digits = 4,
}) => {
  const [showTrendline, setShowTrendline] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  if (!points || points.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-8 text-center text-slate-400">
        Chưa có dữ liệu để vẽ biểu đồ phân tán.
      </div>
    );
  }

  // Calculate bounds
  const xVals = points.map((p) => p.x);
  const yVals = points.map((p) => p.y);

  let minX = Math.min(...xVals);
  let maxX = Math.max(...xVals);
  let minY = Math.min(...yVals);
  let maxY = Math.max(...yVals);

  // If there's a regression line, also ensure trendline endpoints fit
  if (result && showTrendline) {
    const yAtMinX = result.b0 + result.b1 * minX;
    const yAtMaxX = result.b0 + result.b1 * maxX;
    minY = Math.min(minY, yAtMinX, yAtMaxX);
    maxY = Math.max(maxY, yAtMinX, yAtMaxX);
  }

  // Add 10% padding
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  const paddedMinX = minX - spanX * 0.1;
  const paddedMaxX = maxX + spanX * 0.1;
  const paddedMinY = minY - spanY * 0.1;
  const paddedMaxY = maxY + spanY * 0.1;

  // SVG dimensions
  const width = 760;
  const height = 440;
  const margin = { top: 30, right: 30, bottom: 60, left: 75 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  // Scale functions
  const scaleX = (x: number) => {
    return margin.left + ((x - paddedMinX) / (paddedMaxX - paddedMinX)) * plotWidth;
  };
  const scaleY = (y: number) => {
    return margin.top + plotHeight - ((y - paddedMinY) / (paddedMaxY - paddedMinY)) * plotHeight;
  };

  // Generate 5-6 ticks for each axis
  const xTicks: number[] = [];
  const yTicks: number[] = [];
  const numTicks = 6;
  for (let i = 0; i <= numTicks; i++) {
    xTicks.push(paddedMinX + (i / numTicks) * (paddedMaxX - paddedMinX));
    yTicks.push(paddedMinY + (i / numTicks) * (paddedMaxY - paddedMinY));
  }

  // Regression line coords
  const lineX1 = paddedMinX;
  const lineY1 = result ? result.b0 + result.b1 * lineX1 : 0;
  const lineX2 = paddedMaxX;
  const lineY2 = result ? result.b0 + result.b1 * lineX2 : 0;

  // Download SVG as PNG
  const handleDownloadPNG = () => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const svgString = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement('canvas');
    canvas.width = width * 2;
    canvas.height = height * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(2, 2);
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      const a = document.createElement('a');
      a.download = 'bieu-do-hoi-quy-tuyen-tinh-don.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = url;
  };

  const hoveredPoint = hoveredIndex !== null ? points[hoveredIndex] : null;
  const hoveredResidual =
    hoveredIndex !== null && result && result.rows[hoveredIndex]
      ? result.rows[hoveredIndex]
      : null;

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
      {/* Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            Biểu Đồ Phân Tán & Đường Hồi Quy OLS
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Trực quan hóa tương quan giữa biến X và biến Y, kèm phần dư thực tế
          </p>
        </div>

        <div className="flex items-center gap-2">
          {result && (
            <button
              onClick={() => setShowTrendline(!showTrendline)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                showTrendline
                  ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {showTrendline ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              {showTrendline ? 'Ẩn đường hồi quy' : 'Hiện đường hồi quy'}
            </button>
          )}

          <button
            onClick={handleDownloadPNG}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-2xs"
            title="Tải biểu đồ dạng hình ảnh PNG"
          >
            <Camera className="w-3.5 h-3.5 text-blue-600" />
            Tải ảnh PNG
          </button>
        </div>
      </div>

      {/* Badges */}
      {result && (
        <div className="flex flex-wrap items-center gap-2.5 text-sm">
          <div className="bg-blue-50 border border-blue-200 text-blue-900 px-3.5 py-1.5 rounded-lg font-mono font-semibold shadow-2xs">
            Phương trình: <span className="font-extrabold text-blue-950 text-base ml-1">{result.equationString}</span>
          </div>
          <div className="bg-teal-50 border border-teal-200 text-teal-900 px-3 py-1.5 rounded-lg font-mono shadow-2xs">
            r = <span className="font-extrabold text-teal-950 text-base">{formatNum(result.pearsonR, digits)}</span>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 px-3 py-1.5 rounded-lg font-mono shadow-2xs">
            R² = <span className="font-extrabold text-indigo-950 text-base">{formatNum(result.rSquared, digits)}</span>
            <span className="text-indigo-700 text-xs ml-1 font-bold">
              ({(result.rSquared * 100).toFixed(1)}%)
            </span>
          </div>
          {result.ser !== null && (
            <div className="bg-slate-50 border border-slate-200 text-slate-800 px-3 py-1.5 rounded-lg font-mono shadow-2xs">
              SER = <span className="font-extrabold text-slate-950 text-base">{formatNum(result.ser, digits)}</span>
            </div>
          )}
        </div>
      )}

      {/* SVG Container */}
      <div className="w-full overflow-x-auto bg-slate-50/50 rounded-xl p-2 border border-slate-100 flex justify-center">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full max-w-[760px] h-auto select-none font-sans"
        >
          {/* Background */}
          <rect width={width} height={height} fill="#ffffff" rx="8" />

          {/* Grid lines */}
          <g className="grid-lines" stroke="#e2e8f0" strokeDasharray="3 3">
            {xTicks.map((xVal, i) => {
              const xPos = scaleX(xVal);
              return (
                <line
                  key={`gx-${i}`}
                  x1={xPos}
                  y1={margin.top}
                  x2={xPos}
                  y2={margin.top + plotHeight}
                />
              );
            })}
            {yTicks.map((yVal, i) => {
              const yPos = scaleY(yVal);
              return (
                <line
                  key={`gy-${i}`}
                  x1={margin.left}
                  y1={yPos}
                  x2={margin.left + plotWidth}
                  y2={yPos}
                />
              );
            })}
          </g>

          {/* Axes */}
          <g className="axes" stroke="#64748b" strokeWidth="1.5">
            {/* Y axis */}
            <line
              x1={margin.left}
              y1={margin.top}
              x2={margin.left}
              y2={margin.top + plotHeight}
            />
            {/* X axis */}
            <line
              x1={margin.left}
              y1={margin.top + plotHeight}
              x2={margin.left + plotWidth}
              y2={margin.top + plotHeight}
            />
          </g>

          {/* Tick labels */}
          <g className="tick-labels" fill="#64748b" fontSize="11" textAnchor="middle">
            {/* X ticks */}
            {xTicks.map((xVal, i) => {
              const xPos = scaleX(xVal);
              return (
                <g key={`tx-${i}`}>
                  <line
                    x1={xPos}
                    y1={margin.top + plotHeight}
                    x2={xPos}
                    y2={margin.top + plotHeight + 5}
                    stroke="#94a3b8"
                  />
                  <text x={xPos} y={margin.top + plotHeight + 20}>
                    {formatNum(xVal, 2)}
                  </text>
                </g>
              );
            })}

            {/* Y ticks */}
            {yTicks.map((yVal, i) => {
              const yPos = scaleY(yVal);
              return (
                <g key={`ty-${i}`}>
                  <line
                    x1={margin.left - 5}
                    y1={yPos}
                    x2={margin.left}
                    y2={yPos}
                    stroke="#94a3b8"
                  />
                  <text
                    x={margin.left - 10}
                    y={yPos + 4}
                    textAnchor="end"
                  >
                    {formatNum(yVal, 2)}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Axis Titles */}
          <text
            x={margin.left + plotWidth / 2}
            y={height - 15}
            textAnchor="middle"
            fill="#334155"
            fontSize="12"
            fontWeight="600"
          >
            Biến độc lập X
          </text>
          <text
            x={-margin.top - plotHeight / 2}
            y={22}
            textAnchor="middle"
            fill="#334155"
            fontSize="12"
            fontWeight="600"
            transform="rotate(-90)"
          >
            Biến phụ thuộc Y
          </text>

          {/* Residual lines to trendline (when hovering or subtle dashed) */}
          {result && showTrendline && (
            <g className="residuals-lines" stroke="#ef4444" strokeWidth="1" strokeDasharray="2 2" opacity="0.6">
              {points.map((pt, idx) => {
                const yHat = result.b0 + result.b1 * pt.x;
                const isHovered = hoveredIndex === idx;
                return (
                  <line
                    key={`res-${idx}`}
                    x1={scaleX(pt.x)}
                    y1={scaleY(pt.y)}
                    x2={scaleX(pt.x)}
                    y2={scaleY(yHat)}
                    stroke={isHovered ? '#ef4444' : '#cbd5e1'}
                    strokeWidth={isHovered ? 2 : 1}
                    opacity={isHovered ? 1 : 0.4}
                  />
                );
              })}
            </g>
          )}

          {/* Trendline */}
          {result && showTrendline && (
            <g className="trendline">
              <line
                x1={scaleX(lineX1)}
                y1={scaleY(lineY1)}
                x2={scaleX(lineX2)}
                y2={scaleY(lineY2)}
                stroke="#2563eb"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </g>
          )}

          {/* Data Points */}
          <g className="data-points">
            {points.map((pt, idx) => {
              const cx = scaleX(pt.x);
              const cy = scaleY(pt.y);
              const isHovered = hoveredIndex === idx;

              return (
                <g
                  key={pt.id || idx}
                  className="cursor-pointer transition-transform"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 7 : 5}
                    fill={isHovered ? '#ef4444' : '#0284c7'}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    className="transition-all duration-150 shadow-sm"
                  />
                  {/* Subtle index label */}
                  {points.length <= 25 && (
                    <text
                      x={cx}
                      y={cy - 9}
                      textAnchor="middle"
                      fill="#64748b"
                      fontSize="9"
                      fontWeight="500"
                    >
                      {idx + 1}
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          {/* Hover Tooltip inside SVG */}
          {hoveredPoint && (
            <g
              transform={`translate(${Math.min(
                width - 170,
                Math.max(margin.left + 10, scaleX(hoveredPoint.x) - 70)
              )}, ${Math.max(margin.top + 5, scaleY(hoveredPoint.y) - 60)})`}
            >
              <rect
                width="140"
                height={hoveredResidual ? 52 : 36}
                fill="#1e293b"
                rx="6"
                opacity="0.95"
              />
              <text x="70" y="16" fill="#f8fafc" fontSize="10" textAnchor="middle" fontWeight="bold">
                Điểm #{hoveredIndex! + 1}: ({formatNum(hoveredPoint.x, 2)}, {formatNum(hoveredPoint.y, 2)})
              </text>
              {hoveredResidual && (
                <>
                  <text x="70" y="32" fill="#93c5fd" fontSize="9" textAnchor="middle">
                    Ŷ = {formatNum(hoveredResidual.yPred, 2)}
                  </text>
                  <text
                    x="70"
                    y="45"
                    fill={hoveredResidual.residual >= 0 ? '#4ade80' : '#f87171'}
                    fontSize="9"
                    textAnchor="middle"
                  >
                    e = {formatNum(hoveredResidual.residual, 2)}
                  </text>
                </>
              )}
            </g>
          )}
        </svg>
      </div>

      {/* Legend & Note */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-sky-600 inline-block"></span>
            <span>Quan sát thực tế (X, Y)</span>
          </div>
          {result && showTrendline && (
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-0.5 bg-blue-600 inline-block"></span>
              <span>Đường hồi quy Ŷ = a + bX</span>
            </div>
          )}
          {result && showTrendline && (
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0 border-t border-dashed border-red-400 inline-block"></span>
              <span>Đoạn phần dư e = Y - Ŷ</span>
            </div>
          )}
        </div>
        <div className="text-[11px] text-slate-400 italic">
          * Rê chuột vào các điểm để xem tọa độ và giá trị phần dư chi tiết
        </div>
      </div>
    </div>
  );
};
