import { InteractiveScene } from '../core/scene.js';
import { clamp, evaluateNurbs, openUniformKnots, sampleCurve } from '../math/bspline.js';
import { ortho4 } from '../math/linear.js';
import {
  makeCube,
  makeLineSegments,
  makeLineStrip,
  makeRibbon,
  palette,
  withAlpha,
} from '../core/geometry.js';

const FREE_POINTS = [
  [-1.12, -0.34, 0],
  [-0.79, 0.56, 0],
  [-0.34, 0.7, 0],
  [0.11, -0.2, 0],
  [0.63, 0.55, 0],
  [1.08, 0.13, 0],
];

export class NurbsScene extends InteractiveScene {
  constructor() {
    super('nurbs', { orbit: false });
    this.preset = 'free';
    this.degree = 3;
    this.controlPoints = FREE_POINTS.map((point) => [...point]);
    this.weights = new Array(this.controlPoints.length).fill(1);
    this.knots = openUniformKnots(this.controlPoints.length, this.degree);
    this.selectedIndex = 2;
    this.u = 0.5;
    this.weightAnchorCss = null;
  }

  bindControls() {
    this.uInput = document.querySelector('#nurbs-u');
    this.pointSelect = document.querySelector('#nurbs-point');
    this.weightInput = document.querySelector('#nurbs-weight');
    this.freeButton = document.querySelector('#nurbs-free');
    this.circleButton = document.querySelector('#nurbs-circle');

    this.uInput?.addEventListener('input', () => {
      this.u = Number(this.uInput.value);
      this.updateOutputs();
      this.requestRender();
    });
    this.pointSelect?.addEventListener('change', () => {
      this.selectedIndex = Number(this.pointSelect.value);
      this.updateOutputs();
      this.requestRender();
    });
    this.weightInput?.addEventListener('input', () => {
      this.weights[this.selectedIndex] = Number(this.weightInput.value);
      this.updateOutputs();
      this.setHighlight('weight', true);
      this.requestRender();
    });
    this.freeButton?.addEventListener('click', () => this.setFreePreset());
    this.circleButton?.addEventListener('click', () => this.setCirclePreset());

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

  evaluate(u, overrideWeights = null) {
    return evaluateNurbs(this.controlPoints, overrideWeights ?? this.weights, this.degree, this.knots, u);
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
    if (this.pointSelect) this.pointSelect.value = String(this.selectedIndex);
    if (this.weightInput) {
      this.weightInput.value = String(this.weights[this.selectedIndex]);
      this.weightInput.nextElementSibling.value = this.weights[this.selectedIndex].toFixed(2);
    }
  }

  setFreePreset() {
    this.preset = 'free';
    this.degree = 3;
    this.controlPoints = FREE_POINTS.map((point) => [...point]);
    this.weights = [1, 1, 2.15, 0.75, 1.35, 1];
    this.knots = openUniformKnots(this.controlPoints.length, this.degree);
    this.selectedIndex = 2;
    this.u = 0.5;
    this.updatePointSelect();
    this.updateOutputs();
    this.setHighlight('weight', true);
    this.requestRender();
  }

  setCirclePreset() {
    this.preset = 'circle';
    this.degree = 2;
    this.controlPoints = [
      [0.55, -0.5, 0],
      [0.55, 0.52, 0],
      [-0.47, 0.52, 0],
    ];
    this.weights = [1, Math.SQRT1_2, 1];
    this.knots = [0, 0, 0, 1, 1, 1];
    this.selectedIndex = 1;
    this.u = 0.5;
    this.updatePointSelect();
    this.updateOutputs();
    this.setHighlight('denominator', true);
    this.requestRender();
  }

  buildDrawables() {
    const drawables = [];
    const evaluation = this.evaluate(this.u);
    this.evaluationPoint = [evaluation.point[0], evaluation.point[1], 0.045];
    this.rationalBasis = evaluation.rationalBasis;

    const actualCurve = sampleCurve((u) => this.evaluate(u), 220).map((point) => [point[0], point[1], 0.02]);
    const equalWeights = new Array(this.weights.length).fill(1);
    const polynomialCurve = sampleCurve((u) => this.evaluate(u, equalWeights), 220).map((point) => [point[0], point[1], 0.005]);

    if (this.highlightTerm === 'weight' || this.highlightTerm === 'denominator' || this.weights.some((weight) => Math.abs(weight - 1) > 0.01)) {
      drawables.push(makeLineStrip(polynomialCurve, withAlpha(palette.whiteDim, this.highlightTerm ? 0.52 : 0.26), false, 4));
    }

    drawables.push(makeRibbon(actualCurve, this.highlightTerm === 'curve' ? 0.036 : 0.023, this.highlightTerm === 'curve' ? palette.amber : palette.cyan, 5));
    drawables.push(makeLineStrip(this.controlPoints.map((point) => [point[0], point[1], -0.01]), palette.whiteDim, false, 8));

    const contributionSegments = [];
    evaluation.rationalBasis.forEach((value, index) => {
      if (value < 0.001) return;
      contributionSegments.push({
        a: [this.controlPoints[index][0], this.controlPoints[index][1], 0.035],
        b: this.evaluationPoint,
        color: withAlpha(this.highlightTerm === 'denominator' ? palette.violet : palette.cyan, 0.18 + 0.72 * value),
      });
    });
    drawables.push(makeLineSegments(contributionSegments, palette.cyanDim, 12));

    this.controlPoints.forEach((point, index) => {
      const isSelected = index === this.selectedIndex;
      let color = isSelected ? palette.amber : palette.white;
      if (this.highlightTerm === 'weight' && isSelected) color = palette.violet;
      if (this.highlightTerm === 'control' && !isSelected) color = withAlpha(palette.white, 0.3);
      drawables.push(makeCube([point[0], point[1], 0.05], isSelected ? 0.078 : 0.055, color, 20));
    });
    drawables.push(makeCube(this.evaluationPoint, 0.068, this.highlightTerm === 'denominator' ? palette.violet : palette.green, 22));

    if (this.preset === 'circle') {
      const center = [-0.47, -0.5, 0];
      drawables.push(makeLineSegments([
        { a: center, b: [0.55, -0.5, 0], color: withAlpha(palette.amber, 0.4) },
        { a: center, b: [-0.47, 0.52, 0], color: withAlpha(palette.amber, 0.4) },
      ], palette.amberDim, 6));
      drawables.push(makeCube(center, 0.04, withAlpha(palette.amber, 0.75), 16));
    }

    return drawables;
  }

  syncOverlay() {
    const activeKeys = [];
    this.controlPoints.forEach((point, index) => {
      const projected = this.worldToCss([point[0], point[1], 0.05]);
      const pointKey = `point:${index}`;
      activeKeys.push(pointKey);
      this.positionHandle(pointKey, projected.x, projected.y, {
        selected: index === this.selectedIndex,
        label: `Move NURBS control point P${index}`,
      });

      const weightOffset = 24 + this.weights[index] * 17;
      const weightY = projected.y - weightOffset;
      const weightKey = `weight:${index}`;
      activeKeys.push(weightKey);
      this.positionStalk(weightKey, projected.x, weightY, weightOffset, true);
      this.positionHandle(weightKey, projected.x, weightY, {
        selected: index === this.selectedIndex && this.highlightTerm === 'weight',
        className: 'weight-handle',
        label: `Change NURBS weight w${index}`,
      });
      if (index === this.selectedIndex) this.weightAnchorCss = { x: projected.x, y: weightY };
    });
    this.hideUnusedHandles(activeKeys);
  }

  onHandleSelect(key) {
    const [kind, indexText] = key.split(':');
    if (!['point', 'weight'].includes(kind)) return;
    this.selectedIndex = Number(indexText);
    this.updateOutputs();
    this.setHighlight(kind === 'weight' ? 'weight' : 'control', true);
  }

  onHandleDragStart(key) {
    const [kind, indexText] = key.split(':');
    const index = Number(indexText);
    if (kind === 'point') return { kind, index, point: [...this.controlPoints[index]] };
    if (kind === 'weight') return { kind, index, weight: this.weights[index] };
    return null;
  }

  onHandleDrag(key, dx, dy, _event, start) {
    if (!start) return;
    if (start.kind === 'point') {
      const rect = this.canvas.getBoundingClientRect();
      const worldWidth = 2.76;
      const worldHeight = 2 * Math.max(1, 1.38 / Math.max(0.65, rect.width / Math.max(1, rect.height)));
      this.controlPoints[start.index][0] = start.point[0] + (dx / rect.width) * worldWidth;
      this.controlPoints[start.index][1] = start.point[1] - (dy / rect.height) * worldHeight;
    } else if (start.kind === 'weight') {
      this.weights[start.index] = clamp(start.weight - dy / 42, 0.1, 4);
      this.updateOutputs();
    }
    this.requestRender();
  }

  getTermAnchor(term) {
    if (term === 'weight' && this.weightAnchorCss) return { space: 'css', ...this.weightAnchorCss };
    if (term === 'control') return { point: [this.controlPoints[this.selectedIndex][0], this.controlPoints[this.selectedIndex][1], 0.06] };
    if (['curve', 'basis', 'denominator'].includes(term)) return { point: this.evaluationPoint };
    return null;
  }

  reset() {
    this.preset = 'free';
    this.degree = 3;
    this.controlPoints = FREE_POINTS.map((point) => [...point]);
    this.weights = new Array(this.controlPoints.length).fill(1);
    this.knots = openUniformKnots(this.controlPoints.length, this.degree);
    this.selectedIndex = 2;
    this.u = 0.5;
    this.updatePointSelect();
    this.updateOutputs();
    super.reset();
  }
}
