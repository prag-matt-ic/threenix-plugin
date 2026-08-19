---
name: setup-canvas
description: Create a React Three Fiber WebGPU canvas from the bundled Threenix reference. Use when the user invokes $setup-canvas or asks to create or set up a WebGPU Canvas.
---

# Threenix Setup Canvas

Create a WebGPU React Three Fiber canvas from `assets/WebGPUCanvas.tsx` in this Skill.

## Workflow

1. Read the target repository's local instructions and inspect the requested route, its layout, existing canvas components, and dependencies before editing.
2. If the target already has an `@react-three/fiber/webgpu` Canvas that meets the request, reuse it. Do not add a second canvas. If it has only a WebGL Canvas, stop and explain that migration is out of scope.
3. Copy `assets/WebGPUCanvas.tsx` to the target's shared component location without changing its public props. The reference intentionally has no background asset or custom WebGPU support UI.
4. Render `WebGPUCanvas` at the requested client-side scene boundary, with the target's scene as children. Keep DOM UI and overlays outside the canvas, and give its parent a definite height.
5. Add only missing runtime dependencies: `@react-three/fiber`, `react`, `react-dom`, and `three`. Do not add controls, postprocessing, or a WebGL fallback.
6. Run the target repository's narrowest type-check or build covering the new canvas and report any remaining incompatibility.
