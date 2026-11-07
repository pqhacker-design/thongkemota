import React, { useRef, useState } from 'react';
import { Camera, Layers, Activity, TrendingUp } from 'lucide-react';
import { MultipleRegressionResult } from '../../types/regression';
import { formatNum } from '../../utils/mathStatistics';

interface MultipleRegressionChartsProps {
  result: MultipleRegressionResult;
  digits?: number;
}

type ChartTab = 'observed-predicted' | 'residuals-predicted' | 'partial-effect';

export const MultipleRegressionCharts: React.FC<MultipleRegressionChartsProps> = ({
  result,
  digits = 4,
}) => {
  const [activeTab, setActiveTab] = useState<ChartTab>('observed-predicted');
  const [selectedVarIndex, setSelectedVarIndex] = useState<number>(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const { rows, variableNames, coefficients, means, k } = result;

  const width = 760;
  const height = 440;
  const margin = { top: 30, right: 30, bottom: 60, left: 75 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

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
      a.download = `bieu-do-hoi-quy-boi-${activeTab}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = url;
  };

  // 1. Observed vs Predicted Chart Data
  const renderObservedVsPredicted = () => {
    const yHatVals = rows.map((r) => r.yPred);
    const yVals = rows.map((r) => r.y);

    const minVal = Math.min(...yHatVals, ...yVals);
    const maxVal = Math.max(...yHatVals, ...yVals);
    const span = maxVal - minVal || 1;
    const paddedMin = minVal - span * 0.1;
    const paddedMax = maxVal + span * 0.1;

    const scale = (val: number) => {
      return ((val - paddedMin) / (paddedMax - paddedMin));
    };

    const getX = (val: number) => margin.left + scale(val) * plotWidth;
    const getY = (val: number) => margin.top + plotHeight - scale(val) * plotHeight;

    const ticks: number[] = [];
    for (let i = 0; i <= 6; i++) {
      ticks.push(paddedMin + (i / 6) * (paddedMax - paddedMin));
    }

    return (
      <>
        {/* Grid lines */}
        <g stroke="#e2e8f0" strokeDasharray="3 3">
          {ticks.map((t, idx) => (
            <React.Fragment key={`grid-${idx}`}>
              <line x1={getX(t)} y1={margin.top} x2={getX(t)} y2={margin.top + plotHeight} />
              <line x1={margin.left} y1={getY(t)} x2={margin.left + plotWidth} y2={getY(t)} />
            </React.Fragment>
          ))}
        </g>

        {/* 45-degree Reference line Y = YHat */}
        <line
          x1={getX(paddedMin)}
          y1={getY(paddedMin)}
          x2={getX(paddedMax)}
          y2={getY(paddedMax)}
          stroke="#2563eb"
          strokeWidth="2"
          strokeDasharray="5 5"
        />

        {/* Axes */}
        <g stroke="#64748b" strokeWidth="1.5">
          <line x1={margin.left} y1={margin.top} x2={margin.left} y2={margin.top + plotHeight} />
          <line
            x1={margin.left}
            y1={margin.top + plotHeight}
            x2={margin.left + plotWidth}
            y2={margin.top + plotHeight}
          />
        </g>

        {/* Ticks */}
        <g fill="#64748b" fontSize="11" textAnchor="middle">
          {ticks.map((t, idx) => (
            <g key={`t-${idx}`}>
              <text x={getX(t)} y={margin.top + plotHeight + 20}>
                {formatNum(t, 2)}
              </text>
              <text x={margin.left - 10} y={getY(t) + 4} textAnchor="end">
                {formatNum(t, 2)}
              </text>
            </g>
          ))}
        </g>

        {/* Axis titles */}
        <text
          x={margin.left + plotWidth / 2}
          y={height - 15}
          textAnchor="middle"
          fill="#334155"
          fontSize="12"
          fontWeight="600"
        >
          Giá trị Dự đoán (y)
        </text>
        <text
          x={-margin.top - plotHeight / 2}
          y={20}
          textAnchor="middle"
          fill="#334155"
          fontSize="12"
          fontWeight="600"
          transform="rotate(-90)"
        >
          Giá trị Thực tế (Y)
        </text>

        {/* Residual links to 45 degree line */}
        <g stroke="#cbd5e1" strokeDasharray="2 2" strokeWidth="1">
          {rows.map((row, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <line
                key={`line-${idx}`}
                x1={getX(row.yPred)}
                y1={getY(row.y)}
                x2={getX(row.yPred)}
                y2={getY(row.yPred)}
                stroke={isHovered ? '#ef4444' : '#cbd5e1'}
                strokeWidth={isHovered ? 2 : 1}
              />
            );
          })}
        </g>

        {/* Points */}
        {rows.map((row, idx) => {
          const cx = getX(row.yPred);
          const cy = getY(row.y);
          const isHovered = hoveredIndex === idx;

          return (
            <g
              key={`pt-${idx}`}
              className="cursor-pointer"
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
                className="transition-all duration-150"
              />
            </g>
          );
        })}
      </>
    );
  };

  // 2. Residuals vs Predicted
  const renderResidualsVsPredicted = () => {
    const yHatVals = rows.map((r) => r.yPred);
    const resVals = rows.map((r) => r.residual);

    const minX = Math.min(...yHatVals);
    const maxX = Math.max(...yHatVals);
    const spanX = maxX - minX || 1;
    const paddedMinX = minX - spanX * 0.1;
    const paddedMaxX = maxX + spanX * 0.1;

    const maxAbsRes = Math.max(...resVals.map((v) => Math.abs(v))) || 1;
    const paddedMinY = -maxAbsRes * 1.2;
    const paddedMaxY = maxAbsRes * 1.2;

    const scaleX = (val: number) =>
      margin.left + ((val - paddedMinX) / (paddedMaxX - paddedMinX)) * plotWidth;
    const scaleY = (val: number) =>
      margin.top + plotHeight - ((val - paddedMinY) / (paddedMaxY - paddedMinY)) * plotHeight;

    const xTicks: number[] = [];
    for (let i = 0; i <= 6; i++) {
      xTicks.push(paddedMinX + (i / 6) * (paddedMaxX - paddedMinX));
    }
    const yTicks = [-maxAbsRes, -maxAbsRes / 2, 0, maxAbsRes / 2, maxAbsRes];

    return (
      <>
        {/* Grid lines */}
        <g stroke="#e2e8f0" strokeDasharray="3 3">
          {xTicks.map((t, idx) => (
            <line
              key={`gx-${idx}`}
              x1={scaleX(t)}
              y1={margin.top}
              x2={scaleX(t)}
              y2={margin.top + plotHeight}
            />
          ))}
          {yTicks.map((t, idx) => (
            <line
              key={`gy-${idx}`}
              x1={margin.left}
              y1={scaleY(t)}
              x2={margin.left + plotWidth}
              y2={scaleY(t)}
            />
          ))}
        </g>

        {/* Zero baseline e = 0 */}
        <line
          x1={margin.left}
          y1={scaleY(0)}
          x2={margin.left + plotWidth}
          y2={scaleY(0)}
          stroke="#ef4444"
          strokeWidth="2"
        />

        {/* Axes */}
        <g stroke="#64748b" strokeWidth="1.5">
          <line x1={margin.left} y1={margin.top} x2={margin.left} y2={margin.top + plotHeight} />
          <line
            x1={margin.left}
            y1={margin.top + plotHeight}
            x2={margin.left + plotWidth}
            y2={margin.top + plotHeight}
          />
        </g>

        {/* Ticks */}
        <g fill="#64748b" fontSize="11" textAnchor="middle">
          {xTicks.map((t, idx) => (
            <text key={`tx-${idx}`} x={scaleX(t)} y={margin.top + plotHeight + 20}>
              {formatNum(t, 2)}
            </text>
          ))}
          {yTicks.map((t, idx) => (
            <text key={`ty-${idx}`} x={margin.left - 10} y={scaleY(t) + 4} textAnchor="end">
              {formatNum(t, 2)}
            </text>
          ))}
        </g>

        {/* Axis titles */}
        <text
          x={margin.left + plotWidth / 2}
          y={height - 15}
          textAnchor="middle"
          fill="#334155"
          fontSize="12"
          fontWeight="600"
        >
          Giá trị Dự đoán (y)
        </text>
        <text
          x={-margin.top - plotHeight / 2}
          y={20}
          textAnchor="middle"
          fill="#334155"
          fontSize="12"
          fontWeight="600"
          transform="rotate(-90)"
        >
          Phần dư (e = Y - y)
        </text>

        {/* Points */}
        {rows.map((row, idx) => {
          const cx = scaleX(row.yPred);
          const cy = scaleY(row.residual);
          const isHovered = hoveredIndex === idx;

          return (
            <g
              key={`pt-${idx}`}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <line
                x1={cx}
                y1={scaleY(0)}
                x2={cx}
                y2={cy}
                stroke={isHovered ? '#ef4444' : '#cbd5e1'}
                strokeWidth={isHovered ? 2 : 1}
              />
              <circle
                cx={cx}
                cy={cy}
                r={isHovered ? 7 : 5}
                fill={isHovered ? '#ef4444' : row.residual >= 0 ? '#10b981' : '#f59e0b'}
                stroke="#ffffff"
                strokeWidth="1.5"
              />
            </g>
          );
        })}
      </>
    );
  };

  // 3. Partial Effect Plot: Chosen variable X_j vs Y
  const renderPartialEffect = () => {
    const varName = variableNames[selectedVarIndex];
    const bj = coefficients[selectedVarIndex + 1]?.value || 0;
    const b0 = coefficients[0]?.value || 0;

    // Constant contribution of all other variables fixed at their means
    let constOther = b0;
    for (let m = 0; m < k; m++) {
      if (m !== selectedVarIndex) {
        const bm = coefficients[m + 1]?.value || 0;
        constOther += bm * means[m];
      }
    }

    const xVals = rows.map((r) => r.xValues[selectedVarIndex]);
    const yVals = rows.map((r) => r.y);

    const minX = Math.min(...xVals);
    const maxX = Math.max(...xVals);
    const spanX = maxX - minX || 1;
    const paddedMinX = minX - spanX * 0.1;
    const paddedMaxX = maxX + spanX * 0.1;

    const yAtMin = constOther + bj * paddedMinX;
    const yAtMax = constOther + bj * paddedMaxX;

    const minY = Math.min(...yVals, yAtMin, yAtMax);
    const maxY = Math.max(...yVals, yAtMin, yAtMax);
    const spanY = maxY - minY || 1;
    const paddedMinY = minY - spanY * 0.1;
    const paddedMaxY = maxY + spanY * 0.1;

    const scaleX = (val: number) =>
      margin.left + ((val - paddedMinX) / (paddedMaxX - paddedMinX)) * plotWidth;
    const scaleY = (val: number) =>
      margin.top + plotHeight - ((val - paddedMinY) / (paddedMaxY - paddedMinY)) * plotHeight;

    const xTicks: number[] = [];
    for (let i = 0; i <= 6; i++) {
      xTicks.push(paddedMinX + (i / 6) * (paddedMaxX - paddedMinX));
    }
    const yTicks: number[] = [];
    for (let i = 0; i <= 6; i++) {
      yTicks.push(paddedMinY + (i / 6) * (paddedMaxY - paddedMinY));
    }

    return (
      <>
        {/* Grid lines */}
        <g stroke="#e2e8f0" strokeDasharray="3 3">
          {xTicks.map((t, idx) => (
            <line
              key={`gx-${idx}`}
              x1={scaleX(t)}
              y1={margin.top}
              x2={scaleX(t)}
              y2={margin.top + plotHeight}
            />
          ))}
          {yTicks.map((t, idx) => (
            <line
              key={`gy-${idx}`}
              x1={margin.left}
              y1={scaleY(t)}
              x2={margin.left + plotWidth}
              y2={scaleY(t)}
            />
          ))}
        </g>

        {/* Partial Regression Line holding other variables at means */}
        <line
          x1={scaleX(paddedMinX)}
          y1={scaleY(yAtMin)}
          x2={scaleX(paddedMaxX)}
          y2={scaleY(yAtMax)}
          stroke="#0d9488"
          strokeWidth="2.5"
        />

        {/* Axes */}
        <g stroke="#64748b" strokeWidth="1.5">
          <line x1={margin.left} y1={margin.top} x2={margin.left} y2={margin.top + plotHeight} />
          <line
            x1={margin.left}
            y1={margin.top + plotHeight}
            x2={margin.left + plotWidth}
            y2={margin.top + plotHeight}
          />
        </g>

        {/* Ticks */}
        <g fill="#64748b" fontSize="11" textAnchor="middle">
          {xTicks.map((t, idx) => (
            <text key={`tx-${idx}`} x={scaleX(t)} y={margin.top + plotHeight + 20}>
              {formatNum(t, 2)}
            </text>
          ))}
          {yTicks.map((t, idx) => (
            <text key={`ty-${idx}`} x={margin.left - 10} y={scaleY(t) + 4} textAnchor="end">
              {formatNum(t, 2)}
            </text>
          ))}
        </g>

        {/* Axis titles */}
        <text
          x={margin.left + plotWidth / 2}
          y={height - 15}
          textAnchor="middle"
          fill="#334155"
          fontSize="12"
          fontWeight="600"
        >
          Biến độc lập {varName}
        </text>
        <text
          x={-margin.top - plotHeight / 2}
          y={20}
          textAnchor="middle"
          fill="#334155"
          fontSize="12"
          fontWeight="600"
          transform="rotate(-90)"
        >
          Biến phụ thuộc Y
        </text>

        {/* Points */}
        {rows.map((row, idx) => {
          const cx = scaleX(row.xValues[selectedVarIndex]);
          const cy = scaleY(row.y);
          const isHovered = hoveredIndex === idx;

          return (
            <g
              key={`pt-${idx}`}
              className="cursor-pointer"
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
              />
            </g>
          );
        })}
      </>
    );
  };

  const hoveredRow = hoveredIndex !== null ? rows[hoveredIndex] : null;

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
            Trực Quan Hóa Hồi Quy Tuyến Tính Bội
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Biểu đồ chẩn đoán độ khớp mô hình, kiểm tra phần dư và ảnh hưởng riêng phần
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPNG}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-2xs"
          >
            <Camera className="w-3.5 h-3.5 text-teal-600" />
            Tải ảnh PNG
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200/80">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveTab('observed-predicted')}
            className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'observed-predicted'
                ? 'bg-white text-blue-800 shadow-2xs border border-slate-200 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-4 h-4 text-blue-600" />
            Thực tế (Y) theo Dự đoán (y)
          </button>
          <button
            onClick={() => setActiveTab('residuals-predicted')}
            className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'residuals-predicted'
                ? 'bg-white text-blue-800 shadow-2xs border border-slate-200 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-600" />
            Phần dư (e) theo Dự đoán (y)
          </button>
          <button
            onClick={() => setActiveTab('partial-effect')}
            className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'partial-effect'
                ? 'bg-white text-blue-800 shadow-2xs border border-slate-200 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-teal-600" />
            Ảnh hưởng riêng phần
          </button>
        </div>

        {/* Dropdown for partial effect variable selection */}
        {activeTab === 'partial-effect' && (
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <span className="text-slate-600 font-medium">Chọn biến:</span>
            <select
              value={selectedVarIndex}
              onChange={(e) => setSelectedVarIndex(Number(e.target.value))}
              className="bg-white border border-slate-300 rounded-md px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-2xs focus:ring-2 focus:ring-teal-500"
            >
              {variableNames.map((name, idx) => (
                <option key={idx} value={idx}>
                  {name} (b_{idx + 1} = {formatNum(coefficients[idx + 1]?.value, digits)})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Description of active chart */}
      <div className="text-xs text-slate-600 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
        {activeTab === 'observed-predicted' && (
          <p>
            <strong>Đường chuẩn 45° nét đứt xanh dương</strong> thể hiện độ khớp hoàn hảo (Y = y).
            Các điểm dữ liệu tập trung càng gần đường 45° thì hệ số xác định R² càng cao ({formatNum(result.rSquared, digits)}).
          </p>
        )}
        {activeTab === 'residuals-predicted' && (
          <p>
            <strong>Đường chuẩn đỏ e = 0</strong> thể hiện sai số trung bình.
            Nếu các điểm phân bố ngẫu nhiên đồng đều quanh đường 0, giả định tuyến tính và phương sai sai số đồng nhất được thỏa mãn.
          </p>
        )}
        {activeTab === 'partial-effect' && (
          <p>
            Đường hồi quy riêng phần thể hiện mối liên hệ giữa biến <strong>{variableNames[selectedVarIndex]}</strong> và biến phụ thuộc <strong>Y</strong> khi cố định tất cả các biến độc lập khác ở mức trung bình mẫu (ceteris paribus).
          </p>
        )}
      </div>

      {/* SVG Container */}
      <div className="w-full overflow-x-auto bg-slate-50/50 rounded-xl p-2 border border-slate-100 flex justify-center">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full max-w-[760px] h-auto select-none font-sans"
        >
          <rect width={width} height={height} fill="#ffffff" rx="8" />

          {activeTab === 'observed-predicted' && renderObservedVsPredicted()}
          {activeTab === 'residuals-predicted' && renderResidualsVsPredicted()}
          {activeTab === 'partial-effect' && renderPartialEffect()}

          {/* Hover Tooltip inside SVG */}
          {hoveredRow && (
            <g
              transform={`translate(${Math.min(width - 170, 100)}, ${margin.top + 10})`}
            >
              <rect width="160" height="58" fill="#1e293b" rx="6" opacity="0.95" />
              <text x="80" y="16" fill="#f8fafc" fontSize="10" textAnchor="middle" fontWeight="bold">
                Quan sát #{hoveredIndex! + 1}
              </text>
              <text x="80" y="30" fill="#93c5fd" fontSize="9" textAnchor="middle">
                Y thực tế = {formatNum(hoveredRow.y, 2)} | y = {formatNum(hoveredRow.yPred, 2)}
              </text>
              <text
                x="80"
                y="46"
                fill={hoveredRow.residual >= 0 ? '#4ade80' : '#f87171'}
                fontSize="9"
                textAnchor="middle"
              >
                Phần dư e = {formatNum(hoveredRow.residual, 2)}
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
