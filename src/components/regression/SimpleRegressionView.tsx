import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Plus,
  Trash2,
  RotateCcw,
  Sparkles,
  Clipboard,
  FileSpreadsheet,
  Printer,
  BookOpen,
  Calculator,
  AlertTriangle,
  Check,
  Table as TableIcon,
  HelpCircle,
  TrendingUp,
  CornerDownLeft,
} from 'lucide-react';
import { SimpleDataPoint } from '../../types/regression';
import { calculateSimpleLinearRegression, parseSimpleRegressionInput } from '../../utils/regressionMath';
import { formatNum } from '../../utils/mathStatistics';
import { SimpleScatterPlot } from './SimpleScatterPlot';
import { RegressionExplanationModal } from './RegressionExplanationModal';

// Presets per spec
const PRESETS: { label: string; description: string; points: { x: number; y: number }[] }[] = [
  {
    label: 'Mẫu 1: Tương quan thuận mạnh',
    description: 'Chi phí quảng cáo (triệu VNĐ) và Doanh thu (triệu VNĐ)',
    points: [
      { x: 2, y: 12 },
      { x: 3, y: 15 },
      { x: 4, y: 19 },
      { x: 5, y: 22 },
      { x: 6, y: 28 },
      { x: 7, y: 31 },
      { x: 8, y: 35 },
    ],
  },
  {
    label: 'Mẫu 2: Tương quan nghịch mạnh',
    description: 'Giá bán sản phẩm ($) và Lượng cầu đặt mua (nghìn đơn vị)',
    points: [
      { x: 10, y: 95 },
      { x: 12, y: 88 },
      { x: 15, y: 76 },
      { x: 18, y: 64 },
      { x: 20, y: 58 },
      { x: 25, y: 42 },
      { x: 30, y: 28 },
    ],
  },
  {
    label: 'Mẫu 3: Tương quan yếu / Tản mạn',
    description: 'Số giờ chơi game mỗi tuần và Điểm thi môn Lịch sử',
    points: [
      { x: 4, y: 7.5 },
      { x: 8, y: 8.0 },
      { x: 12, y: 6.0 },
      { x: 16, y: 7.2 },
      { x: 20, y: 5.5 },
      { x: 24, y: 6.8 },
      { x: 28, y: 5.0 },
    ],
  },
  {
    label: 'Mẫu 4: Dữ liệu chuẩn giáo trình',
    description: 'Ví dụ bài tập giáo trình mẫu X=[1..6], Y=[3..11]',
    points: [
      { x: 1, y: 3 },
      { x: 2, y: 5 },
      { x: 3, y: 6 },
      { x: 4, y: 8 },
      { x: 5, y: 10 },
      { x: 6, y: 11 },
    ],
  },
];

interface SimpleRegressionViewProps {
  digits?: number;
}

export const SimpleRegressionView: React.FC<SimpleRegressionViewProps> = ({ digits = 4 }) => {
  const [points, setPoints] = useState<SimpleDataPoint[]>(
    PRESETS[3].points.map((p, idx) => ({ id: `${idx + 1}`, x: p.x, y: p.y }))
  );
  const [inputMode, setInputMode] = useState<'table' | 'paste'>('table');
  const [pasteText, setPasteText] = useState('');
  const [pasteError, setPasteError] = useState<string | null>(null);

  // Prediction tool state
  const [predictX, setPredictX] = useState<string>('');
  const [copiedEq, setCopiedEq] = useState(false);
  const [copiedTable, setCopiedTable] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // Compute Regression Result
  const result = useMemo(() => {
    return calculateSimpleLinearRegression(points, digits);
  }, [points, digits]);

  // Handle row changes
  const handlePointChange = (idx: number, field: 'x' | 'y', val: string) => {
    const num = Number(val);
    setPoints((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: Number.isNaN(num) ? 0 : num };
      return next;
    });
  };

  // Refs for keyboard navigation between rows
  const xInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const yInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const pendingFocusRef = useRef<{ index: number; field: 'x' | 'y' } | null>(null);

  useEffect(() => {
    if (pendingFocusRef.current !== null) {
      const { index, field } = pendingFocusRef.current;
      pendingFocusRef.current = null;
      const target = field === 'x' ? xInputRefs.current[index] : yInputRefs.current[index];
      if (target) {
        target.focus();
        target.select();
      }
    }
  }, [points]);

  const handleAddRow = (focusField: 'x' | 'y' = 'x') => {
    pendingFocusRef.current = { index: points.length, field: focusField };
    setPoints((prev) => [
      ...prev,
      { id: Date.now().toString(), x: 0, y: 0 },
    ]);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number,
    field: 'x' | 'y'
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (field === 'x') {
        if (idx < points.length - 1) {
          xInputRefs.current[idx + 1]?.focus();
          xInputRefs.current[idx + 1]?.select();
        } else {
          handleAddRow('x');
        }
      } else if (field === 'y') {
        if (idx < points.length - 1) {
          yInputRefs.current[idx + 1]?.focus();
          yInputRefs.current[idx + 1]?.select();
        } else {
          handleAddRow('y');
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (idx < points.length - 1) {
        const target = field === 'x' ? xInputRefs.current[idx + 1] : yInputRefs.current[idx + 1];
        target?.focus();
        target?.select();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (idx > 0) {
        const target = field === 'x' ? xInputRefs.current[idx - 1] : yInputRefs.current[idx - 1];
        target?.focus();
        target?.select();
      }
    }
  };

  const handleDeleteRow = (idx: number) => {
    if (points.length <= 2) {
      alert('Cần tối thiểu 2 điểm dữ liệu để thực hiện hồi quy tuyến tính.');
      return;
    }
    setPoints((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleClear = () => {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ dữ liệu hiện tại?')) {
      setPoints([
        { id: '1', x: 0, y: 0 },
        { id: '2', x: 0, y: 0 },
      ]);
    }
  };

  const handleApplyPreset = (presetIdx: number) => {
    const selected = PRESETS[presetIdx];
    setPoints(selected.points.map((p, idx) => ({ id: `${idx + 1}`, x: p.x, y: p.y })));
  };

  const handleApplyPaste = () => {
    setPasteError(null);
    const { points: parsedPoints, invalidLines } = parseSimpleRegressionInput(pasteText);

    if (parsedPoints.length < 2) {
      setPasteError('Dữ liệu dán cần có ít nhất 2 dòng hợp lệ (mỗi dòng gồm X và Y).');
      return;
    }

    if (invalidLines.length > 0) {
      setPasteError(`Bỏ qua ${invalidLines.length} dòng không hợp lệ.`);
    }

    setPoints(parsedPoints);
    setInputMode('table');
  };

  // Copy Equation
  const handleCopyEquation = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.equationString);
    setCopiedEq(true);
    setTimeout(() => setCopiedEq(false), 2000);
  };

  // Copy Residual Table
  const handleCopyTable = () => {
    if (!result) return;
    const meanY = result.meanY;
    let tsv = 'STT\tX\tY\tY_du_doan\te\te^2\t(Y-Y_tb)^2\n';
    result.rows.forEach((r) => {
      const devY2 = (r.y - meanY) * (r.y - meanY);
      tsv += `${r.index}\t${r.x}\t${r.y}\t${formatNum(r.yPred, digits)}\t${formatNum(r.residual, digits)}\t${formatNum(r.residualSquared, digits)}\t${formatNum(devY2, digits)}\n`;
    });
    navigator.clipboard.writeText(tsv);
    setCopiedTable(true);
    setTimeout(() => setCopiedTable(false), 2000);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!result) return;
    const meanY = result.meanY;
    let csv = '\uFEFFSTT,X,Y,Y_Dự_đoán,Phần_dư_e,e_bình_phương,Do_lech_binh_phuong_(Y-Ytb)^2\n';
    result.rows.forEach((r) => {
      const devY2 = (r.y - meanY) * (r.y - meanY);
      csv += `${r.index},${r.x},${r.y},${formatNum(r.yPred, digits)},${formatNum(r.residual, digits)},${formatNum(r.residualSquared, digits)},${formatNum(devY2, digits)}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hoi-quy-tuyen-tinh-don-ket-qua.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Print
  const handlePrint = () => {
    window.print();
  };

  // Predict Calculation
  const predictNum = Number(predictX);
  const hasValidPredict = predictX.trim() !== '' && !Number.isNaN(predictNum) && Number.isFinite(predictNum);
  const predictedY = hasValidPredict && result ? result.b0 + result.b1 * predictNum : null;

  // Extrapolation check
  const minXObserved = points.length > 0 ? Math.min(...points.map((p) => p.x)) : 0;
  const maxXObserved = points.length > 0 ? Math.max(...points.map((p) => p.x)) : 0;
  const isExtrapolation = hasValidPredict && (predictNum < minXObserved || predictNum > maxXObserved);

  return (
    <div className="space-y-6">
      {/* Introduction Banner */}
      <div className="bg-linear-to-r from-blue-50 via-sky-50 to-teal-50 border border-blue-200/80 rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-600 text-white uppercase tracking-wider">
                Mô hình đơn biến OLS
              </span>
              <h2 className="text-xl font-bold text-slate-800">
                Hồi Quy Tuyến Tính Đơn & Hệ Số Tương Quan Pearson
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Ước lượng phương trình hồi quy <strong>Ŷ = a + bX</strong>, phân tích mối tương quan và kiểm tra phần dư OLS.
            </p>
          </div>

          {/* Quick Preset Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Dữ liệu mẫu:
            </span>
            <select
              onChange={(e) => handleApplyPreset(Number(e.target.value))}
              defaultValue={3}
              className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              {PRESETS.map((p, idx) => (
                <option key={idx} value={idx}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Data Input & Equation Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Input Form (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          {/* Tabs for Table vs Paste */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-4 pt-2">
            <div className="flex gap-2">
              <button
                onClick={() => setInputMode('table')}
                className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-t border-x ${
                  inputMode === 'table'
                    ? 'bg-white text-blue-700 border-slate-200 -mb-px shadow-2xs'
                    : 'text-slate-600 border-transparent hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <TableIcon className="w-3.5 h-3.5" /> Bảng Nhập Liệu
                </span>
              </button>
              <button
                onClick={() => setInputMode('paste')}
                className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-t border-x ${
                  inputMode === 'paste'
                    ? 'bg-white text-blue-700 border-slate-200 -mb-px shadow-2xs'
                    : 'text-slate-600 border-transparent hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Clipboard className="w-3.5 h-3.5" /> Dán từ Excel / TSV
                </span>
              </button>
            </div>

            <button
              onClick={handleClear}
              className="text-xs text-rose-600 hover:text-rose-800 font-medium pb-1 flex items-center gap-1 transition-colors"
              title="Xóa toàn bộ dòng dữ liệu"
            >
              <RotateCcw className="w-3 h-3" /> Làm mới
            </button>
          </div>

          <div className="p-4">
            {inputMode === 'table' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 pb-1 border-b border-slate-100">
                  <span className="font-medium">Số lượng quan sát: <strong className="text-slate-800 font-bold">{points.length}</strong></span>
                  <span className="italic text-[11px] text-slate-400">Hỗ trợ số nguyên & thập phân</span>
                </div>

                <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1">
                  <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-700 px-2 py-1 bg-slate-50 rounded-lg">
                    <div className="col-span-2 text-center">STT</div>
                    <div className="col-span-4 text-center">Biến X</div>
                    <div className="col-span-4 text-center">Biến Y</div>
                    <div className="col-span-2 text-center">Xóa</div>
                  </div>

                  {points.map((pt, idx) => (
                    <div
                      key={pt.id || idx}
                      className="grid grid-cols-12 gap-2 items-center bg-white hover:bg-blue-50/40 p-1 rounded-lg border border-slate-100 transition-colors"
                    >
                      <div className="col-span-2 text-center text-xs font-mono font-semibold text-slate-500">
                        #{idx + 1}
                      </div>
                      <div className="col-span-4">
                        <input
                          ref={(el) => {
                            xInputRefs.current[idx] = el;
                          }}
                          type="number"
                          step="any"
                          value={pt.x}
                          onChange={(e) => handlePointChange(idx, 'x', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, idx, 'x')}
                          onFocus={(e) => e.target.select()}
                          onWheel={(e) => e.currentTarget.blur()}
                          className="w-full text-center bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-lg py-1.5 px-2 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-100 focus:outline-hidden [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                      <div className="col-span-4">
                        <input
                          ref={(el) => {
                            yInputRefs.current[idx] = el;
                          }}
                          type="number"
                          step="any"
                          value={pt.y}
                          onChange={(e) => handlePointChange(idx, 'y', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, idx, 'y')}
                          onFocus={(e) => e.target.select()}
                          onWheel={(e) => e.currentTarget.blur()}
                          className="w-full text-center bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-lg py-1.5 px-2 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-100 focus:outline-hidden [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                      <div className="col-span-2 flex justify-center">
                        <button
                          onClick={() => handleDeleteRow(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Xóa quan sát này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    onClick={() => handleAddRow('x')}
                    className="flex-1 py-2 border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/50 hover:bg-blue-50 rounded-xl text-blue-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Thêm Dòng Quan Sát
                  </button>
                  <div className="text-[11px] text-slate-500 italic hidden sm:flex items-center gap-1.5 px-1">
                    <CornerDownLeft className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Nhấn <strong>Enter</strong> để xuống dòng tiếp theo hoặc tự động thêm dòng mới</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  Dán trực tiếp hai cột từ Excel, Google Sheets hoặc file văn bản (cột 1: X, cột 2: Y):
                </p>
                <textarea
                  rows={9}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Ví dụ:&#10;1 3&#10;2 5&#10;3 6&#10;4 8&#10;5 10&#10;6 11"
                  className="w-full font-mono text-xs p-3 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-hidden bg-slate-50/50"
                />
                {pasteError && (
                  <div className="text-xs text-rose-600 font-medium bg-rose-50 p-2 rounded-lg border border-rose-200 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {pasteError}
                  </div>
                )}
                <button
                  onClick={handleApplyPaste}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs transition-colors shadow-2xs"
                >
                  Xác Nhận & Nạp Dữ Liệu
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Equation Banner & Stat Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Equation Banner */}
          <div className="bg-linear-to-r from-blue-700 via-indigo-700 to-sky-800 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>

            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <span className="text-xs font-bold text-blue-200 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-4 h-4" /> Phương Trình Hồi Quy Ước Lượng OLS
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyEquation}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-all backdrop-blur-xs"
                  title="Sao chép phương trình"
                >
                  {copiedEq ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Clipboard className="w-3.5 h-3.5" />}
                  {copiedEq ? 'Đã sao chép' : 'Sao chép'}
                </button>
                <button
                  onClick={() => setShowExplanation(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/90 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-xs"
                >
                  <BookOpen className="w-3.5 h-3.5" /> Giải Thích Kết Quả
                </button>
              </div>
            </div>

            {result ? (
              <div className="mt-3">
                <div className="font-mono text-3xl sm:text-4xl font-extrabold tracking-wide text-white drop-shadow-xs">
                  {result.equationString}
                </div>
                <div className="mt-3 text-sm sm:text-base text-blue-100 flex flex-wrap gap-x-6 gap-y-2">
                  <span>Hệ số chặn: <strong className="text-white font-mono text-base sm:text-lg">a = {formatNum(result.b0, digits)}</strong></span>
                  <span>Hệ số góc: <strong className="text-white font-mono text-base sm:text-lg">b = {formatNum(result.b1, digits)}</strong></span>
                  <span>R² = <strong className="text-white font-mono text-base sm:text-lg">{formatNum(result.rSquared, digits)}</strong> ({(result.rSquared * 100).toFixed(1)}%)</span>
                </div>
              </div>
            ) : (
              <div className="mt-3 text-amber-200 text-sm font-medium">
                Cần ít nhất 2 quan sát với độ biến thiên khác 0 của biến X để ước lượng phương trình hồi quy.
              </div>
            )}
          </div>

          {/* Cards Grid: n, x_bar, y_bar, r, R2, a, b, SER */}
          {result && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cỡ Mẫu</span>
                  <span className="font-mono text-base px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold border border-slate-200 shadow-2xs">n</span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 mt-2">{result.n}</div>
                <div className="text-[11px] text-slate-400 mt-1">Số cặp quan sát (x, y)</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Trung Bình X̄</span>
                  <span className="font-mono text-base px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-800 font-bold border border-blue-200 shadow-2xs">x̄</span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-blue-950 mt-2">{formatNum(result.meanX, digits)}</div>
                <div className="text-[11px] text-slate-400 mt-1">s_x = {formatNum(result.sdX, 2)}</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">Trung Bình Ȳ</span>
                  <span className="font-mono text-base px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-800 font-bold border border-teal-200 shadow-2xs">ȳ</span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-teal-950 mt-2">{formatNum(result.meanY, digits)}</div>
                <div className="text-[11px] text-slate-400 mt-1">s_y = {formatNum(result.sdY, 2)}</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Pearson r</span>
                  <span className="font-mono text-base px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-800 font-bold border border-indigo-200 shadow-2xs">r</span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-indigo-950 mt-2">{formatNum(result.pearsonR, digits)}</div>
                <div className="text-[11px] text-indigo-600 font-semibold mt-1">
                  {Math.abs(result.pearsonR) > 0.8 ? 'Tương quan rất mạnh' : Math.abs(result.pearsonR) > 0.5 ? 'Tương quan vừa' : 'Tương quan yếu'}
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Hệ Số R²</span>
                  <span className="font-mono text-base px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-800 font-bold border border-purple-200 shadow-2xs">R²</span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-purple-950 mt-2">{formatNum(result.rSquared, digits)}</div>
                <div className="text-[11px] text-purple-700 font-bold mt-1">
                  {(result.rSquared * 100).toFixed(1)}% độ biến thiên
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Hệ Số Chặn (a)</span>
                  <span className="font-mono text-base px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 shadow-2xs">a</span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-950 mt-2">{formatNum(result.b0, digits)}</div>
                <div className="text-[11px] text-slate-400 mt-1">Khi X = 0</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">Hệ Số Góc (b)</span>
                  <span className="font-mono text-base px-2.5 py-0.5 rounded-md bg-sky-50 text-sky-800 font-bold border border-sky-200 shadow-2xs">b</span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-sky-950 mt-2">{formatNum(result.b1, digits)}</div>
                <div className="text-[11px] text-slate-400 mt-1">{result.b1 >= 0 ? 'Xu hướng tăng' : 'Xu hướng giảm'}</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Sai Số SER</span>
                  <span className="font-mono text-base px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold border border-slate-200 shadow-2xs">SER</span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 mt-2">
                  {result.ser !== null ? formatNum(result.ser, digits) : 'N/A'}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">RMSE = {formatNum(result.rmse, 2)}</div>
              </div>
            </div>
          )}

          {/* Interactive Prediction Widget */}
          {result && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  Công Cụ Dự Báo Giá Trị Ŷ Theo X Mới
                </h4>
                <span className="text-xs text-slate-500 font-mono">Miền mẫu: [{minXObserved}, {maxXObserved}]</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-center">
                <div className="sm:col-span-5">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Nhập giá trị biến độc lập X_mới:
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={predictX}
                    onChange={(e) => setPredictX(e.target.value)}
                    placeholder={`Ví dụ: ${(result.meanX).toFixed(1)}`}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-base font-semibold text-slate-800 shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-7 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-xs font-semibold text-slate-500">Kết quả dự báo Ŷ:</div>
                  {hasValidPredict && predictedY !== null ? (
                    <div>
                      <div className="text-2xl sm:text-3xl font-extrabold text-blue-700 font-mono">
                        Ŷ = {formatNum(predictedY, digits)}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-500 font-mono mt-1">
                        = {formatNum(result.b0, digits)} {result.b1 >= 0 ? '+' : '-'} {formatNum(Math.abs(result.b1), digits)} × ({predictNum})
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic">
                      Nhập một giá trị X vào ô bên cạnh để tính toán
                    </div>
                  )}
                </div>
              </div>

              {isExtrapolation && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>
                    <strong>Cảnh báo ngoại suy:</strong> Giá trị X = {predictNum} nằm ngoài miền quan sát thực tế [{minXObserved}, {maxXObserved}]. Độ tin cậy của mô hình tuyến tính có thể bị giảm sút.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Scatter Plot */}
      <SimpleScatterPlot points={points} result={result} digits={digits} />

      {/* Summary Table: 10 Core Metrics */}
      {result && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                Bảng 10 Đại Lượng Thống Kê Đặc Trưng Của Mô Hình Hồi Quy
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Các thông số then chốt xác định quan hệ tuyến tính, mức độ phù hợp và tổng phương sai
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 border-y border-slate-200 font-bold uppercase text-xs tracking-wider">
                  <th className="py-3 px-3 w-16 text-center">STT</th>
                  <th className="py-3 px-4">Đại lượng thống kê</th>
                  <th className="py-3 px-4 w-36 text-center font-mono">Ký hiệu</th>
                  <th className="py-3 px-4 text-right">Kết quả</th>
                  <th className="py-3 px-4 text-slate-500 font-normal">Ý nghĩa toán học cơ bản</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 text-center font-mono text-slate-400 font-medium">1</td>
                  <td className="py-3 px-4 text-sm sm:text-base font-semibold text-slate-800">Cỡ mẫu</td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-mono text-base sm:text-lg px-3.5 py-1 rounded-md bg-slate-100 text-sky-900 font-bold border border-slate-200 shadow-2xs inline-block">
                      n
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-extrabold text-lg sm:text-xl text-slate-900 tabular-nums">
                    {result.n}
                  </td>
                  <td className="py-3 px-4 text-xs sm:text-sm text-slate-500">Số lượng cặp quan sát (xᵢ, yᵢ) thu thập được</td>
                </tr>

                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 text-center font-mono text-slate-400 font-medium">2</td>
                  <td className="py-3 px-4 text-sm sm:text-base font-semibold text-slate-800">Trung bình mẫu biến độc lập</td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-mono text-base sm:text-lg px-3.5 py-1 rounded-md bg-blue-50 text-blue-900 font-bold border border-blue-200 shadow-2xs inline-block">
                      x̄
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-extrabold text-lg sm:text-xl text-blue-950 tabular-nums">
                    {formatNum(result.meanX, digits)}
                  </td>
                  <td className="py-3 px-4 text-xs sm:text-sm text-slate-500">Tọa độ trọng tâm trục hoành của đám mây điểm</td>
                </tr>

                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 text-center font-mono text-slate-400 font-medium">3</td>
                  <td className="py-3 px-4 text-sm sm:text-base font-semibold text-slate-800">Trung bình mẫu biến phụ thuộc</td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-mono text-base sm:text-lg px-3.5 py-1 rounded-md bg-teal-50 text-teal-900 font-bold border border-teal-200 shadow-2xs inline-block">
                      ȳ
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-extrabold text-lg sm:text-xl text-teal-950 tabular-nums">
                    {formatNum(result.meanY, digits)}
                  </td>
                  <td className="py-3 px-4 text-xs sm:text-sm text-slate-500">Tọa độ trọng tâm trục tung; đường hồi quy luôn đi qua (x̄, ȳ)</td>
                </tr>

                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 text-center font-mono text-slate-400 font-medium">4</td>
                  <td className="py-3 px-4 text-sm sm:text-base font-semibold text-slate-800">Hiệp phương sai mẫu</td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-mono text-base sm:text-lg px-3.5 py-1 rounded-md bg-indigo-50 text-indigo-900 font-bold border border-indigo-200 shadow-2xs inline-block">
                      Cov(X, Y)
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-extrabold text-lg sm:text-xl text-indigo-950 tabular-nums">
                    {formatNum(result.covXY, digits)}
                  </td>
                  <td className="py-3 px-4 text-xs sm:text-sm text-slate-500">Đo lường xu hướng cùng biến thiên tuyến tính giữa X và Y</td>
                </tr>

                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 text-center font-mono text-slate-400 font-medium">5</td>
                  <td className="py-3 px-4 text-sm sm:text-base font-semibold text-slate-800">Hệ số tương quan Pearson</td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-mono text-base sm:text-lg px-3.5 py-1 rounded-md bg-indigo-50 text-indigo-900 font-bold border border-indigo-200 shadow-2xs inline-block">
                      r
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-extrabold text-lg sm:text-xl text-indigo-950 tabular-nums">
                    {formatNum(result.pearsonR, digits)}
                  </td>
                  <td className="py-3 px-4 text-xs sm:text-sm text-slate-500">Chuẩn hóa hiệp phương sai trong khoảng [-1, 1]</td>
                </tr>

                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 text-center font-mono text-slate-400 font-medium">6</td>
                  <td className="py-3 px-4 text-sm sm:text-base font-semibold text-slate-800">Hệ số chặn (a)</td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-mono text-base sm:text-lg px-3.5 py-1 rounded-md bg-emerald-50 text-emerald-900 font-bold border border-emerald-200 shadow-2xs inline-block">
                      a
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-extrabold text-lg sm:text-xl text-emerald-950 tabular-nums">
                    {formatNum(result.b0, digits)}
                  </td>
                  <td className="py-3 px-4 text-xs sm:text-sm text-slate-600">
                    <div>Điểm cắt trục tung của đường hồi quy khi X = 0</div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 font-mono text-xs">
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                        a = ȳ - b·x̄
                      </span>
                      <span className="text-slate-500">
                        = {formatNum(result.meanY, digits)} - ({formatNum(result.b1, digits)}) × {formatNum(result.meanX, digits)} = {formatNum(result.b0, digits)}
                      </span>
                    </div>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 text-center font-mono text-slate-400 font-medium">7</td>
                  <td className="py-3 px-4 text-sm sm:text-base font-semibold text-slate-800">Hệ số góc (b)</td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-mono text-base sm:text-lg px-3.5 py-1 rounded-md bg-sky-50 text-sky-900 font-bold border border-sky-200 shadow-2xs inline-block">
                      b
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-extrabold text-lg sm:text-xl text-sky-950 tabular-nums">
                    {formatNum(result.b1, digits)}
                  </td>
                  <td className="py-3 px-4 text-xs sm:text-sm text-slate-600">
                    <div>Độ dốc: Thay đổi trung bình dự báo của Y khi X tăng thêm 1 đơn vị</div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 font-mono text-xs">
                      <span className="bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded font-semibold">
                        b = Cov(X, Y) / Var(X) = Σ(x - x̄)(y - ȳ) / Σ(x - x̄)²
                      </span>
                      <span className="text-slate-500">
                        = {formatNum(result.covXY, digits)} / {formatNum(result.varX, digits)} = {formatNum(result.b1, digits)}
                      </span>
                    </div>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 text-center font-mono text-slate-400 font-medium">8</td>
                  <td className="py-3 px-4 text-sm sm:text-base font-semibold text-slate-800">Hệ số xác định</td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-mono text-base sm:text-lg px-3.5 py-1 rounded-md bg-purple-50 text-purple-900 font-bold border border-purple-200 shadow-2xs inline-block">
                      R²
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-extrabold text-lg sm:text-xl text-purple-950 tabular-nums">
                    {formatNum(result.rSquared, digits)}{' '}
                    <span className="text-xs sm:text-sm text-purple-700 font-bold block sm:inline">
                      ({(result.rSquared * 100).toFixed(1)}%)
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs sm:text-sm text-slate-500">Tỷ lệ phần trăm tổng biến thiên của Y được giải thích bởi X</td>
                </tr>

                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 text-center font-mono text-slate-400 font-medium">9</td>
                  <td className="py-3 px-4 text-sm sm:text-base font-semibold text-slate-800">Tổng bình phương hồi quy</td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-mono text-base sm:text-lg px-3.5 py-1 rounded-md bg-blue-50 text-blue-900 font-bold border border-blue-200 shadow-2xs inline-block">
                      SSR
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-extrabold text-lg sm:text-xl text-blue-950 tabular-nums">
                    {formatNum(result.ssr, digits)}
                  </td>
                  <td className="py-3 px-4 text-xs sm:text-sm text-slate-500">Phần biến thiên giải thích bởi mô hình: SSR = ∑(ŷᵢ - ȳ)² (với SSR = SST - SSE)</td>
                </tr>

                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 text-center font-mono text-slate-400 font-medium">10</td>
                  <td className="py-3 px-4 text-sm sm:text-base font-semibold text-slate-800">Tổng bình phương phần dư</td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-mono text-base sm:text-lg px-3.5 py-1 rounded-md bg-rose-50 text-rose-900 font-bold border border-rose-200 shadow-2xs inline-block">
                      SSE
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-extrabold text-lg sm:text-xl text-rose-950 tabular-nums">
                    {formatNum(result.sse, digits)}
                  </td>
                  <td className="py-3 px-4 text-xs sm:text-sm text-slate-500">Tổng sai lệch không giải thích được giữa thực tế Y và Ŷ (SSE = ∑eᵢ²)</td>
                </tr>

                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 text-center font-mono text-slate-400 font-medium">11</td>
                  <td className="py-3 px-4 text-sm sm:text-base font-semibold text-slate-800">Tổng bình phương toàn phần</td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-mono text-base sm:text-lg px-3.5 py-1 rounded-md bg-slate-100 text-slate-800 font-bold border border-slate-200 shadow-2xs inline-block">
                      SST
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-extrabold text-lg sm:text-xl text-slate-900 tabular-nums">
                    {formatNum(result.sst, digits)}
                  </td>
                  <td className="py-3 px-4 text-xs sm:text-sm text-slate-500">Tổng bình phương sai lệch toàn phần: SST = ∑(yᵢ - ȳ)² (với SST = SSR + SSE)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Observation Residuals Table */}
      {result && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                Bảng Chi Tiết Quan Sát & Phần Dư OLS
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kiểm chứng tính chất toán học quan trọng của OLS: Tổng phần dư ∑eᵢ = 0 và Tổng bình phương phần dư ∑eᵢ² = SSE
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyTable}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs"
              >
                {copiedTable ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Clipboard className="w-3.5 h-3.5 text-blue-600" />}
                {copiedTable ? 'Đã chép bảng' : 'Sao chép bảng'}
              </button>
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                Xuất Excel (CSV)
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                In bảng
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[380px]">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold uppercase text-xs tracking-wider z-10">
                <tr className="border-b border-slate-200">
                  <th className="py-3 px-3 text-center w-16">STT</th>
                  <th className="py-3 px-4 text-right">Biến độc lập (Xᵢ)</th>
                  <th className="py-3 px-4 text-right">Biến phụ thuộc (Yᵢ)</th>
                  <th className="py-3 px-4 text-right">Giá trị dự đoán (Ŷᵢ)</th>
                  <th className="py-3 px-4 text-right">Phần dư (eᵢ = Yᵢ - Ŷᵢ)</th>
                  <th className="py-3 px-4 text-right">Bình phương phần dư (eᵢ²)</th>
                  <th className="py-3 px-4 text-right bg-purple-50 text-purple-900 font-bold">(yᵢ - ȳ)²</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {result.rows.map((r) => {
                  const devY2 = (r.y - result.meanY) * (r.y - result.meanY);
                  return (
                    <tr key={r.index} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-sans text-sm">{r.index}</td>
                      <td className="py-2.5 px-4 text-right font-semibold text-slate-800 text-sm sm:text-base">{formatNum(r.x, 2)}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-blue-900 text-sm sm:text-base">{formatNum(r.y, 2)}</td>
                      <td className="py-2.5 px-4 text-right text-indigo-900 font-semibold text-sm sm:text-base">{formatNum(r.yPred, digits)}</td>
                      <td
                        className={`py-2.5 px-4 text-right font-bold text-sm sm:text-base ${
                          r.residual >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {formatNum(r.residual, digits)}
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-900 font-bold text-sm sm:text-base">
                        {formatNum(r.residualSquared, digits)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-purple-950 bg-purple-50/20 text-sm sm:text-base">
                        {formatNum(devY2, digits)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 font-mono font-bold text-slate-800 border-t-2 border-slate-300">
                <tr>
                  <td colSpan={3} className="py-3 px-4 text-center font-sans uppercase text-xs sm:text-sm">
                    Tổng cộng (∑)
                  </td>
                  <td className="py-3 px-4 text-right text-indigo-950 text-sm sm:text-base">
                    {formatNum(result.rows.reduce((acc, cur) => acc + cur.yPred, 0), 2)}
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-800 text-sm sm:text-base">
                    {Math.abs(result.rows.reduce((acc, cur) => acc + cur.residual, 0)) < 1e-6
                      ? '0.0000 (≈ 0)'
                      : formatNum(result.rows.reduce((acc, cur) => acc + cur.residual, 0), digits)}
                  </td>
                  <td className="py-3 px-4 text-right text-rose-800 text-sm sm:text-base">
                    {formatNum(result.sse, digits)} (SSE)
                  </td>
                  <td className="py-3 px-4 text-right text-purple-900 text-sm sm:text-base font-extrabold bg-purple-50/50">
                    {formatNum(result.sst, digits)} (SST)
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Explanation Modal */}
      <RegressionExplanationModal
        isOpen={showExplanation}
        onClose={() => setShowExplanation(false)}
        type="simple"
        simpleResult={result}
        digits={digits}
      />
    </div>
  );
};
