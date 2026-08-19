import { InteractiveScene } from '../core/scene.js';
import { catmullClarkStep } from '../math/subdivision.js';
import {
  makeLineSegments,
  makeMeshFromFaces,
  meshWireframe,
  palette,
  withAlpha,
} from '../core/geometry.js';

const BASE_VERTICES = [
  [-0.82, -0.62, -0.78], [0.82, -0.62, -0.78], [0.82, 0.62, -0.78], [-0.82, 0.62, -0.78],
  [-0.82, -0.62, 0.78], [0.82, -0.62, 0.78], [0.82, 0.75, 0.78], [-0.82, 0.68, 0.78],
];
const BASE_FACES = [
  [0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [3, 7, 6, 2], [0, 4, 7, 3],
];

function edgeKey(a, b) {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

export class IntegrationScene extends InteractiveScene {
  constructor() {
    super('integration', {
      orbit: true,
      yaw: -0.72,
      pitch: 0.44,
      distance: 4.25,
      target: [0, 0.03, 0],
      fov: Math.PI / 4.25,
    });
    this.layers = { cage: true, surface: true, topology: true };
    this.lens = 1;
  }

  bindControls() {
    this.lensInput = document.querySelector('#integration-lens');
    this.flowButtons = [...document.querySelectorAll('[data-integration-layer]')];
    this.lensInput?.addEventListener('input', () => {
      this.lens = Number(this.lensInput.value);
      this.updateOutput();
      this.requestRender();
    });
    this.flowButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const layer = button.dataset.integrationLayer;
        this.layers[layer] = !this.layers[layer];
        button.classList.toggle('active', this.layers[layer]);
        this.requestRender();
      });
    });
    this.updateOutput();
  }

  updateOutput() {
    if (!this.lensInput) return;
    this.lensInput.value = String(this.lens);
    const label = this.lens < 0.66 ? 'control' : this.lens < 1.34 ? 'surface' : 'topology';
    this.lensInput.nextElementSibling.value = label;
  }

  buildRefinedMesh(levels = 3) {
    let mesh = { vertices: BASE_VERTICES.map((point) => [...point]), faces: BASE_FACES.map((face) => [...face]) };
    let labels = BASE_FACES.map((_, index) => index);
    for (let level = 0; level < levels; level += 1) {
      const oldFaces = mesh.faces;
      const result = catmullClarkStep(mesh);
      const nextLabels = [];
      oldFaces.forEach((face, faceIndex) => {
        for (let i = 0; i < face.length; i += 1) nextLabels.push(labels[faceIndex]);
      });
      mesh = result.mesh;
      labels = nextLabels;
    }
    return { mesh, labels };
  }

  buildDrawables() {
    const drawables = [];
    const { mesh, labels } = this.buildRefinedMesh(3);
    const focus = {
      cage: Math.max(0.12, 1 - Math.abs(this.lens - 0)),
      surface: Math.max(0.12, 1 - Math.abs(this.lens - 1)),
      topology: Math.max(0.12, 1 - Math.abs(this.lens - 2)),
    };
    if (this.highlightTerm && focus[this.highlightTerm] !== undefined) focus[this.highlightTerm] = 1;
    if (this.highlightTerm === 'solid') focus.surface = 1;

    if (this.layers.surface) {
      const faceColors = [palette.cyan, palette.violet, palette.surface, palette.green, palette.amberDim, palette.surfaceDim];
      for (let label = 0; label < BASE_FACES.length; label += 1) {
        const faces = [];
        labels.forEach((faceLabel, faceIndex) => {
          if (faceLabel === label) faces.push(mesh.faces[faceIndex]);
        });
        const emphasized = this.highlightTerm === 'topology' ? 0.26 : focus.surface;
        const color = withAlpha(faceColors[label], 0.22 + 0.63 * emphasized);
        drawables.push(makeMeshFromFaces(mesh.vertices, faces, color, 0));
      }
      drawables.push(meshWireframe(mesh.vertices, mesh.faces, withAlpha(palette.grid, 0.08 + 0.28 * focus.surface), 5));
    }

    if (this.layers.cage) {
      const cageColor = this.highlightTerm === 'cage' ? palette.cyan : withAlpha(palette.white, 0.18 + 0.72 * focus.cage);
      drawables.push(meshWireframe(BASE_VERTICES, BASE_FACES, cageColor, 12));
    }

    const edgeFaces = new Map();
    mesh.faces.forEach((face, faceIndex) => {
      for (let i = 0; i < face.length; i += 1) {
        const a = face[i];
        const b = face[(i + 1) % face.length];
        const key = edgeKey(a, b);
        if (!edgeFaces.has(key)) edgeFaces.set(key, { a, b, faces: [] });
        edgeFaces.get(key).faces.push(faceIndex);
      }
    });
    const seamSegments = [];
    for (const edge of edgeFaces.values()) {
      if (edge.faces.length !== 2) continue;
      if (labels[edge.faces[0]] !== labels[edge.faces[1]]) {
        seamSegments.push({ a: mesh.vertices[edge.a], b: mesh.vertices[edge.b], color: palette.amber });
      }
    }
    if (this.layers.topology) {
      drawables.push(makeLineSegments(seamSegments.map((segment) => ({ ...segment, color: withAlpha(palette.amber, 0.22 + 0.78 * focus.topology) })), palette.amber, 18));
    }

    this.cageAnchorWorld = BASE_VERTICES[6];
    this.surfaceAnchorWorld = mesh.vertices[Math.floor(mesh.vertices.length * 0.72)];
    const seam = seamSegments[Math.floor(seamSegments.length * 0.45)] ?? { a: BASE_VERTICES[2], b: BASE_VERTICES[6] };
    this.topologyAnchorWorld = [
      (seam.a[0] + seam.b[0]) / 2,
      (seam.a[1] + seam.b[1]) / 2,
      (seam.a[2] + seam.b[2]) / 2,
    ];
    this.solidAnchorWorld = [0, 0.02, 0.75];
    return drawables;
  }

  getTermAnchor(term) {
    if (term === 'cage') return { point: this.cageAnchorWorld };
    if (term === 'surface') return { point: this.surfaceAnchorWorld };
    if (term === 'topology') return { point: this.topologyAnchorWorld };
    if (term === 'solid') return { point: this.solidAnchorWorld };
    return null;
  }
}
