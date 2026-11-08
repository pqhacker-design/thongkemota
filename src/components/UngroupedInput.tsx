import React, { useState, useEffect, useMemo } from 'react';
import {
  Trash2,
  Sparkles,
  FileText,
  CheckCircle,
  AlertCircle,
  Table2,
  Plus,
  ArrowUpDown,
  Merge,
  ClipboardPaste,
  HelpCircle,
  CornerDownLeft,
} from 'lucide-react';
import { parseRawNumbers } from '../utils/mathStatistics';

interface UngroupedInputProps {
  rawInput: string;
  onChangeInput: (val: string) => void;
  parsedNumbers: number[];
  sortedNumbers: number[];
  invalidTokens: string[];
}

interface TableRowItem {
  id: string;
  value: string;
  frequency: string;
}

export const UngroupedInput: React.FC<UngroupedInputProps> = ({
  rawInput,
  onChangeInput,
  parsedNumbers,
  sortedNumbers,
  invalidTokens,
}) => {
  // Mode: 'table' (Bảng giá trị & tần số n) | 'text' (Chuỗi văn bản nhanh)
  const [inputMode, setInputMode] = useState<'table' | 'text'>('table');
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteModalText, setPasteModalText] = useState('');

  // Sample Presets with frequency support
  const samplePresets = [
    {
      label: 'Mẫu cơ bản (SGK)',
      data: '5, 7, 8: 2, 9, 10, 12, 13, 15, 18',
      desc: '10 phần tử, giá trị 8 xuất hiện 2 lần',
    },
    {
      label: 'Bảng điểm thi (N = 50)',
      data: '5: 4, 6: 8, 7: 14, 8: 15, 9: 6, 10: 3',
      desc: 'Bảng phân bố tần số điểm kiểm tra (N = 50)',
    },
    {
      label: 'Mẫu có ngoại lệ',
      data: '-10, 15: 2, 16, 17, 18: 3, 19, 20, 21, 22, 23, 62',
      desc: 'Có điểm ngoại lệ phía dưới (-10) và phía trên (62)',
    },
    {
      label: 'Số thập phân & lẻ',
      data: '2.5: 2, 3.4, 4.1: 2, 4.8, 5.6: 2, 6.2, 7.9, 8.5',
      desc: 'Số thập phân kèm tần số n',
    },
    {
      label: 'Mẫu đặc biệt n = 2',
      data: '12, 28',
      desc: 'Kiểm tra trường hợp biên n = 2',
    },
  ];

  // Parse current text
  const parsedData = useMemo(() => {
    return parseRawNumbers(rawInput);
  }, [rawInput]);

  // Local table rows state
  const [tableRows, setTableRows] = useState<TableRowItem[]>(() => {
    if (parsedData.items.length > 0) {
      return parsedData.items.map((it) => ({
        id: it.id,
        value: it.value.toString(),
        frequency: it.frequency.toString(),
      }));
    }
    return [
      { id: '1', value: '', frequency: '1' },
      { id: '2', value: '', frequency: '1' },
      { id: '3', value: '', frequency: '1' },
    ];
  });

  // Track if local table is actively updating raw text to avoid circular updates
  const isUpdatingFromTable = React.useRef(false);

  // Refs for keyboard navigation between rows
  const valueInputRefs = React.useRef<(HTMLInputElement | null)[]>([]);
  const freqInputRefs = React.useRef<(HTMLInputElement | null)[]>([]);
  const pendingFocusIndexRef = React.useRef<{ index: number; field: 'value' | 'frequency' } | null>(null);

  // Focus effect when moving with Enter key or adding a row
  useEffect(() => {
    if (pendingFocusIndexRef.current !== null) {
      const { index, field } = pendingFocusIndexRef.current;
      pendingFocusIndexRef.current = null;
      const target = field === 'value' ? valueInputRefs.current[index] : freqInputRefs.current[index];
      if (target) {
        target.focus();
        target.select();
      }
    }
  }, [tableRows]);

  // Sync table from external rawInput changes (e.g. presets, or user typed in text mode)
  useEffect(() => {
    if (isUpdatingFromTable.current) {
      isUpdatingFromTable.current = false;
      return;
    }

    if (parsedData.items.length > 0) {
      setTableRows(
        parsedData.items.map((it) => ({
          id: it.id,
          value: it.value.toString(),
          frequency: it.frequency.toString(),
        }))
      );
    } else if (!rawInput.trim()) {
      setTableRows([
        { id: '1', value: '', frequency: '1' },
        { id: '2', value: '', frequency: '1' },
        { id: '3', value: '', frequency: '1' },
      ]);
    }
  }, [rawInput, parsedData.items]);

  // Helper to serialize table rows into text
  const serializeRows = (rows: TableRowItem[]): string => {
    return rows
      .filter((r) => r.value.trim() !== '' && !Number.isNaN(Number(r.value.trim())))
      .map((r) => {
        const v = Number(r.value.trim());
        const rawFreq = Number(r.frequency.trim());
        const f = !Number.isNaN(rawFreq) && rawFreq > 0 ? Math.round(rawFreq) : 1;
        return f > 1 ? `${v}: ${f}` : `${v}`;
      })
      .join(', ');
  };

  const handleRowChange = (index: number, field: 'value' | 'frequency', val: string) => {
    const updated = [...tableRows];
    updated[index] = { ...updated[index], [field]: val };
    setTableRows(updated);

    isUpdatingFromTable.current = true;
    const serialized = serializeRows(updated);
    onChangeInput(serialized);
  };

  const handleAddRow = (shouldFocus: boolean = false) => {
    if (shouldFocus) {
      pendingFocusIndexRef.current = { index: tableRows.length, field: 'value' };
    }
    const newRow: TableRowItem = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      value: '',
      frequency: '1', // Default frequency is 1
    };
    const updated = [...tableRows, newRow];
    setTableRows(updated);
  };

  // Keyboard navigation: Enter moves to next row, ArrowDown/Up navigate
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number,
    field: 'value' | 'frequency'
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (idx < tableRows.length - 1) {
        // Move to the next row's value input
        const nextInput = valueInputRefs.current[idx + 1];
        if (nextInput) {
          nextInput.focus();
          nextInput.select();
        }
      } else {
        // At the last row: automatically add a new row and focus it!
        pendingFocusIndexRef.current = { index: idx + 1, field: 'value' };
        handleAddRow(false);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (idx < tableRows.length - 1) {
        const target = field === 'value' ? valueInputRefs.current[idx + 1] : freqInputRefs.current[idx + 1];
        target?.focus();
        target?.select();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (idx > 0) {
        const target = field === 'value' ? valueInputRefs.current[idx - 1] : freqInputRefs.current[idx - 1];
        target?.focus();
        target?.select();
      }
    }
  };

  const handleAddMultipleRows = (count: number = 5) => {
    const newRows: TableRowItem[] = Array.from({ length: count }, (_, i) => ({
      id: (Date.now() + i).toString() + Math.random().toString(36).substring(2, 5),
      value: '',
      frequency: '1',
    }));
    const updated = [...tableRows, ...newRows];
    setTableRows(updated);
  };

  const handleDeleteRow = (index: number) => {
    if (tableRows.length <= 1) {
      const reset = [{ id: '1', value: '', frequency: '1' }];
      setTableRows(reset);
      isUpdatingFromTable.current = true;
      onChangeInput('');
      return;
    }
    const updated = tableRows.filter((_, i) => i !== index);
    setTableRows(updated);

    isUpdatingFromTable.current = true;
    const serialized = serializeRows(updated);
    onChangeInput(serialized);
  };

  const handleClear = () => {
    setTableRows([
      { id: '1', value: '', frequency: '1' },
      { id: '2', value: '', frequency: '1' },
      { id: '3', value: '', frequency: '1' },
    ]);
    isUpdatingFromTable.current = true;
    onChangeInput('');
  };

  // Sort rows ascending by value
  const handleSortAscending = () => {
    const validRows = tableRows.filter(
      (r) => r.value.trim() !== '' && !Number.isNaN(Number(r.value.trim()))
    );
    validRows.sort((a, b) => Number(a.value.trim()) - Number(b.value.trim()));

    const emptyRows = tableRows.filter(
      (r) => r.value.trim() === '' || Number.isNaN(Number(r.value.trim()))
    );

    const updated = [...validRows, ...emptyRows];
    setTableRows(updated);

    isUpdatingFromTable.current = true;
    const serialized = serializeRows(updated);
    onChangeInput(serialized);
  };

  // Merge duplicate values by summing their frequencies
  const handleConsolidateDuplicates = () => {
    const map = new Map<number, number>();
    for (const r of tableRows) {
      const v = Number(r.value.trim());
      if (r.value.trim() !== '' && !Number.isNaN(v)) {
        const rawFreq = Number(r.frequency.trim());
        const f = !Number.isNaN(rawFreq) && rawFreq > 0 ? Math.round(rawFreq) : 1;
        map.set(v, (map.get(v) || 0) + f);
      }
    }

    const mergedRows: TableRowItem[] = [];
    let counter = 1;
    // Sort merged values ascending
    const sortedKeys = Array.from(map.keys()).sort((a, b) => a - b);
    for (const k of sortedKeys) {
      mergedRows.push({
        id: String(counter++),
        value: k.toString(),
        frequency: (map.get(k) || 1).toString(),
      });
    }

    if (mergedRows.length === 0) {
      mergedRows.push({ id: '1', value: '', frequency: '1' });
    }

    setTableRows(mergedRows);
    isUpdatingFromTable.current = true;
    const serialized = serializeRows(mergedRows);
    onChangeInput(serialized);
  };

  // Process Excel paste into table modal
  const handleApplyPasteModal = () => {
    if (!pasteModalText.trim()) {
      setShowPasteModal(false);
      return;
    }

    const parsed = parseRawNumbers(pasteModalText);
    if (parsed.items.length > 0) {
      const newRows = parsed.items.map((it) => ({
        id: it.id,
        value: it.value.toString(),
        frequency: it.frequency.toString(),
      }));
      setTableRows(newRows);
      isUpdatingFromTable.current = true;
      const serialized = serializeRows(newRows);
      onChangeInput(serialized);
    }
    setPasteModalText('');
    setShowPasteModal(false);
  };

  // Summary statistics for badge
  const totalFrequency = parsedNumbers.length;
  const distinctCount = parsedData.distinctCount;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
      {/* Top Header & Presets */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-600" />
              <span>Nhập Mẫu Số Liệu Thô (Không Ghép Nhóm)</span>
            </h3>
            <span className="text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full">
              Hỗ trợ tần số n (mặc định = 1)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Nhập giá trị và tần số theo dạng bảng hoặc nhập chuỗi văn bản tự do (ví dụ: <code className="bg-slate-100 px-1 py-0.5 rounded text-sky-800 font-mono">8: 5</code> nghĩa là số 8 xuất hiện 5 lần)
          </p>
        </div>

        {/* Quick Presets & Clear */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-400 mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" /> Dữ liệu mẫu:
          </span>
          {samplePresets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                isUpdatingFromTable.current = false;
                onChangeInput(preset.data);
              }}
              className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-700 rounded-lg border border-slate-200/80 transition-colors cursor-pointer"
              title={preset.desc}
            >
              {preset.label}
            </button>
          ))}
          <button
            onClick={handleClear}
            disabled={!rawInput && tableRows.every((r) => !r.value)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg transition-colors disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer ml-1"
            title="Xóa toàn bộ dữ liệu nhập"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher Tabs & Quick Stats Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 p-2 rounded-xl border border-slate-200/70">
        <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-lg">
          <button
            onClick={() => setInputMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              inputMode === 'table'
                ? 'bg-white text-sky-700 shadow-2xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Table2 className="w-3.5 h-3.5 text-sky-600" />
            <span>1. Bảng Giá Trị & Tần Số (n)</span>
          </button>
          <button
            onClick={() => setInputMode('text')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              inputMode === 'text'
                ? 'bg-white text-sky-700 shadow-2xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>2. Nhập Chuỗi Văn Bản Nhanh</span>
          </button>
        </div>

        {/* Quick Sample Summary Pills */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700 shadow-2xs">
            <span className="text-slate-400 font-medium">Tổng cỡ mẫu:</span>
            <span className="font-mono font-bold text-sky-700">n = {totalFrequency}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700 shadow-2xs">
            <span className="text-slate-400 font-medium">Số giá trị phân biệt:</span>
            <span className="font-mono font-bold text-teal-700">k = {distinctCount}</span>
          </div>
        </div>
      </div>

      {/* MODE 1: TABLE INPUT VIEW */}
      {inputMode === 'table' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <p className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 inline-block"></span>
              <span>
                Nhập giá trị $x_i$ rồi nhấn <strong>Enter</strong> để xuống dòng tiếp theo (ở dòng cuối nhấn Enter sẽ tự thêm dòng mới). Tần số mặc định là <strong>1</strong>.
              </span>
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleSortAscending}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md border border-slate-200 transition-colors cursor-pointer"
                title="Sắp xếp các dòng theo giá trị x tăng dần"
              >
                <ArrowUpDown className="w-3 h-3 text-sky-600" />
                <span>Sắp xếp x ↑</span>
              </button>
              <button
                onClick={handleConsolidateDuplicates}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md border border-slate-200 transition-colors cursor-pointer"
                title="Tự động gộp các dòng có cùng giá trị x và cộng tổng tần số n"
              >
                <Merge className="w-3 h-3 text-teal-600" />
                <span>Gộp giá trị trùng</span>
              </button>
              <button
                onClick={() => setShowPasteModal(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-md border border-sky-200 transition-colors cursor-pointer font-medium"
                title="Dán nhanh bảng giá trị và tần số từ Excel"
              >
                <ClipboardPaste className="w-3 h-3 text-sky-600" />
                <span>Dán từ Excel</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto max-h-[360px] border border-slate-200 rounded-xl bg-slate-50/50">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold border-b border-slate-200 z-10">
                <tr>
                  <th className="py-2.5 px-3 text-center w-14">STT</th>
                  <th className="py-2.5 px-4">Giá trị quan sát (xᵢ)</th>
                  <th className="py-2.5 px-4 w-44">Tần số (nᵢ) <span className="text-[11px] font-normal text-slate-500">(mặc định 1)</span></th>
                  <th className="py-2.5 px-4 text-center w-28 text-slate-500 font-semibold">Tỷ trọng %</th>
                  <th className="py-2.5 px-3 text-center w-16">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {tableRows.map((row, idx) => {
                  const numFreq = Number(row.frequency.trim());
                  const validFreq = !Number.isNaN(numFreq) && numFreq > 0 ? Math.round(numFreq) : 1;
                  const pct = totalFrequency > 0 && row.value.trim() !== '' ? ((validFreq / totalFrequency) * 100).toFixed(1) : '—';

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2 px-3 text-center text-slate-400 font-mono text-xs">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-4">
                        <input
                          ref={(el) => {
                            valueInputRefs.current[idx] = el;
                          }}
                          type="number"
                          step="any"
                          value={row.value}
                          onChange={(e) => handleRowChange(idx, 'value', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, idx, 'value')}
                          onFocus={(e) => e.target.select()}
                          onWheel={(e) => e.currentTarget.blur()}
                          placeholder="Ví dụ: 8"
                          className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-sky-500 rounded-lg py-1.5 px-3 font-mono text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-sky-100 focus:outline-hidden transition-all shadow-2xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </td>
                      <td className="py-2 px-4">
                        <div className="relative">
                          <input
                            ref={(el) => {
                              freqInputRefs.current[idx] = el;
                            }}
                            type="number"
                            min="1"
                            step="1"
                            value={row.frequency}
                            onChange={(e) => handleRowChange(idx, 'frequency', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, idx, 'frequency')}
                            onFocus={(e) => e.target.select()}
                            onWheel={(e) => e.currentTarget.blur()}
                            placeholder="1"
                            className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-sky-500 rounded-lg py-1.5 px-3 font-mono text-sm font-bold text-sky-800 focus:ring-2 focus:ring-sky-100 focus:outline-hidden transition-all shadow-2xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          {!row.frequency && (
                            <span className="absolute right-3 top-2 text-[10px] text-slate-400 pointer-events-none italic">
                              mặc định 1
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-4 text-center font-mono text-xs text-slate-600">
                        {pct !== '—' ? `${pct}%` : '—'}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => handleDeleteRow(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="Xóa dòng này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Add Row Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={() => handleAddRow(true)}
              className="flex-1 sm:flex-initial py-2 px-4 border border-dashed border-sky-300 hover:border-sky-500 bg-sky-50/60 hover:bg-sky-50 rounded-xl text-sky-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4 text-sky-600" />
              <span>Thêm Giá Trị (n = 1)</span>
            </button>
            <button
              onClick={() => handleAddMultipleRows(5)}
              className="py-2 px-3 border border-slate-200 hover:border-slate-300 bg-slate-100/70 hover:bg-slate-100 rounded-xl text-slate-700 font-semibold text-xs flex items-center gap-1 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm 5 dòng</span>
            </button>
            <div className="text-[11px] text-slate-500 italic ml-auto hidden sm:flex items-center gap-1.5">
              <CornerDownLeft className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span>Nhấn <strong>Enter</strong> để xuống dòng tiếp theo nhanh chóng</span>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: TEXTAREA INPUT VIEW */}
      {inputMode === 'text' && (
        <div className="space-y-2">
          <textarea
            value={rawInput}
            onChange={(e) => {
              isUpdatingFromTable.current = false;
              onChangeInput(e.target.value);
            }}
            placeholder="Ví dụ kèm tần số n:&#10;5, 7, 8: 3, 9: 5, 10: 2&#10;Hoặc: 5(1), 7(1), 8(3), 9(5)&#10;Hoặc dán 2 cột từ Excel (Cột 1: Giá trị, Cột 2: Tần số)..."
            rows={5}
            className="w-full font-mono text-sm p-3.5 bg-slate-50/70 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all text-slate-800 placeholder:text-slate-400 resize-y"
          />

          <div className="bg-sky-50/60 border border-sky-100 rounded-lg p-2.5 text-xs text-sky-900 flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold">Cú pháp nhập tần số linh hoạt:</p>
              <p className="text-slate-600">
                • <strong>Dạng dấu hai chấm:</strong> <code className="bg-white px-1 py-0.2 rounded font-mono text-sky-800">8: 5</code> (giá trị 8 xuất hiện 5 lần).
              </p>
              <p className="text-slate-600">
                • <strong>Dạng dấu ngoặc đơn:</strong> <code className="bg-white px-1 py-0.2 rounded font-mono text-sky-800">8(5)</code> hoặc phép nhân <code className="bg-white px-1 py-0.2 rounded font-mono text-sky-800">8*5</code>.
              </p>
              <p className="text-slate-600">
                • <strong>Số đơn lẻ:</strong> Nếu không ghi tần số (ví dụ: <code className="bg-white px-1 py-0.2 rounded font-mono text-sky-800">12</code>), tần số mặc định luôn là <strong>1</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status Bar & Recognition Messages */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 border-t border-slate-100">
        <div className="flex items-center gap-2 flex-wrap">
          {parsedNumbers.length > 0 ? (
            <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>
                Đã nhận diện: <strong>{parsedNumbers.length}</strong> quan sát ({distinctCount} giá trị phân biệt)
              </span>
            </div>
          ) : (
            <span className="text-slate-400 italic">Chưa có dữ liệu nào được nhập</span>
          )}

          {invalidTokens.length > 0 && (
            <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>
                Bỏ qua token không hợp lệ: {invalidTokens.slice(0, 3).join(', ')}
                {invalidTokens.length > 3 ? '...' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Sorted array preview */}
        {sortedNumbers.length > 0 && (
          <div className="text-slate-600 truncate max-w-full md:max-w-xl">
            <span className="text-slate-400 font-medium mr-1.5">Mẫu sắp xếp tăng dần:</span>
            <span className="font-mono text-slate-800 font-semibold">
              {sortedNumbers.length <= 15
                ? sortedNumbers.join(', ')
                : `${sortedNumbers.slice(0, 8).join(', ')}, ..., ${sortedNumbers.slice(-4).join(', ')}`}
            </span>
          </div>
        )}
      </div>

      {/* Paste Excel Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <ClipboardPaste className="w-4 h-4 text-sky-600" />
                Dán Dữ Liệu Từ Excel (2 Cột: Giá Trị & Tần Số)
              </h4>
              <button
                onClick={() => setShowPasteModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Sao chép 2 cột từ Excel hoặc Google Sheets (Cột 1: Giá trị, Cột 2: Tần số) rồi dán trực tiếp vào ô bên dưới. Nếu chỉ có 1 cột, tần số sẽ mặc định là 1.
            </p>

            <textarea
              rows={6}
              value={pasteModalText}
              onChange={(e) => setPasteModalText(e.target.value)}
              placeholder={`5\t2\n7\t1\n8\t4\n9\t3`}
              className="w-full font-mono text-xs p-3 border border-slate-200 rounded-xl focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-hidden bg-slate-50"
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowPasteModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleApplyPasteModal}
                className="px-4 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs"
              >
                Nạp vào bảng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
