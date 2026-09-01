---
name: add-background-node
description: Add a custom TSL scene background to an existing React Three Fiber WebGPU Canvas. Use when the user invokes $add-background-node or asks for a custom background node in a WebGPU R3F scene.
---

# Threenix Background Node

Add one scene-level TSL background through `scene.backgroundNode` using the bundled `assets/BackgroundNode.tsx` reference.

## Workflow

1. Read the target repository's local instructions and inspect the existing Canvas, scene composition, and package versions.
2. Confirm the target uses `@react-three/fiber/webgpu` with `useLocalNodes`. If it has a WebGL Canvas, stop and explain that migrating renderers is out of scope.
3. Copy `assets/BackgroundNode.tsx` into the target's scene component location. Keep the component local to the Canvas and render it once as a child of that Canvas.
4. Replace only the example TSL graph inside `createBackgroundNode` with the requested visual. Keep the graph in `three/tsl`, return it as `backgroundNode`, and preserve `<primitive attach="backgroundNode" object={backgroundNode} />`.
5. Reuse the scene's existing textures, uniforms, and shared nodes where they fit. Use `useLocalNodes` for component-local node graphs; do not add a full-screen mesh, a second Canvas, raw GLSL, or a postprocessing pass just to draw the background.
6. Add only missing dependencies required by the existing R3F WebGPU setup. Do not add controls, UI, fallback renderers, or a texture pipeline unless the requested look requires one.
7. Run the target repository's narrowest type-check or build covering the scene and report any unresolved compatibility issue.
