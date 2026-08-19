import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  basisValues,
  evaluateBSpline,
  insertKnotOnce,
  maximumCurveDeviation,
  openUniformKnots,
} from '../src/math/bspline.js';
import { catmullClarkStep, subdivideCatmullClark } from '../src/math/subdivision.js';

const root = resolve(import.meta.dirname, '..');
const required = [
  'index.html', 'styles.css', 'favicon.svg', 'src/main.js',
  'src/core/renderer.js', 'src/scenes/bspline-scene.js',
  'src/scenes/nurbs-scene.js', 'src/scenes/tspline-scene.js',
  'src/scenes/subd-scene.js', 'src/scenes/brep-scene.js',
  'src/scenes/integration-scene.js',
];
await Promise.all(required.map((file) => access(resolve(root, file))));

const controlPoints = [
  [-1.8, -0.8, 0], [-1.2, 0.9, 0], [-0.55, 1.25, 0],
  [0.15, 0.25, 0], [0.75, -0.85, 0], [1.25, 0.9, 0], [1.8, 0.2, 0],
];
const degree = 3;
const knots = openUniformKnots(controlPoints.length, degree);
for (const u of [0, 0.07, 0.25, 0.5, 0.83, 0.999999, 1]) {
  const sum = basisValues(controlPoints.length, degree, knots, u).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1) < 1e-10, `partition of unity failed at u=${u}: ${sum}`);
}
const inserted = insertKnotOnce(controlPoints, degree, knots, 0.42);
assert.equal(inserted.inserted, true);
assert.equal(inserted.controlPoints.length, controlPoints.length + 1);
const deviation = maximumCurveDeviation(
  (u) => evaluateBSpline(controlPoints, degree, knots, u),
  (u) => evaluateBSpline(inserted.controlPoints, degree, inserted.knots, u),
  800,
);
assert.ok(deviation < 1e-11, `knot insertion changed the curve: ${deviation}`);

const cube = {
  vertices: [
    [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
    [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
  ],
  faces: [
    [0, 1, 2, 3], [4, 7, 6, 5], [0, 4, 5, 1],
    [1, 5, 6, 2], [2, 6, 7, 3], [3, 7, 4, 0],
  ],
};
const first = catmullClarkStep(cube);
assert.equal(first.mesh.vertices.length, 26);
assert.equal(first.mesh.faces.length, 24);
assert.ok(first.construction.valence.every((n) => n === 3));
const fourth = subdivideCatmullClark(cube, 4);
assert.equal(fourth.mesh.faces.length, 1536);

const html = await readFile(resolve(root, 'index.html'), 'utf8');
assert.equal((html.match(/<canvas\b/g) ?? []).length, 6, 'expected six linked visuals');
for (const id of ['integration', 'bspline', 'nurbs', 'tspline', 'subd', 'brep']) {
  assert.ok(html.includes(`data-canvas="${id}"`), `missing canvas for ${id}`);
  assert.ok(html.includes(`data-target-handle="${id}"`), `missing target handle for ${id}`);
}
assert.ok(html.includes('data-scene="bspline" data-term="basis"'));
assert.ok(html.includes('data-scene="brep" data-term="inner-wire"'));

console.log('Checks passed');
console.log(`  B-spline knot insertion deviation: ${deviation.toExponential(3)}`);
console.log(`  Catmull–Clark level 4: ${fourth.mesh.vertices.length} vertices / ${fourth.mesh.faces.length} faces`);
console.log('  Six interactive scenes and linked equation targets found');
