import { DescriptiveStatistics, GroupInterval } from '../types/statistics';
import { formatNum } from './mathStatistics';

export function copyTableToClipboard(stats: DescriptiveStatistics, digits: number = 4): Promise<boolean> {
  const rows = [
    ['STT', 'Đại lượng thống kê', 'Ký hiệu', 'Kết quả'],
    ['1', 'Cỡ mẫu', 'n', stats.n.toString()],
    ['2', 'Trung bình', 'x̄', formatNum(stats.mean, digits)],
    ['3', 'Phương sai chưa hiệu chỉnh', 's₀²', formatNum(stats.varianceUncorrected, digits)],
    ['4', 'Phương sai mẫu hiệu chỉnh', 'ŝ² (s²)', formatNum(stats.varianceCorrected, digits)],
    ['5', 'Độ lệch chuẩn chưa hiệu chỉnh', 'ŝ', formatNum(stats.stdevUncorrected, digits)],
    ['6', 'Độ lệch chuẩn', 's', formatNum(stats.stdevCorrected, digits)],
    ['7', 'Giá trị nhỏ nhất', 'x_min', formatNum(stats.min, digits)],
    ['8', 'Giá trị lớn nhất', 'x_max', formatNum(stats.max, digits)],
    ['9', 'Khoảng biến thiên', 'R', formatNum(stats.range, digits)],
    ['10', 'Tứ phân vị thứ nhất', 'Q₁', formatNum(stats.q1, digits)],
    ['11', 'Trung vị', 'Q₂', formatNum(stats.q2, digits)],
    ['12', 'Tứ phân vị thứ ba', 'Q₃', formatNum(stats.q3, digits)],
    ['13', 'Khoảng tứ phân vị', 'ΔQ (IQR)', formatNum(stats.iqr, digits)],
    ['14', 'Ngưỡng dưới', 'LF', formatNum(stats.lowerFence, digits)],
    ['15', 'Ngưỡng trên', 'UF', formatNum(stats.upperFence, digits)],
  ];

  const tsv = rows.map((r) => r.join('\t')).join('\n');
  return navigator.clipboard
    .writeText(tsv)
    .then(() => true)
    .catch(() => false);
}

export function exportToExcel(
  stats: DescriptiveStatistics,
  dataType: 'ungrouped' | 'grouped',
  rawDataOrGroups: number[] | GroupInterval[],
  digits: number = 4
) {
  // Create an Excel-compatible HTML workbook with proper styling and UTF-8 encoding
  const title = `BÁO CÁO THỐNG KÊ MÔ TẢ - STATISTICS PRO`;
  const typeText = dataType === 'ungrouped' ? 'Mẫu số liệu không ghép nhóm' : 'Mẫu số liệu ghép nhóm';
  const timestamp = new Date().toLocaleString('vi-VN');

  let rawSection = '';
  if (dataType === 'ungrouped') {
    const nums = rawDataOrGroups as number[];
    rawSection = `
      <tr><td colspan="4" style="background:#e0f2fe;font-weight:bold;padding:8px;">DỮ LIỆU BAN ĐẦU (n = ${nums.length})</td></tr>
      <tr><td colspan="4" style="padding:6px;">${nums.join(', ')}</td></tr>
    `;
  } else {
    const groups = rawDataOrGroups as GroupInterval[];
    rawSection = `
      <tr><td colspan="4" style="background:#e0f2fe;font-weight:bold;padding:8px;">BẢNG PHÂN BỐ TẦN SỐ GHÉP NHÓM</td></tr>
      <tr style="background:#f1f5f9;font-weight:bold;">
        <td>Nhóm</td>
        <td>Khoảng giá trị</td>
        <td>Giá trị đại diện (xᵢ)</td>
        <td>Tần số (nᵢ)</td>
      </tr>
      ${groups
        .map(
          (g, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>[${g.lower}; ${g.upper})</td>
          <td>${(g.lower + g.upper) / 2}</td>
          <td>${g.frequency}</td>
        </tr>
      `
        )
        .join('')}
    `;
  }

  const tableHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <style>
          body { font-family: Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
          th { background-color: #0284c7; color: white; }
          .title { font-size: 16pt; font-weight: bold; color: #0369a1; }
          .subtitle { font-size: 11pt; color: #64748b; }
          .highlight { background-color: #f8fafc; }
        </style>
      </head>
      <body>
        <table>
          <tr><td colspan="4" class="title">${title}</td></tr>
          <tr><td colspan="4" class="subtitle">Loại dữ liệu: ${typeText} | Xuất lúc: ${timestamp}</td></tr>
          <tr><td colspan="4"></td></tr>
          ${rawSection}
          <tr><td colspan="4"></td></tr>
          <tr><td colspan="4" style="background:#0284c7;color:white;font-weight:bold;padding:8px;">BẢNG KẾT QUẢ CÁC ĐẠI LƯỢNG THỐNG KÊ</td></tr>
          <tr style="background:#f1f5f9;font-weight:bold;">
            <th>STT</th>
            <th>Đại lượng thống kê</th>
            <th>Ký hiệu</th>
            <th>Kết quả</th>
          </tr>
          <tr><td>1</td><td>Cỡ mẫu</td><td>n</td><td>${stats.n}</td></tr>
          <tr><td>2</td><td>Trung bình</td><td>x̄</td><td>${formatNum(stats.mean, digits)}</td></tr>
          <tr><td>3</td><td>Phương sai chưa hiệu chỉnh</td><td>s₀²</td><td>${formatNum(stats.varianceUncorrected, digits)}</td></tr>
          <tr><td>4</td><td>Phương sai mẫu hiệu chỉnh</td><td>ŝ² (s²)</td><td>${formatNum(stats.varianceCorrected, digits)}</td></tr>
          <tr><td>5</td><td>Độ lệch chuẩn chưa hiệu chỉnh</td><td>ŝ</td><td>${formatNum(stats.stdevUncorrected, digits)}</td></tr>
          <tr><td>6</td><td>Độ lệch chuẩn</td><td>s</td><td>${formatNum(stats.stdevCorrected, digits)}</td></tr>
          <tr><td>7</td><td>Giá trị nhỏ nhất</td><td>x_min</td><td>${formatNum(stats.min, digits)}</td></tr>
          <tr><td>8</td><td>Giá trị lớn nhất</td><td>x_max</td><td>${formatNum(stats.max, digits)}</td></tr>
          <tr><td>9</td><td>Khoảng biến thiên</td><td>R</td><td>${formatNum(stats.range, digits)}</td></tr>
          <tr><td>10</td><td>Tứ phân vị thứ nhất</td><td>Q₁</td><td>${formatNum(stats.q1, digits)}</td></tr>
          <tr><td>11</td><td>Trung vị</td><td>Q₂</td><td>${formatNum(stats.q2, digits)}</td></tr>
          <tr><td>12</td><td>Tứ phân vị thứ ba</td><td>Q₃</td><td>${formatNum(stats.q3, digits)}</td></tr>
          <tr><td>13</td><td>Khoảng tứ phân vị</td><td>ΔQ (IQR)</td><td>${formatNum(stats.iqr, digits)}</td></tr>
          <tr><td>14</td><td>Ngưỡng dưới</td><td>LF</td><td>${formatNum(stats.lowerFence, digits)}</td></tr>
          <tr><td>15</td><td>Ngưỡng trên</td><td>UF</td><td>${formatNum(stats.upperFence, digits)}</td></tr>
          <tr><td colspan="4"></td></tr>
          <tr><td colspan="4" style="background:#fef3c7;font-weight:bold;padding:8px;">KẾT LUẬN VỀ GIÁ TRỊ NGOẠI LỆ</td></tr>
          <tr>
            <td colspan="4">
              ${
                stats.outliers.hasOutliers
                  ? `Có giá trị ngoại lệ. Ngoại lệ phía dưới: ${stats.outliers.lowerOutliers.length ? stats.outliers.lowerOutliers.join(', ') : 'Không có'}. Ngoại lệ phía trên: ${stats.outliers.upperOutliers.length ? stats.outliers.upperOutliers.join(', ') : 'Không có'}.`
                  : 'Không có giá trị ngoại lệ trong mẫu dữ liệu.'
              }
              <br/>Ngưỡng ngoại lệ: LF = ${formatNum(stats.lowerFence, digits)}, UF = ${formatNum(stats.upperFence, digits)}
              ${stats.isGrouped ? '<br/><i>Ghi chú: Đối với dữ liệu ghép nhóm, đây là giá trị ước lượng theo phân bố nội suy.</i>' : ''}
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ThongKe_${dataType}_${Date.now()}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadSvgAsPng(
  svgElement: SVGSVGElement | null,
  filename: string = 'BoxPlot_StatisticsPro.png'
) {
  if (!svgElement) return;

  const svgData = new XMLSerializer().serializeToString(svgElement);
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const URLObj = window.URL || window.webkitURL || window;
  const blobURL = URLObj.createObjectURL(svgBlob);

  const image = new Image();
  image.onload = () => {
    // 2x retina scale for ultra-crisp output
    const scale = 2;
    const width = svgElement.clientWidth || 900;
    const height = svgElement.clientHeight || 280;

    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.scale(scale, scale);
    ctx.drawImage(image, 0, 0, width, height);

    const pngUrl = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URLObj.revokeObjectURL(blobURL);
  };

  image.src = blobURL;
}
