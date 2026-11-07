/**
 * Linear Algebra & Matrix operations utility for Ordinary Least Squares (OLS)
 * Designed for numerical stability, singularity detection, and perfect multicollinearity checks.
 */

export function transpose(matrix: number[][]): number[][] {
  const rows = matrix.length;
  if (rows === 0) return [];
  const cols = matrix[0].length;
  const res: number[][] = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      res[j][i] = matrix[i][j];
    }
  }
  return res;
}

export function multiply(a: number[][], b: number[][]): number[][] {
  const rowsA = a.length;
  const colsA = a[0].length;
  const rowsB = b.length;
  const colsB = b[0].length;

  if (colsA !== rowsB) {
    throw new Error(`Matrix dimensions mismatch: ${colsA} !== ${rowsB}`);
  }

  const res: number[][] = Array.from({ length: rowsA }, () => Array(colsB).fill(0));

  for (let i = 0; i < rowsA; i++) {
    for (let j = 0; j < colsB; j++) {
      let sum = 0;
      for (let k = 0; k < colsA; k++) {
        sum += a[i][k] * b[k][j];
      }
      res[i][j] = sum;
    }
  }
  return res;
}

export function multiplyVector(matrix: number[][], vector: number[]): number[] {
  const rows = matrix.length;
  const cols = matrix[0].length;
  if (cols !== vector.length) {
    throw new Error(`Matrix columns (${cols}) must match vector length (${vector.length})`);
  }
  const res: number[] = Array(rows).fill(0);
  for (let i = 0; i < rows; i++) {
    let sum = 0;
    for (let j = 0; j < cols; j++) {
      sum += matrix[i][j] * vector[j];
    }
    res[i] = sum;
  }
  return res;
}

/**
 * Solves A * x = b using Gaussian elimination with partial pivoting.
 * Returns null if matrix is singular or near-singular (perfect multicollinearity).
 */
export function solveLinearSystem(A: number[][], b: number[], tol = 1e-10): number[] | null {
  const n = A.length;
  if (n === 0 || A[0].length !== n || b.length !== n) {
    return null;
  }

  // Create augmented matrix [A | b]
  const M: number[][] = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    // 1. Partial pivoting: find maximum element in current column
    let maxRow = col;
    let maxVal = Math.abs(M[col][col]);
    for (let row = col + 1; row < n; row++) {
      const val = Math.abs(M[row][col]);
      if (val > maxVal) {
        maxVal = val;
        maxRow = row;
      }
    }

    // Check singularity
    if (maxVal < tol) {
      return null; // Matrix is singular or multicollinear!
    }

    // Swap current row with maxRow
    if (maxRow !== col) {
      const temp = M[col];
      M[col] = M[maxRow];
      M[maxRow] = temp;
    }

    // 2. Eliminate entries below pivot
    const pivot = M[col][col];
    for (let row = col + 1; row < n; row++) {
      const factor = M[row][col] / pivot;
      M[row][col] = 0;
      for (let j = col + 1; j <= n; j++) {
        M[row][j] -= factor * M[col][j];
      }
    }
  }

  // 3. Back-substitution
  const x: number[] = Array(n).fill(0);
  for (let row = n - 1; row >= 0; row--) {
    let sum = M[row][n];
    for (let col = row + 1; col < n; col++) {
      sum -= M[row][col] * x[col];
    }
    const pivot = M[row][row];
    if (Math.abs(pivot) < tol) {
      return null;
    }
    x[row] = sum / pivot;
  }

  return x;
}

/**
 * Inverts a square matrix using Gauss-Jordan with partial pivoting.
 * Returns null if matrix is singular.
 */
export function invertMatrix(A: number[][], tol = 1e-10): number[][] | null {
  const n = A.length;
  if (n === 0 || A[0].length !== n) return null;

  // Augment A with Identity matrix
  const M: number[][] = A.map((row, i) => {
    const ident = Array(n).fill(0);
    ident[i] = 1;
    return [...row, ...ident];
  });

  for (let col = 0; col < n; col++) {
    // Find pivot
    let maxRow = col;
    let maxVal = Math.abs(M[col][col]);
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(M[row][col]) > maxVal) {
        maxVal = Math.abs(M[row][col]);
        maxRow = row;
      }
    }

    if (maxVal < tol) return null;

    // Swap
    if (maxRow !== col) {
      const tmp = M[col];
      M[col] = M[maxRow];
      M[maxRow] = tmp;
    }

    // Normalize pivot row
    const pivot = M[col][col];
    for (let j = 0; j < 2 * n; j++) {
      M[col][j] /= pivot;
    }

    // Eliminate other rows
    for (let row = 0; row < n; row++) {
      if (row !== col) {
        const factor = M[row][col];
        for (let j = 0; j < 2 * n; j++) {
          M[row][j] -= factor * M[col][j];
        }
      }
    }
  }

  // Extract right half
  return M.map((row) => row.slice(n));
}
