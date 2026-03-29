// ── Node shims ────────────────────────────────────────────────────────────
self.process = {
  env:      { NODE_ENV: 'production' },
  version:  'v18.0.0',
  versions: {},
  platform: 'browser',
  argv:     [],
  cwd:      () => '/',
  exit:     () => {},
  hrtime:   () => [0, 0],
  nextTick: (fn) => Promise.resolve().then(fn),
}
self.fs = {
  existsSync:   () => false,
  readFileSync: () => '',
  readdirSync:  () => [],
  statSync:     () => ({ isDirectory: () => false }),
}
globalThis.process = self.process
globalThis.fs      = self.fs

// ── Load CDN scripts via fetch (avoids Vite importScripts interception) ───
async function loadScript(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`)
  const text = await res.text()
  // eslint-disable-next-line no-new-func
  Function(text)()
}

async function init() {
  await loadScript('https://unpkg.com/prettier@3/standalone.js')
  await loadScript('https://unpkg.com/prettier@3/plugins/babel.js')
  await loadScript('https://unpkg.com/prettier@3/plugins/estree.js')
  await loadScript('https://unpkg.com/@prettier/plugin-php@0.24/standalone.js')

  const prettier  = self.prettier
  const phpPlugin = self.prettierPlugins.php
  const babel     = self.prettierPlugins.babel
  const estree    = self.prettierPlugins.estree

  self.onmessage = async ({ data }) => {
    const { id, code, tabWidth, useTabs, singleQuote } = data
    try {
      const result = await prettier.format(code, {
        parser:     'php',
        plugins:    [babel, estree, phpPlugin],
        tabWidth,
        useTabs,
        singleQuote,
        printWidth:  9999,
        braceStyle:  'psr-2',
      })
      self.postMessage({ id, result })
    } catch (e) {
      self.postMessage({ id, error: e.message })
    }
  }
}

init().catch(e => {
  // Reject all pending requests on init failure
  self.onmessage = ({ data }) => {
    self.postMessage({ id: data.id, error: `Worker failed to initialize: ${e.message}` })
  }
  console.error('prettier worker init failed:', e)
})