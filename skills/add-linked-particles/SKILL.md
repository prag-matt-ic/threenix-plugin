---
name: add-linked-particles
description: Add Threenix GPU linked particles to an existing React Three Fiber WebGPU scene. Use when the user invokes $add-linked-particles or asks for the proximity-linked particle ring.
---

# Add Linked Particles

Add the canonical linked-particle component to the user's existing scene without copying the Threenix demo.

## Workflow

1. Read the target repository's instructions and inspect its package manager, dependencies, Canvas import, renderer, scene composition, controls, and postprocessing.
2. Confirm the scene uses `@react-three/fiber/webgpu` and provides the WebGPU compute, local-node, and uniform APIs used by the component. If it does not, stop before editing; migrating WebGL to WebGPU is out of scope.
3. Call the `get_component_reference` tool from the `threenix` MCP server with `{ "slug": "linked-particles" }`. If the tool or authentication is unavailable, stop and explain the problem; do not reconstruct the reference from local or bundled sources.
4. Choose one destination root near the target scene. Write only the returned `files[]` beneath it at each relative `path`: write `utf-8` content verbatim and decode `base64` content. Never flatten or rename returned paths because the component imports its portrait-size hook relatively.
5. Follow the returned `integrationNotes` and render `LinkedParticles` inside the existing WebGPU Canvas. Preserve the target's Canvas, camera, renderer, scene, controls, and postprocessing; do not copy the demo, Leva controls, or background. Keep the default 1,024 particles unless the user asks otherwise because the proximity scan scales quadratically.
6. Install only returned dependency names absent from the target manifest, pinned to the returned versions and using the existing package manager. Do not replace existing version ranges or add demo-only dependencies.
7. Run the narrowest type-check or build covering the edited scene and report any unresolved WebGPU, GSAP, or version incompatibility.
