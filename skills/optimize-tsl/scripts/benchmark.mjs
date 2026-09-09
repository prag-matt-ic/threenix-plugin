#!/usr/bin/env node
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'

const hash = (data) => createHash('sha256').update(data).digest('hex')

export function packRGBA(data, width, height) {
  const rowBytes = width * 4
  const stride = Math.ceil(rowBytes / 256) * 256
  const bytes = Buffer.from(data.buffer, data.byteOffset, data.byteLength)
  if (bytes.length === rowBytes * height) return bytes
  assert(bytes.length >= stride * (height - 1) + rowBytes, 'Incomplete GPU texture readback.')
  const packed = Buffer.alloc(rowBytes * height)
  for (let y = 0; y < height; y++)
    bytes.copy(packed, y * rowBytes, y * stride, y * stride + rowBytes)
  return packed
}

export function summarize(samples) {
  assert(
    samples.length >= 2 && samples.every((n) => Number.isFinite(n) && n > 0),
    'GPU timestamps must contain at least two finite, positive samples.',
  )
  const sorted = [...samples].sort((a, b) => a - b)
  const percentile = (p) => {
    const index = (sorted.length - 1) * p
    const lower = Math.floor(index)
    return sorted[lower] + (sorted[Math.ceil(index)] - sorted[lower]) * (index - lower)
  }
  return { medianMs: percentile(0.5), p05Ms: percentile(0.05), p95Ms: percentile(0.95) }
}

export function compare(before, after, beforeOutput, afterOutput) {
  assert.equal(before.schemaVersion, 1, 'Unsupported baseline format.')
  assert.deepEqual(before.environment, after.environment, 'Baseline GPU/runtime differs.')
  assert.deepEqual(before.workload, after.workload, 'Baseline workload/settings differ.')
  assert.equal(
    before.output.sha256,
    hash(beforeOutput),
    'Baseline output is missing or modified.',
  )
  assert.equal(beforeOutput.length, afterOutput.length, 'Output sizes differ.')
  let changedBytes = 0
  let maxByteDifference = 0
  for (let i = 0; i < beforeOutput.length; i++) {
    const difference = Math.abs(beforeOutput[i] - afterOutput[i])
    if (difference) changedBytes++
    maxByteDifference = Math.max(maxByteDifference, difference)
  }
  const previous = summarize(before.samplesMs)
  const current = summarize(after.samplesMs)
  return {
    medianChangePercent: (current.medianMs / previous.medianMs - 1) * 100,
    rangesOverlap: current.p05Ms <= previous.p95Ms && previous.p05Ms <= current.p95Ms,
    outputIdentical: changedBytes === 0,
    changedBytes,
    maxByteDifference,
  }
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      out: { type: 'string' },
      baseline: { type: 'string' },
      width: { type: 'string', default: '1024' },
      height: { type: 'string', default: '1024' },
      warmup: { type: 'string', default: '30' },
      samples: { type: 'string', default: '100' },
      variant: { type: 'string', default: 'default' },
      backend: { type: 'string' },
      help: { type: 'boolean' },
    },
  })
  if (values.help) {
    console.log(
      'node benchmark.mjs <fixture.mjs> --out <new-directory> [--baseline <before/result.json>]\n' +
        'Options: --width 1024 --height 1024 --warmup 30 --samples 100 --variant default --backend metal|vulkan|d3d12\n' +
        'Install webgpu and three in the working project. For TypeScript fixtures, use node --import tsx.',
    )
    return
  }
  assert(
    positionals.length === 1 && values.out,
    'Supply one fixture and --out <new-directory>. See --help.',
  )
  const settings = Object.fromEntries(
    ['width', 'height', 'warmup', 'samples'].map((key) => {
      const value = Number(values[key])
      assert(
        Number.isSafeInteger(value) && value >= (key === 'samples' ? 2 : 1),
        `${key} must be a positive integer.`,
      )
      return [key, value]
    }),
  )
  const backend =
    values.backend ?? { darwin: 'metal', win32: 'd3d12', linux: 'vulkan' }[process.platform]
  assert(
    ['metal', 'vulkan', 'd3d12'].includes(backend),
    'Select a hardware backend: metal, vulkan, or d3d12.',
  )
  const fixturePath = path.resolve(positionals[0])
  const out = path.resolve(values.out)
  const baselinePath = values.baseline && path.resolve(values.baseline)
  const baseline = baselinePath && JSON.parse(await readFile(baselinePath, 'utf8'))
  // A new directory preserves baseline artifacts and prevents stale WGSL/output from mixing into a run.
  await mkdir(path.dirname(out), { recursive: true })
  await mkdir(out)

  // Resolve in the user's project, including when this script lives in an installed plugin cache.
  const require = createRequire(path.resolve('package.json'))
  const load = (name) => import(pathToFileURL(require.resolve(name)).href)
  const { create, globals } = await load('webgpu')
  Object.assign(globalThis, globals)
  // Three r184 starts an internal RAF in init. Keep it stopped; compileAsync still needs a yield callback.
  globalThis.self = { requestAnimationFrame: () => 0, cancelAnimationFrame() {} }
  globalThis.requestAnimationFrame = (callback) =>
    setImmediate(() => callback(performance.now()))
  globalThis.cancelAnimationFrame = clearImmediate
  const THREE = await load('three/webgpu')
  const tsl = await load('three/tsl')
  for (const node of [tsl.time, tsl.deltaTime, tsl.frameId]) node.onRenderUpdate(() => 0)
  const dawnOptions = [`backend=${backend}`, 'disable-dawn-features=timestamp_quantization']
  const gpu = create(dawnOptions)
  const adapter = await gpu.requestAdapter({ powerPreference: 'high-performance' })
  assert(adapter && !adapter.info.isFallbackAdapter, 'A hardware WebGPU adapter is required.')
  assert(
    adapter.features.has('timestamp-query'),
    'This GPU does not support timestamp-query; no CPU timing fallback.',
  )
  const { width, height, warmup, samples } = settings
  assert(
    width <= adapter.limits.maxTextureDimension2D &&
      height <= adapter.limits.maxTextureDimension2D,
    'Requested dimensions exceed GPU limits.',
  )
  const device = await adapter.requestDevice({ requiredFeatures: ['timestamp-query'] })
  const errors = []
  device.addEventListener('uncapturederror', ({ error }) => errors.push(error.message))
  device.lost.then((info) => {
    if (info.reason !== 'destroyed') errors.push(info.message)
  })
  device.pushErrorScope('validation')
  const shaders = new Map()
  const createShaderModule = device.createShaderModule.bind(device)
  device.createShaderModule = (descriptor) => {
    shaders.set(hash(descriptor.code), descriptor.code)
    return createShaderModule(descriptor)
  }
  let renderer, target, fixture
  try {
    renderer = new THREE.WebGPURenderer({
      device,
      canvas: { width, height },
      trackTimestamp: true,
    })
    await renderer.init()
    assert(
      renderer.backend.isWebGPUBackend && renderer.backend.trackTimestamp,
      'Native GPU timing did not initialize.',
    )
    const { default: createFixture } = await import(pathToFileURL(fixturePath).href)
    fixture = await createFixture({
      THREE,
      tsl,
      renderer,
      width,
      height,
      variant: values.variant,
    })
    assert(
      fixture.name && fixture.workload && typeof fixture.workload === 'object',
      'Fixture must supply name and workload metadata (fixed inputs, counts, assets).',
    )
    assert(
      !(fixture.compute && fixture.scene),
      'Benchmark render and compute separately; supply only one workload.',
    )
    const kind = fixture.compute ? 'compute' : 'render'
    const outputs = fixture.outputs ?? [fixture.output]
    if (kind === 'render') {
      assert(
        fixture.scene?.isScene && fixture.camera?.isCamera,
        'Render fixture must supply scene and camera.',
      )
      target = new THREE.RenderTarget(width, height, { samples: 0 })
      renderer.setRenderTarget(target)
      await renderer.compileAsync(fixture.scene, fixture.camera)
    } else {
      assert(
        Array.isArray(outputs) && outputs.length > 0,
        'Compute fixture must supply output attributes.',
      )
      for (const output of outputs) {
        assert(
          output?.isStorageBufferAttribute || output?.isStorageInstancedBufferAttribute,
          'Compute fixture must supply storage buffer attributes.',
        )
        assert(output.count > 0, 'Compute output must not be empty.')
      }
    }
    const run = async () => {
      if (fixture.prepare) {
        await fixture.prepare()
        // Reset/upload work is outside the measured pass. Flush queries from either kind.
        await renderer.resolveTimestampsAsync('compute')
        await renderer.resolveTimestampsAsync('render')
      }
      renderer.info.reset()
      if (kind === 'render') renderer.render(fixture.scene, fixture.camera)
      else renderer.compute(fixture.compute)
      // Resolve EACH sample. Three reports the last frame's passes, not an arbitrary batch average.
      const ms = await renderer.resolveTimestampsAsync(kind)
      assert(Number.isFinite(ms) && ms > 0, 'No valid GPU timestamp for the submitted pass.')
      assert.equal(errors.length, 0, errors.join('\n'))
      return ms
    }
    const readOutput = async () => {
      if (kind === 'render') {
        const data = await renderer.readRenderTargetPixelsAsync(target, 0, 0, width, height)
        return packRGBA(data, width, height)
      }
      const buffers = []
      for (const output of outputs)
        buffers.push(Buffer.from(await renderer.getArrayBufferAsync(output)))
      return Buffer.concat(buffers)
    }
    for (let i = 0; i < warmup; i++) await run()
    const initialOutput = await readOutput()
    const samplesMs = []
    for (let i = 0; i < samples; i++) samplesMs.push(await run())
    const output = await readOutput()
    assert.equal(
      hash(initialOutput),
      hash(output),
      'Output changed during sampling. Freeze/reset the fixture inputs and state.',
    )
    const validationError = await device.popErrorScope()
    assert(!validationError, validationError?.message)
    assert.equal(errors.length, 0, errors.join('\n'))
    assert(shaders.size > 0, 'No WGSL modules were captured.')
    const { drawCalls, triangles, points, lines } = renderer.info.render
    if (kind === 'render') assert(drawCalls > 0, 'Fixture rendered no objects.')
    const result = {
      schemaVersion: 1,
      capturedAt: new Date().toISOString(),
      fixture: fixturePath,
      variant: values.variant,
      environment: {
        platform: process.platform,
        arch: process.arch,
        osRelease: os.release(),
        node: process.version,
        threeRevision: THREE.REVISION,
        webgpu: require('webgpu/package.json').version,
        backend,
        dawnOptions,
        adapter: Object.fromEntries(
          ['vendor', 'architecture', 'device', 'description', 'isFallbackAdapter'].map(
            (key) => [key, adapter.info[key] ?? null],
          ),
        ),
        deviceFeatures: [...device.features].sort(),
      },
      workload: {
        name: fixture.name,
        kind,
        ...settings,
        inputs: fixture.workload,
        fixedTime: 0,
        preparation: fixture.prepare ? 'fixture.prepare excluded from timing' : 'none',
        renderer: {
          toneMapping: renderer.toneMapping,
          outputColorSpace: renderer.outputColorSpace,
          samples: target?.samples ?? 0,
          format: target?.texture.format ?? null,
          type: target?.texture.type ?? null,
        },
        counts:
          kind === 'render'
            ? { drawCalls, triangles, points, lines }
            : {
                dispatches: (Array.isArray(fixture.compute)
                  ? fixture.compute
                  : [fixture.compute]
                ).map((node) => ({ count: node.count, workgroupSize: node.workgroupSize })),
                outputBytes: output.length,
                outputs: outputs.map((attribute) => ({
                  count: attribute.count,
                  itemSize: attribute.itemSize,
                  arrayType: attribute.array.constructor.name,
                })),
              },
      },
      samplesMs,
      ...summarize(samplesMs),
      output: {
        file: 'output.bin',
        encoding: kind === 'render' ? 'rgba8' : 'storage-buffer-bytes',
        bytes: output.length,
        sha256: hash(output),
      },
      shaders: [],
      sources: [],
    }
    if (baseline) {
      const beforeOutput = await readFile(
        path.resolve(path.dirname(baselinePath), baseline.output.file),
      )
      result.comparison = compare(baseline, result, beforeOutput, output)
    }
    for (const [sha256, code] of shaders) {
      const file = `shader-${result.shaders.length}.wgsl`
      await writeFile(path.join(out, file), code)
      result.shaders.push({ file, sha256 })
    }
    // Imported source dependencies must be declared by the fixture; capture exact text before edits.
    const sources = new Set([
      fixturePath,
      ...(fixture.sources ?? []).map((source) =>
        source instanceof URL
          ? fileURLToPath(source)
          : path.resolve(path.dirname(fixturePath), source),
      ),
    ])
    for (const source of sources) {
      const data = await readFile(source)
      const file = `source-${result.sources.length}${path.extname(source)}`
      await writeFile(path.join(out, file), data)
      result.sources.push({ source, file, sha256: hash(data) })
    }
    await writeFile(path.join(out, 'output.bin'), output)
    await writeFile(path.join(out, 'result.json'), JSON.stringify(result, null, 2) + '\n')
    console.log(
      JSON.stringify(
        {
          result: path.join(out, 'result.json'),
          ...summarize(samplesMs),
          comparison: result.comparison,
        },
        null,
        2,
      ),
    )
  } finally {
    try {
      await fixture?.dispose?.()
      target?.dispose()
      renderer?.dispose()
    } finally {
      device.destroy()
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
