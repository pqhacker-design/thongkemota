export type DataType = 'ungrouped' | 'grouped';

export interface UngroupedData {
  rawInput: string;
  numbers: number[];
  sortedNumbers: number[];
  isValid: boolean;
  errorMessage?: string;
}

export interface GroupInterval {
  id: string;
  lower: number; // a_i
  upper: number; // b_i
  frequency: number; // n_i
}

export interface GroupedRowCalculation {
  intervalText: string;
  lower: number;
  upper: number;
  midpoint: number; // x_i
  frequency: number; // n_i
  cumulativeFrequency: number; // cf_i
  fx: number; // n_i * x_i
  deviation: number; // x_i - x_bar
  squaredDeviation: number; // (x_i - x_bar)^2
  fSquaredDeviation: number; // n_i * (x_i - x_bar)^2
}

export interface QuartileInterpolationDetail {
  targetPercent: number; // 0.25, 0.5, 0.75
  targetPosition: number; // n/4, n/2, 3n/4
  groupIndex: number;
  intervalText: string;
  L: number; // lower bound of group
  F: number; // cumulative frequency of preceding group
  f: number; // frequency of group
  h: number; // width of group
  result: number;
  formulaString: string;
  substitutionString: string;
}

export interface OutlierAnalysis {
  hasOutliers: boolean;
  lowerThreshold: number; // LF = Q1 - 1.5 * IQR
  upperThreshold: number; // UF = Q3 + 1.5 * IQR
  lowerOutliers: number[];
  upperOutliers: number[];
  allOutliers: number[];
  isEstimate: boolean;
  note?: string;
}

export interface DescriptiveStatistics {
  // 1. Cỡ mẫu
  n: number;
  // 2. Trung bình mẫu
  mean: number;
  // 3. Phương sai mẫu chưa hiệu chỉnh
  varianceUncorrected: number;
  // 4. Phương sai mẫu đã hiệu chỉnh (null nếu n < 2)
  varianceCorrected: number | null;
  // 5. Độ lệch chuẩn chưa hiệu chỉnh
  stdevUncorrected: number;
  // 6. Độ lệch chuẩn đã hiệu chỉnh (null nếu n < 2)
  stdevCorrected: number | null;
  // 7. Giá trị nhỏ nhất
  min: number;
  // 8. Giá trị lớn nhất
  max: number;
  // 9. Khoảng biến thiên
  range: number;
  // 10. Tứ phân vị Q1
  q1: number;
  // 11. Trung vị Q2
  q2: number;
  // 12. Tứ phân vị Q3
  q3: number;
  // 13. Khoảng tứ phân vị IQR
  iqr: number;
  // 14. Ngưỡng dưới LF
  lowerFence: number;
  // 15. Ngưỡng trên UF
  upperFence: number;

  // Box plot specific limits
  whiskerMin: number; // Giá trị nhỏ nhất không phải ngoại lệ (>= LF)
  whiskerMax: number; // Giá trị lớn nhất không phải ngoại lệ (<= UF)

  // Outliers
  outliers: OutlierAnalysis;

  // Metadata
  isGrouped: boolean;
  notes?: string[];
}

export interface UngroupedCalculationSteps {
  sortedList: number[];
  sum: number;
  meanFormula: string;
  meanCalculation: string;
  medianCalculation: string;
  medianMethodExplanation: string;
  lowerHalf: number[];
  upperHalf: number[];
  q1Calculation: string;
  q3Calculation: string;
  iqrCalculation: string;
  lfCalculation: string;
  ufCalculation: string;
  varianceUncorrectedFormula: string;
  varianceUncorrectedCalculation: string;
  varianceCorrectedFormula: string;
  varianceCorrectedCalculation: string;
  stdevUncorrectedCalculation: string;
  stdevCorrectedCalculation: string;
  detailedRows: {
    index: number;
    value: number;
    diff: number;
    diffSquared: number;
  }[];
  sumSquaredDiffs: number;
}

export interface GroupedCalculationSteps {
  rows: GroupedRowCalculation[];
  totalN: number;
  totalFx: number;
  totalFSquaredDeviation: number;
  meanCalculation: string;
  varianceUncorrectedCalculation: string;
  varianceCorrectedCalculation: string;
  stdevUncorrectedCalculation: string;
  stdevCorrectedCalculation: string;
  q1Detail: QuartileInterpolationDetail;
  q2Detail: QuartileInterpolationDetail;
  q3Detail: QuartileInterpolationDetail;
  iqrCalculation: string;
  lfCalculation: string;
  ufCalculation: string;
}
