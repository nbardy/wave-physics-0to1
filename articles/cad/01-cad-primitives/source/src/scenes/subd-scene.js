import { InteractiveScene } from '../core/scene.js';
import { clamp } from '../math/bspline.js';
import { add3, scale3 } from '../math/linear.js';
import { subdivideCatmullClark, catmullClarkStep } from '../math/subdivision.js';
import {
  makeCube,
  makeLineSegments,
  makeMeshFromFaces,
  meshWireframe,
  palette,
  withAlpha,
} from '../core/geometry.js';

const DEFAULT_VERTICES = [
  [-0.82, -0.62, -0.78],
  [0.82, -0.62, -0.78],
  [0.82, 0.62, -0.78],
  [-0.82, 0.62, -0.78],
  [-0.82, -0.62, 0.78],
  [0.82, -0.62, 0.78],
  [0.9, 0.86, 0.78],
  [-0.82, 0.7, 0.78],
];

const CUBE_FACES = [
  [0, 3, 2, 1],
  [4, 5, 6, 7],
  [0, 1, 5, 4],
  [1, 2, 6, 5],
  [3, 7, 6, 2],
  [0, 4, 7, 3],
];

export class SubDScene extends InteractiveScene {
  constructor() {
    super('subd', {
      orbit: true,
      yaw: -0.72,
      pitch: 0.43,
      distance: 4.3,
      target: [0, 0.05, 0],
      fov: Math.PI / 4.2,
    });
    this.vertices = DEFAULT_VERTICES.map((point) => [...point]);
    this.faces = CUBE_FACES.map((face) => [...face]);
    this.level = 3;
    this.selectedIndex = 6;
    this.showConstruction = false;
  }

  bindControls() {
    this.levelInput = document.querySelector('#subd-level');
    this.vertexSelect = document.querySelector('#subd-vertex');
    this.heightInput = document.querySelector('#subd-height');
    this.constructionInput = document.querySelector('#subd-construction');

    this.levelInput?.addEventListener('input', () => {
      this.level = Number(this.levelInput.value);
      this.updateOutputs();
      this.setHighlight('level', true);
      this.requestRender();
    });
    this.vertexSelect?.addEventListener('change', () => {
      this.selectedIndex = Number(this.vertexSelect.value);
      this.updateOutputs();
      this.setHighlight('control-vertex', true);
      this.requestRender();
    });
    this.heightInput?.addEventListener('input', () => {
      this.vertices[this.selectedIndex][1] = Number(this.heightInput.value);
      this.updateOutputs();
      this.setHighlight('control-vertex', true);
      this.requestRender();
    });
    this.constructionInput?.addEventListener('change', () => {
      this.showConstruction = this.constructionInput.checked;
      this.requestRender();
    });

    this.updateVertexSelect();
    this.updateOutputs();
  }

  updateVertexSelect() {
    if (!this.vertexSelect) return;
    this.vertexSelect.replaceChildren();
    this.vertices.forEach((_, index) => {
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = `P${index}`;
      option.selected = index === this.selectedIndex;
      this.vertexSelect.append(option);
    });
  }

  updateOutputs() {
    if (this.levelInput) {
      this.levelInput.value = String(this.level);
      this.levelInput.nextElementSibling.value = String(this.level);
    }
    if (this.vertexSelect) this.vertexSelect.value = String(this.selectedIndex);
    if (this.heightInput) {
      this.heightInput.value = String(this.vertices[this.selectedIndex][1]);
      this.heightInput.nextElementSibling.value = this.vertices[this.selectedIndex][1].toFixed(2);
    }
    if (this.constructionInput) this.constructionInput.checked = this.showConstruction;
  }

  buildDrawables() {
    const drawables = [];
    const originalMesh = { vertices: this.vertices, faces: this.faces };
    const refined = subdivideCatmullClark(originalMesh, this.level);
    const construction = catmullClarkStep(originalMesh).construction;
    this.construction = construction;

    const constructionActive = this.showConstruction || ['face-points', 'edge-midpoints', 'updated-vertex', 'valence'].includes(this.highlightTerm);
    const surfaceColor = constructionActive ? withAlpha(palette.surfaceDim, 0.42) : (this.highlightTerm === 'level' ? palette.violet : palette.surface);
    drawables.push(makeMeshFromFaces(refined.mesh.vertices, refined.mesh.faces, surfaceColor, 0));
    drawables.push(meshWireframe(refined.mesh.vertices, refined.mesh.faces, withAlpha(palette.grid, this.level > 2 ? 0.18 : 0.42), 6));

    const cageColor = this.highlightTerm === 'control-vertex' || this.highlightTerm === 'valence' ? palette.cyan : withAlpha(palette.white, 0.62);
    drawables.push(meshWireframe(this.vertices, this.faces, cageColor, 14));

    this.vertices.forEach((point, index) => {
      const selected = index === this.selectedIndex;
      let color = selected ? palette.amber : withAlpha(palette.white, 0.82);
      if (this.highlightTerm === 'control-vertex' && !selected) color = withAlpha(palette.white, 0.22);
      drawables.push(makeCube(point, selected ? 0.115 : 0.075, color, 21));
    });

    const incidentEdgeIndices = new Set(construction.vertexEdges[this.selectedIndex]);
    const incidentFaceIndices = new Set(construction.vertexFaces[this.selectedIndex]);

    if (constructionActive) {
      construction.facePoints.forEach((point, index) => {
        const relevant = incidentFaceIndices.has(index);
        const color = this.highlightTerm === 'face-points'
          ? (relevant ? palette.violet : withAlpha(palette.violet, 0.22))
          : withAlpha(palette.violet, relevant ? 0.8 : 0.38);
        drawables.push(makeCube(point, relevant ? 0.1 : 0.07, color, 22));
      });

      construction.edgeMidpoints.forEach((point, index) => {
        const relevant = incidentEdgeIndices.has(index);
        const color = this.highlightTerm === 'edge-midpoints'
          ? (relevant ? palette.amber : withAlpha(palette.amber, 0.2))
          : withAlpha(palette.amber, relevant ? 0.78 : 0.32);
        drawables.push(makeCube(point, relevant ? 0.085 : 0.06, color, 23));
      });

      if (this.highlightTerm === 'valence') {
        const valenceSegments = [];
        for (const edgeIndex of incidentEdgeIndices) {
          const edge = construction.edges[edgeIndex];
          valenceSegments.push({
            a: this.vertices[edge.a],
            b: this.vertices[edge.b],
            color: palette.amber,
          });
        }
        drawables.push(makeLineSegments(valenceSegments, palette.amber, 25));
      }
    }

    this.controlVertexWorld = this.vertices[this.selectedIndex];
    this.updatedVertexWorld = construction.vertexPoints[this.selectedIndex];
    this.facePointWorld = construction.facePoints[construction.vertexFaces[this.selectedIndex][0]];
    this.edgeMidpointWorld = construction.edgeMidpoints[construction.vertexEdges[this.selectedIndex][0]];

    if (constructionActive || this.highlightTerm === 'updated-vertex') {
      drawables.push(makeLineSegments([{
        a: this.controlVertexWorld,
        b: this.updatedVertexWorld,
        color: withAlpha(palette.green, 0.9),
      }], palette.green, 26));
      drawables.push(makeCube(this.updatedVertexWorld, 0.12, palette.green, 27));
    }

    return drawables;
  }

  syncOverlay() {
    const activeKeys = [];
    this.vertices.forEach((point, index) => {
      const projected = this.worldToCss(point);
      const key = `vertex:${index}`;
      activeKeys.push(key);
      this.positionHandle(key, projected.x, projected.y, {
        selected: index === this.selectedIndex,
        label: `Move SubD cage vertex P${index}`,
      });
    });
    this.hideUnusedHandles(activeKeys);
  }

  onHandleSelect(key) {
    if (!key.startsWith('vertex:')) return;
    this.selectedIndex = Number(key.split(':')[1]);
    this.updateOutputs();
    this.setHighlight('control-vertex', true);
  }

  onHandleDragStart(key) {
    if (!key.startsWith('vertex:')) return null;
    const index = Number(key.split(':')[1]);
    return {
      index,
      point: [...this.vertices[index]],
      camera: this.getCameraFrame(),
      distance: this.camera.distance,
    };
  }

  onHandleDrag(_key, dx, dy, _event, start) {
    if (!start) return;
    const scale = start.distance * 0.0019;
    const rightOffset = scale3(start.camera.right, dx * scale);
    const upOffset = scale3(start.camera.up, -dy * scale);
    this.vertices[start.index] = add3(start.point, add3(rightOffset, upOffset));
    this.vertices[start.index][1] = clamp(this.vertices[start.index][1], -1.4, 1.4);
    this.updateOutputs();
    this.requestRender();
  }

  getTermAnchor(term) {
    if (term === 'control-vertex') return { point: this.controlVertexWorld };
    if (term === 'updated-vertex') return { point: this.updatedVertexWorld };
    if (term === 'face-points') return { point: this.facePointWorld };
    if (term === 'edge-midpoints') return { point: this.edgeMidpointWorld };
    if (term === 'valence') return { point: this.controlVertexWorld };
    if (term === 'level') return { point: this.updatedVertexWorld ?? this.controlVertexWorld };
    return null;
  }

  reset() {
    this.vertices = DEFAULT_VERTICES.map((point) => [...point]);
    this.faces = CUBE_FACES.map((face) => [...face]);
    this.level = 3;
    this.selectedIndex = 6;
    this.showConstruction = false;
    this.updateVertexSelect();
    this.updateOutputs();
    super.reset();
  }
}
