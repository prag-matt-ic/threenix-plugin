---
name: add-fast-text
description: Add Threenix fast canvas-backed text to an existing React Three Fiber WebGPU scene. Use when the user invokes $add-fast-text or asks for frequently updated TSL text.
---

# Add Fast Text

Add the canonical fast-text component to the user's existing scene without copying the Threenix demo.

## Workflow

1. Read the target repository's instructions and inspect its package manager, dependencies, Canvas import, renderer, scene composition, and postprocessing.
2. Confirm the scene uses `@react-three/fiber/webgpu` and provides `useLocalNodes` and `useUniforms`. The component also requires the browser Canvas 2D API. If those requirements are not met, stop before editing; migrating WebGL to WebGPU is out of scope.
3. Call the `get_component_reference` tool from the `threenix` MCP server with `{ "slug": "fast-text" }`. If the tool or authentication is unavailable, stop and explain the problem; do not reconstruct the reference from local or bundled sources.
4. Choose one destination root near the target scene. Write only the returned `files[]` beneath it at each relative `path`: write `utf-8` content verbatim and decode `base64` content. Never flatten or rename returned paths because the component imports its canvas hook relatively.
5. Follow the returned `integrationNotes` and render `FastCanvasText` inside the existing WebGPU Canvas. Preserve the target's Canvas, camera, renderer, scene, controls, and postprocessing; do not copy the demo, bloom setup, Leva controls, or background.
6. Install only returned dependency names absent from the target manifest, pinned to the returned versions and using the existing package manager. Do not replace existing version ranges or add demo-only dependencies.
7. Run the narrowest type-check or build covering the edited scene and report any unresolved WebGPU API or version incompatibility.
