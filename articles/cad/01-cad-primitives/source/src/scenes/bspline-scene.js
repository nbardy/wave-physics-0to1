import { InteractiveScene } from '../core/scene.js';
import {
  evaluateBSpline,
  insertKnotOnce,
  maximumCurveDeviation,
  openUniformKnots,
  sampleCurve,
} from '../math/bspline.js';
import { ortho4 } from '../math/linear.js';
import {
  makeCube,
  makeLineSegments,
  makeLineStrip,
  makeRibbon,
  palette,
  withAlpha,
} from '../core/geometry.js';

const DEFAULT_POINTS = [
  [-1.16, -0.38, 0],
  [-0.92, 0.48, 0],
  [-0.53, 0.72, 0],
  [-0.08, 0.08, 0],
  [0.34, -0.22, 0],
  [0.73, 0.62, 0],
  [1.12, 0.28, 0],
];

export class BSplineScene extends InteractiveScene {
  constructor() {
    super('bspline', { orbit: false });
    this.degree = 3;
    this.controlPoints = DEFAULT_POINTS.map((point) => [...point]);
    this.knots = openUniformKnots(this.controlPoints.length, this.degree);
    this.u = 0.42;
    this.selectedIndex = 2;
    this.lastInsertionError = 0;
  }

  bindControls() {
    this.uInput = document.querySelector('#bspline-u');
    this.degreeSelect = document.querySelector('#bspline-degree');
    this.pointSelect = document.querySelector('#bspline-point');
    this.insertButton = document.querySelector('#bspline-insert');
    this.errorOutput = document.querySelector('#bspline-error');

    this.uInput?.addEventListener('input', () => {
      this.u = Number(this.uInput.value);
      this.uInput.nextElementSibling.value = this.u.toFixed(3);
      this.requestRender();
    });

    this.degreeSelect?.addEventListener('change', () => {
      this.degree = Number(this.degreeSelect.value);
      if (this.controlPoints.length < this.degree + 1) this.controlPoints = DEFAULT_POINTS.map((point) => [...point]);
      this.knots = openUniformKnots(this.controlPoints.length, this.degree);
      this.lastInsertionError = 0;
      this.updatePointSelect();
      this.updateOutputs();
      this.requestRender();
    });

    this.pointSelect?.addEventListener('change', () => {
      this.selectedIndex = Number(this.pointSelect.value);
      this.requestRender();
    });

    this.insertButton?.addEventListener('click', () => this.insertKnot());
    this.updatePointSelect();
    this.updateOutputs();
  }

  getMvp() {
    const rect = this.canvas.getBoundingClientRect();
    const aspect = Math.max(0.65, rect.width / Math.max(1, rect.height));
    const halfWidth = 1.38;
    const halfHeight = halfWidth / aspect;
    return ortho4(-halfWidth, halfWidth, -Math.max(1, halfHeight), Math.max(1, halfHeight), -2, 2);
  }

  evaluate(u) {
    return evaluateBSpline(this.controlPoints, this.degree, this.knots, u);
  }

  updatePointSelect() {
    if (!this.pointSelect) return;
    this.selectedIndex = Math.min(this.selectedIndex, this.controlPoints.length - 1);
    this.pointSelect.replaceChildren();
    this.controlPoints.forEach((_, index) => {
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = `P${index}`;
      option.selected = index === this.selectedIndex;
      this.pointSelect.append(option);
    });
  }

  updateOutputs() {
    if (this.uInput) {
      this.uInput.value = String(this.u);
      this.uInput.nextElementSibling.value = this.u.toFixed(3);
    }
    if (this.degreeSelect) this.degreeSelect.value = String(this.degree);
    if (this.pointSelect) this.pointSelect.value = String(this.selectedIndex);
    if (this.errorOutput) this.errorOutput.value = `Δ = ${this.lastInsertionError.toExponential(1)}`;
  }

  insertKnot() {
    if (this.controlPoints.length >= 16) return;
    const beforePoints = this.controlPoints.map((point) => [...point]);
    const beforeKnots = [...this.knots];
    const beforeDegree = this.degree;
    const beforeEvaluator = (u) => evaluateBSpline(beforePoints, beforeDegree, beforeKnots, u);
    const result = insertKnotOnce(this.controlPoints, this.degree, this.knots, this.u);
    if (!result.inserted) return;

    this.controlPoints = result.controlPoints;
    this.knots = result.knots;
    const afterEvaluator = (u) => evaluateBSpline(this.controlPoints, this.degree, this.knots, u);
    this.lastInsertionError = maximumCurveDeviation(beforeEvaluator, afterEvaluator);
    this.selectedIndex = Math.min(this.selectedIndex + 1, this.controlPoints.length - 1);
    this.updatePointSelect();
    this.updateOutputs();
    this.setHighlight('knot', true);
  }

  buildDrawables() {
    const drawables = [];
    const evaluation = this.evaluate(this.u);
    this.evaluationPoint = [...evaluation.point.slice(0, 2), 0.035];
    this.activeBasis = evaluation.basis;

    const curvePoints = sampleCurve((u) => this.evaluate(u), 220).map((point) => [point[0], point[1], 0.015]);
    const selectedSupportStart = this.knots[this.selectedIndex] ?? 0;
    const selectedSupportEnd = this.knots[this.selectedIndex + this.degree + 1] ?? 1;
    const supportPoints = [];
    for (let i = 0; i <= 110; i += 1) {
      const u = selectedSupportStart + (selectedSupportEnd - selectedSupportStart) * (i / 110);
      const point = this.evaluate(u).point;
      supportPoints.push([point[0], point[1], 0.024]);
    }

    const curveColor = this.highlightTerm === 'curve' ? palette.amber : palette.cyan;
    drawables.push(makeRibbon(curvePoints, this.highlightTerm === 'curve' ? 0.034 : 0.022, curveColor, 4));

    if (['control', 'basis', 'degree'].includes(this.highlightTerm)) {
      drawables.push(makeRibbon(supportPoints, 0.038, withAlpha(palette.violet, 0.82), 5));
    }

    drawables.push(makeLineStrip(this.controlPoints.map((point) => [point[0], point[1], -0.015]), palette.whiteDim, false, 8));

    const contributionSegments = [];
    evaluation.basis.forEach((value, index) => {
      if (value < 0.001) return;
      contributionSegments.push({
        a: [this.controlPoints[index][0], this.controlPoints[index][1], 0.03],
        b: this.evaluationPoint,
        color: withAlpha(this.highlightTerm === 'sum' || this.highlightTerm === 'basis' ? palette.violet : palette.cyan, 0.18 + 0.72 * value),
      });
    });
    drawables.push(makeLineSegments(contributionSegments, palette.cyanDim, 12));

    this.controlPoints.forEach((point, index) => {
      const isSelected = index === this.selectedIndex;
      const isActive = evaluation.basis[index] > 0.001;
      let color = isSelected ? palette.amber : palette.white;
      if (this.highlightTerm === 'basis' && isActive) color = palette.violet;
      if (this.highlightTerm === 'control' && !isSelected) color = withAlpha(palette.white, 0.32);
      drawables.push(makeCube([point[0], point[1], 0.045], isSelected ? 0.075 : 0.054, color, 20));
    });
    drawables.push(makeCube(this.evaluationPoint, 0.066, this.highlightTerm === 'u' ? palette.amber : palette.green, 22));

    const rulerY = -0.83;
    const rulerStart = -1.18;
    const rulerEnd = 1.18;
    const parameterX = (u) => rulerStart + (rulerEnd - rulerStart) * u;
    drawables.push(makeLineSegments([{ a: [rulerStart, rulerY, 0], b: [rulerEnd, rulerY, 0] }], this.highlightTerm === 'knot' ? palette.amber : palette.grid, 6));

    const uniqueKnots = [...new Set(this.knots.map((value) => Number(value.toFixed(9))))];
    const tickSegments = uniqueKnots.map((knot) => ({
      a: [parameterX(knot), rulerY - 0.045, 0.01],
      b: [parameterX(knot), rulerY + 0.045, 0.01],
      color: this.highlightTerm === 'knot' ? palette.amber : palette.whiteDim,
    }));
    drawables.push(makeLineSegments(tickSegments, palette.whiteDim, 10));
    drawables.push(makeLineSegments([{
      a: [parameterX(this.u), rulerY - 0.07, 0.03],
      b: [parameterX(this.u), rulerY + 0.31, 0.03],
      color: this.highlightTerm === 'u' ? palette.amber : palette.green,
    }], palette.green, 13));

    const basisBaseY = rulerY + 0.055;
    const basisScale = 0.25;
    for (let basisIndex = 0; basisIndex < this.controlPoints.length; basisIndex += 1) {
      const points = [];
      for (let sample = 0; sample <= 100; sample += 1) {
        const u = sample / 100;
        const value = this.evaluate(u).basis[basisIndex];
        points.push([parameterX(u), basisBaseY + basisScale * value, 0.02]);
      }
      const selected = basisIndex === this.selectedIndex;
      const active = evaluation.basis[basisIndex] > 0.001;
      const color = this.highlightTerm === 'basis'
        ? (selected ? palette.amber : active ? palette.violet : withAlpha(palette.whiteDim, 0.16))
        : (selected ? withAlpha(palette.amber, 0.72) : withAlpha(palette.whiteDim, 0.24));
      drawables.push(makeLineStrip(points, color, false, 9));
    }

    this.rulerAnchor = [parameterX(this.u), rulerY, 0.04];
    const selectedBasisValue = evaluation.basis[this.selectedIndex] ?? 0;
    this.basisAnchor = [parameterX(this.u), basisBaseY + basisScale * selectedBasisValue, 0.04];
    return drawables;
  }

  syncOverlay() {
    const activeKeys = [];
    this.controlPoints.forEach((point, index) => {
      const projected = this.worldToCss([point[0], point[1], 0.05]);
      const key = `point:${index}`;
      activeKeys.push(key);
      this.positionHandle(key, projected.x, projected.y, {
        selected: index === this.selectedIndex,
        label: `Move control point P${index}`,
      });
    });
    this.hideUnusedHandles(activeKeys);
  }

  onHandleSelect(key) {
    if (!key.startsWith('point:')) return;
    this.selectedIndex = Number(key.split(':')[1]);
    this.updateOutputs();
    this.setHighlight('control', true);
  }

  onHandleDragStart(key) {
    if (!key.startsWith('point:')) return null;
    const index = Number(key.split(':')[1]);
    return { point: [...this.controlPoints[index]], index };
  }

  onHandleDrag(key, dx, dy, _event, start) {
    if (!start || !key.startsWith('point:')) return;
    const rect = this.canvas.getBoundingClientRect();
    const worldWidth = 2.76;
    const worldHeight = 2 * Math.max(1, 1.38 / Math.max(0.65, rect.width / Math.max(1, rect.height)));
    this.controlPoints[start.index][0] = start.point[0] + (dx / rect.width) * worldWidth;
    this.controlPoints[start.index][1] = start.point[1] - (dy / rect.height) * worldHeight;
    this.requestRender();
  }

  getTermAnchor(term) {
    if (term === 'control') return { point: [this.controlPoints[this.selectedIndex][0], this.controlPoints[this.selectedIndex][1], 0.06] };
    if (term === 'basis') return { point: this.basisAnchor };
    if (term === 'knot') return { point: this.rulerAnchor };
    if (term === 'degree') return { point: [this.controlPoints[this.selectedIndex][0], this.controlPoints[this.selectedIndex][1], 0.06] };
    if (['curve', 'sum', 'u'].includes(term)) return { point: this.evaluationPoint };
    return null;
  }

  reset() {
    this.degree = 3;
    this.controlPoints = DEFAULT_POINTS.map((point) => [...point]);
    this.knots = openUniformKnots(this.controlPoints.length, this.degree);
    this.u = 0.42;
    this.selectedIndex = 2;
    this.lastInsertionError = 0;
    this.updatePointSelect();
    this.updateOutputs();
    super.reset();
  }
}
