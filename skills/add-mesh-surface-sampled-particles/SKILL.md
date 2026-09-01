---
name: add-mesh-surface-sampled-particles
description: Add Threenix mesh-surface-sampled particles to an existing React Three Fiber WebGPU scene. Use when the user invokes $add-mesh-surface-sampled-particles or asks for the Phoenix particle silhouette.
---

# Add Mesh Surface Sampled Particles

Add the canonical Phoenix particle component to the user's existing scene without copying the Threenix demo.

## Workflow

1. Read the target repository's instructions and inspect its package manager, dependencies, Canvas import, renderer, scene composition, controls, and asset handling.
2. Confirm the scene uses `@react-three/fiber/webgpu`, provides `useLocalNodes`, and can load GLB assets through `useGLTF`. If it does not, stop before editing; migrating WebGL to WebGPU is out of scope.
3. Call the `get_component_reference` tool from the `threenix` MCP server with `{ "slug": "mesh-surface-sampled-particles" }`. If the tool or authentication is unavailable, stop and explain the problem; do not reconstruct the reference from local or bundled sources.
4. Choose one destination root near the target scene. Write only the returned `files[]` beneath it at each relative `path`: write `utf-8` content verbatim and decode `base64` content. Never flatten or rename returned paths; the component expects its sampler and `phoenix_compressed.glb` at their returned relative locations.
5. Follow the returned `integrationNotes` and render `MeshSurfaceSampledParticles` inside the existing WebGPU Canvas. Preserve the target's Canvas, camera, renderer, scene, controls, and postprocessing; do not copy the demo, Leva controls, or background. Keep the returned model and its `Pheonix_Baked_Baked` node contract; apply scene-specific transforms only at the integration site.
6. Install only returned dependency names absent from the target manifest, pinned to the returned versions and using the existing package manager. Do not replace existing version ranges or add demo-only dependencies.
7. Run the narrowest type-check or build covering the edited scene and report any unresolved WebGPU, GLB, or version incompatibility.
