export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function openUniformKnots(controlCount, degree) {
  if (!Number.isInteger(controlCount) || !Number.isInteger(degree)) {
    throw new TypeError('controlCount and degree must be integers');
  }
  if (controlCount < degree + 1) {
    throw new RangeError('A B-spline needs at least degree + 1 control points');
  }

  const knotCount = controlCount + degree + 1;
  const knots = new Array(knotCount).fill(0);
  const interiorCount = controlCount - degree - 1;

  for (let i = 0; i <= degree; i += 1) knots[i] = 0;
  for (let i = 1; i <= interiorCount; i += 1) {
    knots[degree + i] = i / (interiorCount + 1);
  }
  for (let i = knotCount - degree - 1; i < knotCount; i += 1) knots[i] = 1;

  return knots;
}

export function findSpan(controlCount, degree, u, knots) {
  const n = controlCount - 1;
  if (u >= knots[n + 1]) return n;
  if (u <= knots[degree]) return degree;

  let low = degree;
  let high = n + 1;
  let mid = Math.floor((low + high) / 2);
  while (u < knots[mid] || u >= knots[mid + 1]) {
    if (u < knots[mid]) high = mid;
    else low = mid;
    mid = Math.floor((low + high) / 2);
  }
  return mid;
}

export function knotMultiplicity(u, knots, epsilon = 1e-8) {
  return knots.reduce((count, knot) => count + (Math.abs(knot - u) <= epsilon ? 1 : 0), 0);
}

export function basisValues(controlCount, degree, knots, uInput) {
  const u = clamp(uInput, knots[degree], knots[controlCount]);
  const values = new Array(controlCount).fill(0);
  const isEnd = Math.abs(u - knots[controlCount]) < 1e-10;

  for (let i = 0; i < controlCount; i += 1) {
    const inSpan = knots[i] <= u && u < knots[i + 1];
    values[i] = inSpan || (isEnd && i === controlCount - 1) ? 1 : 0;
  }

  for (let p = 1; p <= degree; p += 1) {
    const next = new Array(controlCount).fill(0);
    for (let i = 0; i < controlCount; i += 1) {
      const leftDenominator = knots[i + p] - knots[i];
      const rightDenominator = knots[i + p + 1] - knots[i + 1];
      const left = leftDenominator === 0 ? 0 : ((u - knots[i]) / leftDenominator) * values[i];
      const right = rightDenominator === 0 || i + 1 >= controlCount
        ? 0
        : ((knots[i + p + 1] - u) / rightDenominator) * values[i + 1];
      next[i] = left + right;
    }
    for (let i = 0; i < controlCount; i += 1) values[i] = next[i];
  }

  return values;
}

export function evaluateBSpline(controlPoints, degree, knots, u) {
  const basis = basisValues(controlPoints.length, degree, knots, u);
  const dimension = controlPoints[0]?.length ?? 0;
  const point = new Array(dimension).fill(0);

  for (let i = 0; i < controlPoints.length; i += 1) {
    for (let d = 0; d < dimension; d += 1) point[d] += basis[i] * controlPoints[i][d];
  }

  return { point, basis, denominator: 1, rationalBasis: basis };
}

export function evaluateNurbs(controlPoints, weights, degree, knots, u) {
  if (controlPoints.length !== weights.length) {
    throw new RangeError('controlPoints and weights must have the same length');
  }

  const basis = basisValues(controlPoints.length, degree, knots, u);
  const dimension = controlPoints[0]?.length ?? 0;
  const numerator = new Array(dimension).fill(0);
  let denominator = 0;

  for (let i = 0; i < controlPoints.length; i += 1) {
    const weightedBasis = basis[i] * weights[i];
    denominator += weightedBasis;
    for (let d = 0; d < dimension; d += 1) {
      numerator[d] += weightedBasis * controlPoints[i][d];
    }
  }

  const safeDenominator = Math.abs(denominator) < 1e-12 ? 1e-12 : denominator;
  const point = numerator.map((value) => value / safeDenominator);
  const rationalBasis = basis.map((value, i) => (value * weights[i]) / safeDenominator);
  return { point, basis, denominator, rationalBasis };
}

export function sampleCurve(evaluator, samples = 160) {
  const points = [];
  for (let i = 0; i <= samples; i += 1) {
    const u = i / samples;
    points.push(evaluator(u).point);
  }
  return points;
}

export function insertKnotOnce(controlPoints, degree, knots, uInput) {
  const u = clamp(uInput, 0, 1);
  const n = controlPoints.length - 1;
  const m = knots.length - 1;
  const span = findSpan(controlPoints.length, degree, u, knots);
  const multiplicity = knotMultiplicity(u, knots);

  if (multiplicity >= degree + 1 || (u <= knots[degree] && multiplicity >= degree + 1) || (u >= knots[n + 1] && multiplicity >= degree + 1)) {
    return { controlPoints: controlPoints.map((point) => [...point]), knots: [...knots], inserted: false };
  }

  const newControlPoints = new Array(controlPoints.length + 1);
  const newKnots = new Array(knots.length + 1);

  for (let i = 0; i <= span; i += 1) newKnots[i] = knots[i];
  newKnots[span + 1] = u;
  for (let i = span + 1; i <= m; i += 1) newKnots[i + 1] = knots[i];

  for (let i = 0; i <= span - degree; i += 1) newControlPoints[i] = [...controlPoints[i]];
  for (let i = span - multiplicity; i <= n; i += 1) newControlPoints[i + 1] = [...controlPoints[i]];

  for (let i = span - degree + 1; i <= span - multiplicity; i += 1) {
    const denominator = knots[i + degree] - knots[i];
    const alpha = denominator === 0 ? 0 : (u - knots[i]) / denominator;
    newControlPoints[i] = controlPoints[i].map(
      (value, dimension) => alpha * value + (1 - alpha) * controlPoints[i - 1][dimension],
    );
  }

  return { controlPoints: newControlPoints, knots: newKnots, inserted: true };
}

export function maximumCurveDeviation(beforeEvaluator, afterEvaluator, samples = 400) {
  let maximum = 0;
  for (let i = 0; i <= samples; i += 1) {
    const u = i / samples;
    const a = beforeEvaluator(u).point;
    const b = afterEvaluator(u).point;
    let squared = 0;
    for (let d = 0; d < a.length; d += 1) squared += (a[d] - b[d]) ** 2;
    maximum = Math.max(maximum, Math.sqrt(squared));
  }
  return maximum;
}
