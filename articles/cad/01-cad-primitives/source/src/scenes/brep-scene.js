import { InteractiveScene } from '../core/scene.js';
import { clamp } from '../math/bspline.js';
import {
  makeCube,
  makeGridPlane,
  makeLineSegments,
  makeLineStrip,
  makeMeshFromFaces,
  meshWireframe,
  palette,
  withAlpha,
} from '../core/geometry.js';

export class BRepScene extends InteractiveScene {
  constructor() {
    super('brep', {
      orbit: true,
      yaw: -0.72,
      pitch: 0.48,
      distance: 4.1,
      target: [0, 0, 0],
      fov: Math.PI / 4.2,
    });
    this.holeRatio = 0.46;
    this.thickness = 0.38;
    this.selectedEntity = 'solid';
    this.showPlane = false;
  }

  bindControls() {
    this.holeInput = document.querySelector('#brep-hole');
    this.thicknessInput = document.querySelector('#brep-thickness');
    this.entitySelect = document.querySelector('#brep-entity');
    this.planeInput = document.querySelector('#brep-plane');

    this.holeInput?.addEventListener('input', () => {
      this.holeRatio = Number(this.holeInput.value);
      this.updateOutputs();
      this.setHighlight('inner-wire', true);
      this.requestRender();
    });
    this.thicknessInput?.addEventListener('input', () => {
      this.thickness = Number(this.thicknessInput.value);
      this.updateOutputs();
      this.setHighlight('solid', true);
      this.requestRender();
    });
    this.entitySelect?.addEventListener('change', () => {
      this.selectedEntity = this.entitySelect.value;
      this.setHighlight(this.selectedEntity, true);
      this.requestRender();
    });
    this.planeInput?.addEventListener('change', () => {
      this.showPlane = this.planeInput.checked;
      this.setHighlight('surface', true);
      this.requestRender();
    });
    this.updateOutputs();
  }

  updateOutputs() {
    if (this.holeInput) {
      this.holeInput.value = String(this.holeRatio);
      this.holeInput.nextElementSibling.value = this.holeRatio.toFixed(2);
    }
    if (this.thicknessInput) {
      this.thicknessInput.value = String(this.thickness);
      this.thicknessInput.nextElementSibling.value = this.thickness.toFixed(2);
    }
    if (this.entitySelect) this.entitySelect.value = this.selectedEntity;
    if (this.planeInput) this.planeInput.checked = this.showPlane;
  }

  buildTopology() {
    const ox = 1.12;
    const oz = 0.82;
    const hx = ox * this.holeRatio;
    const hz = oz * this.holeRatio * 0.84;
    const top = this.thickness / 2;
    const bottom = -this.thickness / 2;

    const vertices = [
      [-ox, top, -oz], [ox, top, -oz], [ox, top, oz], [-ox, top, oz],
      [-hx, top, -hz], [hx, top, -hz], [hx, top, hz], [-hx, top, hz],
      [-ox, bottom, -oz], [ox, bottom, -oz], [ox, bottom, oz], [-ox, bottom, oz],
      [-hx, bottom, -hz], [hx, bottom, -hz], [hx, bottom, hz], [-hx, bottom, hz],
    ];

    const topFace = [[0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]];
    const bottomFace = [[8, 12, 13, 9], [9, 13, 14, 10], [10, 14, 15, 11], [11, 15, 12, 8]];
    const outerSides = [[0, 8, 9, 1], [1, 9, 10, 2], [2, 10, 11, 3], [3, 11, 8, 0]];
    const innerSides = [[4, 5, 13, 12], [5, 6, 14, 13], [6, 7, 15, 14], [7, 4, 12, 15]];
    const allFaces = [...topFace, ...bottomFace, ...outerSides, ...innerSides];

    return {
      vertices,
      topFace,
      bottomFace,
      outerSides,
      innerSides,
      allFaces,
      outerWire: [vertices[0], vertices[1], vertices[2], vertices[3]],
      innerWire: [vertices[4], vertices[5], vertices[6], vertices[7]],
      dimensions: { ox, oz, hx, hz, top, bottom },
    };
  }

  buildDrawables() {
    const drawables = [];
    const topology = this.buildTopology();
    this.topology = topology;
    const entity = this.highlightTerm ?? this.selectedEntity;
    const isolate = ['face', 'outer-wire', 'inner-wire', 'edge', 'vertex', 'surface'].includes(entity);

    const baseSurface = isolate ? withAlpha(palette.surfaceDim, 0.28) : palette.surface;
    const topColor = entity === 'face' ? palette.amber : baseSurface;
    const innerColor = entity === 'inner-wire' ? withAlpha(palette.violet, 0.38) : baseSurface;
    drawables.push(makeMeshFromFaces(topology.vertices, topology.topFace, topColor, 0));
    drawables.push(makeMeshFromFaces(topology.vertices, topology.bottomFace, baseSurface, 0));
    drawables.push(makeMeshFromFaces(topology.vertices, topology.outerSides, baseSurface, 0));
    drawables.push(makeMeshFromFaces(topology.vertices, topology.innerSides, innerColor, 0));

    const shellColor = entity === 'shell' ? palette.cyan : withAlpha(palette.white, isolate ? 0.22 : 0.56);
    drawables.push(meshWireframe(topology.vertices, topology.allFaces, shellColor, 12));

    const outerColor = entity === 'outer-wire' ? palette.amber : withAlpha(palette.cyan, 0.68);
    const innerWireColor = entity === 'inner-wire' ? palette.amber : withAlpha(palette.violet, 0.84);
    drawables.push(makeLineStrip(topology.outerWire.map((point) => [point[0], point[1] + 0.012, point[2]]), outerColor, true, 18));
    drawables.push(makeLineStrip(topology.innerWire.map((point) => [point[0], point[1] + 0.016, point[2]]), innerWireColor, true, 19));

    this.edgeWorldA = topology.vertices[0];
    this.edgeWorldB = topology.vertices[1];
    this.edgeWorldMid = [0, topology.dimensions.top + 0.025, -topology.dimensions.oz];
    if (entity === 'edge') {
      drawables.push(makeLineSegments([{ a: this.edgeWorldA, b: this.edgeWorldB, color: palette.amber }], palette.amber, 24));
    }

    this.vertexWorld = topology.vertices[1];
    if (entity === 'vertex') drawables.push(makeCube(this.vertexWorld, 0.13, palette.amber, 25));

    const showSupportPlane = this.showPlane || entity === 'surface';
    if (showSupportPlane) {
      drawables.push(makeGridPlane(3.5, 16, topology.dimensions.top + 0.005, entity === 'surface' ? withAlpha(palette.amber, 0.42) : withAlpha(palette.grid, 0.28), 2));
    }

    this.holeHandleWorld = topology.vertices[6];
    drawables.push(makeCube(this.holeHandleWorld, 0.085, entity === 'inner-wire' ? palette.amber : palette.violet, 23));

    this.solidAnchorWorld = [0, 0, topology.dimensions.oz];
    this.shellAnchorWorld = topology.vertices[2];
    this.faceAnchorWorld = [0, topology.dimensions.top + 0.025, -(topology.dimensions.hz + topology.dimensions.oz) / 2];
    this.outerWireAnchorWorld = [0, topology.dimensions.top + 0.025, -topology.dimensions.oz];
    this.surfaceAnchorWorld = [-topology.dimensions.ox * 1.3, topology.dimensions.top + 0.01, -topology.dimensions.oz * 1.25];

    return drawables;
  }

  syncOverlay() {
    const projected = this.worldToCss(this.holeHandleWorld);
    const activeKeys = ['hole:corner'];
    this.positionHandle('hole:corner', projected.x, projected.y, {
      selected: this.highlightTerm === 'inner-wire',
      label: 'Drag to resize the inner wire',
    });
    this.hideUnusedHandles(activeKeys);
  }

  onHandleSelect() {
    this.selectedEntity = 'inner-wire';
    this.updateOutputs();
    this.setHighlight('inner-wire', true);
  }

  onHandleDragStart(_key, event) {
    const center = this.worldToCss([0, this.thickness / 2, 0]);
    const startRadius = Math.hypot(event.clientX - this.canvas.getBoundingClientRect().left - center.x, event.clientY - this.canvas.getBoundingClientRect().top - center.y);
    return { holeRatio: this.holeRatio, center, startRadius };
  }

  onHandleDrag(_key, _dx, _dy, event, start) {
    if (!start) return;
    const rect = this.canvas.getBoundingClientRect();
    const currentRadius = Math.hypot(event.clientX - rect.left - start.center.x, event.clientY - rect.top - start.center.y);
    this.holeRatio = clamp(start.holeRatio + (currentRadius - start.startRadius) / 260, 0.25, 0.72);
    this.updateOutputs();
    this.requestRender();
  }

  getTermAnchor(term) {
    if (term === 'solid') return { point: this.solidAnchorWorld };
    if (term === 'shell') return { point: this.shellAnchorWorld };
    if (term === 'face') return { point: this.faceAnchorWorld };
    if (term === 'outer-wire') return { point: this.outerWireAnchorWorld };
    if (term === 'inner-wire') return { point: this.holeHandleWorld };
    if (term === 'edge') return { point: this.edgeWorldMid };
    if (term === 'vertex') return { point: this.vertexWorld };
    if (term === 'surface') return { point: this.surfaceAnchorWorld };
    return null;
  }

  reset() {
    this.holeRatio = 0.46;
    this.thickness = 0.38;
    this.selectedEntity = 'solid';
    this.showPlane = false;
    this.updateOutputs();
    super.reset();
  }
}
