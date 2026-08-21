# Threenix

Three.js/WebGPU skills and reference components built with React Three Fiber v10.

## Codex

```bash
codex plugin marketplace add prag-matt-ic/threenix-plugin
codex plugin add threenix@threenix
```

Start a new task and invoke:

- `$best-practices` to review and refactor Three.js or React Three Fiber code
- `$optimize-shader` to optimize TSL shader code
- `$simplify` to review the latest commit for unnecessary complexity
- `$setup-canvas` to create a WebGPU React Three Fiber canvas
- `$threenix-fireworks` to integrate the Fireworks reference into an existing WebGPU project

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
