# ChatGPT Sites handoff prompt

Use this after attaching or opening the `cad-primitives-explainer` project in ChatGPT Work/Sites:

> **Create a website from this compatible local project using ChatGPT Sites. Preserve the existing source architecture and all six interactive scenes. First save a private review version without deploying it. Verify that ES modules, raw WebGPU, the Canvas fallback, pointer-drag handles, equation-token highlighting, SVG connector paths, responsive layout, and the native dialog all work in the Sites runtime. Do not replace the computed visuals with screenshots or canned animation. Keep the T-spline disclaimer exactly visible: that panel is a support/refinement explainer, not a production analysis-suitable evaluator. After compatibility fixes, show me the private preview and a concise diff. Do not publish until I explicitly approve.**

Suggested first review checks:

1. Hover `N_{i,p}(u)` and confirm the active basis curve and connector highlight.
2. Insert a B-spline knot and confirm the control-point count increases while `Δ` remains near machine precision.
3. Load the exact NURBS quarter circle and drag a weight stalk.
4. Toggle the T-junction and support footprint independently.
5. Set SubD refinement to level 4 and show the one-step Catmull–Clark construction.
6. Inspect `Face`, `Inner Wire`, and `Underlying Surface` in the B-rep panel.
7. Test one desktop viewport and a 390-pixel mobile viewport with no horizontal overflow.
8. Test a browser without WebGPU and confirm the Canvas fallback badge appears.
