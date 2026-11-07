import React from 'react';
import { Trash2, Sparkles, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { parseRawNumbers } from '../utils/mathStatistics';

interface UngroupedInputProps {
  rawInput: string;
  onChangeInput: (val: string) => void;
  parsedNumbers: number[];
  sortedNumbers: number[];
  invalidTokens: string[];
}

export const UngroupedInput: React.FC<UngroupedInputProps> = ({
  rawInput,
  onChangeInput,
  parsedNumbers,
  sortedNumbers,
  invalidTokens,
}) => {
  const samplePresets = [
    {
      label: 'Mẫu cơ bản (SGK)',
      data: '5, 7, 8, 8, 9, 10, 12, 13, 15, 18',
      desc: '10 phần tử, n chẵn',
    },
    {
      label: 'Mẫu có ngoại lệ',
      data: '-10, 15, 16, 17, 18, 19, 20, 21, 22, 23, 62',
      desc: 'Có điểm ngoại lệ phía dưới (-10) và phía trên (62)',
    },
    {
      label: 'Số thập phân & lẻ',
      data: '2.5, 3.4, 4.1, 4.8, 5.6, 6.2, 7.9, 8.5, 9.3',
      desc: 'n = 9 phần tử lẻ, số thập phân',
    },
    {
      label: 'Mẫu đặc biệt n = 2',
      data: '12, 28',
      desc: 'Kiểm tra trường hợp biên n = 2',
    },
  ];

  const handleClear = () => {
    onChangeInput('');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
      {/* Header & Quick Action Presets */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-600" />
            <span>Nhập Mẫu Số Liệu Thô (Không Ghép Nhóm)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Nhập hoặc dán các giá trị cách nhau bằng dấu cách, phẩy, chấm phẩy hoặc xuống dòng (hỗ trợ Excel)
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-400 mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" /> Dữ liệu mẫu:
          </span>
          {samplePresets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => onChangeInput(preset.data)}
              className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-700 rounded-lg border border-slate-200/80 transition-colors cursor-pointer"
              title={preset.desc}
            >
              {preset.label}
            </button>
          ))}
          <button
            onClick={handleClear}
            disabled={!rawInput}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg transition-colors disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer ml-1"
            title="Xóa toàn bộ dữ liệu nhập"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa</span>
          </button>
        </div>
      </div>

      {/* Textarea Input */}
      <div>
        <textarea
          value={rawInput}
          onChange={(e) => onChangeInput(e.target.value)}
          placeholder="Ví dụ: 5, 7, 8, 8, 9, 10, 12, 13, 15, 18&#10;Hoặc dán một cột số liệu trực tiếp từ Excel..."
          rows={4}
          className="w-full font-mono text-sm p-3.5 bg-slate-50/70 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all text-slate-800 placeholder:text-slate-400 resize-y"
        />
      </div>

      {/* Status Bar & Validation Messages */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
        <div className="flex items-center gap-2">
          {parsedNumbers.length > 0 ? (
            <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Đã nhận diện: <strong>{parsedNumbers.length}</strong> số hợp lệ</span>
            </div>
          ) : (
            <span className="text-slate-400 italic">Chưa có dữ liệu nào được nhập</span>
          )}

          {invalidTokens.length > 0 && (
            <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Bỏ qua ký tự không hợp lệ: {invalidTokens.slice(0, 3).join(', ')}{invalidTokens.length > 3 ? '...' : ''}</span>
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
    </div>
  );
};
