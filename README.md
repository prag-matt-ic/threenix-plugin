# Threenix (Alpha)

Agent skill for building performant React Three Fiber v10+ WebGPU experiences.

Threenix helps you (and your AI agent) build R3F/WebGPU apps using production-ready code and prompts.

- prompts for reviewing and refactoring Three.js code for performance and best practices.
- example components, including backgrounds, particles, animated text and postprocessing.

## ChatGPT / Codex

```bash
codex plugin marketplace add prag-matt-ic/threenix-plugin
codex plugin add threenix@threenix
```

Start a new task. For focused reviews, `@`-mention the chosen files as context:

- `$best-practices @Component.tsx` to review and refactor selected Three.js or React Three Fiber files
- `$optimize-shader @Component.tsx` to optimize selected TSL shader files
- `$simplify @file.ts` to focus the latest-commit review on selected files

Other skills can be invoked directly:

- `$setup-canvas` to create a WebGPU React Three Fiber canvas
- `$threenix-fireworks` to integrate the Fireworks reference into an existing WebGPU project

## Cursor

Install the skills from `https://github.com/prag-matt-ic/threenix-plugin` using Cursor's [Skills guide](https://cursor.com/help/customization/skills), then invoke:

- `/best-practices @Component.tsx`
- `/optimize-shader @Component.tsx`
- `/simplify @file.ts`
- `/setup-canvas`
- `/threenix-fireworks`

## Claude Code

```bash
claude plugin marketplace add prag-matt-ic/threenix-plugin
claude plugin install threenix@threenix
```

Start a new session and invoke:

- `/threenix:best-practices`
- `/threenix:optimize-shader`
- `/threenix:simplify`
- `/threenix:setup-canvas`
- `/threenix:threenix-fireworks`

## MCP resources

The public workflow Skills are bundled directly with the plugin.
`$setup-canvas` requires React Three Fiber v10 alpha and Three.js:

```bash
npm install @react-three/fiber@alpha three
npm install --save-dev @types/three
```
