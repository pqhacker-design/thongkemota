import React from 'react';
import {
  X,
  BookOpen,
  AlertTriangle,
  Info,
  CheckCircle2,
  TrendingUp,
  Percent,
  Sliders,
  Scale,
  Sparkles,
} from 'lucide-react';
import { SimpleRegressionResult, MultipleRegressionResult } from '../../types/regression';
import { formatNum } from '../../utils/mathStatistics';

interface RegressionExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'simple' | 'multiple';
  simpleResult?: SimpleRegressionResult | null;
  multipleResult?: MultipleRegressionResult | null;
  digits?: number;
}

export const RegressionExplanationModal: React.FC<RegressionExplanationModalProps> = ({
  isOpen,
  onClose,
  type,
  simpleResult,
  multipleResult,
  digits = 4,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-linear-to-r from-blue-700 via-blue-800 to-indigo-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {type === 'simple'
                  ? 'Ý Nghĩa Toán Học & Báo Cáo Giải Thích: Hồi Quy Tuyến Tính Đơn'
                  : 'Ý Nghĩa Toán Học & Báo Cáo Giải Thích: Hồi Quy Tuyến Tính Bội'}
              </h2>
              <p className="text-xs text-blue-200 mt-0.5">
                Giải thích chi tiết theo lý thuyết toán học và thống kê ứng dụng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-sm leading-relaxed">
          {/* Section 1: Phương trình & Tóm tắt mô hình */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-base mb-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              1. Phương Trình Hồi Quy Ước Lượng (Mô Hình OLS)
            </h3>
            <div className="bg-white border border-blue-200 p-3 rounded-lg font-mono text-base font-bold text-blue-900 shadow-2xs">
              {type === 'simple' && simpleResult && (
                <div>{simpleResult.equationString}</div>
              )}
              {type === 'multiple' && multipleResult && (
                <div>{multipleResult.equationString}</div>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              * Phương trình được ước lượng bằng phương pháp Bình phương tối thiểu (Ordinary Least Squares - OLS), tối thiểu hóa tổng bình phương phần dư (SSE = ∑eᵢ² → min).
            </p>
          </div>

          {/* Section 2: Ý nghĩa của các hệ số hồi quy */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-base">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              2. Ý Nghĩa Toán Học Của Từng Hệ Số
            </h3>

            {type === 'simple' && simpleResult && (
              <div className="space-y-3">
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-3">
                  <div className="font-bold text-emerald-900 text-sm sm:text-base">
                    Hệ số chặn a = {formatNum(simpleResult.b0, digits)}
                  </div>
                  <p className="text-xs sm:text-sm text-emerald-800 mt-1">
                    {simpleResult.interpretation.b0Meaning}
                  </p>
                  {simpleResult.interpretation.b0Warning && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-700 mt-1 font-medium bg-amber-50 p-1.5 rounded">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      {simpleResult.interpretation.b0Warning}
                    </div>
                  )}
                </div>

                <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-3">
                  <div className="font-bold text-blue-900 text-sm sm:text-base">
                    Hệ số góc b = {formatNum(simpleResult.b1, digits)}
                  </div>
                  <p className="text-xs sm:text-sm text-blue-800 mt-1">
                    {simpleResult.interpretation.b1Meaning}
                  </p>
                  <p className="text-xs text-slate-500 italic mt-1">
                    * Lưu ý quan trọng: Hệ số góc b chỉ biểu thị tốc độ thay đổi <strong>trung bình theo mô hình tuyến tính</strong>, không khẳng định mọi cá thể quan sát đều thay đổi đúng bằng b đơn vị.
                  </p>
                </div>
              </div>
            )}

            {type === 'multiple' && multipleResult && (
              <div className="space-y-3">
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-3">
                  <div className="font-bold text-emerald-900">
                    Hệ số chặn b₀ = {formatNum(multipleResult.coefficients[0].value, digits)}
                  </div>
                  <p className="text-xs text-emerald-800 mt-1">
                    {multipleResult.interpretation.b0Meaning}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {multipleResult.interpretation.coefficientsMeaning.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50 border border-slate-200 rounded-lg p-3"
                    >
                      <div className="font-bold text-slate-900">
                        Hệ số riêng phần {item.name}:
                      </div>
                      <p className="text-xs text-slate-700 mt-1">{item.meaning}</p>
                      <div className="text-[11px] text-teal-700 font-medium mt-1">
                        * Áp dụng nguyên lý &ldquo;Ceteris Paribus&rdquo; (các biến còn lại giữ nguyên).
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Độ mạnh của tương quan và độ thích hợp mô hình */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-base">
              <Percent className="w-4 h-4 text-indigo-600" />
              3. Tương Quan & Mức Độ Thích Hợp Của Mô Hình (R & R²)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-indigo-50/60 border border-indigo-200 rounded-lg p-3">
                <div className="font-bold text-indigo-900 text-sm">
                  {type === 'simple'
                    ? `Hệ số tương quan Pearson r = ${formatNum(simpleResult?.pearsonR, digits)}`
                    : `Hệ số tương quan bội R = ${formatNum(multipleResult?.multipleR, digits)}`}
                </div>
                <p className="text-xs text-indigo-800 mt-1">
                  {type === 'simple' && simpleResult?.interpretation.rMeaning}
                  {type === 'multiple' && multipleResult?.interpretation.rMeaning}
                </p>
              </div>

              <div className="bg-teal-50/60 border border-teal-200 rounded-lg p-3">
                <div className="font-bold text-teal-900 text-sm">
                  {type === 'simple'
                    ? `Hệ số xác định R² = ${formatNum(simpleResult?.rSquared, digits)} (${(
                        (simpleResult?.rSquared || 0) * 100
                      ).toFixed(1)}%)`
                    : `Hệ số xác định R² = ${formatNum(multipleResult?.rSquared, digits)} (${(
                        (multipleResult?.rSquared || 0) * 100
                      ).toFixed(1)}%)`}
                </div>
                <p className="text-xs text-teal-800 mt-1">
                  {type === 'simple' && simpleResult?.interpretation.rSquaredMeaning}
                  {type === 'multiple' && multipleResult?.interpretation.rSquaredMeaning}
                </p>
                {type === 'multiple' && multipleResult?.adjRSquared !== null && (
                  <p className="text-xs text-teal-900 font-medium mt-2 pt-2 border-t border-teal-200">
                    R² hiệu chỉnh (R²_adj) = {formatNum(multipleResult?.adjRSquared, digits)}:
                    Phạt việc đưa thêm các biến giải thích không mang lại giá trị thực, cho phép so sánh khách quan các mô hình khác nhau.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Sai số chuẩn của mô hình */}
          <div className="border border-slate-200 rounded-xl p-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-base mb-2">
              <Scale className="w-4 h-4 text-blue-600" />
              4. Độ Phân Tán Sai Số (SER & RMSE)
            </h3>
            <div className="text-xs text-slate-600 space-y-1.5">
              <p>
                <strong>Sai số chuẩn hồi quy (SER - Standard Error of Regression):</strong>{' '}
                {type === 'simple'
                  ? formatNum(simpleResult?.ser, digits)
                  : formatNum(multipleResult?.ser, digits)}
                . Cho biết mức độ phân tán trung bình của các quan sát thực tế Y xung quanh đường hồi quy mẫu. SER càng nhỏ, các giá trị dự báo càng hội tụ gần giá trị thực tế.
              </p>
              <p>
                <strong>RMSE (Root Mean Square Error):</strong>{' '}
                {type === 'simple'
                  ? formatNum(simpleResult?.rmse, digits)
                  : formatNum(multipleResult?.rmse, digits)}
                . Căn bậc hai của sai số bình phương trung bình mẫu.
              </p>
            </div>
          </div>

          {/* Section 5: Cảnh báo quan trọng trong thực hành thống kê */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-amber-900 flex items-center gap-2 text-base">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              5. Ba Cảnh Báo Sống Còn Khi Sử Dụng Mô Hình Hồi Quy
            </h3>

            <div className="space-y-2.5 text-xs text-amber-950">
              <div className="flex items-start gap-2 bg-white/70 p-2.5 rounded-lg border border-amber-200/80">
                <span className="font-bold text-red-600 shrink-0">1.</span>
                <div>
                  <strong>Tương quan không đồng nghĩa với quan hệ nhân quả (Correlation ≠ Causation):</strong>{' '}
                  Hệ số tương quan r cao chỉ chứng minh hai biến cùng biến thiên tuyến tính trong mẫu thu thập. Nó không chứng minh biến X là nguyên nhân trực tiếp làm thay đổi biến Y (có thể có biến ẩn thứ ba tác động, hoặc là tương quan ngẫu nhiên).
                </div>
              </div>

              <div className="flex items-start gap-2 bg-white/70 p-2.5 rounded-lg border border-amber-200/80">
                <span className="font-bold text-red-600 shrink-0">2.</span>
                <div>
                  <strong>Rủi ro ngoại suy (Extrapolation Hazard):</strong>{' '}
                  Phương trình hồi quy chỉ có độ tin cậy trong phạm vi tập dữ liệu đã quan sát [X_min, X_max]. Việc dự báo cho các giá trị nằm ngoài miền quan sát có thể dẫn đến sai lệch nghiêm trọng do hành vi dữ liệu bên ngoài có thể không còn tuyến tính.
                </div>
              </div>

              <div className="flex items-start gap-2 bg-white/70 p-2.5 rounded-lg border border-amber-200/80">
                <span className="font-bold text-red-600 shrink-0">3.</span>
                <div>
                  <strong>Điểm dị biệt & Giả định OLS:</strong>{' '}
                  Ước lượng OLS rất nhạy cảm với các điểm ngoại lai (Outliers) và các điểm có đòn bẩy cao (Leverage points). Ngoài ra mô hình giả định mối liên hệ là dạng đường thẳng và phương sai phần dư không đổi (đồng phương sai).
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-colors shadow-2xs"
          >
            Đã hiểu & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
