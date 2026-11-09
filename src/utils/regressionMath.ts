import {
  SimpleDataPoint,
  SimpleRegressionResult,
  SimpleResidualRow,
  MultipleRegressionResult,
  MultipleResidualRow,
} from '../types/regression';
import { formatNum } from './mathStatistics';
import { multiply, multiplyVector, solveLinearSystem, transpose } from './matrixMath';

/**
 * Parses raw text input for Simple Linear Regression (two columns: X and Y).
 * Accepts tab, comma, semicolon, or space delimiters.
 */
export function parseSimpleRegressionInput(text: string): {
  points: SimpleDataPoint[];
  invalidLines: string[];
} {
  if (!text || !text.trim()) return { points: [], invalidLines: [] };

  const lines = text.trim().split(/\r?\n/);
  const points: SimpleDataPoint[] = [];
  const invalidLines: string[] = [];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Split by tab, comma, semicolon, or whitespace
    // If comma is decimal separator (e.g. "3,5; 7,2"), detect semicolon
    let processed = trimmed;
    if (processed.includes(';')) {
      processed = processed.replace(/,/g, '.').replace(/;/g, '\t');
    } else if (processed.includes('\t')) {
      // standard tab
    } else if (processed.includes(',')) {
      processed = processed.replace(/,/g, '\t');
    }

    const tokens = processed.split(/[\t\s]+/).filter(Boolean);
    if (tokens.length >= 2) {
      const x = Number(tokens[0]);
      const y = Number(tokens[1]);
      if (!Number.isNaN(x) && Number.isFinite(x) && !Number.isNaN(y) && Number.isFinite(y)) {
        points.push({
          id: (idx + 1).toString(),
          x,
          y,
        });
        return;
      }
    }
    invalidLines.push(trimmed);
  });

  return { points, invalidLines };
}

/**
 * Calculates complete Simple Linear Regression and Correlation metrics.
 */
export function calculateSimpleLinearRegression(
  points: SimpleDataPoint[],
  digits: number = 4
): SimpleRegressionResult | null {
  const n = points.length;
  if (n < 2) return null;

  // 1. Means
  let sumX = 0;
  let sumY = 0;
  for (const pt of points) {
    sumX += pt.x;
    sumY += pt.y;
  }
  const meanX = sumX / n;
  const meanY = sumY / n;

  // 2. Sum of squares and cross-products
  let ssxx = 0;
  let ssyy = 0;
  let ssxy = 0;
  for (const pt of points) {
    const dx = pt.x - meanX;
    const dy = pt.y - meanY;
    ssxx += dx * dx;
    ssyy += dy * dy;
    ssxy += dx * dy;
  }

  // Check variance of X: if variance of X is zero, slope cannot be determined
  if (ssxx < 1e-12) {
    throw new Error(
      'Biến độc lập X không có sự biến thiên (tất cả các giá trị X đều bằng nhau). Không thể xác định đường hồi quy tuyến tính!'
    );
  }

  // 3. Variances & Standard deviations
  const varX = ssxx / (n - 1);
  const varY = ssyy / (n - 1);
  const sdX = Math.sqrt(varX);
  const sdY = Math.sqrt(varY);
  const covXY = ssxy / (n - 1);

  // 4. Pearson correlation coefficient r
  let pearsonR = 0;
  if (ssyy < 1e-12) {
    // Y is constant
    pearsonR = 0;
  } else {
    pearsonR = ssxy / Math.sqrt(ssxx * ssyy);
    // Clamp to [-1, 1] to avoid float precision drift
    pearsonR = Math.max(-1, Math.min(1, pearsonR));
  }

  // 5. OLS Slope b1 and Intercept b0
  const b1 = ssxy / ssxx;
  const b0 = meanY - b1 * meanX;

  // 6. Predicted values & residuals
  let sse = 0;
  const rows: SimpleResidualRow[] = points.map((pt, idx) => {
    const yPred = b0 + b1 * pt.x;
    const residual = pt.y - yPred;
    const residualSquared = residual * residual;
    sse += residualSquared;
    return {
      index: idx + 1,
      x: pt.x,
      y: pt.y,
      yPred,
      residual,
      residualSquared,
    };
  });

  const sst = ssyy;
  const ssr = Math.max(0, sst - sse);

  // 7. R^2 (Coefficient of determination)
  const rSquared = sst > 1e-12 ? Math.max(0, Math.min(1, 1 - sse / sst)) : 1;

  // 8. SER and RMSE
  const ser = n > 2 ? Math.sqrt(sse / (n - 2)) : null;
  const rmse = Math.sqrt(sse / n);

  // Format equation string cleanly (y = a + bx)
  const b0Str = formatNum(b0, digits);
  const b1AbsStr = formatNum(Math.abs(b1), digits);
  const b1Sign = b1 >= 0 ? '+' : '-';
  const equationString = `Ŷ = ${b0Str} ${b1Sign} ${b1AbsStr}X`;

  // 9. Detailed Mathematical Interpretations
  const minX = Math.min(...points.map((p) => p.x));
  const maxX = Math.max(...points.map((p) => p.x));
  const isZeroInRange = 0 >= minX && 0 <= maxX;

  const b0Meaning = `Khi biến độc lập X = 0, giá trị dự đoán trung bình của Y là hệ số chặn a = ${formatNum(b0, digits)}.`;
  const b0Warning = !isZeroInRange
    ? `Cảnh báo: Giá trị X = 0 nằm ngoài phạm vi dữ liệu quan sát [${formatNum(minX, 2)}; ${formatNum(maxX, 2)}]. Vì vậy, hệ số chặn a chủ yếu mang ý nghĩa định vị toán học cho đường hồi quy trên mặt phẳng tọa độ, không nên diễn giải theo nghĩa thực tiễn nếu không có căn cứ chuyên môn.`
    : undefined;

  let b1TrendDesc = '';
  if (Math.abs(b1) < 1e-9) {
    b1TrendDesc = 'Hệ số góc b ≈ 0: Đường hồi quy nằm ngang, biến X không mang lại đóng góp dự đoán tuyến tính cho Y.';
  } else if (b1 > 0) {
    b1TrendDesc = `Hệ số góc b > 0 (${formatNum(b1, digits)}): Y có xu hướng tăng tuyến tính khi X tăng. Cụ thể, khi X tăng thêm 1 đơn vị, giá trị dự đoán trung bình của Y tăng ${formatNum(b1, digits)} đơn vị.`;
  } else {
    b1TrendDesc = `Hệ số góc b < 0 (${formatNum(b1, digits)}): Y có xu hướng giảm tuyến tính khi X tăng. Cụ thể, khi X tăng thêm 1 đơn vị, giá trị dự đoán trung bình của Y giảm ${formatNum(Math.abs(b1), digits)} đơn vị.`;
  }

  const b1Meaning = `${b1TrendDesc} (Lưu ý: Hệ số góc b phản ánh mức thay đổi của giá trị dự đoán trung bình Ŷ, không có nghĩa là mọi quan sát thực tế đều thay đổi đúng bằng b).`;

  let rDesc = '';
  const absR = Math.abs(pearsonR);
  if (absR >= 0.9) rDesc = 'Mối liên hệ tuyến tính rất chặt chẽ';
  else if (absR >= 0.7) rDesc = 'Mối liên hệ tuyến tính chặt chẽ';
  else if (absR >= 0.5) rDesc = 'Mối liên hệ tuyến tính trung bình';
  else if (absR >= 0.3) rDesc = 'Mối liên hệ tuyến tính yếu';
  else rDesc = 'Tương quan tuyến tính rất yếu hoặc không đáng kể';

  const rDirection = pearsonR > 0 ? 'thuận chiều' : pearsonR < 0 ? 'nghịch chiều' : 'không tương quan';
  const rMeaning = `Hệ số tương quan Pearson r = ${formatNum(pearsonR, digits)} cho thấy hai biến có tương quan ${rDirection} (${rDesc}).`;

  const rSquaredPct = (rSquared * 100).toFixed(2);
  const rSquaredMeaning = `Hệ số xác định R² = ${formatNum(rSquared, digits)} (${rSquaredPct}%): Mô hình hồi quy tuyến tính giải thích được ${rSquaredPct}% tổng biến thiên của biến phụ thuộc Y trong mẫu số liệu quan sát.`;

  const limitations = [
    'Tương quan không đồng nghĩa với quan hệ nhân quả: Hệ số tương quan cao chỉ phản ánh quy luật đồng biến thiên tuyến tính, không chứng minh biến X gây ra biến Y.',
    'Phạm vi dự đoán: Chỉ nên dự đoán trong miền dữ liệu quan sát [x_min; x_max]. Ngoại suy quá xa có thể dẫn đến sai số nghiêm trọng.',
    'Hệ số xác định R² không phải là xác suất dự đoán chính xác và không đánh giá liệu mô hình có vi phạm các giả định hồi quy hay không.',
  ];

  return {
    n,
    meanX,
    meanY,
    varX,
    varY,
    sdX,
    sdY,
    covXY,
    pearsonR,
    rSquared,
    b0,
    b1,
    sse,
    ssr,
    sst,
    ser,
    rmse,
    equationString,
    rows,
    interpretation: {
      b0Meaning,
      b0Warning,
      b1Meaning,
      rMeaning,
      rSquaredMeaning,
      limitations,
    },
  };
}

/**
 * Calculates Multiple Linear Regression using OLS via Normal Equations (X^T * X) * beta = X^T * Y
 * Supports 2 to 10 independent variables.
 */
export function calculateMultipleLinearRegression(
  variableNames: string[], // [X1, X2, ..., Xk]
  rows: number[][], // each row is [x1, x2, ..., xk, y]
  digits: number = 4
): MultipleRegressionResult {
  const n = rows.length;
  const k = variableNames.length;

  if (n < 2) {
    throw new Error('Cỡ mẫu phải có ít nhất 2 quan sát.');
  }
  if (k < 2 || k > 10) {
    throw new Error('Số lượng biến độc lập phải từ 2 đến 10 biến.');
  }

  // Check columns per row
  for (let i = 0; i < n; i++) {
    if (rows[i].length !== k + 1) {
      throw new Error(`Dòng ${i + 1} không đủ ${k + 1} giá trị (cần ${k} biến X và 1 biến Y).`);
    }
    for (let j = 0; j <= k; j++) {
      if (Number.isNaN(rows[i][j]) || !Number.isFinite(rows[i][j])) {
        throw new Error(`Dòng ${i + 1}, cột ${j + 1} có giá trị không hợp lệ.`);
      }
    }
  }

  // 1. Calculate means and standard deviations for all columns
  const allHeaders = [...variableNames, 'Y'];
  const means: number[] = Array(k + 1).fill(0);
  for (const r of rows) {
    for (let j = 0; j <= k; j++) {
      means[j] += r[j];
    }
  }
  for (let j = 0; j <= k; j++) {
    means[j] /= n;
  }

  const stdDevs: number[] = Array(k + 1).fill(0);
  for (const r of rows) {
    for (let j = 0; j <= k; j++) {
      const diff = r[j] - means[j];
      stdDevs[j] += diff * diff;
    }
  }

  for (let j = 0; j < k; j++) {
    if (stdDevs[j] < 1e-12) {
      throw new Error(
        `Biến độc lập ${variableNames[j]} không có sự biến thiên (phương sai bằng 0). Không thể đưa vào mô hình hồi quy!`
      );
    }
  }

  for (let j = 0; j <= k; j++) {
    stdDevs[j] = Math.sqrt(stdDevs[j] / (n - 1));
  }

  // 2. Correlation Matrix & Covariance Matrix between all variables (k+1 x k+1)
  const corrMatrix: number[][] = Array.from({ length: k + 1 }, () => Array(k + 1).fill(1));
  const covMatrix: number[][] = Array.from({ length: k + 1 }, () => Array(k + 1).fill(0));

  for (let i = 0; i <= k; i++) {
    for (let j = 0; j <= k; j++) {
      if (i === j) {
        corrMatrix[i][j] = 1;
        covMatrix[i][j] = stdDevs[i] * stdDevs[i];
      } else {
        let sumProd = 0;
        for (const r of rows) {
          sumProd += (r[i] - means[i]) * (r[j] - means[j]);
        }
        const cov = sumProd / (n - 1);
        covMatrix[i][j] = cov;

        const denom = (n - 1) * stdDevs[i] * stdDevs[j];
        const rVal = denom > 1e-12 ? Math.max(-1, Math.min(1, sumProd / denom)) : 0;
        corrMatrix[i][j] = rVal;
      }
    }
  }

  // 3. Construct Design Matrix X (n x (k + 1)) with intercept column of 1s
  // and vector Y (n x 1)
  const X_mat: number[][] = rows.map((r) => [1, ...r.slice(0, k)]);
  const Y_vec: number[] = rows.map((r) => r[k]);

  // Compute X^T and normal equations: (X^T * X) * beta = X^T * Y
  const XT = transpose(X_mat);
  const XTX = multiply(XT, X_mat);
  const XTY = multiplyVector(XT, Y_vec);

  // Solve for beta coefficients
  const beta = solveLinearSystem(XTX, XTY);
  if (!beta) {
    throw new Error(
      'Ma trận thiết kế bị suy biến (Singular Matrix) hoặc xảy ra hiện tượng Đa cộng tuyến hoàn hảo (Perfect Multicollinearity). Một hoặc nhiều biến độc lập là tổ hợp tuyến tính chính xác của các biến khác. Vui lòng kiểm tra và loại bỏ biến phụ thuộc tuyến tính!'
    );
  }

  const b0 = beta[0];
  const slopeCoeffs = beta.slice(1);

  // 4. Calculate predictions and residuals
  let sse = 0;
  const meanY = means[k];
  let sst = 0;

  const residualRows: MultipleResidualRow[] = rows.map((r, idx) => {
    const xVals = r.slice(0, k);
    const y = r[k];

    let yPred = b0;
    for (let j = 0; j < k; j++) {
      yPred += slopeCoeffs[j] * xVals[j];
    }

    const residual = y - yPred;
    const residualSquared = residual * residual;
    sse += residualSquared;
    sst += (y - meanY) * (y - meanY);

    return {
      index: idx + 1,
      xValues: xVals,
      y,
      yPred,
      residual,
      residualSquared,
    };
  });

  const ssr = Math.max(0, sst - sse);
  const rSquared = sst > 1e-12 ? Math.max(0, Math.min(1, 1 - sse / sst)) : 1;
  const multipleR = Math.sqrt(rSquared);

  // Degrees of freedom checks
  const dfResidual = n - k - 1;
  let adjRSquared: number | null = null;
  let ser: number | null = null;
  let degreeOfFreedomWarning: string | undefined = undefined;

  if (dfResidual <= 0) {
    degreeOfFreedomWarning = `Cỡ mẫu n = ${n} không đủ bậc tự do so với số biến độc lập k = ${k} (cần n > k + 1 = ${k + 1}). Không thể xác định sai số chuẩn hồi quy SER.`;
  } else {
    adjRSquared = 1 - ((1 - rSquared) * (n - 1)) / dfResidual;
    ser = Math.sqrt(sse / dfResidual);
  }

  const rmse = Math.sqrt(sse / n);

  // 5. Build Equation String
  let eqStr = `Ŷ = ${formatNum(b0, digits)}`;
  for (let j = 0; j < k; j++) {
    const bVal = slopeCoeffs[j];
    const sign = bVal >= 0 ? '+' : '-';
    eqStr += ` ${sign} ${formatNum(Math.abs(bVal), digits)}${variableNames[j]}`;
  }

  const coefficients = [
    {
      name: 'b₀',
      variableName: 'Hệ số chặn (Intercept)',
      value: b0,
      description: 'Giá trị dự đoán trung bình của Y khi tất cả các biến độc lập đều bằng 0',
      formula: 'b₀ = Ȳ - ∑ⱼ₌₁ᵏ bⱼX̄ⱼ',
      calculationSteps: `Ȳ - (${variableNames.map((_, j) => `${formatNum(slopeCoeffs[j], digits)}×${formatNum(means[j], digits)}`).join(' + ')})`,
    },
    ...variableNames.map((name, j) => ({
      name: `b${j + 1}`,
      variableName: `Hệ số riêng phần của ${name}`,
      value: slopeCoeffs[j],
      description: `Mức thay đổi dự đoán của Y khi ${name} tăng 1 đơn vị (các biến khác giữ nguyên)`,
      formula: `Nghiệm OLS: β̂ = (XᵀX)⁻¹XᵀY`,
      calculationSteps: `Phần tử [${j + 1}] của vectơ β̂ giải từ hệ phương trình chuẩn (XᵀX)β = XᵀY`,
    })),
  ];

  const b0Meaning = `Hệ số chặn b₀ = ${formatNum(b0, digits)}: Là giá trị dự đoán trung bình của biến phụ thuộc Y khi tất cả các biến độc lập (${variableNames.join(', ')}) đồng thời bằng 0. (Lưu ý: Nếu trạng thái tất cả X = 0 không khả thi hoặc nằm ngoài phạm vi thực nghiệm, b₀ chỉ có ý nghĩa vị trí toán học).`;

  const coefficientsMeaning = variableNames.map((name, j) => {
    const val = slopeCoeffs[j];
    const dir: 'positive' | 'negative' | 'zero' =
      Math.abs(val) < 1e-9 ? 'zero' : val > 0 ? 'positive' : 'negative';

    let meaning = '';
    if (dir === 'zero') {
      meaning = `Hệ số của ${name} (b${j + 1} ≈ 0): Biến ${name} hầu như không có đóng góp tuyến tính riêng phần vào mô hình ước lượng khi đã kiểm soát các biến còn lại.`;
    } else if (dir === 'positive') {
      meaning = `Hệ số của ${name} (b${j + 1} = ${formatNum(val, digits)} > 0): Có tác động tuyến tính riêng phần cùng chiều. Cụ thể, khi ${name} tăng thêm 1 đơn vị và giữ nguyên tất cả các biến độc lập còn lại (ceteris paribus), giá trị dự đoán trung bình của Y sẽ tăng ${formatNum(val, digits)} đơn vị.`;
    } else {
      meaning = `Hệ số của ${name} (b${j + 1} = ${formatNum(val, digits)} < 0): Có tác động tuyến tính riêng phần ngược chiều. Cụ thể, khi ${name} tăng thêm 1 đơn vị và giữ nguyên tất cả các biến độc lập còn lại (ceteris paribus), giá trị dự đoán trung bình của Y sẽ giảm ${formatNum(Math.abs(val), digits)} đơn vị.`;
    }

    return {
      name,
      meaning,
      direction: dir,
    };
  });

  const rMeaning = `Hệ số tương quan bội R = ${formatNum(multipleR, digits)}: Đo lường mức độ liên hệ tuyến tính tổng hợp giữa biến phụ thuộc Y và tập hợp ${k} biến độc lập (${variableNames.join(', ')}). R càng gần 1 chứng tỏ mối liên hệ tuyến tính tổng hợp càng chặt chẽ. (Lưu ý: Không được nhầm R với hệ số tương quan từng cặp Pearson r).`;

  const rSquaredPct = (rSquared * 100).toFixed(2);
  const rSquaredMeaning = `Hệ số xác định R² = ${formatNum(rSquared, digits)}: Cho biết mô hình hồi quy giải thích được ${rSquaredPct}% tổng biến thiên của biến phụ thuộc Y trong mẫu số liệu quan sát (tương ứng biến thiên giải thích SSR = ${formatNum(ssr, digits)} trên tổng bình phương độ lệch SST = ${formatNum(sst, digits)}).`;

  const limitations = [
    'Điều kiện các biến khác giữ nguyên (Ceteris Paribus): Ý nghĩa của từng hệ số riêng phần bⱼ dựa trên giả định giữ cố định các biến còn lại. Trong thực tế, các biến độc lập thường có tương quan với nhau.',
    'Chưa khẳng định ý nghĩa thống kê: Các hệ số bⱼ ở đây là kết quả ước lượng toán học OLS trên mẫu. Không được kết luận một biến là "có ý nghĩa thống kê" đối với Y nếu chưa thực hiện các kiểm định giả thuyết (như t-test cho từng hệ số hoặc F-test cho toàn bộ mô hình).',
    'Tương quan bội không đồng nghĩa với quan hệ nhân quả.',
  ];

  return {
    n,
    k,
    variableNames,
    depVariableName: 'Y',
    means,
    stdDevs,
    correlationMatrix: {
      headers: allHeaders,
      matrix: corrMatrix,
    },
    covarianceMatrix: {
      headers: allHeaders,
      matrix: covMatrix,
    },
    coefficients,
    xtxMatrix: XTX,
    xtyVector: XTY,
    equationString: eqStr,
    sse,
    ssr,
    sst,
    rSquared,
    adjRSquared,
    ser,
    rmse,
    multipleR,
    rows: residualRows,
    degreeOfFreedomWarning,
    interpretation: {
      b0Meaning,
      coefficientsMeaning,
      rMeaning,
      rSquaredMeaning,
      limitations,
    },
  };
}
