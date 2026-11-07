import React, { useState } from 'react';
import {
  Copy,
  Check,
  FileSpreadsheet,
  Printer,
  Download,
  Eye,
  FileText,
  Share2,
} from 'lucide-react';
import { DescriptiveStatistics, GroupInterval } from '../types/statistics';
import { copyTableToClipboard, exportToExcel } from '../utils/exportUtils';

interface ExportBarProps {
  stats: DescriptiveStatistics;
  dataType: 'ungrouped' | 'grouped';
  rawSource: number[] | GroupInterval[];
  digits?: number;
  onOpenSteps: () => void;
  onPrint: () => void;
  onDownloadBoxPlot: () => void;
}

export const ExportBar: React.FC<ExportBarProps> = ({
  stats,
  dataType,
  rawSource,
  digits = 4,
  onOpenSteps,
  onPrint,
  onDownloadBoxPlot,
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

  return (
    <div className="no-print bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-slate-700 text-xs font-semibold">
        <Share2 className="w-4 h-4 text-sky-600" />
        <span>Công cụ & Xuất báo cáo:</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Xem cách tính */}
        <button
          onClick={onOpenSteps}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Xem cách tính</span>
        </button>

        {/* Sao chép bảng */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700">Đã chép!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>Sao chép bảng</span>
            </>
          )}
        </button>

        {/* Xuất Excel */}
        <button
          onClick={handleExportExcel}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors cursor-pointer"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-sky-600" />
          <span>Xuất Excel</span>
        </button>

        {/* Tải PNG Box Plot */}
        <button
          onClick={onDownloadBoxPlot}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-indigo-600" />
          <span>Tải ảnh Box Plot</span>
        </button>

        {/* In báo cáo / PDF */}
        <button
          onClick={onPrint}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5 text-slate-700" />
          <span>Xuất PDF / In báo cáo</span>
        </button>
      </div>
    </div>
  );
};
