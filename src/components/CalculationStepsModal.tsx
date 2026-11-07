import React from 'react';
import { X, BookOpen, Calculator, Layers, HelpCircle, Check, ArrowRight } from 'lucide-react';
import {
  DescriptiveStatistics,
  GroupedCalculationSteps,
  UngroupedCalculationSteps,
} from '../types/statistics';
import { formatNum } from '../utils/mathStatistics';

interface CalculationStepsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: DescriptiveStatistics;
  ungroupedSteps?: UngroupedCalculationSteps | null;
  groupedSteps?: GroupedCalculationSteps | null;
  digits?: number;
}

export const CalculationStepsModal: React.FC<CalculationStepsModalProps> = ({
  isOpen,
  onClose,
  stats,
  ungroupedSteps,
  groupedSteps,
  digits = 4,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-100 text-sky-700">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Chi Tiết Các Bước Tính Toán Thống Kê
              </h2>
              <p className="text-xs text-slate-500">
                {stats.isGrouped
                  ? 'Quy trình nội suy phân bố tần số ghép nhóm'
                  : 'Quy trình tính toán mẫu số liệu thô (Phương pháp chia đôi mẫu)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700 leading-relaxed">
          {/* 1. Mẫu số liệu thô (Ungrouped) */}
          {!stats.isGrouped && ungroupedSteps && (
            <>
              {/* Step 1: Sắp xếp số liệu */}
              <section className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-sky-600 text-white text-xs flex items-center justify-center font-mono">1</span>
                  Sắp xếp mẫu số liệu & Cỡ mẫu n
                </h3>
                <p className="text-xs text-slate-600 mb-2">
                  Sắp xếp mẫu số liệu theo thứ tự không giảm để xác định phân vị và khoảng biến thiên:
                </p>
                <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-sm text-slate-800 break-words leading-relaxed">
                  {ungroupedSteps.sortedList.join(', ')}
                </div>
                <div className="mt-2 text-xs sm:text-sm text-slate-600 flex items-center gap-2">
                  <span>Cỡ mẫu: <strong>n = {stats.n}</strong></span>
                  <span>·</span>
                  <span>x_min = <strong>{stats.min}</strong></span>
                  <span>·</span>
                  <span>x_max = <strong>{stats.max}</strong></span>
                  <span>·</span>
                  <span>Khoảng biến thiên: R = {stats.max} - {stats.min} = <strong>{stats.range}</strong></span>
                </div>
              </section>

              {/* Step 2: Trung bình mẫu */}
              <section className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-sky-600 text-white text-xs flex items-center justify-center font-mono">2</span>
                  Tính số trung bình mẫu (x̄)
                </h3>
                <div className="bg-white p-3.5 rounded-lg border border-slate-200 font-mono text-sm space-y-1">
                  <p className="text-sky-700 font-semibold">{ungroupedSteps.meanFormula}</p>
                  <p className="text-slate-800">{ungroupedSteps.meanCalculation}</p>
                </div>
              </section>

              {/* Step 3: Tứ phân vị (Half-Split Method) */}
              <section className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-sky-600 text-white text-xs flex items-center justify-center font-mono">3</span>
                  Xác định các tứ phân vị (Q₁, Q₂, Q₃) theo Phương pháp chia đôi mẫu
                </h3>
                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-teal-900">
                    <p className="font-semibold mb-1">Quy ước bắt buộc (SGK Toán Việt Nam):</p>
                    <p>{ungroupedSteps.medianMethodExplanation}</p>
                  </div>

                  <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2 font-mono text-sm">
                    <p className="text-slate-900 font-bold">
                      • Trung vị Q₂: {ungroupedSteps.medianCalculation}
                    </p>
                    <div className="pl-3 border-l-2 border-slate-200 space-y-1 text-slate-700 text-xs sm:text-sm">
                      <p>Nửa dưới: [{ungroupedSteps.lowerHalf.join(', ')}]</p>
                      <p>Nửa trên: [{ungroupedSteps.upperHalf.join(', ')}]</p>
                    </div>
                    <p className="text-slate-900 font-semibold">• Tứ phân vị thứ nhất Q₁: {ungroupedSteps.q1Calculation}</p>
                    <p className="text-slate-900 font-semibold">• Tứ phân vị thứ ba Q₃: {ungroupedSteps.q3Calculation}</p>
                  </div>
                </div>
              </section>

              {/* Step 4: Phương sai & Độ lệch chuẩn */}
              <section className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-sky-600 text-white text-xs flex items-center justify-center font-mono">4</span>
                  Tính phương sai và độ lệch chuẩn
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono space-y-2">
                    <p className="text-slate-600">
                      Tổng bình phương các độ lệch: Σ(xᵢ - x̄)² = {formatNum(ungroupedSteps.sumSquaredDiffs, digits)}
                    </p>
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-slate-800 font-semibold">1. Phương sai mẫu chưa hiệu chỉnh (mẫu số n):</p>
                      <p className="text-sky-700">{ungroupedSteps.varianceUncorrectedFormula}</p>
                      <p>{ungroupedSteps.varianceUncorrectedCalculation}</p>
                      <p>{ungroupedSteps.stdevUncorrectedCalculation}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-slate-800 font-semibold">2. Phương sai mẫu hiệu chỉnh s² (mẫu số n - 1):</p>
                      <p className="text-sky-700">s² = Σ(xᵢ - x̄)² / (n - 1)</p>
                      <p>{ungroupedSteps.varianceCorrectedCalculation}</p>
                      <p>s = √s²: {ungroupedSteps.stdevCorrectedCalculation}</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Step 5: Xác định ngoại lệ */}
              <section className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-sky-600 text-white text-xs flex items-center justify-center font-mono">5</span>
                  Khoảng tứ phân vị & Ngưỡng nhận diện ngoại lệ
                </h3>
                <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-xs space-y-1.5">
                  <p className="text-slate-800">{ungroupedSteps.iqrCalculation}</p>
                  <p className="text-slate-800">{ungroupedSteps.lfCalculation}</p>
                  <p className="text-slate-800">{ungroupedSteps.ufCalculation}</p>
                  <p className="text-slate-600 pt-1">
                    Miền giá trị thông thường: [{formatNum(stats.lowerFence, digits)}; {formatNum(stats.upperFence, digits)}]
                  </p>
                </div>
              </section>
            </>
          )}

          {/* 2. Mẫu số liệu ghép nhóm (Grouped) */}
          {stats.isGrouped && groupedSteps && (
            <>
              {/* Bảng tính trung gian */}
              <section className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-sky-600 text-white text-xs flex items-center justify-center font-mono">1</span>
                  Bảng tính toán trung gian các đại lượng nhóm
                </h3>
                <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                        <th className="py-2 px-3">Khoảng lớp</th>
                        <th className="py-2 px-3 text-center">xᵢ = (a+b)/2</th>
                        <th className="py-2 px-3 text-center">nᵢ</th>
                        <th className="py-2 px-3 text-center">cfᵢ (tích lũy)</th>
                        <th className="py-2 px-3 text-right">nᵢxᵢ</th>
                        <th className="py-2 px-3 text-right">xᵢ - x̄</th>
                        <th className="py-2 px-3 text-right">nᵢ(xᵢ - x̄)²</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {groupedSteps.rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-1.5 px-3 font-sans font-medium text-slate-800">
                            {row.intervalText}
                          </td>
                          <td className="py-1.5 px-3 text-center">{formatNum(row.midpoint, 2)}</td>
                          <td className="py-1.5 px-3 text-center font-bold text-slate-900">{row.frequency}</td>
                          <td className="py-1.5 px-3 text-center text-sky-700">{row.cumulativeFrequency}</td>
                          <td className="py-1.5 px-3 text-right">{formatNum(row.fx, digits)}</td>
                          <td className="py-1.5 px-3 text-right text-slate-500">{formatNum(row.deviation, digits)}</td>
                          <td className="py-1.5 px-3 text-right text-slate-900 font-semibold">
                            {formatNum(row.fSquaredDeviation, digits)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-sky-50 font-bold text-slate-900 border-t border-sky-200">
                        <td className="py-2 px-3 font-sans">Tổng cộng (Σ)</td>
                        <td className="py-2 px-3 text-center">—</td>
                        <td className="py-2 px-3 text-center text-sky-800 font-mono">n = {groupedSteps.totalN}</td>
                        <td className="py-2 px-3 text-center">—</td>
                        <td className="py-2 px-3 text-right font-mono">{formatNum(groupedSteps.totalFx, digits)}</td>
                        <td className="py-2 px-3 text-right">—</td>
                        <td className="py-2 px-3 text-right font-mono text-sky-800">
                          {formatNum(groupedSteps.totalFSquaredDeviation, digits)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </section>

              {/* Trung bình, Phương sai, Độ lệch chuẩn */}
              <section className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-sky-600 text-white text-xs flex items-center justify-center font-mono">2</span>
                  Tính Trung bình và Phương sai mẫu ghép nhóm
                </h3>
                <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-xs space-y-2">
                  <p className="text-slate-800">• {groupedSteps.meanCalculation}</p>
                  <p className="text-slate-800">• {groupedSteps.varianceUncorrectedCalculation}</p>
                  <p className="text-slate-800">• {groupedSteps.varianceCorrectedCalculation}</p>
                  <p className="text-slate-800">• {groupedSteps.stdevUncorrectedCalculation}</p>
                  <p className="text-slate-800">• {groupedSteps.stdevCorrectedCalculation}</p>
                </div>
              </section>

              {/* Công thức nội suy Tứ phân vị */}
              <section className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-sky-600 text-white text-xs flex items-center justify-center font-mono">3</span>
                  Tính Tứ phân vị (Q1, Q2, Q3) bằng công thức nội suy tuyến tính
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg text-sky-900">
                    <p className="font-semibold mb-1">Công thức tổng quát:</p>
                    <p className="font-mono">Q = L + [(k - F) / f] × h</p>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Trong đó: L là cận dưới của nhóm chứa tứ phân vị; k là vị trí (n/4, n/2 hoặc 3n/4); F là tần số tích lũy của nhóm trước; f là tần số nhóm đó; h là độ rộng nhóm.
                    </p>
                  </div>

                  {/* Q1, Q2, Q3 details */}
                  {[
                    { label: 'Tứ phân vị thứ nhất Q1', d: groupedSteps.q1Detail },
                    { label: 'Trung vị Q2 (Tứ phân vị thứ hai)', d: groupedSteps.q2Detail },
                    { label: 'Tứ phân vị thứ ba Q3', d: groupedSteps.q3Detail },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 space-y-1 font-mono">
                      <p className="font-sans font-bold text-slate-900">{item.label}:</p>
                      <p className="text-slate-600">
                        Vị trí cần tìm: k = {formatNum(item.d.targetPosition, 2)} → Nhóm chứa: {item.d.intervalText} (Nhóm {item.d.groupIndex})
                      </p>
                      <p className="text-slate-600">
                        Thông số: L = {item.d.L}, F = {item.d.F}, f = {item.d.f}, h = {item.d.h}
                      </p>
                      <p className="text-sky-700 font-semibold">{item.d.formulaString}</p>
                      <p className="text-slate-900 font-bold">{item.d.substitutionString}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Ngưỡng ngoại lệ ghép nhóm */}
              <section className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-sky-600 text-white text-xs flex items-center justify-center font-mono">4</span>
                  Khoảng tứ phân vị & Ngưỡng ngoại lệ ước lượng
                </h3>
                <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-xs space-y-1.5">
                  <p>{groupedSteps.iqrCalculation}</p>
                  <p>{groupedSteps.lfCalculation}</p>
                  <p>{groupedSteps.ufCalculation}</p>
                </div>
              </section>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Đóng bảng giải thích
          </button>
        </div>
      </div>
    </div>
  );
};
