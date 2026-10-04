#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const PLUGIN_ID = 'threenix@threenix'
const REPOSITORY = 'prag-matt-ic/threenix-plugin'
const MANIFEST_URL = `https://raw.githubusercontent.com/${REPOSITORY}/main/plugin.json`
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'))
const samePath = (a, b) => typeof a === 'string' && realpathSync(a) === realpathSync(b)

export function compareVersions(a, b) {
  const stable = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/
  if (typeof a !== 'string' || typeof b !== 'string' || !stable.test(a) || !stable.test(b))
    return null
  const left = a.split('.').map(BigInt)
  const right = b.split('.').map(BigInt)
  for (let i = 0; i < 3; i++) {
    if (left[i] !== right[i]) return left[i] > right[i] ? 1 : -1
  }
  return 0
}

export function detectHost(env, root) {
  // Other hosts can expose Claude compatibility variables too.
  if (env.CURSOR_PLUGIN_ROOT || env.COPILOT_PLUGIN_ROOT) return null
  if (env.PLUGIN_ROOT && samePath(env.PLUGIN_ROOT, root)) return 'codex'
  if (env.CLAUDE_PLUGIN_ROOT && samePath(env.CLAUDE_PLUGIN_ROOT, root)) return 'claude'
  return null
}

function isPublicRepository(source) {
  return [
    REPOSITORY,
    `https://github.com/${REPOSITORY}`,
    `https://github.com/${REPOSITORY}.git`,
    `git@github.com:${REPOSITORY}.git`,
    `ssh://git@github.com/${REPOSITORY}.git`,
  ].includes(source)
}

export function marketplaceRoot(host, result) {
  const entries = host === 'codex' ? result.marketplaces : result
  const matches = entries.filter((entry) => entry.name === 'threenix')
  if (matches.length !== 1) return null
  const entry = matches[0]
  if (host === 'codex') {
    const source = entry.marketplaceSource
    // Fail closed on additional source selectors, including refs and sparse checkouts.
    if (!source || Object.keys(source).some((key) => !['sourceType', 'source'].includes(key)))
      return null
    return source.sourceType === 'git' && isPublicRepository(source.source) ? entry.root : null
  }
  if (entry.ref != null) return null
  return (entry.source === 'github' && entry.repo === REPOSITORY) ||
    (entry.source === 'git' && isPublicRepository(entry.url))
    ? entry.installLocation
    : null
}

function checkCatalog(host, root, expectedVersion) {
  const catalog = readJson(
    join(
      root,
      host === 'codex' ? '.agents/plugins/marketplace.json' : '.claude-plugin/marketplace.json',
    ),
  )
  const entries = catalog.plugins.filter((entry) => entry.name === 'threenix')
  if (catalog.name !== 'threenix' || entries.length !== 1) return false
  const entry = entries[0]
  const source = entry.source
  const local =
    host === 'codex'
      ? source?.source === 'local' && source.path === './' && Object.keys(source).length === 2
      : source === './'
  if (!local || entry.ref != null || entry.sha != null || entry.version != null) return false
  if (!expectedVersion) return true
  // Avoid installing a prerelease or a different version if publication raced the fetch.
  return ['plugin.json', '.codex-plugin/plugin.json', '.claude-plugin/plugin.json'].every(
    (file) => {
      const manifest = readJson(join(root, file))
      return manifest.name === 'threenix' && manifest.version === expectedVersion
    },
  )
}

function claudeInstallation(entries, root, cwd) {
  const priority = { local: 3, project: 2, user: 1 }
  return (
    entries
      .filter((entry) => {
        if (
          !priority[entry.scope] ||
          entry.readFromFolder ||
          !samePath(entry.installPath, root)
        )
          return false
        if (entry.scope === 'user') return true
        if (typeof entry.projectPath !== 'string') return false
        const path = relative(realpathSync(entry.projectPath), realpathSync(cwd))
        return path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path)
      })
      // Multiple scopes can share one cached version. Match the host's precedence,
      // not the first installation returned by the CLI.
      .sort(
        (a, b) =>
          priority[b.scope] - priority[a.scope] ||
          (b.projectPath?.length || 0) - (a.projectPath?.length || 0),
      )[0]
  )
}

export function acquireLock(path) {
  try {
    mkdirSync(path, { mode: 0o700 })
  } catch (error) {
    if (error.code !== 'EEXIST') throw error
    const previous = statSync(path)
    if (Date.now() - previous.mtimeMs < 35_000) return null
    try {
      const { pid } = readJson(join(path, 'owner.json'))
      if (!Number.isInteger(pid) || pid <= 0) return null
      try {
        process.kill(pid, 0)
        return null
      } catch (error) {
        if (error.code !== 'ESRCH') return null
      }
    } catch (error) {
      if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) return null
    }
    // Only one contender may reclaim this stale directory. Check its identity again
    // so a delayed contender cannot remove a new owner's lock.
    const releaseReaper = acquireLock(join(path, 'reaping'))
    if (!releaseReaper) return null
    try {
      if (statSync(path).ino !== previous.ino) return null
      rmSync(path, { recursive: true })
      return acquireLock(path)
    } finally {
      releaseReaper()
    }
  }
  const identity = statSync(path).ino
  writeFileSync(join(path, 'owner.json'), JSON.stringify({ pid: process.pid }))
  return () => {
    try {
      if (statSync(path).ino === identity) rmSync(path, { recursive: true })
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
  }
}

export function runCommand(command, args, { signal, env, cwd }) {
  signal.throwIfAborted()
  return new Promise((resolveCommand, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...env, GIT_TERMINAL_PROMPT: '0' },
      detached: process.platform !== 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let output = ''
    let bytes = 0
    let failure
    let killed = false
    const kill = () => {
      if (!child.pid || killed) return
      killed = true
      try {
        if (process.platform === 'win32') {
          spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f'], {
            timeout: 1000,
            windowsHide: true,
          })
          child.kill('SIGKILL')
        } else process.kill(-child.pid, 'SIGKILL')
      } catch (error) {
        if (error.code !== 'ESRCH') {
          child.kill('SIGKILL')
          failure ||= new Error('could not terminate the CLI process group')
        }
      }
    }
    const onAbort = () => {
      failure = new Error('update timed out')
      kill()
    }
    signal.addEventListener('abort', onAbort, { once: true })
    const finish = (error) => {
      signal.removeEventListener('abort', onAbort)
      if (error || failure) reject(failure || error)
      else resolveCommand(output)
    }
    child.on('error', (error) => finish(new Error(`${command} could not run (${error.code})`)))
    child.on('close', (code) =>
      finish(code === 0 ? null : new Error(`${command} exited ${code}`)),
    )
    for (const stream of [child.stdout, child.stderr]) {
      stream.setEncoding('utf8')
      stream.on('data', (data) => {
        bytes += Buffer.byteLength(data)
        if (bytes > 1024 * 1024) {
          failure = new Error('CLI output exceeded 1 MiB')
          kill()
        } else if (stream === child.stdout) output += data
      })
    }
    if (signal.aborted) onAbort()
  })
}

async function fetchManifest(signal) {
  const response = await fetch(MANIFEST_URL, { signal, redirect: 'error' })
  if (!response.ok) throw new Error(`release check returned HTTP ${response.status}`)
  let text = ''
  for await (const chunk of response.body) {
    text += Buffer.from(chunk).toString()
    if (text.length > 64 * 1024) throw new Error('release manifest exceeded 64 KiB')
  }
  return JSON.parse(text)
}

export async function ensureLatest({
  event,
  root = ROOT,
  env = process.env,
  run = runCommand,
  fetchRelease = fetchManifest,
  lockBase = tmpdir(),
  timeoutMs = 28_000,
  signal: externalSignal,
}) {
  let releaseLock
  const controller = new AbortController()
  const signal = externalSignal || controller.signal
  const timer = externalSignal ? null : setTimeout(() => controller.abort(), timeoutMs)
  try {
    if (
      event?.hook_event_name !== 'SessionStart' ||
      !['startup', 'resume'].includes(event.source)
    )
      return {}
    if (Number(process.versions.node.split('.')[0]) < 20)
      throw new Error('Node 20+ is required')
    const host = detectHost(env, root)
    if (!host) return {}
    const profile =
      host === 'codex'
        ? env.CODEX_HOME || join(homedir(), '.codex')
        : env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude')
    const key = createHash('sha256')
      .update(`${host}:${resolve(profile)}`)
      .digest('hex')
      .slice(0, 20)
    releaseLock = acquireLock(join(lockBase, `threenix-update-${key}.lock`))
    if (!releaseLock) return {}
    const installedManifest = readJson(join(root, 'plugin.json'))
    const loadedVersion = installedManifest.version
    if (
      installedManifest.name !== 'threenix' ||
      compareVersions(loadedVersion, loadedVersion) !== 0
    )
      return {}
    signal.throwIfAborted()
    const execute = (args) =>
      run(host, ['plugin', ...args], { signal, env, cwd: event.cwd || process.cwd() })
    const json = async (args) => JSON.parse(await execute(args))
    const list = async () => {
      const result = await json(
        host === 'codex' ? ['list', '--marketplace', 'threenix', '--json'] : ['list', '--json'],
      )
      return host === 'codex' ? result.installed : result
    }
    const market = marketplaceRoot(host, await json(['marketplace', 'list', '--json']))
    if (!market || !checkCatalog(host, market)) return {}
    const installations = (await list()).filter(
      (entry) =>
        (host === 'codex' ? entry.pluginId : entry.id) === PLUGIN_ID && entry.enabled === true,
    )
    const installation =
      host === 'codex'
        ? installations.find((entry) => entry.installed === true)
        : claudeInstallation(installations, root, event.cwd || process.cwd())
    if (!installation) return {}
    // Do not update a developer's --plugin-dir copy because another copy is installed.
    if (
      host === 'codex' &&
      !samePath(root, join(profile, 'plugins/cache/threenix/threenix', loadedVersion))
    )
      return {}
    if (host === 'claude' && !['user', 'project', 'local'].includes(installation.scope))
      return {}
    const latest = await fetchRelease(signal)
    if (latest.name !== 'threenix' || compareVersions(latest.version, loadedVersion) !== 1)
      return {}
    const notice = (version) => ({
      systemMessage: `Threenix ${version} is installed. ${
        host === 'claude'
          ? 'Run /reload-plugins or start a new session to load it.'
          : 'Start a new Codex session to load it; restart the app if needed.'
      }`,
    })
    // A previous session or the host's native updater may already have installed it.
    const comparison = compareVersions(installation.version, latest.version)
    if (comparison === null) return {}
    if (comparison >= 0) return notice(installation.version)
    await execute(['marketplace', host === 'codex' ? 'upgrade' : 'update', 'threenix'])
    const refreshed = marketplaceRoot(host, await json(['marketplace', 'list', '--json']))
    if (
      !refreshed ||
      !samePath(refreshed, market) ||
      !checkCatalog(host, refreshed, latest.version)
    )
      throw new Error('refreshed marketplace does not match the published release')
    if (host === 'codex') {
      const result = await json(['add', PLUGIN_ID, '--json'])
      if (
        result.pluginId !== PLUGIN_ID ||
        result.version !== latest.version ||
        readJson(join(result.installedPath, 'plugin.json')).version !== latest.version
      )
        throw new Error('could not confirm the installed release')
    } else {
      // Pin the scope already selected by the loaded installation, including on older CLIs.
      await execute(['update', PLUGIN_ID, '--scope', installation.scope])
    }
    const confirmed = (await list()).some(
      (entry) =>
        (host === 'codex'
          ? entry.pluginId === PLUGIN_ID && entry.installed === true
          : entry.id === PLUGIN_ID &&
            entry.scope === installation.scope &&
            entry.projectPath === installation.projectPath &&
            readJson(join(entry.installPath, 'plugin.json')).version === latest.version) &&
        entry.version === latest.version,
    )
    if (!confirmed) throw new Error('could not confirm the installed release')
    return notice(latest.version)
  } catch (error) {
    return { diagnostic: signal.aborted ? 'update timed out' : error.message }
  } finally {
    clearTimeout(timer)
    try {
      releaseLock?.()
    } catch {
      /* A cleanup failure must not block the session. */
    }
  }
}

if (process.argv[1] && pathToFileURL(realpathSync(process.argv[1])).href === import.meta.url) {
  // One deadline covers stdin, HTTP and every CLI subprocess; leave cleanup time
  // before the host's 30-second limit. Aborting kills CLI process groups too.
  const controller = new AbortController()
  const watchdog = setTimeout(() => {
    controller.abort()
    process.stdin.destroy(new Error('update timed out'))
  }, 28_000)
  try {
    let input = ''
    for await (const chunk of process.stdin) {
      input += chunk
      if (input.length > 64 * 1024) throw new Error('hook input exceeded 64 KiB')
    }
    const result = await ensureLatest({ event: JSON.parse(input), signal: controller.signal })
    if (result.systemMessage)
      process.stdout.write(`${JSON.stringify({ systemMessage: result.systemMessage })}\n`)
    if (result.diagnostic) process.stderr.write(`Threenix: ${result.diagnostic}; continuing.\n`)
  } catch {
    process.stderr.write('Threenix: could not check for updates; continuing.\n')
  } finally {
    clearTimeout(watchdog)
    process.exit(0)
  }
}
