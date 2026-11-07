import React from 'react';
import { Plus, Trash2, Sparkles, Table2, AlertCircle, ArrowRight } from 'lucide-react';
import { GroupInterval } from '../types/statistics';

interface GroupedInputProps {
  groups: GroupInterval[];
  onChangeGroups: (newGroups: GroupInterval[]) => void;
  validationErrors: string[];
}

export const GroupedInput: React.FC<GroupedInputProps> = ({
  groups,
  onChangeGroups,
  validationErrors,
}) => {
  const samplePresets = [
    {
      label: 'Mẫu chuẩn đề bài [0-50)',
      data: [
        { id: '1', lower: 0, upper: 10, frequency: 5 },
        { id: '2', lower: 10, upper: 20, frequency: 8 },
        { id: '3', lower: 20, upper: 30, frequency: 12 },
        { id: '4', lower: 30, upper: 40, frequency: 10 },
        { id: '5', lower: 40, upper: 50, frequency: 5 },
      ],
      desc: '5 khoảng lớp độ rộng đều 10, tổng n = 40',
    },
    {
      label: 'Điểm thi học sinh [4-10]',
      data: [
        { id: '1', lower: 4, upper: 5, frequency: 3 },
        { id: '2', lower: 5, upper: 6.5, frequency: 14 },
        { id: '3', lower: 6.5, upper: 8, frequency: 22 },
        { id: '4', lower: 8, upper: 9, frequency: 11 },
        { id: '5', lower: 9, upper: 10, frequency: 4 },
      ],
      desc: 'Khoảng lớp có độ rộng không bằng nhau',
    },
    {
      label: 'Khối lượng quả (gam)',
      data: [
        { id: '1', lower: 100, upper: 120, frequency: 16 },
        { id: '2', lower: 120, upper: 140, frequency: 35 },
        { id: '3', lower: 140, upper: 160, frequency: 42 },
        { id: '4', lower: 160, upper: 180, frequency: 28 },
        { id: '5', lower: 180, upper: 200, frequency: 9 },
      ],
      desc: 'Mẫu lớn n = 130',
    },
  ];

  const handleRowChange = (index: number, field: keyof GroupInterval, value: number) => {
    const updated = [...groups];
    updated[index] = { ...updated[index], [field]: value };
    onChangeGroups(updated);
  };

  const handleAddRow = () => {
    let nextLower = 0;
    let nextUpper = 10;
    if (groups.length > 0) {
      const last = groups[groups.length - 1];
      const step = Math.max(1, last.upper - last.lower);
      nextLower = last.upper;
      nextUpper = nextLower + step;
    }

    const newRow: GroupInterval = {
      id: Date.now().toString(),
      lower: nextLower,
      upper: nextUpper,
      frequency: 1,
    };
    onChangeGroups([...groups, newRow]);
  };

  const handleRemoveRow = (index: number) => {
    if (groups.length <= 1) return;
    const updated = groups.filter((_, i) => i !== index);
    onChangeGroups(updated);
  };

  const handleClear = () => {
    onChangeGroups([
      { id: '1', lower: 0, upper: 10, frequency: 1 },
    ]);
  };

  const totalN = groups.reduce((acc, curr) => acc + (Number(curr.frequency) || 0), 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
      {/* Header and Presets */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Table2 className="w-4 h-4 text-sky-600" />
            <span>Nhập Bảng Phân Bố Tần Số Ghép Nhóm</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Nhập các khoảng giá trị [aᵢ; bᵢ) và tần số tương ứng nᵢ (hỗ trợ độ rộng linh hoạt)
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-400 mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" /> Bảng mẫu:
          </span>
          {samplePresets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => onChangeGroups(preset.data)}
              className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-700 rounded-lg border border-slate-200/80 transition-colors cursor-pointer"
              title={preset.desc}
            >
              {preset.label}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg transition-colors cursor-pointer ml-1"
            title="Xóa trắng bảng về 1 hàng mặc định"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Đặt lại</span>
          </button>
        </div>
      </div>

      {/* Grouped Table Grid */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100/80 text-slate-700 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <th className="py-2.5 px-3 w-12 text-center">STT</th>
              <th className="py-2.5 px-3">Cận dưới [aᵢ</th>
              <th className="py-2.5 px-2 text-center w-6 text-slate-400">;</th>
              <th className="py-2.5 px-3">Cận trên bᵢ)</th>
              <th className="py-2.5 px-3 text-center bg-slate-50/70 text-slate-600">Đại diện (xᵢ)</th>
              <th className="py-2.5 px-3">Tần số (nᵢ)</th>
              <th className="py-2.5 px-2 w-12 text-center">Xóa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {groups.map((group, idx) => {
              const midpoint = (Number(group.lower) + Number(group.upper)) / 2;
              const hasError = group.lower >= group.upper || group.frequency < 0;

              return (
                <tr
                  key={group.id || idx}
                  className={`hover:bg-slate-50 transition-colors ${hasError ? 'bg-rose-50/50' : ''}`}
                >
                  <td className="py-2 px-3 text-center text-xs text-slate-400 font-mono">
                    {idx + 1}
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      step="any"
                      value={group.lower}
                      onChange={(e) => handleRowChange(idx, 'lower', parseFloat(e.target.value) || 0)}
                      className="w-full max-w-[120px] font-mono text-sm px-2.5 py-1.5 border border-slate-300 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </td>
                  <td className="py-2 px-2 text-center text-slate-400 font-bold">;</td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      step="any"
                      value={group.upper}
                      onChange={(e) => handleRowChange(idx, 'upper', parseFloat(e.target.value) || 0)}
                      className="w-full max-w-[120px] font-mono text-sm px-2.5 py-1.5 border border-slate-300 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </td>
                  <td className="py-2 px-3 text-center bg-slate-50/70 font-mono font-medium text-slate-700 text-xs">
                    {!Number.isNaN(midpoint) ? midpoint : '—'}
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={group.frequency}
                      onChange={(e) =>
                        handleRowChange(idx, 'frequency', Math.max(0, parseInt(e.target.value, 10) || 0))
                      }
                      className="w-full max-w-[100px] font-mono text-sm px-2.5 py-1.5 border border-slate-300 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </td>
                  <td className="py-2 px-2 text-center">
                    <button
                      onClick={() => handleRemoveRow(idx)}
                      disabled={groups.length <= 1}
                      className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-20 hover:bg-rose-50 rounded transition-colors"
                      title="Xóa hàng này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100/90 font-semibold text-slate-800 text-xs border-t border-slate-200">
              <td colSpan={4} className="py-2.5 px-3 text-right uppercase tracking-wider text-slate-600">
                Tổng tần số (Cỡ mẫu n = Σnᵢ):
              </td>
              <td className="py-2.5 px-3 text-center text-slate-400">—</td>
              <td className="py-2.5 px-3 font-mono font-bold text-sky-700 text-sm">
                {totalN}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Add Row Button & Error Alerts */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <button
          onClick={handleAddRow}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm khoảng nhóm mới</span>
        </button>

        {validationErrors.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg max-w-xl">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{validationErrors[0]}</span>
          </div>
        )}
      </div>
    </div>
  );
};
