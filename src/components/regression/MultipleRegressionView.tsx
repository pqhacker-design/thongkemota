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
  Layers,
  TrendingUp,
  Settings,
  CornerDownLeft,
} from 'lucide-react';
import { MultipleRegressionResult } from '../../types/regression';
import { calculateMultipleLinearRegression } from '../../utils/regressionMath';
import { formatNum } from '../../utils/mathStatistics';
import { MultipleRegressionCharts } from './MultipleRegressionCharts';
import { RegressionExplanationModal } from './RegressionExplanationModal';

// Presets for Multiple Regression
const MULTIPLE_PRESETS = [
  {
    label: 'Mẫu 1: Doanh số (Y) theo Quảng cáo (X₁) & Nhân viên (X₂)',
    variableNames: ['X₁ (Quảng cáo)', 'X₂ (Nhân viên)'],
    depName: 'Y (Doanh số)',
    data: [
      [2, 5, 22],
      [3, 6, 28],
      [4, 7, 34],
      [5, 8, 41],
      [6, 9, 49],
      [7, 10, 56],
      [8, 12, 65],
      [9, 13, 73],
    ],
  },
  {
    label: 'Mẫu 2: Điểm thi (Y) theo Tự học (X₁), Chuyên cần (X₂), Thi thử (X₃)',
    variableNames: ['X₁ (Tự học)', 'X₂ (Chuyên cần)', 'X₃ (Thi thử)'],
    depName: 'Y (Điểm thi)',
    data: [
      [15, 9, 6.5, 7.5],
      [20, 10, 7.0, 8.2],
      [12, 8, 5.5, 6.0],
      [25, 10, 8.5, 9.2],
      [18, 9, 7.5, 8.0],
      [10, 7, 5.0, 5.8],
      [22, 10, 8.0, 8.8],
      [16, 9, 6.8, 7.8],
      [14, 8, 6.0, 6.9],
      [28, 10, 9.0, 9.6],
    ],
  },
  {
    label: 'Mẫu 3: Giá nhà (Y) theo Diện tích (X₁), Phòng ngủ (X₂), Khoảng cách (X₃)',
    variableNames: ['X₁ (Diện tích m²)', 'X₂ (Phòng ngủ)', 'X₃ (Cách TT km)'],
    depName: 'Y (Giá tỷ VNĐ)',
    data: [
      [50, 2, 8, 2.5],
      [65, 2, 6, 3.2],
      [80, 3, 5, 4.2],
      [90, 3, 4, 5.0],
      [110, 4, 3, 6.8],
      [120, 4, 2, 7.9],
      [70, 2, 7, 3.5],
      [85, 3, 5, 4.6],
    ],
  },
];

interface MultipleRegressionViewProps {
  digits?: number;
}

export const MultipleRegressionView: React.FC<MultipleRegressionViewProps> = ({ digits = 4 }) => {
  const [variableNames, setVariableNames] = useState<string[]>(['X₁', 'X₂']);
  const [dataRows, setDataRows] = useState<number[][]>(MULTIPLE_PRESETS[0].data);
  const [inputMode, setInputMode] = useState<'table' | 'paste'>('table');
  const [pasteText, setPasteText] = useState('');
  const [pasteError, setPasteError] = useState<string | null>(null);

  // Prediction inputs for each X variable
  const [predictInputs, setPredictInputs] = useState<string[]>(['', '']);

  const [copiedEq, setCopiedEq] = useState(false);
  const [copiedTable, setCopiedTable] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showCalculationDetails, setShowCalculationDetails] = useState(true);

  // Sync prediction inputs array length with variableNames
  const k = variableNames.length;

  // Compute Multiple Regression Result
  const { result, error: mathError } = useMemo(() => {
    try {
      if (dataRows.length < 2) {
        return { result: null, error: 'Cần tối thiểu 2 dòng quan sát.' };
      }
      const res = calculateMultipleLinearRegression(variableNames, dataRows, digits);
      return { result: res, error: null };
    } catch (err: any) {
      return { result: null, error: err.message || 'Lỗi tính toán mô hình hồi quy bội.' };
    }
  }, [variableNames, dataRows, digits]);

  // Handle cell edits
  const handleCellChange = (rowIdx: number, colIdx: number, val: string) => {
    const num = Number(val);
    setDataRows((prev) => {
      const next = prev.map((r) => [...r]);
      next[rowIdx][colIdx] = Number.isNaN(num) ? 0 : num;
      return next;
    });
  };

  // 2D grid refs: cellRefs[`${rowIdx}-${colIdx}`]
  const cellRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const pendingFocusCellRef = useRef<{ row: number; col: number } | null>(null);

  useEffect(() => {
    if (pendingFocusCellRef.current !== null) {
      const { row, col } = pendingFocusCellRef.current;
      pendingFocusCellRef.current = null;
      const key = `${row}-${col}`;
      const el = cellRefs.current[key];
      if (el) {
        el.focus();
        el.select();
      }
    }
  }, [dataRows]);

  // Add row
  const handleAddRow = (focusCol: number = 0) => {
    pendingFocusCellRef.current = { row: dataRows.length, col: focusCol };
    setDataRows((prev) => [...prev, Array(k + 1).fill(0)]);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIdx: number,
    colIdx: number
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Pressing Enter moves straight down to the same column in rowIdx + 1 (stays in column Y or column X)
      const targetCol = colIdx;
      if (rowIdx < dataRows.length - 1) {
        const nextKey = `${rowIdx + 1}-${targetCol}`;
        const nextEl = cellRefs.current[nextKey];
        if (nextEl) {
          nextEl.focus();
          nextEl.select();
        }
      } else {
        // At the last row: automatically add a new row and focus on the same column!
        handleAddRow(targetCol);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (rowIdx < dataRows.length - 1) {
        const nextKey = `${rowIdx + 1}-${colIdx}`;
        cellRefs.current[nextKey]?.focus();
        cellRefs.current[nextKey]?.select();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (rowIdx > 0) {
        const prevKey = `${rowIdx - 1}-${colIdx}`;
        cellRefs.current[prevKey]?.focus();
        cellRefs.current[prevKey]?.select();
      }
    }
  };

  // Delete row
  const handleDeleteRow = (rowIdx: number) => {
    if (dataRows.length <= 2) {
      alert('Cần ít nhất 2 quan sát để tính toán.');
      return;
    }
    setDataRows((prev) => prev.filter((_, i) => i !== rowIdx));
  };

  // Add variable column (up to 10)
  const handleAddVariable = () => {
    if (k >= 10) {
      alert('Tối đa hỗ trợ 10 biến độc lập.');
      return;
    }
    const newVarName = `X${k + 1}`;
    setVariableNames((prev) => [...prev, newVarName]);
    setDataRows((prev) => {
      return prev.map((r) => {
        // insert before Y (which is the last element)
        const xPart = r.slice(0, r.length - 1);
        const yVal = r[r.length - 1];
        return [...xPart, 0, yVal];
      });
    });
    setPredictInputs((prev) => [...prev, '']);
  };

  // Remove variable column (minimum 2)
  const handleRemoveVariable = (varIdx: number) => {
    if (k <= 2) {
      alert('Hồi quy tuyến tính bội cần tối thiểu 2 biến độc lập (k ≥ 2).');
      return;
    }
    setVariableNames((prev) => prev.filter((_, i) => i !== varIdx));
    setDataRows((prev) => {
      return prev.map((r) => {
        const nextRow = [...r];
        nextRow.splice(varIdx, 1);
        return nextRow;
      });
    });
    setPredictInputs((prev) => prev.filter((_, i) => i !== varIdx));
  };

  // Rename variable
  const handleRenameVariable = (idx: number, name: string) => {
    setVariableNames((prev) => {
      const next = [...prev];
      next[idx] = name;
      return next;
    });
  };

  // Preset selector
  const handleApplyPreset = (presetIdx: number) => {
    const p = MULTIPLE_PRESETS[presetIdx];
    setVariableNames(p.variableNames);
    setDataRows(p.data);
    setPredictInputs(Array(p.variableNames.length).fill(''));
  };

  // Clear data
  const handleClear = () => {
    if (confirm('Bạn có chắc chắn muốn xóa dữ liệu hiện tại?')) {
      setDataRows([
        Array(k + 1).fill(0),
        Array(k + 1).fill(0),
      ]);
    }
  };

  // Paste handler
  const handleApplyPaste = () => {
    setPasteError(null);
    if (!pasteText.trim()) return;

    const lines = pasteText.trim().split(/\r?\n/);
    const parsedRows: number[][] = [];
    const expectedCols = k + 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const tokens = line.replace(/,/g, '.').split(/[\t\s]+/).filter(Boolean);
      if (tokens.length !== expectedCols) {
        setPasteError(
          `Dòng ${i + 1} có ${tokens.length} cột, nhưng bảng hiện tại yêu cầu ${expectedCols} cột (${k} biến X và 1 biến Y).`
        );
        return;
      }
      const numRow = tokens.map(Number);
      if (numRow.some((v) => Number.isNaN(v) || !Number.isFinite(v))) {
        setPasteError(`Dòng ${i + 1} chứa giá trị không hợp lệ.`);
        return;
      }
      parsedRows.push(numRow);
    }

    if (parsedRows.length < 2) {
      setPasteError('Cần tối thiểu 2 dòng dữ liệu hợp lệ.');
      return;
    }

    setDataRows(parsedRows);
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
    const meanY = result.means[k];
    let tsv = 'STT\t' + variableNames.join('\t') + '\tY\tY_du_doan\te\te^2\t(Y-Y_tb)^2\n';
    result.rows.forEach((r) => {
      const devY2 = (r.y - meanY) * (r.y - meanY);
      tsv += `${r.index}\t${r.xValues.join('\t')}\t${r.y}\t${formatNum(r.yPred, digits)}\t${formatNum(r.residual, digits)}\t${formatNum(r.residualSquared, digits)}\t${formatNum(devY2, digits)}\n`;
    });
    navigator.clipboard.writeText(tsv);
    setCopiedTable(true);
    setTimeout(() => setCopiedTable(false), 2000);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!result) return;
    const meanY = result.means[k];
    let csv = '\uFEFFSTT,' + variableNames.join(',') + ',Y_Thực_tế,Y_Dự_đoán,Phần_dư_e,e_bình_phương,Do_lech_binh_phuong_(Y-Ytb)^2\n';
    result.rows.forEach((r) => {
      const devY2 = (r.y - meanY) * (r.y - meanY);
      csv += `${r.index},${r.xValues.join(',')},${r.y},${formatNum(r.yPred, digits)},${formatNum(r.residual, digits)},${formatNum(r.residualSquared, digits)},${formatNum(devY2, digits)}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hoi-quy-tuyen-tinh-boi-ket-qua.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle Predict Inputs
  const handlePredictInputChange = (idx: number, val: string) => {
    setPredictInputs((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  // Prediction computation
  const allPredictInputsValid =
    predictInputs.length === k &&
    predictInputs.every((v) => v.trim() !== '' && !Number.isNaN(Number(v)));

  let predictedYVal: number | null = null;
  let predictionExtrapolationVars: string[] = [];

  if (allPredictInputsValid && result) {
    let sum = result.coefficients[0].value;
    for (let j = 0; j < k; j++) {
      const val = Number(predictInputs[j]);
      const bj = result.coefficients[j + 1].value;
      sum += bj * val;

      // Range check
      const colVals = dataRows.map((r) => r[j]);
      const colMin = Math.min(...colVals);
      const colMax = Math.max(...colVals);
      if (val < colMin || val > colMax) {
        predictionExtrapolationVars.push(`${variableNames[j]} [${colMin}, ${colMax}]`);
      }
    }
    predictedYVal = sum;
  }

  return (
    <div className="space-y-6">
      {/* Introduction Banner */}
      <div className="bg-linear-to-r from-teal-50 via-sky-50 to-indigo-50 border border-teal-200/80 rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-600 text-white uppercase tracking-wider">
                Mô hình đa biến OLS
              </span>
              <h2 className="text-xl font-bold text-slate-800">
                Hồi Quy Tuyến Tính Bội (Multiple Linear Regression)
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Phân tích tác động đồng thời của <strong>{k} biến độc lập</strong> lên biến phụ thuộc <strong>Y</strong> bằng phương pháp ma trận OLS: β̂ = (XᵀX)⁻¹XᵀY.
            </p>
          </div>

          {/* Preset Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Dữ liệu mẫu:
            </span>
            <select
              onChange={(e) => handleApplyPreset(Number(e.target.value))}
              defaultValue={0}
              className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:border-teal-400 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            >
              {MULTIPLE_PRESETS.map((p, idx) => (
                <option key={idx} value={idx}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Data Matrix & Equation Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Data Input & Variable Manager (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-4 pt-2">
            <div className="flex gap-2">
              <button
                onClick={() => setInputMode('table')}
                className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-t border-x ${
                  inputMode === 'table'
                    ? 'bg-white text-teal-700 border-slate-200 -mb-px shadow-2xs'
                    : 'text-slate-600 border-transparent hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <TableIcon className="w-3.5 h-3.5" /> Ma Trận Dữ Liệu
                </span>
              </button>
              <button
                onClick={() => setInputMode('paste')}
                className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-t border-x ${
                  inputMode === 'paste'
                    ? 'bg-white text-teal-700 border-slate-200 -mb-px shadow-2xs'
                    : 'text-slate-600 border-transparent hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Clipboard className="w-3.5 h-3.5" /> Dán từ Excel
                </span>
              </button>
            </div>

            <button
              onClick={handleClear}
              className="text-xs text-rose-600 hover:text-rose-800 font-medium pb-1 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Làm mới
            </button>
          </div>

          <div className="p-4 space-y-3">
            {/* Variable Manager Bar */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-teal-600" />
                Số biến độc lập: <strong>{k}</strong> (tối đa 10)
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleAddVariable}
                  disabled={k >= 10}
                  className="px-2.5 py-1 text-xs font-semibold bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                >
                  <Plus className="w-3 h-3" /> Thêm biến X
                </button>
              </div>
            </div>

            {inputMode === 'table' ? (
              <div className="space-y-3">
                <div className="overflow-x-auto max-h-[360px] border border-slate-200 rounded-xl">
                  <table className="w-full text-xs text-center border-collapse">
                    <thead className="sticky top-0 bg-slate-100 font-bold text-slate-700 z-10 border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-2 text-slate-400">STT</th>
                        {variableNames.map((name, vIdx) => (
                          <th key={vIdx} className="py-2 px-2 min-w-[70px]">
                            <div className="flex flex-col items-center gap-1">
                              <input
                                type="text"
                                value={name}
                                onChange={(e) => handleRenameVariable(vIdx, e.target.value)}
                                className="w-16 text-center bg-white border border-slate-300 rounded px-1 py-0.5 text-[11px] font-bold text-blue-800"
                                title="Bấm để đổi tên biến"
                              />
                              {k > 2 && (
                                <button
                                  onClick={() => handleRemoveVariable(vIdx)}
                                  className="text-[10px] text-rose-500 hover:text-rose-700 hover:underline"
                                  title="Xóa biến này"
                                >
                                  Xóa
                                </button>
                              )}
                            </div>
                          </th>
                        ))}
                        <th className="py-2 px-2 min-w-[70px] bg-teal-50 text-teal-900">
                          Biến Y
                        </th>
                        <th className="py-2 px-2 text-slate-400">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {dataRows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50">
                          <td className="py-1 px-2 text-slate-400 font-sans text-[11px]">
                            #{rIdx + 1}
                          </td>
                          {row.slice(0, k).map((val, cIdx) => (
                            <td key={cIdx} className="p-1">
                              <input
                                ref={(el) => {
                                  cellRefs.current[`${rIdx}-${cIdx}`] = el;
                                }}
                                type="number"
                                step="any"
                                value={val}
                                onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, rIdx, cIdx)}
                                onFocus={(e) => e.target.select()}
                                onWheel={(e) => e.currentTarget.blur()}
                                className="w-16 text-center bg-slate-50 focus:bg-white border border-slate-200 focus:border-teal-500 rounded py-1 px-1 text-xs font-semibold text-slate-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                            </td>
                          ))}
                          <td className="p-1 bg-teal-50/40">
                            <input
                              ref={(el) => {
                                cellRefs.current[`${rIdx}-${k}`] = el;
                              }}
                              type="number"
                              step="any"
                              value={row[k]}
                              onChange={(e) => handleCellChange(rIdx, k, e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, rIdx, k)}
                              onFocus={(e) => e.target.select()}
                              onWheel={(e) => e.currentTarget.blur()}
                              className="w-16 text-center bg-white border border-teal-300 focus:border-teal-500 rounded py-1 px-1 text-xs font-bold text-teal-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </td>
                          <td className="py-1 px-2">
                            <button
                              onClick={() => handleDeleteRow(rIdx)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    onClick={() => handleAddRow(0)}
                    className="flex-1 py-2 border-2 border-dashed border-teal-200 hover:border-teal-400 bg-teal-50/50 hover:bg-teal-50 rounded-xl text-teal-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Thêm Dòng Quan Sát
                  </button>
                  <div className="text-[11px] text-slate-500 italic hidden sm:flex items-center gap-1.5 px-1">
                    <CornerDownLeft className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>Nhấn <strong>Enter</strong> để xuống dòng tiếp theo hoặc tự động thêm dòng mới</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  Dán các cột từ Excel theo thứ tự: {variableNames.join(', ')} và Y:
                </p>
                <textarea
                  rows={9}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Ví dụ dán 3 cột (X1, X2, Y):&#10;2 5 22&#10;3 6 28&#10;4 7 34"
                  className="w-full font-mono text-xs p-3 border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 focus:outline-hidden bg-slate-50/50"
                />
                {pasteError && (
                  <div className="text-xs text-rose-600 font-medium bg-rose-50 p-2 rounded-lg border border-rose-200 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {pasteError}
                  </div>
                )}
                <button
                  onClick={handleApplyPaste}
                  className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold text-xs transition-colors shadow-2xs"
                >
                  Xác Nhận & Nạp Dữ Liệu
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Equation Banner & Statistics Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Equation Banner */}
          <div className="bg-linear-to-r from-teal-800 via-emerald-800 to-cyan-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>

            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <span className="text-xs font-bold text-teal-200 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-4 h-4" /> Phương Trình Hồi Quy Bội Ước Lượng OLS
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyEquation}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-all backdrop-blur-xs"
                >
                  {copiedEq ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Clipboard className="w-3.5 h-3.5" />}
                  {copiedEq ? 'Đã sao chép' : 'Sao chép'}
                </button>
                <button
                  onClick={() => setShowExplanation(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/90 hover:bg-amber-500 text-white text-xs font-semibold transition-all shadow-xs"
                >
                  <BookOpen className="w-3.5 h-3.5" /> Giải Thích Kết Quả
                </button>
              </div>
            </div>

            {result ? (
              <div className="mt-3">
                <div className="font-mono text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-wide text-white drop-shadow-xs break-words">
                  {result.equationString}
                </div>
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm sm:text-base text-teal-100">
                  <span>Hệ số chặn: <strong className="text-white font-mono text-base sm:text-lg">a (b₀) = {formatNum(result.coefficients[0].value, digits)}</strong></span>
                  <span>R² = <strong className="text-white font-mono text-base sm:text-lg">{formatNum(result.rSquared, digits)}</strong> ({(result.rSquared * 100).toFixed(1)}%)</span>
                  <span>SST = <strong className="text-white font-mono text-base sm:text-lg">{formatNum(result.sst, digits)}</strong></span>
                </div>
              </div>
            ) : (
              <div className="mt-3 text-amber-200 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {mathError || 'Cần bổ sung thêm quan sát để ma trận nghịch đảo tồn tại.'}
              </div>
            )}
          </div>

          {/* Warnings (Collinearity, df) */}
          {result?.degreeOfFreedomWarning && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{result.degreeOfFreedomWarning}</span>
            </div>
          )}

          {result?.multicollinearityWarning && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{result.multicollinearityWarning}</span>
            </div>
          )}

          {/* Stat Cards Grid */}
          {result && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cỡ Mẫu & Biến</span>
                  <span className="font-mono text-base px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold border border-slate-200 shadow-2xs">n, k</span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 mt-2">
                  n={result.n}, k={result.k}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Bậc tự do df = {result.n - result.k - 1}</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">Tương Quan Bội</span>
                  <span className="font-mono text-base px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-900 font-bold border border-teal-200 shadow-2xs">R</span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-teal-950 mt-2">
                  {formatNum(result.multipleR, digits)}
                </div>
                <div className="text-[11px] text-teal-700 font-medium mt-1">R = √R²</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Hệ Số R²</span>
                  <span className="font-mono text-base px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-900 font-bold border border-indigo-200 shadow-2xs">R²</span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-indigo-950 mt-2">
                  {formatNum(result.rSquared, digits)}
                </div>
                <div className="text-[11px] text-indigo-700 font-bold mt-1">
                  {(result.rSquared * 100).toFixed(1)}% giải thích
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Tổng Bình Phương Độ Lệch</span>
                  <span className="font-mono text-base px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-900 font-bold border border-purple-200 shadow-2xs">SST</span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-purple-950 mt-2">
                  {formatNum(result.sst, digits)}
                </div>
                <div className="text-[11px] text-purple-700 font-bold mt-1">SST = ∑(yᵢ - ȳ)²</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Tổng Dư SSE</span>
                  <span className="font-mono text-base px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-900 font-bold border border-rose-200 shadow-2xs">SSE</span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-950 mt-2">
                  {formatNum(result.sse, digits)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">∑eᵢ² tối thiểu</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Tổng Hồi Quy (SSR)</span>
                  <span className="font-mono text-base px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-900 font-bold border border-blue-200 shadow-2xs">SSR</span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-blue-950 mt-2">
                  {formatNum(result.ssr, digits)}
                </div>
                <div className="text-[11px] text-blue-700 font-bold mt-1">SSR = ∑(ŷᵢ - ȳ)²</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Sai Số Chuẩn</span>
                  <span className="font-mono text-base px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold border border-slate-200 shadow-2xs">SER</span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 mt-2">
                  {result.ser !== null ? formatNum(result.ser, digits) : 'N/A'}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Độ lệch chuẩn phần dư</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Sai Số RMSE</span>
                  <span className="font-mono text-base px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-900 font-bold border border-emerald-200 shadow-2xs">RMSE</span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-950 mt-2">
                  {formatNum(result.rmse, digits)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">√ (SSE / n)</div>
              </div>
            </div>
          )}

          {/* Multiple Prediction Tool */}
          {result && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-teal-600" />
                  Công Cụ Dự Báo Giá Trị Ŷ Với {k} Biến Độc Lập
                </h4>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {variableNames.map((name, idx) => (
                  <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <label className="block text-xs font-semibold text-slate-600 truncate mb-1">
                      {name}:
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={predictInputs[idx] || ''}
                      onChange={(e) => handlePredictInputChange(idx, e.target.value)}
                      placeholder={`TB: ${formatNum(result.means[idx], 1)}`}
                      className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-sm font-semibold text-slate-800 focus:bg-white focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                ))}
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-slate-500">Kết quả dự báo Ŷ:</div>
                  {predictedYVal !== null ? (
                    <div className="text-2xl sm:text-3xl font-extrabold text-teal-700 font-mono mt-1">
                      Ŷ = {formatNum(predictedYVal, digits)}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic">
                      Nhập đủ giá trị cho tất cả {k} biến độc lập để dự báo
                    </div>
                  )}
                </div>

                {predictionExtrapolationVars.length > 0 && (
                  <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-lg font-medium">
                    ⚠️ Ngoại suy ở biến: {predictionExtrapolationVars.join('; ')}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Regression Coefficients Breakdown */}
      {result && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                Bảng Hệ Số Hồi Quy OLS & Ý Nghĩa Riêng Phần (Ceteris Paribus)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Mỗi hệ số bⱼ phản ánh lượng thay đổi trung bình của Y khi biến Xⱼ tăng 1 đơn vị và các biến khác giữ nguyên
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 border-y border-slate-200 font-bold uppercase text-xs tracking-wider">
                  <th className="py-3 px-3 w-28 text-center font-mono">Hệ số (Ký hiệu)</th>
                  <th className="py-3 px-3 min-w-[120px]">Tên biến</th>
                  <th className="py-3 px-3 min-w-[220px]">Công thức & Cách tính</th>
                  <th className="py-3 px-3 text-right min-w-[120px]">Giá trị ước lượng</th>
                  <th className="py-3 px-3 text-slate-500 font-normal min-w-[200px]">Ý nghĩa kinh tế / thống kê</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.coefficients.map((coef, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 text-center">
                      <span className="font-mono text-base sm:text-lg px-3 py-1 rounded-md bg-teal-50 text-teal-900 font-bold border border-teal-200 shadow-2xs inline-block">
                        {coef.name}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-sm font-semibold text-slate-800">
                      {coef.variableName}
                    </td>
                    <td className="py-3 px-3">
                      {idx === 0 ? (
                        <div>
                          <div className="font-mono text-xs font-bold text-teal-900 bg-teal-50/90 px-2 py-0.5 rounded border border-teal-200 inline-block shadow-2xs">
                            b₀ = Ȳ - ∑ⱼ₌₁ᵏ bⱼX̄ⱼ
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-1 leading-snug">
                            = {formatNum(result.means[k], digits)} - ({variableNames.map((_, j) => `${formatNum(result.coefficients[j + 1]?.value, 2)}×${formatNum(result.means[j], 2)}`).join(' + ')})
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="font-mono text-xs font-bold text-blue-900 bg-blue-50/90 px-2 py-0.5 rounded border border-blue-200 inline-block shadow-2xs">
                            β̂ = (XᵀX)⁻¹XᵀY (Hàng #{idx + 1})
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 leading-snug">
                            Nghiệm OLS riêng phần giải từ hệ phương trình chuẩn (XᵀX)β = XᵀY
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-lg sm:text-xl text-slate-900 tabular-nums">
                      {formatNum(coef.value, digits)}
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-600 leading-relaxed">
                      {coef.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detailed Calculation & Normal Equations System */}
          <div className="border border-slate-200 rounded-xl bg-slate-50/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-teal-600" />
                Cách Tính & Hệ Phương Trình Chuẩn OLS (Normal Equations)
              </h4>
              <button
                onClick={() => setShowCalculationDetails(!showCalculationDetails)}
                className="text-xs font-semibold text-teal-700 hover:text-teal-900 cursor-pointer"
              >
                {showCalculationDetails ? 'Thu gọn' : 'Xem chi tiết'}
              </button>
            </div>

            {showCalculationDetails && (
              <div className="space-y-3 text-xs text-slate-700 pt-1 border-t border-slate-200/80">
                <p>
                  Theo phương pháp <strong>Bình phương bé nhất (OLS)</strong>, vectơ hệ số hồi quy <span className="font-mono font-bold">β̂ = [b₀, b₁, ..., bₖ]ᵀ</span> được ước lượng bằng cách giải hệ phương trình chuẩn ma trận:
                </p>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-center font-bold text-slate-900 text-xs sm:text-sm shadow-2xs">
                  (XᵀX) · β̂ = XᵀY &nbsp;⟺&nbsp; β̂ = (XᵀX)⁻¹ · XᵀY
                </div>

                {/* If k == 2, display classical 3-equation system */}
                {k === 2 && result.xtxMatrix && result.xtyVector && (
                  <div className="space-y-2 bg-white p-3.5 rounded-lg border border-teal-200">
                    <div className="font-semibold text-teal-900">
                      Hệ 3 phương trình chuẩn OLS cụ thể (2 biến độc lập {variableNames[0]}, {variableNames[1]}):
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px] sm:text-xs">
                      {/* Symbolic system */}
                      <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1">
                        <div className="text-slate-500 font-sans font-bold text-[10px] uppercase">Dạng tổng quát lý thuyết:</div>
                        <div>⎧ n·b₀ + (∑X₁)·b₁ + (∑X₂)·b₂ = ∑Y</div>
                        <div>⎨ (∑X₁)·b₀ + (∑X₁²)·b₁ + (∑X₁X₂)·b₂ = ∑X₁Y</div>
                        <div>⎩ (∑X₂)·b₀ + (∑X₁X₂)·b₁ + (∑X₂²)·b₂ = ∑X₂Y</div>
                      </div>

                      {/* Numeric substituted system */}
                      <div className="bg-teal-50/60 p-2.5 rounded border border-teal-200 space-y-1 text-teal-950 font-bold">
                        <div className="text-teal-800 font-sans font-bold text-[10px] uppercase">Thế số từ mẫu dữ liệu (n = {result.n}):</div>
                        <div>⎧ {formatNum(result.xtxMatrix[0][0], 1)}·b₀ + {formatNum(result.xtxMatrix[0][1], 2)}·b₁ + {formatNum(result.xtxMatrix[0][2], 2)}·b₂ = {formatNum(result.xtyVector[0], 2)}</div>
                        <div>⎨ {formatNum(result.xtxMatrix[1][0], 2)}·b₀ + {formatNum(result.xtxMatrix[1][1], 2)}·b₁ + {formatNum(result.xtxMatrix[1][2], 2)}·b₂ = {formatNum(result.xtyVector[1], 2)}</div>
                        <div>⎩ {formatNum(result.xtxMatrix[2][0], 2)}·b₀ + {formatNum(result.xtxMatrix[2][1], 2)}·b₁ + {formatNum(result.xtxMatrix[2][2], 2)}·b₂ = {formatNum(result.xtyVector[2], 2)}</div>
                      </div>
                    </div>
                    <div className="text-[11px] text-teal-800 font-medium pt-1">
                      Giải hệ phương trình bằng phương pháp khử Gauss hoặc ma trận nghịch đảo ta được nghiệm:
                      <span className="font-mono font-bold text-slate-900 ml-1">
                        b₀ = {formatNum(result.coefficients[0].value, digits)}, b₁ = {formatNum(result.coefficients[1].value, digits)}, b₂ = {formatNum(result.coefficients[2].value, digits)}
                      </span>
                    </div>
                  </div>
                )}

                {/* If k > 2, show matrix dimensions and XTX, XTY breakdown */}
                {k > 2 && result.xtxMatrix && result.xtyVector && (
                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                    <div className="font-semibold text-slate-800">
                      Ma trận hệ số thực tế ({k + 1} × {k + 1}) và vectơ vế phải ({k + 1} × 1):
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Ma trận XᵀX chứa cỡ mẫu n và các tổng bình phương, tổng tích chéo: ∑Xⱼ, ∑Xⱼ², ∑XᵢXⱼ. Vectơ XᵀY chứa tổng biến phụ thuộc ∑Y và tổng tích chéo ∑XⱼY.
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs font-mono">
                      <div className="bg-slate-50 p-2 rounded border border-slate-200">
                        <span className="font-bold text-slate-700">∑Y = {formatNum(result.xtyVector[0], 2)}</span>
                      </div>
                      {variableNames.map((name, idx) => (
                        <div key={idx} className="bg-slate-50 p-2 rounded border border-slate-200">
                          <span>∑{name} = {formatNum(result.xtxMatrix![0][idx + 1], 2)} | ∑{name}Y = {formatNum(result.xtyVector![idx + 1], 2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pearson Correlation Matrix Heatmap */}
      {result && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                Ma Trận Tương Quan Pearson Giữa Các Cặp Biến (Correlation Matrix)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kiểm tra mối tương quan cặp giữa các biến độc lập (phát hiện đa cộng tuyến nếu |r| &gt; 0.8) và với biến phụ thuộc Y
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-xs">
                  <th className="py-3 px-3 text-left">Biến</th>
                  {result.correlationMatrix.headers.map((h, idx) => (
                    <th key={idx} className="py-3 px-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {result.correlationMatrix.matrix.map((row, rIdx) => {
                  const headerName = result.correlationMatrix.headers[rIdx];
                  return (
                    <tr key={rIdx}>
                      <td className="py-2.5 px-3 text-left font-sans font-bold text-slate-800 bg-slate-50 text-xs sm:text-sm">
                        {headerName}
                      </td>
                      {row.map((val, cIdx) => {
                        const isDiag = rIdx === cIdx;
                        const isHighCorr = !isDiag && Math.abs(val) >= 0.8;
                        const isModerate = !isDiag && Math.abs(val) >= 0.5 && Math.abs(val) < 0.8;

                        return (
                          <td
                            key={cIdx}
                            className={`py-2.5 px-3 font-mono text-sm sm:text-base font-bold tabular-nums ${
                              isDiag
                                ? 'bg-slate-100 text-slate-400 font-normal'
                                : isHighCorr
                                ? 'bg-rose-100 text-rose-950 font-extrabold'
                                : isModerate
                                ? 'bg-blue-50 text-blue-950 font-bold'
                                : 'text-slate-800'
                            }`}
                          >
                            {formatNum(val, digits)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-slate-100 border border-slate-300 rounded inline-block"></span>
              <span>Đường chéo r = 1.0000 (tự tương quan)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-rose-100 border border-rose-300 rounded inline-block"></span>
              <span>|r| ≥ 0.80 (Tương quan cặp rất cao - nguy cơ đa cộng tuyến)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-blue-50 border border-blue-200 rounded inline-block"></span>
              <span>0.50 ≤ |r| &lt; 0.80 (Tương quan vừa)</span>
            </div>
          </div>
        </div>
      )}

      {/* Multiple Regression Interactive Charts */}
      {result && <MultipleRegressionCharts result={result} digits={digits} />}

      {/* Observation Residuals Table */}
      {result && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                Bảng Chi Tiết Quan Sát & Phần Dư Mô Hình Hồi Quy Bội
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kiểm chứng: Tổng phần dư ∑eᵢ = 0 và Tổng bình phương phần dư ∑eᵢ² = SSE
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyTable}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs"
              >
                {copiedTable ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Clipboard className="w-3.5 h-3.5 text-teal-600" />}
                {copiedTable ? 'Đã chép bảng' : 'Sao chép bảng'}
              </button>
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                Xuất CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[380px]">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold uppercase text-xs tracking-wider z-10 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 text-center w-16">STT</th>
                  {variableNames.map((name, idx) => (
                    <th key={idx} className="py-3 px-4 text-right">
                      {name}
                    </th>
                  ))}
                  <th className="py-3 px-4 text-right bg-teal-50 text-teal-900 font-extrabold">Y thực tế</th>
                  <th className="py-3 px-4 text-right">Ŷ dự đoán</th>
                  <th className="py-3 px-4 text-right">Phần dư (e)</th>
                  <th className="py-3 px-4 text-right">e²</th>
                  <th className="py-3 px-4 text-right bg-purple-50 text-purple-900 font-bold">(yᵢ - ȳ)²</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {result.rows.map((r) => {
                  const devY2 = (r.y - result.means[k]) * (r.y - result.means[k]);
                  return (
                    <tr key={r.index} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-sans text-sm">{r.index}</td>
                      {r.xValues.map((xv, xvIdx) => (
                        <td key={xvIdx} className="py-2.5 px-4 text-right text-slate-800 text-sm sm:text-base font-semibold">
                          {formatNum(xv, 2)}
                        </td>
                      ))}
                      <td className="py-2.5 px-4 text-right font-extrabold text-teal-950 bg-teal-50/30 text-sm sm:text-base">
                        {formatNum(r.y, 2)}
                      </td>
                      <td className="py-2.5 px-4 text-right text-indigo-900 font-bold text-sm sm:text-base">
                        {formatNum(r.yPred, digits)}
                      </td>
                      <td
                        className={`py-2.5 px-4 text-right font-bold text-sm sm:text-base ${
                          r.residual >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {formatNum(r.residual, digits)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900 text-sm sm:text-base">
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
                  <td colSpan={k + 2} className="py-3 px-4 text-center font-sans uppercase text-xs sm:text-sm">
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
        type="multiple"
        multipleResult={result}
        digits={digits}
      />
    </div>
  );
};
