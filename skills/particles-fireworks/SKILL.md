---
name: particles-fireworks
description: Implement a GPU compute fireworks component in an existing React Three Fiber WebGPU scene. Use when the user invokes $particles-fireworks or asks to add the Threenix fireworks effect to an existing R3F WebGPU Canvas.
---

# Threenix Fireworks

Implement the GPU compute fireworks component in the user's existing scene; do not replace it with the Threenix demo.

## Workflow

1. Read the target repository's local instructions and inspect its dependencies, Canvas import, renderer, camera, controls, postprocessing, and scene composition before editing.
2. Confirm the scene uses `@react-three/fiber/webgpu` and provides the WebGPU hooks required by `Fireworks.tsx`, including `useLocalNodes` and `useUniforms`. If it does not, stop before editing and explain the incompatibility. Migrating WebGL to WebGPU is out of scope.
3. Call the `get_fireworks_reference` MCP tool from the `threenix` server. If access is unavailable or authentication fails, stop and explain the access problem. Never reconstruct, approximate, or use bundled source or assets as a fallback.
4. Write the returned UTF-8 component as `Fireworks.tsx` and decode the returned base64 sprite as `fireworks-sprites.webp` beside it. Preserve `new URL('./fireworks-sprites.webp', import.meta.url)` resolution.
5. Render `FireworksParticles` inside the existing WebGPU Canvas. Preserve the target's camera, controls, postprocessing, renderer setup, and scene structure.
6. Add only missing runtime dependencies returned by the tool. Do not copy or add `FireworksDemo.tsx`, `WebGPUCanvas.tsx`, Leva controls, `bg.png`, or demo-only dependencies.
7. Run the target repository's narrowest type-check or build covering the edited scene and report any remaining incompatibility.
