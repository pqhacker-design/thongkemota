import {
  DescriptiveStatistics,
  GroupInterval,
  GroupedCalculationSteps,
  GroupedRowCalculation,
  QuartileInterpolationDetail,
  UngroupedCalculationSteps,
} from '../types/statistics';

/**
 * Format a number for display according to chosen decimal places.
 * Calculation remains strictly unrounded.
 */
export function formatNum(
  val: number | null | undefined,
  digits: number = 4,
  useVietnameseLocale: boolean = false
): string {
  if (val === null || val === undefined || Number.isNaN(val)) {
    return '—';
  }

  // Handle tiny floating point noise (e.g. 1e-13 -> 0)
  if (Math.abs(val) < 1e-12) {
    return '0';
  }

  if (Number.isInteger(val)) {
    return val.toString();
  }

  // Round strictly for display only
  const fixed = val.toFixed(digits);
  // Remove trailing zeros after decimal if desired or keep clean
  const trimmed = parseFloat(fixed);

  if (useVietnameseLocale) {
    return trimmed.toLocaleString('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: digits,
    });
  }

  return trimmed.toString();
}

/**
 * Parses raw text input into an array of valid numbers.
 * Supports spaces, commas, semicolons, tabs, newlines.
 * Handles negative numbers and decimals.
 */
export function parseRawNumbers(text: string): { numbers: number[]; invalidTokens: string[] } {
  if (!text || !text.trim()) {
    return { numbers: [], invalidTokens: [] };
  }

  // Normalize delimiters (replace comma if used as list delimiter or European decimal)
  // We handle European decimals if formatted like "3,5" surrounded by spaces or in standard list
  // Best strategy:
  // Split on newlines, semicolons, tabs first, or commas between numbers.
  // Standard Vietnamese/Excel list pasting: "5, 7, 8, 8, 9, 10" or "5\t7\t8" or "5.5, -2.4"
  // If someone enters "5, 7.5, -3.2", commas are separators.
  
  // Replace multiple whitespace/commas/semicolons with a single token separator
  // First, detect if comma is used as decimal separator (e.g. "3,14; 2,5; 7,8")
  const hasSemicolon = text.includes(';');
  let processedText = text;
  
  if (hasSemicolon) {
    // If semicolons are used, commas are decimal points!
    processedText = processedText.replace(/,/g, '.').replace(/;/g, ' ');
  } else {
    // Standard delimiter: commas, spaces, tabs, newlines
    processedText = processedText.replace(/,/g, ' ');
  }

  const tokens = processedText.trim().split(/\s+/).filter(Boolean);
  const numbers: number[] = [];
  const invalidTokens: string[] = [];

  for (const token of tokens) {
    const cleanToken = token.trim();
    if (!cleanToken) continue;

    const num = Number(cleanToken);
    if (!Number.isNaN(num) && Number.isFinite(num)) {
      numbers.push(num);
    } else {
      invalidTokens.push(cleanToken);
    }
  }

  return { numbers, invalidTokens };
}

/**
 * Calculate median of a pre-sorted array
 */
function getMedianOfSorted(arr: number[]): { median: number; explanation: string } {
  const len = arr.length;
  if (len === 0) return { median: 0, explanation: 'Mẫu rỗng' };
  if (len === 1) return { median: arr[0], explanation: `Mẫu có 1 phần tử: ${arr[0]}` };

  if (len % 2 === 1) {
    const midIdx = Math.floor(len / 2);
    return {
      median: arr[midIdx],
      explanation: `Vì n = ${len} lẻ, trung vị là phần tử thứ ${(len + 1) / 2}: x(${midIdx + 1}) = ${arr[midIdx]}`,
    };
  } else {
    const mid1 = len / 2 - 1;
    const mid2 = len / 2;
    const val = (arr[mid1] + arr[mid2]) / 2;
    return {
      median: val,
      explanation: `Vì n = ${len} chẵn, trung vị là trung bình cộng hai phần tử ở giữa: [x(${mid1 + 1}) + x(${mid2 + 1})] / 2 = [${arr[mid1]} + ${arr[mid2]}] / 2 = ${val}`,
    };
  }
}

/**
 * Calculates complete descriptive statistics for ungrouped raw data.
 * Implements the mandatory Half-Split method (Phương pháp chia đôi mẫu - chuẩn SGK Toán Việt Nam).
 */
export function calculateUngroupedStatistics(
  numbers: number[],
  digits: number = 4
): { stats: DescriptiveStatistics; steps: UngroupedCalculationSteps } | null {
  const n = numbers.length;
  if (n === 0) return null;

  // 1. Sort ascending
  const sorted = [...numbers].sort((a, b) => a - b);

  // 2. Sum and Mean
  const sum = numbers.reduce((acc, curr) => acc + curr, 0);
  const mean = sum / n;

  // 3. Min, Max, Range
  const min = sorted[0];
  const max = sorted[n - 1];
  const range = max - min;

  // 4. Sum of squared deviations
  let sumSquaredDiffs = 0;
  const detailedRows = numbers.map((val, idx) => {
    const diff = val - mean;
    const diffSquared = diff * diff;
    sumSquaredDiffs += diffSquared;
    return {
      index: idx + 1,
      value: val,
      diff,
      diffSquared,
    };
  });

  // 5. Variance and Standard Deviation
  const varianceUncorrected = sumSquaredDiffs / n;
  const stdevUncorrected = Math.sqrt(varianceUncorrected);

  const varianceCorrected = n >= 2 ? sumSquaredDiffs / (n - 1) : null;
  const stdevCorrected = varianceCorrected !== null ? Math.sqrt(varianceCorrected) : null;

  // 6. Quartiles (Half-Split Method)
  let q1 = 0;
  let q2 = 0;
  let q3 = 0;
  let lowerHalf: number[] = [];
  let upperHalf: number[] = [];
  let medianMethodExplanation = '';
  let q1Calculation = '';
  let q2Calculation = '';
  let q3Calculation = '';

  if (n === 1) {
    q1 = sorted[0];
    q2 = sorted[0];
    q3 = sorted[0];
    lowerHalf = [sorted[0]];
    upperHalf = [sorted[0]];
    medianMethodExplanation = 'Cỡ mẫu n = 1: Q1 = Q2 = Q3 = ' + sorted[0];
    q1Calculation = `Q1 = ${sorted[0]}`;
    q2Calculation = `Q2 = ${sorted[0]}`;
    q3Calculation = `Q3 = ${sorted[0]}`;
  } else {
    // Median Q2
    const medResult = getMedianOfSorted(sorted);
    q2 = medResult.median;
    q2Calculation = medResult.explanation;

    if (n % 2 === 1) {
      // n is odd: exclude median at Math.floor(n / 2)
      const midIdx = Math.floor(n / 2);
      lowerHalf = sorted.slice(0, midIdx);
      upperHalf = sorted.slice(midIdx + 1);
      medianMethodExplanation = `Vì cỡ mẫu n = ${n} lẻ, giá trị trung vị Q2 = ${sorted[midIdx]} (ở vị trí ${(n + 1) / 2}) được loại bỏ khi chia đôi mẫu. Nửa dưới gồm ${lowerHalf.length} phần tử đầu; nửa trên gồm ${upperHalf.length} phần tử cuối.`;
    } else {
      // n is even: split cleanly in half
      const midIdx = n / 2;
      lowerHalf = sorted.slice(0, midIdx);
      upperHalf = sorted.slice(midIdx);
      medianMethodExplanation = `Vì cỡ mẫu n = ${n} chẵn, mẫu được chia đều thành hai nửa: nửa dưới gồm ${lowerHalf.length} phần tử đầu; nửa trên gồm ${upperHalf.length} phần tử cuối.`;
    }

    const q1Res = getMedianOfSorted(lowerHalf);
    q1 = q1Res.median;
    q1Calculation = `Q1 là trung vị của nửa dưới [${lowerHalf.join(', ')}]: ${q1Res.explanation}`;

    const q3Res = getMedianOfSorted(upperHalf);
    q3 = q3Res.median;
    q3Calculation = `Q3 là trung vị của nửa trên [${upperHalf.join(', ')}]: ${q3Res.explanation}`;
  }

  // 7. IQR and Outlier Thresholds
  const iqr = q3 - q1;
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;

  // 8. Identify Outliers
  const lowerOutliers = sorted.filter((x) => x < lowerFence);
  const upperOutliers = sorted.filter((x) => x > upperFence);
  const allOutliers = [...lowerOutliers, ...upperOutliers];
  const hasOutliers = allOutliers.length > 0;

  // 9. Whiskers for Box Plot (non-outlier min/max)
  const nonOutlierValues = sorted.filter((x) => x >= lowerFence && x <= upperFence);
  const whiskerMin = nonOutlierValues.length > 0 ? nonOutlierValues[0] : min;
  const whiskerMax = nonOutlierValues.length > 0 ? nonOutlierValues[nonOutlierValues.length - 1] : max;

  // Step explanations
  const meanFormula = 'x̄ = Σxᵢ / n';
  const meanCalculation = `x̄ = (${sum}) / ${n} = ${formatNum(mean, digits)}`;

  const varianceUncorrectedFormula = 'ŝ² = Σ(xᵢ - x̄)² / n';
  const varianceUncorrectedCalculation = `ŝ² = ${formatNum(sumSquaredDiffs, digits)} / ${n} = ${formatNum(varianceUncorrected, digits)}`;

  const varianceCorrectedFormula = 's² = Σ(xᵢ - x̄)² / (n - 1)';
  const varianceCorrectedCalculation =
    n >= 2
      ? `s² = ${formatNum(sumSquaredDiffs, digits)} / (${n} - 1) = ${formatNum(sumSquaredDiffs, digits)} / ${n - 1} = ${formatNum(varianceCorrected, digits)}`
      : 'Không thể tính phương sai hiệu chỉnh khi n < 2 (mẫu số n - 1 = 0)';

  const stdevUncorrectedCalculation = `ŝ = √(${formatNum(varianceUncorrected, digits)}) = ${formatNum(stdevUncorrected, digits)}`;
  const stdevCorrectedCalculation =
    stdevCorrected !== null
      ? `s = √(${formatNum(varianceCorrected, digits)}) = ${formatNum(stdevCorrected, digits)}`
      : 'Không xác định khi n < 2';

  const iqrCalculation = `IQR = Q3 - Q1 = ${formatNum(q3, digits)} - ${formatNum(q1, digits)} = ${formatNum(iqr, digits)}`;
  const lfCalculation = `LF = Q1 - 1.5 × IQR = ${formatNum(q1, digits)} - 1.5 × ${formatNum(iqr, digits)} = ${formatNum(lowerFence, digits)}`;
  const ufCalculation = `UF = Q3 + 1.5 × IQR = ${formatNum(q3, digits)} + 1.5 × ${formatNum(iqr, digits)} = ${formatNum(upperFence, digits)}`;

  const notes: string[] = [
    'Quy ước tứ phân vị: Phương pháp chia đôi mẫu (Tukey / SGK Toán Việt Nam).',
  ];
  if (n < 2) {
    notes.push('Cỡ mẫu n = 1: Không xác định phương sai và độ lệch chuẩn đã hiệu chỉnh (mẫu số n - 1 = 0).');
  }

  const stats: DescriptiveStatistics = {
    n,
    mean,
    varianceUncorrected,
    varianceCorrected,
    stdevUncorrected,
    stdevCorrected,
    min,
    max,
    range,
    q1,
    q2,
    q3,
    iqr,
    lowerFence,
    upperFence,
    whiskerMin,
    whiskerMax,
    outliers: {
      hasOutliers,
      lowerThreshold: lowerFence,
      upperThreshold: upperFence,
      lowerOutliers,
      upperOutliers,
      allOutliers,
      isEstimate: false,
    },
    isGrouped: false,
    notes,
  };

  const steps: UngroupedCalculationSteps = {
    sortedList: sorted,
    sum,
    meanFormula,
    meanCalculation,
    medianCalculation: q2Calculation,
    medianMethodExplanation,
    lowerHalf,
    upperHalf,
    q1Calculation,
    q3Calculation,
    iqrCalculation,
    lfCalculation,
    ufCalculation,
    varianceUncorrectedFormula,
    varianceUncorrectedCalculation,
    varianceCorrectedFormula,
    varianceCorrectedCalculation,
    stdevUncorrectedCalculation,
    stdevCorrectedCalculation,
    detailedRows,
    sumSquaredDiffs,
  };

  return { stats, steps };
}

/**
 * Validates grouped interval table.
 */
export function validateGroupedIntervals(groups: GroupInterval[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (groups.length === 0) {
    errors.push('Bảng phân bố tần số phải có ít nhất một khoảng.');
    return { isValid: false, errors };
  }

  let totalN = 0;
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    if (g.lower >= g.upper) {
      errors.push(`Nhóm ${i + 1}: Cận dưới (${g.lower}) phải nhỏ hơn cận trên (${g.upper}).`);
    }
    if (g.frequency < 0 || !Number.isInteger(g.frequency)) {
      errors.push(`Nhóm ${i + 1}: Tần số (${g.frequency}) phải là số nguyên không âm.`);
    }
    totalN += g.frequency || 0;

    if (i > 0) {
      const prev = groups[i - 1];
      if (g.lower < prev.upper) {
        errors.push(
          `Khoảng [${g.lower}; ${g.upper}) bị chồng lấn với khoảng trước đó [${prev.lower}; ${prev.upper}).`
        );
      } else if (g.lower > prev.upper) {
        // Gap between intervals warning (allowed in general, but good to flag if user intended continuous)
      }
    }
  }

  if (totalN <= 0) {
    errors.push('Tổng tần số (cỡ mẫu n) phải lớn hơn 0.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calculates complete descriptive statistics for grouped data (bảng phân bố tần số ghép nhóm).
 * Uses midpoints x_i = (a_i + b_i) / 2 and interpolation for quartiles.
 */
export function calculateGroupedStatistics(
  groups: GroupInterval[],
  digits: number = 4
): { stats: DescriptiveStatistics; steps: GroupedCalculationSteps } | null {
  const valRes = validateGroupedIntervals(groups);
  if (!valRes.isValid) return null;

  // 1. Calculate cumulative frequencies and midpoints
  let totalN = 0;
  let runningCum = 0;
  const activeGroups = groups.map((g) => {
    const midpoint = (g.lower + g.upper) / 2;
    const freq = g.frequency;
    totalN += freq;
    runningCum += freq;
    return {
      ...g,
      midpoint,
      cumulative: runningCum,
    };
  });

  if (totalN === 0) return null;

  // 2. Mean: x_bar = Sum(n_i * x_i) / n
  let totalFx = 0;
  for (const g of activeGroups) {
    totalFx += g.frequency * g.midpoint;
  }
  const mean = totalFx / totalN;

  // 3. Variance and Standard Deviation
  let totalFSquaredDev = 0;
  const rows: GroupedRowCalculation[] = activeGroups.map((g) => {
    const fx = g.frequency * g.midpoint;
    const deviation = g.midpoint - mean;
    const squaredDeviation = deviation * deviation;
    const fSquaredDeviation = g.frequency * squaredDeviation;
    totalFSquaredDev += fSquaredDeviation;

    return {
      intervalText: `[${g.lower}; ${g.upper})`,
      lower: g.lower,
      upper: g.upper,
      midpoint: g.midpoint,
      frequency: g.frequency,
      cumulativeFrequency: g.cumulative,
      fx,
      deviation,
      squaredDeviation,
      fSquaredDeviation,
    };
  });

  const varianceUncorrected = totalFSquaredDev / totalN;
  const stdevUncorrected = Math.sqrt(varianceUncorrected);

  const varianceCorrected = totalN >= 2 ? totalFSquaredDev / (totalN - 1) : null;
  const stdevCorrected = varianceCorrected !== null ? Math.sqrt(varianceCorrected) : null;

  // 4. Min, Max, Range (Estimated based on intervals with positive frequency)
  const positiveGroups = activeGroups.filter((g) => g.frequency > 0);
  const firstPos = positiveGroups[0] || activeGroups[0];
  const lastPos = positiveGroups[positiveGroups.length - 1] || activeGroups[activeGroups.length - 1];

  const min = firstPos.lower;
  const max = lastPos.upper;
  const range = max - min;

  // 5. Quartiles by Linear Interpolation
  // Q_p = L + [(k - F) / f] * h
  function interpolateQuartile(
    p: number, // 0.25, 0.5, 0.75
    label: string
  ): QuartileInterpolationDetail {
    const targetPosition = p * totalN; // e.g. n/4, n/2, 3n/4
    let targetGroupIndex = 0;

    for (let i = 0; i < activeGroups.length; i++) {
      if (activeGroups[i].cumulative >= targetPosition && activeGroups[i].frequency > 0) {
        targetGroupIndex = i;
        break;
      }
    }

    const g = activeGroups[targetGroupIndex];
    const L = g.lower;
    const F = targetGroupIndex > 0 ? activeGroups[targetGroupIndex - 1].cumulative : 0;
    const f = g.frequency;
    const h = g.upper - g.lower;

    // Linear interpolation formula
    const result = f > 0 ? L + ((targetPosition - F) / f) * h : L;

    const pFraction = p === 0.25 ? 'n/4' : p === 0.5 ? 'n/2' : '3n/4';
    const formulaString = `${label} = L + [(${pFraction} - F) / f] × h`;
    const substitutionString = `${label} = ${L} + [(${formatNum(targetPosition, digits)} - ${F}) / ${f}] × ${h} = ${formatNum(result, digits)}`;

    return {
      targetPercent: p,
      targetPosition,
      groupIndex: targetGroupIndex + 1,
      intervalText: `[${g.lower}; ${g.upper})`,
      L,
      F,
      f,
      h,
      result,
      formulaString,
      substitutionString,
    };
  }

  const q1Detail = interpolateQuartile(0.25, 'Q1');
  const q2Detail = interpolateQuartile(0.5, 'Q2');
  const q3Detail = interpolateQuartile(0.75, 'Q3');

  const q1 = q1Detail.result;
  const q2 = q2Detail.result;
  const q3 = q3Detail.result;

  // 6. IQR and Outliers
  const iqr = q3 - q1;
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;

  // For grouped data, we note that exact observation outliers cannot be determined without raw data
  const hasOutliers = min < lowerFence || max > upperFence;

  const notes: string[] = [
    'Xmin, Xmax và Khoảng biến thiên R là giá trị ước lượng theo khoảng lớp của các nhóm có tần số dương.',
    'Tứ phân vị Q1, Q2, Q3 được tính bằng công thức nội suy tuyến tính theo phân bố tần số ghép nhóm.',
    'Lưu ý quan trọng: Với dữ liệu ghép nhóm, không thể xác định chính xác từng giá trị quan sát ngoại lệ. Kết luận về ngoại lệ chỉ mang tính chất ước lượng lý thuyết dựa trên phân bố nội suy; cần dữ liệu thô để xác định chính xác.',
  ];

  if (totalN < 2) {
    notes.push('Cỡ mẫu n = 1: Không xác định phương sai và độ lệch chuẩn đã hiệu chỉnh.');
  }

  const stats: DescriptiveStatistics = {
    n: totalN,
    mean,
    varianceUncorrected,
    varianceCorrected,
    stdevUncorrected,
    stdevCorrected,
    min,
    max,
    range,
    q1,
    q2,
    q3,
    iqr,
    lowerFence,
    upperFence,
    whiskerMin: Math.max(min, lowerFence),
    whiskerMax: Math.min(max, upperFence),
    outliers: {
      hasOutliers,
      lowerThreshold: lowerFence,
      upperThreshold: upperFence,
      lowerOutliers: min < lowerFence ? [min] : [],
      upperOutliers: max > upperFence ? [max] : [],
      allOutliers: [
        ...(min < lowerFence ? [min] : []),
        ...(max > upperFence ? [max] : []),
      ],
      isEstimate: true,
      note: 'Ước lượng theo khoảng lớp. Cần số liệu thô để xác định từng quan sát ngoại lệ.',
    },
    isGrouped: true,
    notes,
  };

  const steps: GroupedCalculationSteps = {
    rows,
    totalN,
    totalFx,
    totalFSquaredDeviation: totalFSquaredDev,
    meanCalculation: `x̄ = Σ(nᵢxᵢ) / n = ${formatNum(totalFx, digits)} / ${totalN} = ${formatNum(mean, digits)}`,
    varianceUncorrectedCalculation: `ŝ² = Σ[nᵢ(xᵢ - x̄)²] / n = ${formatNum(totalFSquaredDev, digits)} / ${totalN} = ${formatNum(varianceUncorrected, digits)}`,
    varianceCorrectedCalculation:
      totalN >= 2
        ? `s² = Σ[nᵢ(xᵢ - x̄)²] / (n - 1) = ${formatNum(totalFSquaredDev, digits)} / (${totalN} - 1) = ${formatNum(varianceCorrected, digits)}`
        : 'Không xác định khi n < 2',
    stdevUncorrectedCalculation: `ŝ = √ŝ² = √(${formatNum(varianceUncorrected, digits)}) = ${formatNum(stdevUncorrected, digits)}`,
    stdevCorrectedCalculation:
      stdevCorrected !== null
        ? `s = √s² = √(${formatNum(varianceCorrected, digits)}) = ${formatNum(stdevCorrected, digits)}`
        : 'Không xác định khi n < 2',
    q1Detail,
    q2Detail,
    q3Detail,
    iqrCalculation: `IQR = Q3 - Q1 = ${formatNum(q3, digits)} - ${formatNum(q1, digits)} = ${formatNum(iqr, digits)}`,
    lfCalculation: `LF = Q1 - 1.5 × IQR = ${formatNum(q1, digits)} - 1.5 × ${formatNum(iqr, digits)} = ${formatNum(lowerFence, digits)}`,
    ufCalculation: `UF = Q3 + 1.5 × IQR = ${formatNum(q3, digits)} + 1.5 × ${formatNum(iqr, digits)} = ${formatNum(upperFence, digits)}`,
  };

  return { stats, steps };
}
