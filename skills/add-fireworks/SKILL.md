---
name: add-fireworks
description: Implement a GPU compute fireworks component in an existing React Three Fiber WebGPU scene. Use when the user invokes $add-fireworks or asks to add the Threenix fireworks effect to an existing R3F WebGPU Canvas.
---

# Threenix Fireworks

Implement the GPU compute fireworks component in the user's existing scene; do not replace it with the Threenix demo.

## Workflow

1. Read the target repository's local instructions and inspect its dependencies, Canvas import, renderer, camera, controls, postprocessing, and scene composition before editing.
2. Confirm the scene uses `@react-three/fiber/webgpu` and provides the WebGPU hooks required by `Fireworks.tsx`, including `useLocalNodes` and `useUniforms`. If it does not, stop before editing and explain the incompatibility. Migrating WebGL to WebGPU is out of scope.
3. Call the `get_component_reference` tool from the `threenix` MCP server with `{ "slug": "fireworks" }`. If the tool or authentication is unavailable, stop and explain the problem; do not reconstruct the reference from local or bundled sources.
4. Choose one destination root near the target scene. Write only the returned `files[]` beneath it at each relative `path`: write `utf-8` content verbatim and decode `base64` content. Never flatten or rename returned paths; `fireworks-sprites.webp` must remain beside `Fireworks.tsx` for its relative asset URL.
5. Follow the returned `integrationNotes` and render `FireworksParticles` inside the existing WebGPU Canvas. Preserve the target's camera, controls, postprocessing, renderer, and scene; do not copy or replace its Canvas, demo, Leva controls, or background.
6. Install only returned dependency names absent from the target manifest, pinned to the returned versions and using the existing package manager. Do not replace existing version ranges or add demo-only dependencies.
7. Run the narrowest type-check or build covering the edited scene and report any unresolved WebGPU API or version incompatibility.
