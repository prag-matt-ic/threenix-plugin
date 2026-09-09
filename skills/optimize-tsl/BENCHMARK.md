# Local TSL GPU benchmarks

Purpose: Capture a deterministic TSL workload before edits, then compare its GPU execution time and output after edits.

Read this before changing the benchmark runner or making performance claims with `optimize-tsl`.

Keywords: TSL, WGSL, WebGPU, GPU timestamps, Node, benchmark, shader optimization

The [Node runner](scripts/benchmark.mjs) uses the project's Three.js and native Dawn WebGPU to run an isolated render or compute fixture on the GPU. It records hardware timestamp samples, generated WGSL, source snapshots, and output bytes. This is a local prototype; automatic component extraction and plugin lifecycle hooks are not implemented.

## Quickstart in this repository

After installing the root dependencies, run from the monorepo root:

```sh
npm run bench:tsl -- scripts/benchmarks/tsl-palette.mjs --out .benchmarks/palette-before
```

The palette fixture imports the production `getStepColourFromPalette` graph from `@repo/ui/tslColours`. After that command finishes, edit the target source and compare using the same fixture and settings:

```sh
npm run bench:tsl -- scripts/benchmarks/tsl-palette.mjs --out .benchmarks/palette-after --baseline .benchmarks/palette-before/result.json
```

Each output directory must be new. Keep the baseline directory intact. Before making edits, run an unchanged second capture against the baseline to see the local timing noise.

The synthetic compute fixture demonstrates `length(p)^2` versus `dot(p, p)` with the same inputs:

```sh
npm run bench:tsl -- scripts/benchmarks/tsl-compute.mjs --variant before --out .benchmarks/compute-before
npm run bench:tsl -- scripts/benchmarks/tsl-compute.mjs --variant after --out .benchmarks/compute-after --baseline .benchmarks/compute-before/result.json
```

This is a harness example, not a promised optimization: a compiler may already remove the extra work, and floating-point results can differ.

The [landing component suite](../../../scripts/benchmarks/README.md) exercises the actual `InvertedMeteorFalls`, `SunFragments`, `Terrain`, and `Fireflies` components through a local R3F mount, plus the exported production background node factory. Its Node preload supplies the landing app's aliases, Next asset imports, JSX runtime, and empty local storage. Image fixtures decode the actual local assets into GPU textures with their dimensions and sampling settings preserved. These are explicit adapters for those components, not an arbitrary component extractor.

The meteor and firefly compute fixtures inspect private Three r184 `NodeManager` bindings to identify their production storage buffers. That version-specific inspection belongs to the local fixtures; the generic runner only consumes the returned compute nodes and output attributes. Recheck those adapters before changing Three versions.

## Running from an installed plugin

Run in the target project's directory. The runner resolves `webgpu` and `three` from that directory, even when the script lives in a plugin cache. The prototype uses `webgpu@0.6.0` and was developed against `three@0.184.0`; retain the project's Three version for its own graph and verify compatibility before comparing results.

For a project that already installs Three:

```sh
npm install --save-dev webgpu@0.6.0 tsx
node --import tsx /path/to/threenix/skills/optimize-tsl/scripts/benchmark.mjs ./benchmarks/target.mjs --out .benchmarks/before
```

Omit `--import tsx` when the fixture and all its imports are plain JavaScript. TypeScript/TSX imports need a loader; app-specific aliases and browser asset imports still need to resolve in Node.

Defaults are `--width 1024 --height 1024 --warmup 30 --samples 100 --variant default`. The hardware backend defaults to Metal on macOS, D3D12 on Windows, and Vulkan on Linux; `--backend metal|d3d12|vulkan` overrides it. A hardware adapter with `timestamp-query` is required. Unsupported hardware, invalid timestamps, and GPU validation errors fail the run; there is no CPU timing fallback.

## Fixture contract

Export a function, optionally async, receiving `{ THREE, tsl, renderer, width, height, variant }`. Return:

| Field               | Contract                                                                                                                                                                                                                                                         |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`              | Stable workload identity, shared by before/after.                                                                                                                                                                                                                |
| `workload`          | JSON metadata describing fixed inputs: geometry, counts, material settings, uniforms, assets/seeds, camera, and any feature flags affecting work. Keep equivalent inputs identical across variants.                                                              |
| `scene`, `camera`   | Render fixture: a Three `Scene` containing the target and its required lights/resources, plus a `Camera`. The runner supplies a render target at the selected dimensions with zero MSAA samples.                                                                 |
| `compute`           | Compute fixture instead: a `ComputeNode` or array. The runner submits the node(s) once per sample.                                                                                                                                                               |
| `output`, `outputs` | Compute output: one `StorageBufferAttribute` or `StorageInstancedBufferAttribute` in `output`, or a nonempty array of those attributes in `outputs`. When supplied, `outputs` takes precedence. The runner concatenates their raw readback bytes in array order. |
| `prepare`           | Optional async setup/reset function, called before every warmup and measured sample. Its work is excluded from timing; the runner resolves both compute and render timestamp pools afterward, before submitting the measured pass.                               |
| `sources`           | Optional source dependencies to snapshot, as file URLs or paths relative to the fixture. The fixture itself is always captured; transitive imports and assets are **not discovered automatically**. Declare every edited shader dependency.                      |
| `dispose`           | Optional cleanup function for fixture resources. Async cleanup is awaited.                                                                                                                                                                                       |

Use the supplied `THREE` and `tsl` when constructing fixture resources, and import the actual target graph where possible. The runner does not mount arbitrary R3F components: hooks, loaders, animation, React context, and app stores require an explicit fixture adapter. Prefer an existing exported node factory; the landing suite shows how a local R3F mount can reuse hook-owned graphs without copying their shader code. A browser fixture may still be necessary for browser-dependent behavior. Keep canonical shader code in its owning package, not copied into the plugin.

The runner freezes built-in TSL `time`, `deltaTime`, and `frameId` at zero. Supply explicit fixed uniforms for other representative times, and deterministic input buffers/textures. Compute must produce a stable result on repeated dispatches; use `prepare` to restore a fixed input state before each simulation update. Include that state and reset policy in `workload`, and keep the output attribute order fixed across captures. Readbacks after warmup and after sampling must match exactly. Run distinct fixed scenarios when branches, coverage, or resource sizes affect cost.

## What is measured

Each sample submits one `renderer.render()` or `renderer.compute()` call and resolves its GPU timestamps. Render compilation and warmup precede sampling; `prepare` and output readback happen outside it. The reported milliseconds measure the GPU pass workload, including rasterization, memory traffic, blending and other relevant GPU work. They exclude fixture resets and do not isolate vertex time from fragment time or measure React/CPU overhead, shader compilation latency, or application FPS.

Three r184 resolves the last frame's accumulated pass duration, so this runner resolves every sample separately. See the [r184 timestamp implementation](https://github.com/mrdoob/three.js/blob/r184/src/renderers/webgpu/utils/WebGPUTimestampQueryPool.js) and [renderer implementation](https://github.com/mrdoob/three.js/blob/r184/src/renderers/common/Renderer.js).

Captured `shader-*.wgsl` files are the modules submitted to the device, including any support shaders. WGSL alone is not a replayable component: geometry, bind groups, buffers, textures, pipeline flags and render targets determine execution. The fixture recreates that resource context; exported source is an inspection artifact, not a machine-instruction count or a standalone benchmark input.

## Reading results

Each run writes `result.json`, `output.bin`, `shader-*.wgsl`, and `source-*` snapshots. JSON includes all timing samples, median, 5th/95th percentiles, adapter/runtime details, workload metadata, and SHA-256 hashes. Finish the baseline capture before editing sources.

With `--baseline`, incompatible recorded GPU/runtime or workload settings fail comparison. Source and variant changes are allowed. The fixture's declared metadata is part of this protection: the runner cannot infer that an omitted light, changed uniform, or different asset makes a comparison unfair.

- `medianChangePercent`: negative means the new median was lower in these runs.
- `rangesOverlap`: the two runs' 5th–95th percentile ranges overlap. These are sample ranges, not confidence intervals or a statistical significance test.
- `outputIdentical`, `changedBytes`, `maxByteDifference`: exact output-byte comparison. Render output is raw RGBA8; compute output is raw storage-buffer bytes. Compute byte differences are **not floating-point error/tolerance measurements**. Decode and assess numerical output separately when bitwise equality is unnecessary.

An output difference is reported, not automatically accepted or rejected. Inspect it before claiming preserved visuals or behavior; one fixed input and RGBA8 equality cannot establish equivalence for every scene state.

Repeat unchanged A/A captures and interleave before/after runs under comparable power, temperature, and background GPU load. Treat small shifts within that noise as inconclusive. Even non-overlapping ranges from one pair do not establish a durable win. Report the workload, hardware, observed range, and output checks; reserve claims of improvement for repeatable results.

## Native and browser boundaries

Native Dawn can render to textures and run compute, but does not provide browser canvas, image/video elements, or the rest of the web platform. See the [official Node WebGPU README](https://github.com/dawn-gpu/node-webgpu/blob/main/README.md). Browser scenes with those dependencies need a browser fixture for representative validation.

The runner disables Dawn's `timestamp_quantization` for local measurement; the option is documented in [Dawn's toggle definitions](https://dawn.googlesource.com/dawn/+/refs/heads/main/src/dawn/native/Toggles.cpp). Browser timing precision, compiler/backend versions, feature availability and workload composition can differ. Native results establish a local comparison; recheck important wins in the target browser and on representative hardware before generalizing them.
