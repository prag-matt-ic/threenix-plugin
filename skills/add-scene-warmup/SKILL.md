---
name: add-scene-warmup
description: Reduce first-reveal jitter, stutter, frame-time spikes, or FPS drops when meshes enter the camera frustum or become visible in a React Three Fiber WebGPU scene. Use when the user invokes $add-scene-warmup, requests scene precompilation, or reports these first-use symptoms. Supports default Canvas rendering and existing postprocessing passes; not a general fix for sustained low FPS.
---

# Add Scene Warmup

Compile mounted content before its first reveal. Leaving the frustum does not itself discard a compiled pipeline. Warmup targets first-use compilation, not ongoing draw cost, asset downloads, or meshes that have not mounted yet.

## Workflow

1. Read the target repository's instructions and inspect its dependencies, Canvas, renderer, render owner, and content/loading readiness. Check whether the hitch occurs on first entry but improves on revisiting the same content; repeated slow frames need profiling beyond warmup.
2. Confirm compatible React Three Fiber `/webgpu` APIs and a WebGPU renderer. The reference is tested with R3F `10.0.0-alpha.5` and Three `0.185.0`; inspect installed APIs when versions differ. Its immediate visibility restoration relies on initialized Three collecting the render list synchronously before yielding. WebGL requires a different integration; do not transplant this WebGPU hook. A custom postprocessing pipeline is **not required**.
3. Call the `get_component_reference` tool from the `threenix` MCP server with `{ "slug": "scene-warmup" }`. If the tool or authentication is unavailable, explain the access problem; do not reconstruct the reference from local or bundled sources.
4. Choose one destination root near the target scene. Write the returned `files[]` beneath it at each relative `path`: write `utf-8` content verbatim and decode `base64` content. Preserve paths; keep host integration edits outside the returned source.
5. Follow the returned `integrationNotes` and the integration contract below. Keep the host renderer, scene, camera, loading UI, and disposal ownership. Do not create a renderer or postprocessing pipeline just for warmup.
6. Install only returned dependencies absent from the target manifest, pinned to returned versions with the existing package manager. Preserve existing ranges; report incompatible installed APIs rather than silently upgrading the app.
7. Run the narrowest type-check/build and the runtime checks below. Report checks not performed and remaining hitch sources; a successful build alone does not demonstrate smoother frames.

## Integration contract

- Mount one `useSceneWarmup` owner inside the existing Canvas. **Default Canvas rendering:** omit `scenePassRef` entirely. The hook uses the Canvas scene/camera, compiles against the screen target, pauses its frame loop during compilation, restores the prior mode in `finally`, and invalidates a frame. Do not change frame-loop mode concurrently. If the host manually calls `advance`/`render`, guard those calls with a shared `compilationRef` too.
- **Existing postprocessing:** pass its actual `PassNode` via `scenePassRef`. A `RenderPipeline` is not itself a scene pass. Passing `null` or a ref whose `.current` is null means “wait for the pass,” never “compile the screen.” Publish a new ref object through React state when the pass is created/replaced, or update `.current` and change `revision` in the same commit. A ref write alone does not rerun effects. Keep ref identity stable otherwise.
- For postprocessing, share one `useRef<Promise<void> | null>(null)` between the hook and render owner. Skip draws while `compilationRef.current` is set. With automatic pipeline rendering, pause/resume the existing frame loop around warmup instead. Defer disposal of replaced pass resources using the pending promise read at cleanup: `pending.then(dispose, dispose)`. Keep resources alive until renderer state has been restored.
- `isSceneReady` means **content ready, excluding warmup**. Assets, async text geometry, and intended meshes/materials must already be mounted and configured. Do not use the final loading gate as this input or clear it from `onWarmupStart`: that cancels the work or prevents it starting. Track warmup completion separately in the host readiness system; final readiness combines content readiness and warmup completion. `onWarmupStart` clears only warmup completion; `onWarmupComplete` sets it even on compilation failure.
- If no readiness system exists, add the smallest content-ready signal at the actual scene's resolved Suspense/setup boundary and a separate warmup-complete flag if interaction must wait. Mounting an outside parent or finishing downloads alone does not prove async geometry is ready. Keep intended content mounted before warmup, using visibility for later reveals. Do not assume warmup includes camera-layer-excluded objects or materials with `visible=false`.
- Change `revision` after new content/material variants settle or a pipeline configuration changes. Never use camera movement or every frame as a revision. Warmup does not compile future unmounted content or every possible material variant, and does not warm all fullscreen postprocessing effects.

## Runtime checks

On a cold reload, keep the existing loading/interaction gate closed until content and warmup settle. Reveal a previously off-camera mounted mesh and compare its first-entry frame-time spike with warmup disabled, then revisit it. Check that visibility/culling flags return to their original values and the normal frame loop resumes (including demand mode).

Exercise a delayed scene/pass, a pass or content revision, and a rejected compile. Verify no premature readiness, stuck loading, concurrent draws, or early resource disposal. If a browser/GPU is unavailable, leave these as explicit unverified checks rather than claiming the jitter is fixed.
