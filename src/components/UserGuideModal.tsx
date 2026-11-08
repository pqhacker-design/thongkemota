import React from 'react';
import { X, BookOpen, Check, Layers, AlertTriangle, ArrowRight, BarChart2 } from 'lucide-react';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-100 text-sky-700">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Hướng Dẫn Sử Dụng & Quy Ước Thống Kê
              </h2>
              <p className="text-xs text-slate-500">
                Tài liệu tham khảo phương pháp tính toán chuẩn giáo dục cho giáo viên và học sinh
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700 leading-relaxed">
          {/* Section 1: Nhập dữ liệu */}
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 text-xs flex items-center justify-center font-bold">1</span>
              Cách nhập dữ liệu
            </h3>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
              <li>
                <strong>Dữ liệu thường (không ghép nhóm):</strong> Hỗ trợ 2 chế độ:
                <ul className="list-circle pl-4 mt-1 space-y-1 text-slate-500">
                  <li><strong>Dạng Bảng Giá trị & Tần số (n):</strong> Nhập trực tiếp giá trị <code>xᵢ</code> và tần số xuất hiện <code>nᵢ</code> (nếu để trống, tần số mặc định là <strong>1</strong>). Tiện lợi khi một số liệu lặp lại nhiều lần, có nút thêm dòng, gộp giá trị trùng và dán từ Excel.</li>
                  <li><strong>Dạng Văn bản nhanh:</strong> Nhập số cách nhau bởi dấu phẩy, dấu cách; hỗ trợ cú pháp tần số <code>8: 5</code> hoặc <code>8(5)</code> (nghĩa là giá trị 8 xuất hiện 5 lần). Số đơn lẻ mặc định có tần số là 1.</li>
                </ul>
              </li>
              <li>
                <strong>Dữ liệu ghép nhóm:</strong> Nhập cận dưới, cận trên và tần số vào từng hàng. Ứng dụng tự động kiểm tra tính không chồng lấn của các khoảng và tự động tính giá trị đại diện <code>xᵢ = (aᵢ + bᵢ)/2</code>.
              </li>
            </ul>
          </div>

          {/* Section 2: Phương sai & Độ lệch chuẩn */}
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 text-xs flex items-center justify-center font-bold">2</span>
              Ký hiệu Phương sai và Độ lệch chuẩn theo bài học
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="font-bold text-slate-900 mb-1">Phương sai chưa hiệu chỉnh ŝ²</p>
                <p className="font-mono text-sky-700 mb-1">ŝ² = Σ(xᵢ - x̄)² / n</p>
                <p className="text-slate-500">
                  Độ lệch chuẩn chưa hiệu chỉnh ký hiệu là <strong>ŝ</strong>. Chia trực tiếp cho cỡ mẫu <code>n</code>.
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="font-bold text-slate-900 mb-1">Phương sai mẫu hiệu chỉnh: s²</p>
                <p className="font-mono text-sky-700 mb-1">s² = Σ(xᵢ - x̄)² / (n - 1)</p>
                <p className="text-slate-500">
                  Độ lệch chuẩn hiệu chỉnh ký hiệu là <strong>s</strong> (s = √s²). Chia cho bậc tự do <code>n - 1</code> để triệt tiêu độ chệch. Chỉ tính khi <code>n ≥ 2</code>.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Tứ phân vị */}
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 text-xs flex items-center justify-center font-bold">3</span>
              Quy ước tính Tứ phân vị (Phương pháp chia đôi mẫu)
            </h3>
            <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-lg text-xs space-y-1.5 text-teal-950">
              <p>
                Ứng dụng áp dụng chuẩn <strong>Phương pháp chia đôi mẫu (Tukey's Hinges / SGK Toán THPT Việt Nam)</strong>:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-teal-900">
                <li>Sắp xếp mẫu số liệu không giảm: x(1) ≤ x(2) ≤ ... ≤ x(n).</li>
                <li><strong>x_min:</strong> Giá trị nhỏ nhất; <strong>x_max:</strong> Giá trị lớn nhất.</li>
                <li><strong>Q₂:</strong> Là trung vị của toàn bộ mẫu.</li>
                <li>Nếu <strong>n lẻ</strong>: Loại bỏ giá trị trung vị Q₂ khi tách mẫu. Nửa dưới gồm các phần tử đứng trước Q₂; nửa trên gồm các phần tử đứng sau Q₂.</li>
                <li>Nếu <strong>n chẵn</strong>: Chia đều mẫu thành nửa dưới (n/2 phần tử đầu) và nửa trên (n/2 phần tử cuối).</li>
                <li><strong>Q₁:</strong> Là trung vị của nửa dưới.</li>
                <li><strong>Q₃:</strong> Là trung vị của nửa trên.</li>
                <li><strong>Khoảng tứ phân vị:</strong> Ký hiệu là <strong>ΔQ (IQR) = Q₃ - Q₁</strong>.</li>
              </ul>
            </div>
          </div>

          {/* Section 4: Nhận diện ngoại lệ */}
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 text-xs flex items-center justify-center font-bold">4</span>
              Quy tắc xác định giá trị ngoại lệ (Outliers)
            </h3>
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-950 space-y-1">
              <p>Khoảng tứ phân vị: <code>ΔQ = Q₃ - Q₁</code>.</p>
              <p>Ngưỡng dưới: <code>LF = Q₁ - 1.5 × ΔQ</code>. Mọi giá trị <code>x &lt; LF</code> là ngoại lệ phía dưới.</p>
              <p>Ngưỡng trên: <code>UF = Q₃ + 1.5 × ΔQ</code>. Mọi giá trị <code>x &gt; UF</code> là ngoại lệ phía trên.</p>
              <p className="pt-1 text-[11px] text-amber-800">
                * Lưu ý: Đối với dữ liệu ghép nhóm, kết luận ngoại lệ chỉ là ước lượng lý thuyết theo phân bố nội suy vì không thể quan sát từng cá thể cụ thể.
              </p>
            </div>
          </div>

          {/* Section 5: Biểu đồ hộp Box Plot */}
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 text-xs flex items-center justify-center font-bold">5</span>
              Cách đọc biểu đồ hộp (Box Plot & Whisker)
            </h3>
            <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-lg text-xs text-sky-950 space-y-1">
              <p>• Hộp hình chữ nhật trải dài từ Q₁ đến Q₃, biểu diễn 50% số liệu tập trung ở giữa (độ dài hộp chính là ΔQ).</p>
              <p>• Vạch đậm ở giữa hộp chính là Trung vị Q₂.</p>
              <p>• Râu dưới kéo đến giá trị nhỏ nhất không phải ngoại lệ (≥ LF).</p>
              <p>• Râu trên kéo đến giá trị lớn nhất không phải ngoại lệ (≤ UF).</p>
              <p>• Các điểm nằm ngoài hai râu được hiển thị riêng biệt dưới dạng các chấm tròn đỏ biểu thị giá trị ngoại lệ.</p>
            </div>
          </div>

          {/* Section 6: Biểu đồ phần trăm Pie Chart */}
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 text-xs flex items-center justify-center font-bold">6</span>
              Biểu đồ phần trăm (Pie & Donut Chart)
            </h3>
            <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-950 space-y-1">
              <p>• <strong>Dữ liệu ghép nhóm:</strong> Biểu diễn tỷ lệ phần trăm tần số tương đối của từng nhóm: <code>pᵢ = (nᵢ / n) × 100%</code>, góc ở tâm tương ứng <code>αᵢ = pᵢ × 3.6°</code>.</p>
              <p>• <strong>Dữ liệu thường:</strong> Cho phép xem phân bố tỷ lệ theo 4 khoảng Tứ phân vị (mỗi khoảng xấp xỉ 25% cỡ mẫu) hoặc theo tần số của từng giá trị riêng biệt.</p>
              <p>• Hỗ trợ chuyển đổi linh hoạt giữa dạng quạt tròn (Pie) và vành khăn (Donut), kèm tải ảnh PNG.</p>
            </div>
          </div>

          {/* Section 7: Hồi quy tuyến tính & Tương quan */}
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 text-xs flex items-center justify-center font-bold">7</span>
              Hồi quy tuyến tính & Phân tích tương quan
            </h3>
            <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-950 space-y-1.5">
              <p>• <strong>Hồi quy tuyến tính đơn:</strong> Mô hình hóa quan hệ giữa 1 biến X và biến Y bằng phương trình <code>Ŷ = a + bX</code>; tính hệ số tương quan Pearson <code>r</code>, hệ số xác định <code>R²</code>, sai số chuẩn <code>SER</code> và vẽ biểu đồ phân tán kèm đường hồi quy OLS.</p>
              <p>• <strong>Hồi quy tuyến tính bội:</strong> Mô hình hóa từ 2 đến 10 biến độc lập <code>X₁, X₂, ... Xₖ</code> tác động lên <code>Y</code> bằng đại số ma trận OLS <code>β̂ = (XᵀX)⁻¹XᵀY</code>; tính tổng bình phương độ lệch <code>SST = ∑(yᵢ - ȳ)²</code> (với quan hệ phân rã <code>SST = SSR + SSE</code>), hệ số xác định <code>R²</code>, trực quan hóa <strong>Biểu đồ 3D tương tác (Three.js WebGL)</strong> với mặt phẳng hồi quy Ŷ xoay 360°, ma trận tương quan Heatmap, kiểm tra đa cộng tuyến và vẽ biểu đồ chẩn đoán độ khớp.</p>
              <p>• <strong>Nguyên lý Ceteris Paribus:</strong> Mỗi hệ số hồi quy riêng phần <code>bⱼ</code> cho biết khi <code>Xⱼ</code> tăng 1 đơn vị thì <code>Y</code> thay đổi trung bình <code>bⱼ</code> đơn vị khi tất cả các biến độc lập khác giữ nguyên không đổi.</p>
              <p>• <strong>Cảnh báo quan trọng:</strong> Tương quan không khẳng định quan hệ nhân quả (Correlation ≠ Causation); cảnh báo ngoại suy khi dự báo ngoài phạm vi giá trị quan sát của mẫu.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
};
