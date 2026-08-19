import { InteractiveScene } from '../core/scene.js';
import { clamp } from '../math/bspline.js';
import {
  makeCube,
  makeLineSegments,
  makeSurfaceGrid,
  mixColor,
  palette,
  withAlpha,
} from '../core/geometry.js';

const ANCHOR_CENTERS = {
  center: [0.25, 0],
  left: [-0.25, 0],
  right: [0.68, 0],
};

function cubicKernel(value) {
  const x = Math.abs(value);
  if (x < 1) return 2 / 3 - x * x + 0.5 * x * x * x;
  if (x < 2) return ((2 - x) ** 3) / 6;
  return 0;
}

export class TSplineScene extends InteractiveScene {
  constructor() {
    super('tspline', {
      orbit: true,
      yaw: -0.72,
      pitch: 0.57,
      distance: 3.5,
      target: [0, 0.05, 0],
      fov: Math.PI / 4.5,
    });
    this.detail = 0.65;
    this.localRefinement = true;
    this.showSupport = true;
    this.selectedAnchor = 'center';
    this.tJunctionWorld = [0.25, 0, 0.5];
  }

  bindControls() {
    this.detailInput = document.querySelector('#tspline-detail');
    this.localInput = document.querySelector('#tspline-local');
    this.supportInput = document.querySelector('#tspline-support');
    this.anchorSelect = document.querySelector('#tspline-anchor');

    this.detailInput?.addEventListener('input', () => {
      this.detail = Number(this.detailInput.value);
      this.updateOutputs();
      this.setHighlight('anchor', true);
      this.requestRender();
    });
    this.localInput?.addEventListener('change', () => {
      this.localRefinement = this.localInput.checked;
      this.setHighlight('t-junction', true);
      this.requestRender();
    });
    this.supportInput?.addEventListener('change', () => {
      this.showSupport = this.supportInput.checked;
      this.setHighlight('local-basis', true);
      this.requestRender();
    });
    this.anchorSelect?.addEventListener('change', () => {
      this.selectedAnchor = this.anchorSelect.value;
      this.setHighlight('anchor', true);
      this.requestRender();
    });
    this.updateOutputs();
  }

  updateOutputs() {
    if (this.detailInput) {
      this.detailInput.value = String(this.detail);
      this.detailInput.nextElementSibling.value = this.detail.toFixed(2);
    }
    if (this.localInput) this.localInput.checked = this.localRefinement;
    if (this.supportInput) this.supportInput.checked = this.showSupport;
    if (this.anchorSelect) this.anchorSelect.value = this.selectedAnchor;
  }

  supportAt(x, z) {
    const center = ANCHOR_CENTERS[this.selectedAnchor];
    const supportX = cubicKernel((x - center[0]) / 0.28);
    const supportZ = cubicKernel((z - center[1]) / 0.27);
    return (supportX * supportZ) / ((2 / 3) ** 2);
  }

  heightAt(x, z) {
    const base = 0.08 * Math.sin(Math.PI * (x + 0.15)) * Math.cos(Math.PI * z * 0.8);
    return base + this.detail * 0.42 * this.supportAt(x, z);
  }

  sampleParamLine(axis, fixed, start = -1, end = 1, samples = 40, lift = 0.032) {
    const points = [];
    for (let i = 0; i <= samples; i += 1) {
      const t = start + (end - start) * (i / samples);
      const x = axis === 'x' ? t : fixed;
      const z = axis === 'z' ? t : fixed;
      points.push([x, this.heightAt(x, z) + lift, z]);
    }
    return points;
  }

  buildDrawables() {
    const drawables = [];
    const resolution = 30;
    const grid = [];
    for (let row = 0; row <= resolution; row += 1) {
      const z = -1 + 2 * (row / resolution);
      const gridRow = [];
      for (let column = 0; column <= resolution; column += 1) {
        const x = -1 + 2 * (column / resolution);
        gridRow.push([x, this.heightAt(x, z), z]);
      }
      grid.push(gridRow);
    }

    const surfaceColor = (row, column, point) => {
      const x = point[0];
      const z = point[2];
      const support = this.supportAt(x, z);
      if (this.showSupport || this.highlightTerm === 'local-basis') {
        return mixColor(palette.surfaceDim, palette.violet, Math.min(1, support * 0.9));
      }
      return this.highlightTerm === 'surface' ? palette.cyan : palette.surface;
    };

    const surface = makeSurfaceGrid(grid, surfaceColor, {
      wireColor: withAlpha(palette.grid, 0.3),
      surfaceOrder: 0,
      wireOrder: 4,
    });
    drawables.push(surface.surface, surface.wire);

    const baseCoordinates = [-1, -0.5, 0, 0.5, 1];
    const meshSegments = [];
    for (const coordinate of baseCoordinates) {
      const xLine = this.sampleParamLine('x', coordinate);
      const zLine = this.sampleParamLine('z', coordinate);
      for (let i = 0; i < xLine.length - 1; i += 1) meshSegments.push({ a: xLine[i], b: xLine[i + 1], color: palette.whiteDim });
      for (let i = 0; i < zLine.length - 1; i += 1) meshSegments.push({ a: zLine[i], b: zLine[i + 1], color: palette.whiteDim });
    }

    const localColor = this.highlightTerm === 't-junction' ? palette.amber : palette.cyan;
    const horizontalRefinements = [-0.25, 0.25];
    for (const z of horizontalRefinements) {
      const line = this.sampleParamLine('x', z, -0.5, 0.75, 28, 0.052);
      for (let i = 0; i < line.length - 1; i += 1) meshSegments.push({ a: line[i], b: line[i + 1], color: localColor });
    }

    const verticalStart = this.localRefinement ? -0.5 : -1;
    const verticalEnd = this.localRefinement ? 0.5 : 1;
    const vertical = this.sampleParamLine('z', 0.25, verticalStart, verticalEnd, 32, 0.058);
    for (let i = 0; i < vertical.length - 1; i += 1) meshSegments.push({ a: vertical[i], b: vertical[i + 1], color: localColor });
    drawables.push(makeLineSegments(meshSegments, palette.whiteDim, 12));

    const anchorPoints = [];
    for (const x of baseCoordinates) {
      for (const z of baseCoordinates) anchorPoints.push([x, this.heightAt(x, z) + 0.055, z]);
    }
    for (const x of [-0.5, -0.25, 0, 0.25, 0.5, 0.75]) {
      for (const z of [-0.25, 0.25]) anchorPoints.push([x, this.heightAt(x, z) + 0.075, z]);
    }
    for (const z of [verticalStart, -0.25, 0, 0.25, verticalEnd]) {
      anchorPoints.push([0.25, this.heightAt(0.25, z) + 0.08, z]);
    }

    anchorPoints.forEach((point) => drawables.push(makeCube(point, 0.045, withAlpha(palette.white, 0.78), 18)));

    const center = ANCHOR_CENTERS[this.selectedAnchor];
    this.selectedAnchorWorld = [center[0], this.heightAt(center[0], center[1]) + 0.095, center[1]];
    drawables.push(makeCube(this.selectedAnchorWorld, 0.09, this.highlightTerm === 'anchor' ? palette.amber : palette.violet, 22));

    const junctionZ = this.localRefinement ? 0.5 : 1;
    this.tJunctionWorld = [0.25, this.heightAt(0.25, junctionZ) + 0.07, junctionZ];
    if (this.localRefinement) {
      drawables.push(makeCube(this.tJunctionWorld, 0.078, palette.amber, 23));
      const bottomJunction = [0.25, this.heightAt(0.25, -0.5) + 0.07, -0.5];
      drawables.push(makeCube(bottomJunction, 0.078, palette.amber, 23));
    }

    return drawables;
  }

  syncOverlay() {
    const projected = this.worldToCss(this.selectedAnchorWorld);
    const activeKeys = ['anchor:active'];
    this.positionHandle('anchor:active', projected.x, projected.y, {
      selected: true,
      label: 'Drag vertically to change local anchor height',
    });
    this.hideUnusedHandles(activeKeys);
  }

  onHandleSelect() {
    this.setHighlight('anchor', true);
  }

  onHandleDragStart() {
    return { detail: this.detail };
  }

  onHandleDrag(_key, _dx, dy, _event, start) {
    if (!start) return;
    this.detail = clamp(start.detail - dy / 95, -0.8, 1.4);
    this.updateOutputs();
    this.requestRender();
  }

  getTermAnchor(term) {
    if (term === 't-junction') return { point: this.tJunctionWorld };
    if (['anchor', 'local-basis', 'surface'].includes(term)) return { point: this.selectedAnchorWorld };
    return null;
  }

  reset() {
    this.detail = 0.65;
    this.localRefinement = true;
    this.showSupport = true;
    this.selectedAnchor = 'center';
    this.updateOutputs();
    super.reset();
  }
}
