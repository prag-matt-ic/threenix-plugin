---
name: optimize-tsl
description: Review and refactor TSL shader node graphs for performance, clarity, and portability. Use when the user invokes $optimize-tsl or asks to optimize Three.js Shading Language (TSL) code.
---

# Review and refactor TSL node graphs for performance, clarity, and portability

## Goal

Review and refactor the provided **TSL TypeScript** shader logic (nodes + material slots) to reduce GPU cost and improve readability **without visible regressions**.

For full TSL documentation refer to: https://github.com/mrdoob/three.js/wiki/Three.js-Shading-Language

**Success criteria**

- Visual output is indistinguishable under normal viewing (small numeric drift is acceptable).
- No feature regressions; public APIs (uniforms, exported functions, material slot assignments) remain compatible unless explicitly justified.
- Fewer or cheaper instructions in the bottleneck stage and no added texture fetches unless justified.
- Code stays in TSL (no raw GLSL strings).

## Inputs

- Current TSL sources (TypeScript) and where they are bound (material slots, post-processing pass, compute).
- (Optional) Active light count, material flags, pipeline notes, target backend (WebGL2/WebGPU).

## Procedure (follow in order)

1. **Establish evidence + stage mapping**
   - State the suspected bottleneck and the evidence for it. Treat vertex/fragment/bandwidth limits as hypotheses until profiling supports them; pass timing alone does not identify the limiting stage.
   - Map the heavy work to stage: `material.positionNode`/`geometryNode` is vertex-stage, `material.colorNode`/`fragmentNode`/postprocessing is fragment-stage.
   - Note any `vertexStage()` / `varying()` usage and whether it matches the actual consumption site.
   - When benchmarking is requested or a suitable local fixture is available, follow [BENCHMARK.md](BENCHMARK.md): import the actual target graph into a deterministic render/compute fixture, declare shader source dependencies, and capture the baseline **before editing**. Take an unchanged repeat to establish noise. If a faithful fixture cannot run locally, state the limitation and keep performance estimates unmeasured.

2. **Static audit (find issues)**
   - Unused or redundant nodes, uniforms, varyings, or cached vars (`toVar`).
   - Implicit or unclear type conversions; prefer explicit `float/vec*` or `.to*()`.
   - Hot ops in fragment: trig (`sin/cos`), `pow`, `exp`, divisions, conditionals/loops, multiple texture fetches.
   - Recomputation: repeated expressions or UV transforms; missing `toVar()`/`toConst()` where reuse matters.
   - Interface bloat: `varying()` created but only used in vertex stage (use `vertexStage()` instead).

3. **Plan (write before changing code)**
   - List concrete edits you will make, ordered by expected impact (largest -> smallest), tied to the identified bottleneck.
   - Note any quality trade-offs and why they are acceptable.

4. **Refactor (apply changes)**
   - **Move work out of fragment when acceptable:** use `vertexStage()`; use `varying()` only when fragment truly needs it.
   - **Cache and reuse:** use `.toVar()` for repeated expressions; `.toConst()` or `float/vec*` for literals.
   - **Explicit conversions:** use `float/vec2/vec3/vec4` or `.toVec*()` for clear types.
   - **Reduce branching:** replace `If/Else` with `mix/step/smoothstep` when visually safe.
   - **Texture discipline:** sample once and reuse; keep UV math minimal; avoid duplicate `texture()` calls.
   - **Function hygiene (TS safe + pure):**
     - Use `Fn()` for reusable node functions.
     - Prefer typed tuple/object params (e.g., `[t, a]: [t: VarNode, a: VarNode]`).
     - Add `/*#__PURE__*/` (or `/*@__PURE__*/`) to exported `Fn()` for tree-shaking.
     - Use `.setLayout({ name, type, inputs })` for exported helpers to lock in typings.
   - **Uniform updates:** use `uniform()` for dynamic values; prefer `uniform.onFrameUpdate/onRenderUpdate/onObjectUpdate` over captured mutable JS state.
   - **Keep interfaces lean:** only emit nodes/varyings that are actually consumed; preserve slot semantics.

5. **Output (deliverables)**
   - **Measured comparison, when captured:** run the same fixture/settings after edits with `--baseline` pointing to the saved `result.json`. Inspect output differences and repeat A/B runs before claiming a win. Report GPU pass timing separately from stage hypotheses and application FPS; include artifact paths and any inconclusive result. See [benchmark interpretation](BENCHMARK.md#reading-results).
   - **Findings table**
     | Issue | Location | Severity | Fix summary |
     | ----- | -------- | -------- | ----------- |
   - **Refactor plan** (bulleted, 5-10 lines).
   - **Refactored code**: updated **TSL TypeScript** node code.
   - **Change diff**: minimal unified diff or `changes` tool entries.
   - **Impact estimate**: which stage should get cheaper and why (e.g., removed N trig ops per fragment), clearly distinguished from measured results and compiler-dependent assumptions.
   - **TODOs**: further safe optimizations or optional quality dials.

## Checks (single consolidated checklist)

- **Bottleneck-aligned:** Optimization focuses on the limiting stage (vertex vs fragment).
- **Stage-correct:** `vertexStage()`/`varying()` usage matches where results are consumed.
- **Type clarity:** conversions are explicit; no accidental JS math or type drift.
- **Redundancy removed:** repeated work cached or hoisted with `toVar()`/`toConst()`.
- **Branching minimized:** replaced with branchless math where safe.
- **Texture fetches minimized:** no duplicate samples; UV math kept light.
- **Function hygiene:** `Fn()` usage is pure, typed, and layouted when exported.
- **Interface stable:** material slots, uniforms, and public function signatures remain compatible.
- **Readability maintained:** clear naming; minimal noise; portable across WebGL2/WebGPU where possible.

## Notes & guardrails

- Do **not** change color spaces, tonemapping, or gamma unless explicitly requested.
- Preserve semantic behavior; call out any intentional approximations.
- Avoid raw GLSL strings or `onBeforeCompile`; keep logic in TSL nodes.
- If a backend limitation applies (WebGL2 vs WebGPU), document it explicitly.

<!-- TODO: add Particle buffer best practices here. -->
