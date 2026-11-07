import React, { useState } from 'react';
import { Copy, Check, FileSpreadsheet, Eye, HelpCircle } from 'lucide-react';
import { DescriptiveStatistics } from '../types/statistics';
import { formatNum } from '../utils/mathStatistics';
import { copyTableToClipboard, exportToExcel } from '../utils/exportUtils';

interface SummaryTableProps {
  stats: DescriptiveStatistics;
  digits?: number;
  onOpenSteps: () => void;
  rawSource: any;
  dataType: 'ungrouped' | 'grouped';
}

export const SummaryTable: React.FC<SummaryTableProps> = ({
  stats,
  digits = 4,
  onOpenSteps,
  rawSource,
  dataType,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyTableToClipboard(stats, digits);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportExcel = () => {
    exportToExcel(stats, dataType, rawSource, digits);
  };

  const rows = [
    {
      stt: 1,
      name: 'Cỡ mẫu',
      symbol: 'n',
      value: stats.n.toString(),
      description: 'Tổng số lượng quan sát hoặc tổng tần số (n = Σnᵢ)',
      category: 'basic',
    },
    {
      stt: 2,
      name: 'Trung bình',
      symbol: 'x̄',
      value: formatNum(stats.mean, digits),
      description: 'Giá trị trung bình cộng của mẫu số liệu',
      category: 'central',
    },
    {
      stt: 3,
      name: 'Phương sai chưa hiệu chỉnh',
      symbol: 'ŝ²',
      value: formatNum(stats.varianceUncorrected, digits),
      description: 'Chia cho mẫu số n (đặc trưng phân tán chưa hiệu chỉnh)',
      category: 'spread',
    },
    {
      stt: 4,
      name: 'Phương sai mẫu hiệu chỉnh',
      symbol: 's²',
      value: stats.n >= 2 ? formatNum(stats.varianceCorrected, digits) : 'Không xác định (n < 2)',
      description: 'Chia cho bậc tự do n - 1: s² = Σ(xᵢ - x̄)² / (n - 1)',
      highlight: true,
      category: 'spread',
    },
    {
      stt: 5,
      name: 'Độ lệch chuẩn chưa hiệu chỉnh',
      symbol: 'ŝ',
      value: formatNum(stats.stdevUncorrected, digits),
      description: 'Độ lệch chuẩn chưa hiệu chỉnh theo bài học',
      category: 'spread',
    },
    {
      stt: 6,
      name: 'Độ lệch chuẩn',
      symbol: 's',
      value: stats.n >= 2 ? formatNum(stats.stdevCorrected, digits) : 'Không xác định (n < 2)',
      description: 'Căn bậc hai của phương sai mẫu hiệu chỉnh: s = √s²',
      highlight: true,
      category: 'spread',
    },
    {
      stt: 7,
      name: 'Giá trị nhỏ nhất',
      symbol: 'x_min',
      value: formatNum(stats.min, digits),
      description: stats.isGrouped ? 'Cận dưới của nhóm đầu có tần số dương' : 'Giá trị nhỏ nhất quan sát được trong mẫu',
      category: 'extreme',
    },
    {
      stt: 8,
      name: 'Giá trị lớn nhất',
      symbol: 'x_max',
      value: formatNum(stats.max, digits),
      description: stats.isGrouped ? 'Cận trên của nhóm cuối có tần số dương' : 'Giá trị lớn nhất quan sát được trong mẫu',
      category: 'extreme',
    },
    {
      stt: 9,
      name: 'Khoảng biến thiên',
      symbol: 'R',
      value: formatNum(stats.range, digits),
      description: 'Hiệu số giữa giá trị lớn nhất và nhỏ nhất: R = x_max - x_min',
      category: 'spread',
    },
    {
      stt: 10,
      name: 'Tứ phân vị thứ nhất',
      symbol: 'Q₁',
      value: formatNum(stats.q1, digits),
      description: 'Điểm phân vị 25% (trung vị của nửa dưới mẫu)',
      category: 'quartile',
    },
    {
      stt: 11,
      name: 'Trung vị',
      symbol: 'Q₂',
      value: formatNum(stats.q2, digits),
      description: 'Điểm phân vị 50% (chia đôi mẫu số liệu)',
      highlight: true,
      category: 'quartile',
    },
    {
      stt: 12,
      name: 'Tứ phân vị thứ ba',
      symbol: 'Q₃',
      value: formatNum(stats.q3, digits),
      description: 'Điểm phân vị 75% (trung vị của nửa trên mẫu)',
      category: 'quartile',
    },
    {
      stt: 13,
      name: 'Khoảng tứ phân vị',
      symbol: 'ΔQ (IQR)',
      value: formatNum(stats.iqr, digits),
      description: 'Độ trải giữa của 50% số liệu: ΔQ = Q₃ - Q₁',
      highlight: true,
      category: 'quartile',
    },
    {
      stt: 14,
      name: 'Ngưỡng dưới',
      symbol: 'LF',
      value: formatNum(stats.lowerFence, digits),
      description: 'Hàng rào dưới xác định ngoại lệ: Q₁ - 1.5 × ΔQ',
      category: 'outlier',
    },
    {
      stt: 15,
      name: 'Ngưỡng trên',
      symbol: 'UF',
      value: formatNum(stats.upperFence, digits),
      description: 'Hàng rào trên xác định ngoại lệ: Q₃ + 1.5 × ΔQ',
      category: 'outlier',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Table Action Bar */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            Bảng Kết Quả Thống Kê
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            15 đại lượng đặc trưng đo mức độ tập trung và phân tán của mẫu
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSteps}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Xem cách tính</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Sao chép toàn bộ bảng vào bộ nhớ tạm"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Đã chép!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Sao chép bảng</span>
              </>
            )}
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors cursor-pointer"
            title="Xuất bảng ra tệp Excel (.xls)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100/90 text-slate-700 text-xs sm:text-sm font-bold uppercase tracking-wider border-b border-slate-200">
              <th className="py-3.5 px-4 w-14 text-center">STT</th>
              <th className="py-3.5 px-4">Đại lượng thống kê</th>
              <th className="py-3.5 px-4 w-36 text-center font-mono">Ký hiệu</th>
              <th className="py-3.5 px-4 text-right">Kết quả</th>
              <th className="py-3.5 px-4 hidden lg:table-cell text-slate-500 font-normal">Ý nghĩa & Công thức</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr
                key={row.stt}
                className={`transition-colors hover:bg-sky-50/50 ${
                  row.highlight ? 'bg-sky-50/25' : ''
                }`}
              >
                <td className="py-3 px-4 text-center text-xs sm:text-sm text-slate-400 font-mono font-medium">
                  {row.stt}
                </td>
                <td className="py-3 px-4 text-sm sm:text-base font-semibold text-slate-800">
                  {row.name}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="font-mono text-base sm:text-lg px-3 py-1 rounded-md bg-slate-100/90 text-sky-900 font-bold border border-slate-200 shadow-2xs inline-block">
                    {row.symbol}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-mono font-extrabold text-lg sm:text-xl text-slate-900 tabular-nums">
                  {row.value}
                </td>
                <td className="py-3 px-4 hidden lg:table-cell text-xs sm:text-sm text-slate-500">
                  {row.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Notice */}
      {stats.isGrouped && (
        <div className="px-5 py-3 bg-amber-50/70 border-t border-amber-100 text-xs text-amber-800 flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Lưu ý đối với dữ liệu ghép nhóm:</strong> Xmin, Xmax và R được ước lượng theo cận khoảng lớp. Các tứ phân vị Q1, Q2, Q3 được tính theo công thức nội suy tuyến tính dựa vào phân bố tần số.
          </span>
        </div>
      )}
    </div>
  );
};
