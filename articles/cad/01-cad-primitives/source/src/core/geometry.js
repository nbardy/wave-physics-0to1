import { add3, cross3, normalize3, scale3, sub3 } from '../math/linear.js';

export const VERTEX_FLOATS = 10;

export const palette = {
  background: [0.035, 0.047, 0.067, 1],
  surface: [0.16, 0.54, 0.66, 0.92],
  surfaceDim: [0.12, 0.27, 0.34, 0.62],
  cyan: [0.33, 0.85, 0.95, 1],
  cyanDim: [0.23, 0.62, 0.72, 0.62],
  violet: [0.66, 0.55, 1, 1],
  violetDim: [0.48, 0.38, 0.78, 0.62],
  amber: [1, 0.78, 0.43, 1],
  amberDim: [0.72, 0.51, 0.25, 0.64],
  green: [0.49, 0.9, 0.65, 1],
  red: [1, 0.49, 0.57, 1],
  white: [0.94, 0.97, 1, 1],
  whiteDim: [0.58, 0.64, 0.72, 0.58],
  grid: [0.35, 0.44, 0.55, 0.3],
  darkLine: [0.12, 0.16, 0.22, 0.9],
};

export function withAlpha(color, alpha) {
  return [color[0], color[1], color[2], alpha];
}

export function mixColor(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
    a[3] + (b[3] - a[3]) * t,
  ];
}

function appendVertex(target, position, normal, color) {
  target.push(
    position[0], position[1], position[2],
    normal[0], normal[1], normal[2],
    color[0], color[1], color[2], color[3],
  );
}

export function makeLineSegments(segments, color = palette.white, order = 10) {
  const vertices = [];
  for (const segment of segments) {
    const segmentColor = segment.color ?? color;
    appendVertex(vertices, segment.a, [0, 0, 0], segmentColor);
    appendVertex(vertices, segment.b, [0, 0, 0], segmentColor);
  }
  return { topology: 'lines', vertices: new Float32Array(vertices), order };
}

export function makeLineStrip(points, color = palette.white, closed = false, order = 10) {
  const segments = [];
  for (let i = 0; i < points.length - 1; i += 1) segments.push({ a: points[i], b: points[i + 1] });
  if (closed && points.length > 2) segments.push({ a: points.at(-1), b: points[0] });
  return makeLineSegments(segments, color, order);
}

export function makePointCubes(points, size = 0.035, color = palette.white, order = 20) {
  const drawables = [];
  for (const point of points) drawables.push(makeCube(point, size, color, order));
  return drawables;
}

export function makeCube(center, size = 0.04, color = palette.white, order = 20) {
  const half = size / 2;
  const p = [
    [center[0] - half, center[1] - half, center[2] - half],
    [center[0] + half, center[1] - half, center[2] - half],
    [center[0] + half, center[1] + half, center[2] - half],
    [center[0] - half, center[1] + half, center[2] - half],
    [center[0] - half, center[1] - half, center[2] + half],
    [center[0] + half, center[1] - half, center[2] + half],
    [center[0] + half, center[1] + half, center[2] + half],
    [center[0] - half, center[1] + half, center[2] + half],
  ];
  const faces = [
    [0, 1, 2, 3], [4, 7, 6, 5], [0, 4, 5, 1],
    [1, 5, 6, 2], [2, 6, 7, 3], [4, 0, 3, 7],
  ];
  return makeMeshFromFaces(p, faces, color, order);
}

export function makeMeshFromFaces(points, faces, color = palette.surface, order = 0) {
  const vertices = [];
  for (let faceIndex = 0; faceIndex < faces.length; faceIndex += 1) {
    const face = faces[faceIndex];
    if (face.length < 3) continue;
    const faceColor = typeof color === 'function' ? color(faceIndex, face) : color;
    for (let i = 1; i < face.length - 1; i += 1) {
      const a = points[face[0]];
      const b = points[face[i]];
      const c = points[face[i + 1]];
      const normal = normalize3(cross3(sub3(b, a), sub3(c, a)));
      appendVertex(vertices, a, normal, faceColor);
      appendVertex(vertices, b, normal, faceColor);
      appendVertex(vertices, c, normal, faceColor);
    }
  }
  return { topology: 'triangles', vertices: new Float32Array(vertices), order };
}

export function meshWireframe(points, faces, color = palette.whiteDim, order = 11) {
  const edgeKeys = new Set();
  const segments = [];
  for (const face of faces) {
    for (let i = 0; i < face.length; i += 1) {
      const aIndex = face[i];
      const bIndex = face[(i + 1) % face.length];
      const key = aIndex < bIndex ? `${aIndex}:${bIndex}` : `${bIndex}:${aIndex}`;
      if (edgeKeys.has(key)) continue;
      edgeKeys.add(key);
      segments.push({ a: points[aIndex], b: points[bIndex] });
    }
  }
  return makeLineSegments(segments, color, order);
}

function gridNormal(grid, row, column) {
  const rows = grid.length;
  const columns = grid[0].length;
  const left = grid[row][Math.max(0, column - 1)];
  const right = grid[row][Math.min(columns - 1, column + 1)];
  const down = grid[Math.max(0, row - 1)][column];
  const up = grid[Math.min(rows - 1, row + 1)][column];
  return normalize3(cross3(sub3(right, left), sub3(up, down)));
}

export function makeSurfaceGrid(grid, color = palette.surface, options = {}) {
  const { wireColor = palette.grid, surfaceOrder = 0, wireOrder = 10 } = options;
  const rows = grid.length;
  const columns = grid[0].length;
  const normals = grid.map((row, rowIndex) => row.map((_, columnIndex) => gridNormal(grid, rowIndex, columnIndex)));
  const surfaceVertices = [];

  const colorAt = (row, column, point) => {
    if (typeof color === 'function') return color(row, column, point);
    return color;
  };

  const pushTriangle = (a, b, c) => {
    for (const vertex of [a, b, c]) {
      const point = grid[vertex[0]][vertex[1]];
      appendVertex(surfaceVertices, point, normals[vertex[0]][vertex[1]], colorAt(vertex[0], vertex[1], point));
    }
  };

  for (let row = 0; row < rows - 1; row += 1) {
    for (let column = 0; column < columns - 1; column += 1) {
      pushTriangle([row, column], [row, column + 1], [row + 1, column + 1]);
      pushTriangle([row, column], [row + 1, column + 1], [row + 1, column]);
    }
  }

  const segments = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns - 1; column += 1) {
      segments.push({ a: grid[row][column], b: grid[row][column + 1] });
    }
  }
  for (let column = 0; column < columns; column += 1) {
    for (let row = 0; row < rows - 1; row += 1) {
      segments.push({ a: grid[row][column], b: grid[row + 1][column] });
    }
  }

  return {
    surface: { topology: 'triangles', vertices: new Float32Array(surfaceVertices), order: surfaceOrder },
    wire: makeLineSegments(segments, wireColor, wireOrder),
  };
}

export function makeRibbon(points, width, color = palette.cyan, order = 2) {
  if (points.length < 2) return { topology: 'triangles', vertices: new Float32Array(), order };
  const vertices = [];
  const normal = [0, 0, 1];
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    const direction = normalize3(sub3(b, a));
    const offset = scale3([-direction[1], direction[0], 0], width / 2);
    const a0 = sub3(a, offset);
    const a1 = add3(a, offset);
    const b0 = sub3(b, offset);
    const b1 = add3(b, offset);
    for (const point of [a0, b0, b1, a0, b1, a1]) appendVertex(vertices, point, normal, color);
  }
  return { topology: 'triangles', vertices: new Float32Array(vertices), order };
}

export function makeGridPlane(size = 3, divisions = 12, y = 0, color = palette.grid, order = 1) {
  const segments = [];
  for (let i = 0; i <= divisions; i += 1) {
    const t = -size / 2 + (size * i) / divisions;
    segments.push({ a: [-size / 2, y, t], b: [size / 2, y, t] });
    segments.push({ a: [t, y, -size / 2], b: [t, y, size / 2] });
  }
  return makeLineSegments(segments, color, order);
}

export function translatePoints(points, offset) {
  return points.map((point) => add3(point, offset));
}
