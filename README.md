# Threenix (Alpha)

Agent skill for building performant React Three Fiber v10+ WebGPU experiences.

Threenix helps you (and your AI agent) build R3F/WebGPU apps using production-ready code and prompts.

- prompts for reviewing and refactoring Three.js code for performance and best practices.
- example components, including backgrounds, particles, animated text and postprocessing.

## Installation

### ChatGPT / Codex

```bash
codex plugin marketplace add prag-matt-ic/threenix-plugin
codex plugin add threenix@threenix
```

### Cursor

Install the skills from `https://github.com/prag-matt-ic/threenix-plugin` using Cursor's [Skills guide](https://cursor.com/help/customization/skills).

### Claude Code

```bash
claude plugin marketplace add prag-matt-ic/threenix-plugin
claude plugin install threenix@threenix
```

## Skills

Start a new task or session after installing. For focused reviews, `@`-mention the chosen files as context.

### Review / Refactor

Catch performance problems, remove unnecessary complexity, and make Three.js, R3F, and TSL code easier to maintain.

| Name                                                 | Description                                                            | ChatGPT / Codex                  | Claude Code                               | Cursor                           |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------- | ----------------------------------------- | -------------------------------- |
| [`best-practices`](skills/best-practices/SKILL.md)   | Review and refactor Three.js and R3F code for performance and clarity. | `$best-practices @Component.tsx` | `/threenix:best-practices @Component.tsx` | `/best-practices @Component.tsx` |
| [`clean-code`](skills/clean-code/SKILL.md)           | Review and refactor code with the Threenix Clean Code checklist.       | `$clean-code @Component.tsx`     | `/threenix:clean-code @Component.tsx`     | `/clean-code @Component.tsx`     |
| [`optimize-shader`](skills/optimize-shader/SKILL.md) | Optimize TSL node graphs without changing their visible output.        | `$optimize-shader @Shader.ts`    | `/threenix:optimize-shader @Shader.ts`    | `/optimize-shader @Shader.ts`    |
| [`simplify`](skills/simplify/SKILL.md)               | Review the latest commit for duplication and unnecessary complexity.   | `$simplify @file.ts`             | `/threenix:simplify @file.ts`             | `/simplify @file.ts`             |

### Build Components

Ship WebGPU features faster by adding proven scene foundations and effects to an existing project.

| Name                                                         | Description                                                     | ChatGPT / Codex        | Claude Code                     | Cursor                 |
| ------------------------------------------------------------ | --------------------------------------------------------------- | ---------------------- | ------------------------------- | ---------------------- |
| [`background-node`](skills/background-node/SKILL.md)         | Add a custom TSL background to an existing WebGPU R3F canvas.   | `$background-node`     | `/threenix:background-node`     | `/background-node`     |
| [`particles-fireworks`](skills/particles-fireworks/SKILL.md) | Add GPU compute fireworks to an existing WebGPU R3F scene.      | `$particles-fireworks` | `/threenix:particles-fireworks` | `/particles-fireworks` |
| [`setup-canvas`](skills/setup-canvas/SKILL.md)               | Create a WebGPU R3F canvas from the bundled Threenix reference. | `$setup-canvas`        | `/threenix:setup-canvas`        | `/setup-canvas`        |
