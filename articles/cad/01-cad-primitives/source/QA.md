# Verification record

## Mathematical checks

Run with `npm run check`.

- B-spline basis functions sum to one at endpoints and representative interior parameters.
- One-knot insertion increases the control-point count by one and preserves the curve to below `1e-11` sampled Euclidean error. The current deterministic test reports approximately `6.75e-16`.
- One Catmull–Clark step on a closed cube produces 26 vertices and 24 quads.
- Four Catmull–Clark levels produce 1,538 vertices and 1,536 quads.
- The document contains six canvases, six linked scene targets, and representative equation-token bindings.

## Browser checks

Tested in Chromium 144 at 1440×1000 and 390×844 using the Canvas fallback path:

- no uncaught page errors;
- no console warnings or failed resources;
- no mobile horizontal overflow;
- all six scenes initialize;
- equation tokens activate the linked geometry, connector, and matching control;
- geometric DOM handles drag and update their scene state;
- exact B-spline knot insertion updates the editor and reports machine-scale deviation;
- native switch labels toggle correctly;
- LaTeX reveal controls work;
- the guided-tour dialog opens and closes;
- both the source tree and `dist/` build pass the same interaction checks.

## WebGPU note

The implementation contains a raw WebGPU renderer with explicit shared pipeline and bind-group layouts, plus a Canvas renderer consuming the same drawables. The headless QA environment exposed `navigator.gpu` but did not provide a usable adapter, so the WebGPU execution path could not be visually exercised here. The Sites handoff prompt therefore makes WebGPU preview verification a blocking pre-publication check. If Sites does not expose an adapter for a visitor, the tested Canvas fallback is automatic.
