import React, { useMemo, useState } from 'react';
import { Header } from './components/Header';
import { UngroupedInput } from './components/UngroupedInput';
import { GroupedInput } from './components/GroupedInput';
import { StatisticsCards } from './components/StatisticsCards';
import { BoxPlotChart } from './components/BoxPlotChart';
import { PieChart } from './components/PieChart';
import { SummaryTable } from './components/SummaryTable';
import { OutlierReport } from './components/OutlierReport';
import { ExportBar } from './components/ExportBar';
import { UserGuideModal } from './components/UserGuideModal';
import { CalculationStepsModal } from './components/CalculationStepsModal';
import { PrintableReport } from './components/PrintableReport';
import { SimpleRegressionView } from './components/regression/SimpleRegressionView';
import { MultipleRegressionView } from './components/regression/MultipleRegressionView';
import { DataType, GroupInterval } from './types/statistics';
import {
  calculateGroupedStatistics,
  calculateUngroupedStatistics,
  parseRawNumbers,
  validateGroupedIntervals,
} from './utils/mathStatistics';
import { downloadSvgAsPng } from './utils/exportUtils';
import {
  FileSpreadsheet,
  ListFilter,
  AlertCircle,
  BarChart3,
  TrendingUp,
  Activity,
  Layers,
} from 'lucide-react';

type MainModule = 'descriptive' | 'regression';
type RegressionSubTab = 'simple' | 'multiple';

export default function App() {
  // Top-Level Main Module Selector: Thống kê mô tả (default) | Hồi quy & Tương quan
  const [mainModule, setMainModule] = useState<MainModule>('descriptive');

  // Descriptive Statistics Navigation Tab
  const [activeTab, setActiveTab] = useState<DataType>('ungrouped');

  // Regression Sub-Method: Hồi quy đơn | Hồi quy bội
  const [regressionTab, setRegressionTab] = useState<RegressionSubTab>('simple');

  // Decimal Precision Display setting (default 4 digits as required)
  const [digits, setDigits] = useState<number>(4);

  // Modals state
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isStepsOpen, setIsStepsOpen] = useState(false);

  // 1. Ungrouped Data State (Default sample from prompt: 5, 7, 8, 8, 9, 10, 12, 13, 15, 18)
  const [rawText, setRawText] = useState<string>('5, 7, 8, 8, 9, 10, 12, 13, 15, 18');

  // 2. Grouped Data State (Default sample from prompt)
  const [groupRows, setGroupRows] = useState<GroupInterval[]>([
    { id: '1', lower: 0, upper: 10, frequency: 5 },
    { id: '2', lower: 10, upper: 20, frequency: 8 },
    { id: '3', lower: 20, upper: 30, frequency: 12 },
    { id: '4', lower: 30, upper: 40, frequency: 10 },
    { id: '5', lower: 40, upper: 50, frequency: 5 },
  ]);

  // Parse Raw Numbers
  const { numbers: parsedNumbers, invalidTokens } = useMemo(() => {
    return parseRawNumbers(rawText);
  }, [rawText]);

  // Compute Ungrouped Statistics
  const ungroupedResult = useMemo(() => {
    if (parsedNumbers.length === 0) return null;
    return calculateUngroupedStatistics(parsedNumbers, digits);
  }, [parsedNumbers, digits]);

  // Validate and Compute Grouped Statistics
  const groupedValidation = useMemo(() => {
    return validateGroupedIntervals(groupRows);
  }, [groupRows]);

  const groupedResult = useMemo(() => {
    if (!groupedValidation.isValid) return null;
    return calculateGroupedStatistics(groupRows, digits);
  }, [groupRows, groupedValidation.isValid, digits]);

  // Current Active Descriptive Statistics
  const currentStats = activeTab === 'ungrouped' ? ungroupedResult?.stats : groupedResult?.stats;
  const currentUngroupedSteps = ungroupedResult?.steps;
  const currentGroupedSteps = groupedResult?.steps;

  // Print Action
  const handlePrint = () => {
    window.print();
  };

  // Download box plot helper
  const handleDownloadBoxPlot = () => {
    const svgEl = document.querySelector('svg') as SVGSVGElement | null;
    if (svgEl) {
      downloadSvgAsPng(svgEl, `BoxPlot_${activeTab}_StatisticsPro.png`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Top Header */}
      <Header
        onOpenGuide={() => setIsGuideOpen(true)}
        digits={digits}
        onChangeDigits={setDigits}
        onPrint={handlePrint}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Primary Module Selector (Top Navigation) */}
        <div className="no-print bg-white p-2 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setMainModule('descriptive')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                mainModule === 'descriptive'
                  ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>THỐNG KÊ MÔ TẢ</span>
            </button>

            <button
              onClick={() => setMainModule('regression')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                mainModule === 'regression'
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>HỒI QUY & TƯƠNG QUAN</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 pr-2">
            {mainModule === 'descriptive' ? (
              <span>Mô tả mức độ tập trung, mức độ phân tán & giá trị ngoại lai</span>
            ) : (
              <span>Phân tích hồi quy OLS, hệ số Pearson, tương quan bội & dự báo</span>
            )}
          </div>
        </div>

        {/* MODULE 1: THỐNG KÊ MÔ TẢ */}
        {mainModule === 'descriptive' && (
          <div className="space-y-6">
            {/* Sub-Tabs: Ungrouped vs Grouped */}
            <div className="no-print bg-white p-1.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <button
                  onClick={() => setActiveTab('ungrouped')}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'ungrouped'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <ListFilter className="w-4 h-4" />
                  <span>Dữ liệu thường (Dữ liệu thô)</span>
                </button>

                <button
                  onClick={() => setActiveTab('grouped')}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'grouped'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Dữ liệu ghép nhóm (Bảng tần số)</span>
                </button>
              </div>

              <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 pr-2">
                <span>
                  Phương pháp: <strong>Chia đôi mẫu</strong> (Dữ liệu thường) · <strong>Nội suy tuyến tính</strong> (Ghép nhóm)
                </span>
              </div>
            </div>

            {/* Input Area */}
            <section className="no-print">
              {activeTab === 'ungrouped' ? (
                <UngroupedInput
                  rawInput={rawText}
                  onChangeInput={setRawText}
                  parsedNumbers={parsedNumbers}
                  sortedNumbers={ungroupedResult ? ungroupedResult.steps.sortedList : []}
                  invalidTokens={invalidTokens}
                />
              ) : (
                <GroupedInput
                  groups={groupRows}
                  onChangeGroups={setGroupRows}
                  validationErrors={groupedValidation.errors}
                />
              )}
            </section>

            {/* Results Area */}
            {currentStats ? (
              <section className="space-y-6">
                {/* 1. Statistics Cards */}
                <StatisticsCards stats={currentStats} digits={digits} />

                {/* 2. Box Plot Chart */}
                <BoxPlotChart
                  stats={currentStats}
                  digits={digits}
                  rawNumbers={activeTab === 'ungrouped' ? parsedNumbers : undefined}
                />

                {/* 3. Pie Chart (Biểu đồ phần trăm) */}
                <PieChart
                  stats={currentStats}
                  dataType={activeTab}
                  groups={groupRows}
                  rawNumbers={parsedNumbers}
                  digits={digits}
                />

                {/* 4. Detailed Summary Table (15 rows) */}
                <SummaryTable
                  stats={currentStats}
                  digits={digits}
                  onOpenSteps={() => setIsStepsOpen(true)}
                  rawSource={activeTab === 'ungrouped' ? parsedNumbers : groupRows}
                  dataType={activeTab}
                />

                {/* 5. Outlier Analysis & Conclusion */}
                <OutlierReport stats={currentStats} digits={digits} />

                {/* 6. Export and Action Bar */}
                <ExportBar
                  stats={currentStats}
                  dataType={activeTab}
                  rawSource={activeTab === 'ungrouped' ? parsedNumbers : groupRows}
                  digits={digits}
                  onOpenSteps={() => setIsStepsOpen(true)}
                  onPrint={handlePrint}
                  onDownloadBoxPlot={handleDownloadBoxPlot}
                />
              </section>
            ) : (
              /* Empty or Invalid State */
              <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-500 space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-slate-700">Chưa có kết quả thống kê</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {activeTab === 'ungrouped'
                    ? 'Vui lòng nhập hoặc chọn một bộ dữ liệu mẫu ở trên để bắt đầu tính toán.'
                    : groupedValidation.errors.length > 0
                    ? groupedValidation.errors[0]
                    : 'Vui lòng hoàn thiện bảng phân bố tần số hợp lệ ở trên để bắt đầu tính toán.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* MODULE 2: HỒI QUY & TƯƠNG QUAN */}
        {mainModule === 'regression' && (
          <div className="space-y-6">
            {/* Sub-Tabs: Simple vs Multiple */}
            <div className="no-print bg-white p-1.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <button
                  onClick={() => setRegressionTab('simple')}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                    regressionTab === 'simple'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  <span>1. Hồi quy tuyến tính đơn (Simple OLS)</span>
                </button>

                <button
                  onClick={() => setRegressionTab('multiple')}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                    regressionTab === 'multiple'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>2. Hồi quy tuyến tính bội (Multiple OLS)</span>
                </button>
              </div>

              <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 pr-2">
                <span>
                  {regressionTab === 'simple'
                    ? '1 biến giải thích X · Phương trình y = a + bX · Hệ số Pearson r'
                    : '2 đến 10 biến giải thích · Ma trận OLS β̂ = (XᵀX)⁻¹XᵀY · R² hiệu chỉnh'}
                </span>
              </div>
            </div>

            {/* Regression Views */}
            {regressionTab === 'simple' ? (
              <SimpleRegressionView digits={digits} />
            ) : (
              <MultipleRegressionView digits={digits} />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="no-print bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>STATISTICS PRO</strong> · Công cụ tính toán thống kê mô tả & hồi quy tuyến tính
          </div>
          <div className="text-slate-400 text-[11px]">
            Ngô Thanh Hùng - Lớp ĐHSTOAN26A_L2 môn Thống kê nâng cao (GV: Lê Trung Hiếu)
          </div>
        </div>
      </footer>

      {/* Hidden Printable Report for PDF Export */}
      {currentStats && (
        <PrintableReport
          stats={currentStats}
          dataType={activeTab}
          rawNumbers={parsedNumbers}
          groups={groupRows}
          digits={digits}
        />
      )}

      {/* User Guide Modal */}
      <UserGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

      {/* Step-by-Step Calculation Modal */}
      {currentStats && (
        <CalculationStepsModal
          isOpen={isStepsOpen}
          onClose={() => setIsStepsOpen(false)}
          stats={currentStats}
          ungroupedSteps={currentUngroupedSteps}
          groupedSteps={currentGroupedSteps}
          digits={digits}
        />
      )}
    </div>
  );
}
