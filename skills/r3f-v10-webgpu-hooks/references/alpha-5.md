# R3F 10.0.0-alpha.5 implementation caveats

Checked against Fiber's installed `dist/webgpu/index.mjs` and `index.d.ts`. These are version-specific observations, not promises about later releases. Recheck the target's package and any patches before applying a workaround.

## Registration and replacement

- `useScopedResource` stages entries during render and flushes in a layout effect. It has no unmount cleanup/refcount effect for uniforms, nodes, buffers, or GPU storage. Texture enrollment has a separate refcount mechanism.
- Valid scopes reuse entries by name. A fresh creator can therefore receive an older allocation. Scope names must distinguish allocation shape and source generation; an effect cannot repair an already-bound wrong-size buffer during render.
- `useNodes`, `useBuffers`, and `useGPUStorage` do **not** pass their creator as the internal `input` dependency. Changing a `useCallback` dependency does not itself recreate their resources. Use a new scope for a new generation or an explicit, owner-controlled rebuild and rebind sequence. Memoizing the creator alone is not a replacement policy.
- `useUniforms` does pass normalized input to that internal dependency. `useUniform` passes only the name: do not rely on a changing second argument synchronizing a mounted uniform. Update `.value` explicitly.
- `useLocalNodes` depends on creator identity, uniform/node/texture registries, and HMR version; it does not directly subscribe to buffer/storage registry changes. Read buffers/storage with their reader hooks and include the specific returned resources in the local creator's dependencies when replacement must propagate.
- Registration can cause another render. Inline local creators can then produce new nodes. Do not key a material on such a node's UUID unless a remount is intentional.

## Teardown is not recursive

`disposeBuffers(names, scope)` and `disposeStorage(names, scope)` call `.dispose()` on each registered object, then remove its entry. They do not recursively find underlying attributes or textures. Their scope argument is not inferred from the hook call. Name arrays must be mutable `string[]`; spread a readonly tuple instead of casting.

For a Three `StorageBufferNode` from `instancedArray`, node disposal does not forward to its `.value` BufferAttribute. Nor does compute-node disposal release every buffer it references. Inspect the installed Three renderer's attribute ownership path: geometry-owned attributes can have a different teardown path from compute-only storage. Do not claim a registry cleanup released GPU memory without verifying that path. Avoid manually freeing an attribute while a geometry or another compute pass still uses it.

Rebuild invalidates registered generations without disposing the outgoing resources. Remove/clear likewise are not GPU teardown. Capture outgoing resources in the owner's cleanup where needed; disposal by name after replacement can target the new generation. Account for React Strict Mode effect replay and reinitialization before reuse.

For `useRenderPipeline`, the configuring owner must dispose its pipeline and custom effects/passes and call `reset()` on teardown. `reset()` disposes only the hook's cached scene pass and clears root pipeline/pass state. A reader must not reset another component's pipeline.

`useRenderTarget` memoizes a newly constructed target by dimensions, canvas size, options identity, and renderer kind. It has no disposal effect in this build. Keep options stable and have the owner dispose outgoing targets on replacement/unmount; even canvas resizing can replace an explicitly sized target.

## Small check for the node/attribute distinction

Run from a project with Three installed:

```bash
node --input-type=module <<'JS'
import assert from 'node:assert/strict'
import { instancedArray } from 'three/tsl'
const buffer = instancedArray(4, 'vec4')
let attributeDisposed = false
buffer.value.addEventListener('dispose', () => { attributeDisposed = true })
buffer.dispose()
assert.equal(attributeDisposed, false)
console.log('Node disposal did not dispose its backing attribute')
JS
```

This checks object lifecycle only, without allocating on a GPU. If it fails on a newer Three release, inspect its disposal implementation and update the ownership decision; it is not a GPU leak test.
