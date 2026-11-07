import React from 'react';
import { DescriptiveStatistics, GroupInterval } from '../types/statistics';
import { formatNum } from '../utils/mathStatistics';

interface PrintableReportProps {
  stats: DescriptiveStatistics;
  dataType: 'ungrouped' | 'grouped';
  rawNumbers: number[];
  groups: GroupInterval[];
  digits?: number;
}

export const PrintableReport: React.FC<PrintableReportProps> = ({
  stats,
  dataType,
  rawNumbers,
  groups,
  digits = 4,
}) => {
  const timestamp = new Date().toLocaleString('vi-VN');

  return (
    <div className="hidden print-only p-8 text-black bg-white max-w-4xl mx-auto">
      {/* Title & Metadata */}
      <div className="text-center pb-6 border-b-2 border-slate-900 mb-6">
        <h1 className="text-2xl font-bold uppercase tracking-wider text-slate-900">
          BÁO CÁO KẾT QUẢ THỐNG KÊ MÔ TẢ
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Hệ thống: STATISTICS PRO – Công cụ tính toán thống kê mô tả chuẩn giáo dục
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          Loại dữ liệu: {dataType === 'ungrouped' ? 'Mẫu số liệu thô (Không ghép nhóm)' : 'Bảng phân bố tần số ghép nhóm'} · Thời gian lập: {timestamp}
        </p>
      </div>

      {/* Dữ liệu ban đầu */}
      <div className="mb-6 print-break-inside-avoid">
        <h2 className="text-sm font-bold uppercase text-slate-900 mb-2 border-b border-slate-300 pb-1">
          1. Dữ liệu ban đầu
        </h2>
        {dataType === 'ungrouped' ? (
          <div>
            <p className="text-xs text-slate-700 mb-1">
              Cỡ mẫu n = {rawNumbers.length} quan sát:
            </p>
            <div className="p-3 bg-slate-50 border border-slate-200 text-xs font-mono break-words">
              {rawNumbers.join(', ')}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse border border-slate-400">
              <thead>
                <tr className="bg-slate-100 font-bold">
                  <th className="border border-slate-300 p-1.5 text-center">STT</th>
                  <th className="border border-slate-300 p-1.5">Khoảng lớp [aᵢ; bᵢ)</th>
                  <th className="border border-slate-300 p-1.5 text-center">Đại diện (xᵢ)</th>
                  <th className="border border-slate-300 p-1.5 text-center">Tần số (nᵢ)</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g, idx) => (
                  <tr key={idx}>
                    <td className="border border-slate-300 p-1.5 text-center">{idx + 1}</td>
                    <td className="border border-slate-300 p-1.5 font-medium">[{g.lower}; {g.upper})</td>
                    <td className="border border-slate-300 p-1.5 text-center">{(g.lower + g.upper) / 2}</td>
                    <td className="border border-slate-300 p-1.5 text-center font-bold">{g.frequency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bảng kết quả 15 đại lượng */}
      <div className="mb-6 print-break-inside-avoid">
        <h2 className="text-sm font-bold uppercase text-slate-900 mb-2 border-b border-slate-300 pb-1">
          2. Bảng các đại lượng thống kê đặc trưng
        </h2>
        <table className="w-full text-xs border-collapse border border-slate-400">
          <thead>
            <tr className="bg-slate-100 font-bold text-slate-900">
              <th className="border border-slate-300 p-1.5 text-center w-10">STT</th>
              <th className="border border-slate-300 p-1.5">Đại lượng thống kê</th>
              <th className="border border-slate-300 p-1.5 text-center w-20">Ký hiệu</th>
              <th className="border border-slate-300 p-1.5 text-right w-28">Kết quả</th>
              <th className="border border-slate-300 p-1.5">Ghi chú & Công thức</th>
            </tr>
          </thead>
          <tbody>
            {[
              { stt: 1, name: 'Cỡ mẫu', sym: 'n', val: stats.n.toString(), note: 'Tổng số quan sát (n = Σnᵢ)' },
              { stt: 2, name: 'Trung bình', sym: 'x̄', val: formatNum(stats.mean, digits), note: 'x̄ = Σxᵢ / n' },
              { stt: 3, name: 'Phương sai chưa hiệu chỉnh', sym: 's₀²', val: formatNum(stats.varianceUncorrected, digits), note: 's₀² = Σ(xᵢ - x̄)² / n' },
              { stt: 4, name: 'Phương sai mẫu hiệu chỉnh', sym: 'ŝ² (s²)', val: formatNum(stats.varianceCorrected, digits), note: 'ŝ² = Σ(xᵢ - x̄)² / (n - 1)' },
              { stt: 5, name: 'Độ lệch chuẩn chưa hiệu chỉnh', sym: 'ŝ', val: formatNum(stats.stdevUncorrected, digits), note: 'Độ lệch chuẩn chưa hiệu chỉnh' },
              { stt: 6, name: 'Độ lệch chuẩn', sym: 's', val: formatNum(stats.stdevCorrected, digits), note: 's = √ŝ²' },
              { stt: 7, name: 'Giá trị nhỏ nhất', sym: 'x_min', val: formatNum(stats.min, digits), note: stats.isGrouped ? 'Cận dưới nhóm đầu có tần số dương' : 'Nhỏ nhất trong mẫu' },
              { stt: 8, name: 'Giá trị lớn nhất', sym: 'x_max', val: formatNum(stats.max, digits), note: stats.isGrouped ? 'Cận trên nhóm cuối có tần số dương' : 'Lớn nhất trong mẫu' },
              { stt: 9, name: 'Khoảng biến thiên', sym: 'R', val: formatNum(stats.range, digits), note: 'R = x_max - x_min' },
              { stt: 10, name: 'Tứ phân vị thứ nhất', sym: 'Q₁', val: formatNum(stats.q1, digits), note: 'Phân vị 25%' },
              { stt: 11, name: 'Trung vị (Tứ phân vị thứ hai)', sym: 'Q₂', val: formatNum(stats.q2, digits), note: 'Phân vị 50%' },
              { stt: 12, name: 'Tứ phân vị thứ ba', sym: 'Q₃', val: formatNum(stats.q3, digits), note: 'Phân vị 75%' },
              { stt: 13, name: 'Khoảng tứ phân vị', sym: 'ΔQ (IQR)', val: formatNum(stats.iqr, digits), note: 'ΔQ = Q₃ - Q₁' },
              { stt: 14, name: 'Ngưỡng dưới', sym: 'LF', val: formatNum(stats.lowerFence, digits), note: 'LF = Q₁ - 1.5 × ΔQ' },
              { stt: 15, name: 'Ngưỡng trên', sym: 'UF', val: formatNum(stats.upperFence, digits), note: 'UF = Q₃ + 1.5 × ΔQ' },
            ].map((r) => (
              <tr key={r.stt}>
                <td className="border border-slate-300 p-1.5 text-center font-mono">{r.stt}</td>
                <td className="border border-slate-300 p-1.5 font-medium">{r.name}</td>
                <td className="border border-slate-300 p-1.5 text-center font-mono">{r.sym}</td>
                <td className="border border-slate-300 p-1.5 text-right font-mono font-bold">{r.val}</td>
                <td className="border border-slate-300 p-1.5 text-slate-600">{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Kết luận ngoại lệ */}
      <div className="mb-6 print-break-inside-avoid p-3 border border-slate-300 bg-slate-50">
        <h2 className="text-sm font-bold uppercase text-slate-900 mb-1">
          3. Kết luận về giá trị ngoại lệ
        </h2>
        <p className="text-xs text-slate-800">
          • Giới hạn chấp nhận: [LF = {formatNum(stats.lowerFence, digits)}; UF = {formatNum(stats.upperFence, digits)}]
        </p>
        <p className="text-xs text-slate-800 mt-1">
          • Trạng thái: {stats.outliers.hasOutliers ? 'CÓ GIÁ TRỊ NGOẠI LỆ' : 'KHÔNG CÓ GIÁ TRỊ NGOẠI LỆ'}
        </p>
        {stats.outliers.lowerOutliers.length > 0 && (
          <p className="text-xs text-slate-800">
            • Ngoại lệ phía dưới: {stats.outliers.lowerOutliers.join(', ')}
          </p>
        )}
        {stats.outliers.upperOutliers.length > 0 && (
          <p className="text-xs text-slate-800">
            • Ngoại lệ phía trên: {stats.outliers.upperOutliers.join(', ')}
          </p>
        )}
        {stats.isGrouped && (
          <p className="text-[11px] text-slate-600 italic mt-1">
            * Đối với dữ liệu ghép nhóm, kết luận ngoại lệ chỉ là ước lượng lý thuyết theo khoảng lớp nội suy.
          </p>
        )}
      </div>

      {/* Chữ ký xác nhận */}
      <div className="pt-8 flex justify-between text-xs text-slate-700 print-break-inside-avoid">
        <div className="text-center">
          <p className="font-bold">Người lập báo cáo</p>
          <p className="text-slate-400 mt-12">(Ký và ghi rõ họ tên)</p>
        </div>
        <div className="text-center">
          <p className="font-bold">Giáo viên / Giám sát chuyên môn</p>
          <p className="text-slate-400 mt-12">(Ký và ghi rõ họ tên)</p>
        </div>
      </div>
    </div>
  );
};
