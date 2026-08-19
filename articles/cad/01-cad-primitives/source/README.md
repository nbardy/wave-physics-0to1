# CAD primitives, visually

A self-contained, dependency-free interactive explainer for the category distinction between:

- **B-splines** — compactly supported finite bases;
- **NURBS** — rational B-splines with homogeneous weights;
- **T-splines** — spline support organized by a locally refinable T-mesh;
- **Subdivision surfaces / SubD** — smooth limits of recursively refined control meshes;
- **B-reps** — oriented topological boundaries whose faces are supported by geometry.

This deliberately excludes the later Gauged Fiber Volume proposal. It extracts only the incumbent CAD primitives and shows how they compose.

## Interaction model

The notation is part of the UI rather than static decoration.

- Hover or focus an equation token to isolate the corresponding geometric object.
- Click a token to pin the relationship, draw a connector to the visual, and focus its editor.
- Drag geometric handles to change the finite coordinates.
- Use the controls to move the evaluation parameter, change spline degree and weights, compare global and local refinement, inspect subdivision construction data, and select B-rep entities.
- Reveal the LaTeX source under every principal equation.

## What is computed

- The B-spline panel evaluates the Cox–de Boor basis and plots all active basis functions.
- Knot insertion is exact representation refinement; the UI reports the sampled before/after deviation.
- The NURBS panel evaluates the normalized rational basis and includes an exact quarter-circle preset.
- The SubD panel performs real Catmull–Clark refinement recursively from the editable cage.
- The B-rep panel constructs a closed plate with an outer shell, through-hole, grouped faces, wires, edges, and vertices.
- The integration panel shows authoring structure, surface geometry, and boundary topology as layers of one object.

The T-spline panel is intentionally labeled as a **support/refinement explainer**, not a production analysis-suitable T-spline evaluator. It demonstrates terminating refinement lines and localized anchor support without pretending that arbitrary T-junction combinatorics are automatically valid.

## Rendering

The project uses raw browser WebGPU when an adapter is available. It automatically falls back to a Canvas 2D renderer that consumes the same scene geometry, so the explainer remains usable on browsers or hosted previews without WebGPU.

Add `?forceCanvas=1` while testing to force the fallback path.

## Run locally

No package installation is required.

```bash
npm run check
npm run serve
```

Then open `http://localhost:4173`.

## Build

```bash
npm run build
```

The production-ready static files are written to `dist/`. The build includes a `404.html` fallback and `.nojekyll` marker.

## ChatGPT Sites handoff

Upload the project folder or the provided zip to ChatGPT Work/Sites and use the prompt in `SITE_PROMPT.md`. Save a private version for review before deploying publicly.

## Project map

```text
index.html                 content, equations, controls, semantic structure
styles.css                 responsive visual system and connector UI
src/main.js                term linking, navigation, tour, runtime status
src/core/renderer.js       shared WebGPU renderer + Canvas fallback
src/core/scene.js          camera, dragging, handle overlays, highlight protocol
src/math/bspline.js        basis evaluation, NURBS, exact knot insertion
src/math/subdivision.js    Catmull–Clark refinement
src/scenes/*               one interactive scene per primitive
scripts/check.mjs          mathematical and structural checks
scripts/build.mjs          dependency-free static build
```

## Scope notes

This is an educational explainer, not a CAD kernel. It avoids claiming exact field-to-B-rep conversion, production booleans, analysis-suitable T-spline admissibility, or manufacturing tolerancing. The point is to make the incumbent primitives legible and manipulable—and to make their category differences impossible to miss.
