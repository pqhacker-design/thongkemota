import React from 'react';
import { Users, TrendingUp, SplitSquareVertical, Activity, Layers, AlertCircle, CheckCircle } from 'lucide-react';
import { DescriptiveStatistics } from '../types/statistics';
import { formatNum } from '../utils/mathStatistics';

interface StatisticsCardsProps {
  stats: DescriptiveStatistics;
  digits?: number;
}

export const StatisticsCards: React.FC<StatisticsCardsProps> = ({ stats, digits = 4 }) => {
  const cards = [
    {
      title: 'Cỡ mẫu (n)',
      value: stats.n.toString(),
      subtext: stats.isGrouped ? 'Tổng tần số Σnᵢ' : 'Số phần tử quan sát',
      icon: Users,
      color: 'text-sky-600',
      bg: 'bg-sky-50',
      border: 'border-sky-100',
    },
    {
      title: 'Trung bình (x̄)',
      value: formatNum(stats.mean, digits),
      subtext: 'Đại diện xu thế trung tâm',
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      title: 'Trung vị (Q₂)',
      value: formatNum(stats.q2, digits),
      subtext: 'Phân vị 50% ở giữa mẫu',
      icon: SplitSquareVertical,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
      border: 'border-teal-100',
    },
    {
      title: 'Độ lệch chuẩn (s / ŝ)',
      value: stats.n >= 2 ? formatNum(stats.stdevCorrected, digits) : formatNum(stats.stdevUncorrected, digits),
      subtext: stats.n >= 2 ? 'Đã hiệu chỉnh s = √ŝ²' : 'Chưa hiệu chỉnh ŝ',
      icon: Activity,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
    },
    {
      title: 'Khoảng tứ phân vị (ΔQ)',
      value: formatNum(stats.iqr, digits),
      subtext: `ΔQ = Q₃ - Q₁ (${formatNum(stats.q3, 2)} - ${formatNum(stats.q1, 2)})`,
      icon: Layers,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
    },
    {
      title: 'Giá trị ngoại lệ',
      value: stats.outliers.hasOutliers
        ? `${stats.outliers.allOutliers.length} giá trị`
        : 'Không có',
      subtext: stats.outliers.hasOutliers ? 'Nằm ngoài [LF; UF]' : 'Mẫu đồng nhất',
      icon: stats.outliers.hasOutliers ? AlertCircle : CheckCircle,
      color: stats.outliers.hasOutliers ? 'text-rose-600' : 'text-emerald-600',
      bg: stats.outliers.hasOutliers ? 'bg-rose-50' : 'bg-emerald-50',
      border: stats.outliers.hasOutliers ? 'border-rose-100' : 'border-emerald-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className={`bg-white rounded-xl border ${c.border} p-3.5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-xs sm:text-sm font-bold text-slate-600 uppercase tracking-wider truncate">
                {c.title}
              </span>
              <div className={`p-1.5 rounded-lg ${c.bg} ${c.color} shrink-0`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 tabular-nums truncate">
                {c.value}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-1 font-medium truncate" title={c.subtext}>
                {c.subtext}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
