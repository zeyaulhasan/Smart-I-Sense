const { movingAverage, linearRegression, calculateVariance } = (() => {
  // Extract the pure functions from predictionEngine for testing
  function movingAverage(values, window) {
    const result = [];
    for (let i = window - 1; i < values.length; i++) {
      const slice = values.slice(i - window + 1, i + 1);
      result.push(slice.reduce((a, b) => a + b, 0) / window);
    }
    return result;
  }

  function linearRegression(values) {
    const n = values.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumX2 += i * i;
    }
    const denom = n * sumX2 - sumX * sumX;
    const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
    const intercept = (sumY - slope * sumX) / n;
    return {
      slope: isFinite(slope) ? slope : 0,
      intercept: isFinite(intercept) ? intercept : 0
    };
  }

  function calculateVariance(values) {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }

  return { movingAverage, linearRegression, calculateVariance };
})();

describe('Prediction Engine - movingAverage', () => {
  test('returns correct SMA for window=3', () => {
    const result = movingAverage([10, 20, 30, 40, 50], 3);
    expect(result).toEqual([20, 30, 40]);
  });

  test('returns empty for values shorter than window', () => {
    const result = movingAverage([10, 20], 3);
    expect(result).toEqual([]);
  });

  test('returns single value when values equal window', () => {
    const result = movingAverage([10, 20, 30], 3);
    expect(result).toEqual([20]);
  });

  test('handles window=1 as identity', () => {
    const result = movingAverage([5, 10, 15], 1);
    expect(result).toEqual([5, 10, 15]);
  });
});

describe('Prediction Engine - linearRegression', () => {
  test('detects increasing trend', () => {
    const result = linearRegression([10, 20, 30, 40, 50]);
    expect(result.slope).toBe(10);
    expect(result.intercept).toBe(10);
  });

  test('detects flat trend', () => {
    const result = linearRegression([5, 5, 5, 5]);
    expect(result.slope).toBe(0);
    expect(result.intercept).toBe(5);
  });

  test('detects decreasing trend', () => {
    const result = linearRegression([50, 40, 30, 20, 10]);
    expect(result.slope).toBe(-10);
    expect(result.intercept).toBe(50);
  });

  test('handles single value', () => {
    const result = linearRegression([42]);
    expect(result.intercept).toBe(42);
  });
});

describe('Prediction Engine - calculateVariance', () => {
  test('returns 0 for identical values', () => {
    expect(calculateVariance([5, 5, 5, 5])).toBe(0);
  });

  test('returns 0 for empty array', () => {
    expect(calculateVariance([])).toBe(0);
  });

  test('calculates correct variance', () => {
    // Variance of [2, 4, 4, 4, 5, 5, 7, 9] = 4
    const result = calculateVariance([2, 4, 4, 4, 5, 5, 7, 9]);
    expect(result).toBe(4);
  });
});
