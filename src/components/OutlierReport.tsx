import React from 'react';
import { AlertTriangle, CheckCircle2, ArrowDownCircle, ArrowUpCircle, Info } from 'lucide-react';
import { DescriptiveStatistics } from '../types/statistics';
import { formatNum } from '../utils/mathStatistics';

interface OutlierReportProps {
  stats: DescriptiveStatistics;
  digits?: number;
}

export const OutlierReport: React.FC<OutlierReportProps> = ({ stats, digits = 4 }) => {
  const { outliers, lowerFence, upperFence, isGrouped } = stats;
  const { hasOutliers, lowerOutliers, upperOutliers } = outliers;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 transition-all">
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            Kết Luận Về Giá Trị Ngoại Lệ
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Xác định các phần tử dị biệt dựa trên quy tắc khoảng tứ phân vị [LF; UF]
          </p>
        </div>

        {/* Status Pill-free badge */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${
            hasOutliers
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}
        >
          {hasOutliers ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Có giá trị ngoại lệ</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Không có ngoại lệ</span>
            </>
          )}
        </div>
      </div>

      {/* Threshold Formula Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200/80">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
            <span className="font-semibold text-slate-700">Ngưỡng dưới (Lower Fence - LF)</span>
            <span className="font-mono text-slate-500">Q1 - 1.5 × IQR</span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 tabular-nums">
            {formatNum(lowerFence, digits)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Mọi giá trị x &lt; {formatNum(lowerFence, digits)} là ngoại lệ phía dưới
          </p>
        </div>

        <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200/80">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
            <span className="font-semibold text-slate-700">Ngưỡng trên (Upper Fence - UF)</span>
            <span className="font-mono text-slate-500">Q3 + 1.5 × IQR</span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 tabular-nums">
            {formatNum(upperFence, digits)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Mọi giá trị x &gt; {formatNum(upperFence, digits)} là ngoại lệ phía trên
          </p>
        </div>
      </div>

      {/* Detailed Outlier Listing */}
      {!isGrouped ? (
        <div className="space-y-3">
          {hasOutliers ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Lower Outliers */}
              <div className="border border-rose-100 bg-rose-50/40 rounded-lg p-3.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 mb-1.5">
                  <ArrowDownCircle className="w-4 h-4 text-rose-600" />
                  <span>Ngoại lệ phía dưới (x &lt; LF)</span>
                </div>
                {lowerOutliers.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {lowerOutliers.map((val, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-white border border-rose-200 text-rose-700 font-mono font-bold text-xs rounded shadow-2xs"
                      >
                        {formatNum(val, digits)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic mt-1">Không có giá trị nào &lt; LF</p>
                )}
              </div>

              {/* Upper Outliers */}
              <div className="border border-rose-100 bg-rose-50/40 rounded-lg p-3.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 mb-1.5">
                  <ArrowUpCircle className="w-4 h-4 text-rose-600" />
                  <span>Ngoại lệ phía trên (x &gt; UF)</span>
                </div>
                {upperOutliers.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {upperOutliers.map((val, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-white border border-rose-200 text-rose-700 font-mono font-bold text-xs rounded shadow-2xs"
                      >
                        {formatNum(val, digits)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic mt-1">Không có giá trị nào &gt; UF</p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-lg text-xs text-emerald-800">
              <p className="font-semibold mb-0.5">Không phát hiện giá trị ngoại lệ</p>
              <p className="text-slate-600 text-[11px]">
                Toàn bộ {stats.n} quan sát đều nằm an toàn trong khoảng hợp lệ [{formatNum(lowerFence, digits)}; {formatNum(upperFence, digits)}]. Mẫu số liệu có tính đồng nhất tốt.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Grouped Data Outlier Explanation */
        <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-950">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Đánh giá ngoại lệ đối với số liệu ghép nhóm</span>
          </div>
          <p className="text-[12px] leading-relaxed">
            Khoảng chấp nhận lý thuyết: [{formatNum(lowerFence, digits)}; {formatNum(upperFence, digits)}].
            {hasOutliers ? (
              <span className="font-semibold text-rose-800 ml-1">
                Các khoảng lớp của mẫu mở rộng từ {formatNum(stats.min, digits)} đến {formatNum(stats.max, digits)}, có phần vượt ngoài ngưỡng lý thuyết [LF; UF].
              </span>
            ) : (
              <span className="font-semibold text-emerald-800 ml-1">
                Toàn bộ các khoảng lớp nằm trong giới hạn lý thuyết [LF; UF].
              </span>
            )}
          </p>
          <div className="p-2.5 bg-white/70 border border-amber-200 rounded text-[11px] text-slate-700 leading-normal">
            <strong>Cảnh báo quan trọng:</strong> Vì dữ liệu chỉ được cung cấp dưới dạng các khoảng lớp ghép nhóm [aᵢ; bᵢ) kèm tần số, không thể quan sát chính xác từng cá thể riêng biệt. Do đó, kết luận ngoại lệ ở đây chỉ mang tính <em>ước lượng phân bố nội suy</em>. Để khẳng định chính xác từng quan sát ngoại lệ, bắt buộc cần có bộ dữ liệu thô ban đầu.
          </div>
        </div>
      )}
    </div>
  );
};
