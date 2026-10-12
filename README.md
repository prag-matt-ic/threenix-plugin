[![Threenix hero](assets/hero.jpg)](https://threenix.io)

[Explore the demo](https://threenix.io)

# Skills for Advanced React Three Fiber + WebGPU Developers

[![skills.sh](https://skills.sh/b/prag-matt-ic/threenix-plugin)](https://skills.sh/prag-matt-ic/threenix-plugin)

Build WebGPU scenes and improve existing Three.js code with focused AI skills from Threenix, a Three.js development studio. The skills cover R3F v10 scene components, GPU particle effects, performance reviews and TSL shaders.

_Currently in Alpha._

## Why Threenix

React Three Fiber v10 and Three.js Shading Language (TSL) are still evolving. Reliable patterns can be hard to find online, and performance best practices are easy to miss. These skills bring together scene components, shader patterns and review workflows developed alongside real 3D projects.

## Installation

### Skills CLI

Run this from your project directory to install Threenix skills:

```bash
npx skills add prag-matt-ic/threenix-plugin
```

Follow the prompts to choose your skills and agents. For Cursor-specific guidance, see Cursor's [Skills guide](https://cursor.com/help/customization/skills).

<details>
<summary><strong>ChatGPT / Codex</strong></summary>

```bash
codex plugin marketplace add prag-matt-ic/threenix-plugin
codex plugin add threenix@threenix
```

</details>

<details>
<summary><strong>Claude Code</strong></summary>

```bash
claude plugin marketplace add prag-matt-ic/threenix-plugin
claude plugin install threenix@threenix
```

</details>

## Start here

- **Review an existing scene:** [`threenix-best-practices`](skills/threenix-best-practices/SKILL.md)
- **Start a WebGPU scene:** [`threenix-add-webgpu-canvas`](skills/threenix-add-webgpu-canvas/SKILL.md)
- **Use R3F v10 hooks:** [`threenix-r3f-v10-webgpu-hooks`](skills/threenix-r3f-v10-webgpu-hooks/SKILL.md)
- **Add a visual effect:** [`threenix-add-fireworks`](skills/threenix-add-fireworks/SKILL.md)

## Skills

Start a new task or session after installing. For focused reviews, `@`-mention the chosen files as context.

Invoke a skill by name: `$threenix-best-practices` in Codex, `/threenix-best-practices` in Cursor or Claude Code when installed through the Skills CLI, or `/threenix:threenix-best-practices` with the Claude Code plugin.

From v0.9.0, all 13 skill names use the `threenix-` prefix. For example, `optimize-tsl` becomes `threenix-optimize-tsl`. The old skill names are no longer provided. Update your installation, use the prefixed commands, and start a new session to load them. The plugin installation name remains `threenix@threenix`.

### Review / Refactor

Catch performance problems, remove unnecessary complexity, and make Three.js, R3F, and TSL code easier to maintain.

| Skill                                                                            | What it does                                                                                 |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| [`threenix-best-practices`](skills/threenix-best-practices/SKILL.md)             | Review and refactor Three.js and R3F code for performance and clarity.                       |
| [`threenix-benchmark-webgpu`](skills/threenix-benchmark-webgpu/SKILL.md)         | Measure Three.js WebGPU render and compute workloads with GPU timestamps.                    |
| [`threenix-clean-code`](skills/threenix-clean-code/SKILL.md)                     | Review and refactor TypeScript code against a Clean Code checklist.                          |
| [`threenix-optimize-tsl`](skills/threenix-optimize-tsl/SKILL.md)                 | Optimize Three.js Shading Language (TSL) nodes without changing their visible output.        |
| [`threenix-r3f-v10-webgpu-hooks`](skills/threenix-r3f-v10-webgpu-hooks/SKILL.md) | Choose WebGPU hooks and manage uniforms, graphs, buffers, textures, and pipeline lifecycles. |

For standalone baselines or before/after GPU comparisons, use [`threenix-benchmark-webgpu`](skills/threenix-benchmark-webgpu/SKILL.md) and its [Node benchmark guide](skills/threenix-benchmark-webgpu/BENCHMARK.md). `threenix-optimize-tsl` uses it when a shader change needs measurement.

### Add Components

Add WebGPU scene foundations and effects to an existing project.

| Skill                                                                                                        | What it does                                                      |
| ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| [`threenix-add-background-node`](skills/threenix-add-background-node/SKILL.md)                               | Add a custom TSL background to an existing WebGPU R3F canvas.     |
| [`threenix-add-camera-controls`](skills/threenix-add-camera-controls/SKILL.md)                               | Add cinematic camera controls to an existing R3F scene.           |
| [`threenix-add-fast-text`](skills/threenix-add-fast-text/SKILL.md)                                           | Add fast canvas-backed text to an existing WebGPU R3F scene.      |
| [`threenix-add-fireworks`](skills/threenix-add-fireworks/SKILL.md)                                           | Add GPU compute fireworks to an existing WebGPU R3F scene.        |
| [`threenix-add-linked-particles`](skills/threenix-add-linked-particles/SKILL.md)                             | Add GPU proximity-linked particles to an existing WebGPU scene.   |
| [`threenix-add-mesh-surface-sampled-particles`](skills/threenix-add-mesh-surface-sampled-particles/SKILL.md) | Add a mesh-sampled Phoenix particle silhouette to a WebGPU scene. |
| [`threenix-add-scene-warmup`](skills/threenix-add-scene-warmup/SKILL.md)                                     | Reduce first-reveal stutter with or without postprocessing.       |
| [`threenix-add-webgpu-canvas`](skills/threenix-add-webgpu-canvas/SKILL.md)                                   | Create a WebGPU R3F canvas from the bundled Threenix reference.   |

## Startup updates

Codex and Claude Code marketplace installs (v0.8.0+) check for updates when you start or resume a session and can update the plugin and its skills automatically. This requires Node 20+, Git and the relevant CLI, plus hook approval in Codex. Existing users need one manual plugin update to enable it. Start a new session to load updated skills. Failed checks let work continue. Skills CLI installs and pinned or local copies aren’t updated automatically.
