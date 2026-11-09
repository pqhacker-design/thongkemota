export interface SimpleDataPoint {
  id: string;
  x: number;
  y: number;
}

export interface SimpleResidualRow {
  index: number;
  x: number;
  y: number;
  yPred: number;
  residual: number; // e = y - yPred
  residualSquared: number; // e^2
}

export interface SimpleRegressionResult {
  n: number;
  meanX: number;
  meanY: number;
  varX: number;
  varY: number;
  sdX: number;
  sdY: number;
  covXY: number;
  pearsonR: number; // r in [-1, 1]
  rSquared: number; // R^2 = r^2 in [0, 1]
  b0: number; // intercept
  b1: number; // slope
  sse: number; // Sum of Squared Errors
  ssr: number; // Sum of Squares Regression
  sst: number; // Total Sum of Squares
  ser: number | null; // Standard Error of Regression = sqrt(SSE / (n - 2))
  rmse: number; // Root Mean Square Error = sqrt(SSE / n)
  equationString: string;
  rows: SimpleResidualRow[];
  interpretation: {
    b0Meaning: string;
    b0Warning?: string;
    b1Meaning: string;
    rMeaning: string;
    rSquaredMeaning: string;
    limitations: string[];
  };
}

export interface MultipleDataRow {
  id: string;
  values: number[]; // [X1, X2, ..., Xk, Y]
}

export interface MultipleResidualRow {
  index: number;
  xValues: number[];
  y: number;
  yPred: number;
  residual: number;
  residualSquared: number;
}

export interface MultipleRegressionResult {
  n: number;
  k: number; // number of independent variables
  variableNames: string[]; // ['X1', 'X2', ..., 'Xk']
  depVariableName: string; // 'Y'
  means: number[]; // means of X1..Xk, then Y
  stdDevs: number[]; // std devs of X1..Xk, then Y
  correlationMatrix: {
    headers: string[];
    matrix: number[][]; // (k+1) x (k+1) Pearson matrix
  };
  covarianceMatrix: {
    headers: string[];
    matrix: number[][];
  };
  coefficients: {
    name: string; // 'b0', 'b1', ...
    variableName: string; // 'Hệ số chặn', 'X1', 'X2', ...
    value: number;
    description: string;
    formula?: string;
    calculationSteps?: string;
  }[];
  xtxMatrix?: number[][];
  xtyVector?: number[];
  equationString: string;
  sse: number;
  ssr: number;
  sst: number;
  rSquared: number;
  adjRSquared: number | null; // null if n <= k + 1
  ser: number | null; // null if n <= k + 1
  rmse: number;
  multipleR: number; // sqrt(R^2)
  rows: MultipleResidualRow[];
  degreeOfFreedomWarning?: string;
  multicollinearityWarning?: string;
  interpretation: {
    b0Meaning: string;
    coefficientsMeaning: {
      name: string;
      meaning: string;
      direction: 'positive' | 'negative' | 'zero';
    }[];
    rMeaning: string;
    rSquaredMeaning: string;
    limitations: string[];
  };
}
