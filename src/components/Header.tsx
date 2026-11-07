import React from 'react';
import { BookOpen, Printer, Sliders } from 'lucide-react';

interface HeaderProps {
  onOpenGuide: () => void;
  digits: number;
  onChangeDigits: (d: number) => void;
  onPrint: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenGuide,
  digits,
  onChangeDigits,
  onPrint,
}) => {
  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-500 text-white flex items-center justify-center font-extrabold text-lg tracking-wider shadow-xs select-none">
            SP
          </div>
          <div>
            <div className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap">
              STATISTICS PRO
            </div>
            <div className="hidden sm:block text-[11px] text-slate-500 font-medium">
              Công cụ tính toán thống kê mô tả & hồi quy tuyến tính
            </div>
          </div>
        </div>

        {/* Zone 2: Center Controls / Decimal Selector */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100/80 px-2.5 py-1 rounded-lg border border-slate-200/60">
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-medium">Chữ số thập phân:</span>
            <div className="flex items-center gap-0.5 ml-1">
              {[2, 3, 4, 6].map((d) => (
                <button
                  key={d}
                  onClick={() => onChangeDigits(d)}
                  className={`w-6 h-6 rounded text-xs font-mono font-semibold transition-colors cursor-pointer ${
                    digits === d
                      ? 'bg-sky-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onPrint}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            title="In báo cáo thống kê hoặc lưu dưới dạng PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In báo cáo</span>
          </button>

          <button
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Hướng dẫn sử dụng</span>
          </button>
        </div>
      </div>
    </header>
  );
};
