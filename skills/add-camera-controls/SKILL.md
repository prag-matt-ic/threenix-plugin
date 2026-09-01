---
name: add-camera-controls
description: Add Threenix cinematic camera controls to an existing React Three Fiber scene. Use when the user invokes $add-camera-controls or asks for distance-aware camera transitions with optional pointer look.
---

# Add Camera Controls

Add the canonical camera-control hook to the user's existing scene without copying the Threenix demo.

## Workflow

1. Read the target repository's instructions and inspect its package manager, dependencies, Canvas, camera setup, controls, scene composition, and relevant input or shot logic.
2. Confirm the hook will run inside a React Three Fiber Canvas and that no other active controller writes the same camera. It updates the camera at frame priority `-1`; do not silently remove a conflicting controller.
3. Call the `get_component_reference` tool from the `threenix` MCP server with `{ "slug": "camera-controls" }`. If the tool or authentication is unavailable, stop and explain the problem; do not reconstruct the reference from local or bundled sources.
4. Choose one destination root near the target scene. Write only the returned `files[]` beneath it at each relative `path`: write `utf-8` content verbatim and decode `base64` content. Never flatten or rename returned paths.
5. Follow the returned `integrationNotes`. Call `useCameraControls` from a component inside the existing Canvas and wire only the requested `setLookAt`, pointer, or distance behavior. Preserve the target's Canvas, renderer, scene, postprocessing, and UI; do not copy demo shots, clipping logic, Leva controls, or backgrounds.
6. Install only returned dependency names absent from the target manifest, pinned to the returned versions and using the existing package manager. Do not replace existing version ranges or add demo-only dependencies.
7. Run the narrowest type-check or build covering the edited scene and report any unresolved controller or version incompatibility.
