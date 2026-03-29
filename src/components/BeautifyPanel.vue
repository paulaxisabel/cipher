<template>
  <div class="h-full flex flex-col gap-2 lg:overflow-hidden">

    <!-- Options row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-2 shrink-0">

      <!-- Language -->
      <div class="card !p-3">
        <div class="card-title !mb-2.5 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--accent);opacity:0.8"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          Language
          <span
            v-if="autoDetected"
            class="ml-auto font-mono text-[0.6rem] px-2 py-0.5 rounded-full animate-pulse-soft"
            style="background:color-mix(in srgb,var(--accent2) 12%,transparent);border:1px solid color-mix(in srgb,var(--accent2) 35%,transparent);color:var(--accent2);letter-spacing:0.06em"
          >auto-detected</span>
        </div>
        <div class="grid grid-cols-2 gap-1.5">
          <div
            v-for="lang in languages" :key="lang.id"
            class="lang-btn"
            :class="{ selected: selectedLang === lang.id }"
            @click="selectedLang = lang.id"
          >
            <div class="flex flex-col min-w-0">
              <div class="lang-name truncate">{{ lang.name }}</div>
              <div class="lang-ext truncate">{{ lang.ext }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Style options -->
      <div class="card !p-3">
        <div class="card-title !mb-2.5 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--accent);opacity:0.8"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
          Style
        </div>
        <div class="flex flex-col gap-2.5">

          <!-- Indent type -->
          <div class="style-row">
            <span class="style-label">Indent</span>
            <div class="flex gap-1 flex-1">
              <div
                v-for="opt in indentTypes" :key="opt.id"
                class="opt-pill flex-1 justify-center"
                :class="{ on: indentType === opt.id }"
                @click="indentType = opt.id"
              >{{ opt.label }}</div>
            </div>
          </div>

          <!-- Indent size -->
          <div class="style-row">
            <span class="style-label">Size</span>
            <div class="flex gap-1 flex-1">
              <div
                v-for="n in [2, 4, 6]" :key="n"
                class="opt-pill flex-1 justify-center"
                :class="{ on: indentSize === n, 'opt-disabled': indentType === 'tab' }"
                @click="setIndentSize(n)"
              >{{ n }}</div>
            </div>
          </div>

          <!-- Quotes -->
          <div class="style-row">
            <span class="style-label">Quotes</span>
            <div class="flex gap-1 flex-1">
              <div
                v-for="opt in quoteStyles" :key="opt.id"
                class="opt-pill flex-1 justify-center"
                :class="{ on: quoteStyle === opt.id, 'opt-disabled': selectedLang === 'html' }"
                @click="setQuoteStyle(opt.id)"
              >{{ opt.label }}</div>
            </div>
          </div>

        </div>
      </div>

    </div>

    <!-- Editors -->
    <div class="flex flex-col lg:flex-row gap-2 lg:flex-1 lg:min-h-0">

      <!-- Input -->
      <div class="flex flex-col gap-1.5 lg:flex-1 lg:min-h-0">
        <div class="editor-label">
          <div class="flex items-center gap-1.5">
            <div class="editor-dot" style="background:color-mix(in srgb,var(--accent2) 70%,transparent)"></div>
            <span>Input</span>
            <span class="char-badge">{{ formatCount(input.length) }}</span>
          </div>
          <button
            class="load-example-btn"
            @click="loadExample"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Load Example
          </button>
        </div>
        <div class="relative lg:flex-1 lg:min-h-0 flex flex-col" style="min-height:200px">
          <textarea
            v-model="input"
            class="code-area w-full !resize-none flex-1"
            :placeholder="placeholder"
            spellcheck="false"
          ></textarea>
          <!-- char count watermark when empty -->
          <div v-if="!input" class="paste-hint">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.15"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </div>
        </div>
      </div>

      <!-- Divider with arrow -->
      <div class="hidden lg:flex flex-col items-center justify-center gap-1 shrink-0" style="width:20px">
        <div class="h-full w-px" style="background:linear-gradient(to bottom,transparent,var(--border) 30%,var(--border) 70%,transparent)"></div>
        <div class="shrink-0 flex flex-col items-center gap-0.5" style="color:var(--accent);opacity:0.4">
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
        <div class="h-full w-px" style="background:linear-gradient(to bottom,transparent,var(--border) 30%,var(--border) 70%,transparent)"></div>
      </div>

      <!-- Output -->
      <div class="flex flex-col gap-1.5 lg:flex-1 lg:min-h-0">
        <div class="editor-label">
          <div class="flex items-center gap-1.5">
            <div class="editor-dot" style="background:color-mix(in srgb,var(--accent) 70%,transparent)"></div>
            <span>Output</span>
            <span v-if="output" class="char-badge">{{ formatCount(output.length) }}</span>
          </div>
          <!-- line diff badge -->
          <div v-if="stats" class="flex items-center gap-1.5">
            <span
              class="char-badge"
              :style="lineDiff > 0 ? 'color:var(--accent2)' : lineDiff < 0 ? 'color:#e06060' : ''"
            >
              {{ lineDiff > 0 ? '+' : '' }}{{ lineDiff }} lines
            </span>
          </div>
        </div>
        <div class="relative lg:flex-1 lg:min-h-0 flex flex-col" style="min-height:200px">
          <textarea
            :value="output"
            class="code-area w-full !resize-none flex-1"
            style="padding-top:2.5rem"
            readonly
            placeholder="Beautified output will appear here…"
            spellcheck="false"
          ></textarea>

          <!-- Loading overlay -->
          <Transition name="fade">
            <div v-if="loading" class="loading-overlay">
              <div class="loading-spinner"></div>
              <span class="font-mono text-[0.65rem]" style="color:var(--muted)">Beautifying…</span>
            </div>
          </Transition>

          <!-- Copy button -->
          <button
            class="copy-btn"
            :class="{ copied }"
            @click="copyOutput"
          >
            <svg v-if="!copied" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {{ copied ? 'Copied!' : 'Copy' }}
          </button>
        </div>
      </div>

    </div>

    <!-- Stats bar -->
    <Transition name="result">
      <div v-if="stats" class="stats-bar">
        <div v-for="s in stats" :key="s.label" class="stat-item">
          <span class="stat-label">{{ s.label }}</span>
          <span class="stat-value" :style="{ color: s.color || 'var(--txt)' }">{{ s.value }}</span>
        </div>
        <div class="ml-auto flex items-center gap-1" style="color:var(--accent);opacity:0.6">
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span class="font-mono text-[0.6rem] tracking-widest uppercase">Done</span>
        </div>
      </div>
    </Transition>

    <!-- Actions -->
    <div class="actions-bar">
      <button
        class="btn-beautify"
        :class="{ loading }"
        :disabled="loading"
        @click="run"
      >
        <svg v-if="!loading" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        <div v-else class="btn-spinner"></div>
        {{ loading ? 'Beautifying…' : 'Beautify' }}
      </button>

      <div class="action-divider"></div>

      <button class="btn-action" @click="copyOutput">
        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        Copy
      </button>

      <button class="btn-action" @click="downloadOutput">
        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Download
      </button>

      <div class="action-divider"></div>

      <button class="btn-ghost-sm" @click="clear">
        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        Clear
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { beautify, detectLang } from '../utils.js'

const emit = defineEmits(['toast'])

// ── Config ────────────────────────────────────────────────────────────────
const languages = [
  { id: 'php',  name: 'PHP',        ext: '.php'           },
  { id: 'js',   name: 'JavaScript', ext: '.js / .ts'      },
  { id: 'css',  name: 'CSS / SCSS', ext: '.css / .scss'   },
  { id: 'html', name: 'HTML',       ext: '.html / .blade' },
]
const indentTypes  = [{ id: 'space', label: 'Spaces' }, { id: 'tab', label: 'Tabs' }]
const quoteStyles  = [{ id: 'single', label: "Single '" }, { id: 'double', label: 'Double "' }, { id: 'keep', label: 'Keep' }]

const selectedLang = ref('php')
const indentType   = ref('space')
const indentSize   = ref(4)
const quoteStyle   = ref('single')

const input   = ref('')
const output  = ref('')
const copied  = ref(false)
const loading = ref(false)
const stats   = ref(null)
let copyTimer = null

// ── Auto-detect ───────────────────────────────────────────────────────────
const autoDetected = ref(false)
watch(input, (val) => {
  if (!val.trim()) { autoDetected.value = false; return }
  const detected = detectLang(val)
  if (detected) { selectedLang.value = detected; autoDetected.value = true }
  else autoDetected.value = false
})

// ── Line diff ─────────────────────────────────────────────────────────────
const lineDiff = computed(() => {
  if (!stats.value) return 0
  const before = stats.value.find(s => s.label === 'Lines before')?.value ?? 0
  const after  = stats.value.find(s => s.label === 'Lines after')?.value  ?? 0
  return after - before
})

// ── Placeholder ───────────────────────────────────────────────────────────
const placeholder = computed(() => {
  const map = {
    php:  `<?php\nfunction hello($name){\nreturn 'Hello, '.$name;\n}\necho hello('World');`,
    js:   `function greet(name){\nconst msg='Hello, '+name;\nconsole.log(msg);\nreturn msg;\n}`,
    css:  `.card{display:flex;flex-direction:column;padding:16px;border-radius:8px;background:#fff;}`,
    html: `<!DOCTYPE html><html><head><title>Page</title></head><body><div class="wrap"><p>Hello</p></div></body></html>`,
  }
  return map[selectedLang.value] || ''
})

// ── Examples ──────────────────────────────────────────────────────────────
const examples = {
  php:  `<?php\nfunction add($a,$b){return $a+$b;}\n$result=add(1,2);\nif($result>0){\necho 'Positive: '.$result;\n}else{\necho 'Non-positive';\n}`,
  js:   `function fetchUser(id){return fetch('/api/users/'+id).then(res=>res.json()).then(data=>{console.log(data);return data;}).catch(err=>console.error(err));}`,
  css:  `body{margin:0;padding:0;font-family:sans-serif;}.container{max-width:1200px;margin:0 auto;padding:0 16px;}.btn{display:inline-flex;align-items:center;padding:8px 16px;border-radius:6px;font-weight:600;}`,
  html: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Hello</title></head><body><main class="container"><h1>Hello World</h1><p>Welcome to my page.</p></main></body></html>`,
}

function loadExample() {
  input.value  = examples[selectedLang.value] || ''
  output.value = ''
  stats.value  = null
}

// ── Helpers ───────────────────────────────────────────────────────────────
function formatCount(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return n + ''
}

// ── Run ───────────────────────────────────────────────────────────────────
async function run() {
  if (!input.value.trim()) { emit('toast', 'Paste some code first.'); return }
  loading.value = true
  try {
    const indentStr = indentType.value === 'tab' ? '\t' : ' '.repeat(indentSize.value)
    output.value = await beautify(input.value, selectedLang.value, { indent: indentStr, quotes: quoteStyle.value })

    const linesIn  = input.value.split('\n').length
    const linesOut = output.value.split('\n').length
    stats.value = [
      { label: 'Lines before', value: linesIn },
      { label: 'Lines after',  value: linesOut, color: linesOut > linesIn ? 'var(--accent2)' : 'var(--txt)' },
      { label: 'Chars before', value: input.value.length },
      { label: 'Chars after',  value: output.value.length },
    ]
  } catch (e) {
    emit('toast', 'Could not beautify — check syntax.')
    output.value = ''
    stats.value  = null
  } finally {
    loading.value = false
  }
}

// ── Copy / Download / Clear ───────────────────────────────────────────────
function copyOutput() {
  if (!output.value) { emit('toast', 'Nothing to copy.'); return }
  navigator.clipboard.writeText(output.value).then(() => {
    copied.value = true
    clearTimeout(copyTimer)
    copyTimer = setTimeout(() => { copied.value = false }, 2000)
  })
}

function downloadOutput() {
  if (!output.value) { emit('toast', 'Nothing to download.'); return }
  const ext  = languages.find(l => l.id === selectedLang.value)?.ext.split(' ')[0].replace('/', '') || '.txt'
  const a    = document.createElement('a')
  a.href     = URL.createObjectURL(new Blob([output.value], { type: 'text/plain' }))
  a.download = `beautified${ext}`
  a.click()
}

function clear() {
  input.value  = ''
  output.value = ''
  stats.value  = null
}

function setIndentSize(n) {
  if (indentType.value !== 'tab') indentSize.value = n
}

function setQuoteStyle(id) {
  if (selectedLang.value !== 'html') quoteStyle.value = id
}
</script>

<style scoped>
/* ── Language buttons ────────────────────────────────────────────────── */
.lang-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}
.lang-btn:hover {
  border-color: color-mix(in srgb, var(--accent) 40%, transparent);
  background: color-mix(in srgb, var(--accent) 5%, transparent);
}
.lang-btn.selected {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 10%, transparent);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 20%, transparent);
}
.lang-name {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--txt);
  line-height: 1.2;
}
.lang-ext {
  font-size: 0.6rem;
  font-family: monospace;
  color: var(--muted);
  line-height: 1.2;
}
.lang-btn.selected .lang-name {
  color: var(--accent);
}

/* ── Style row ───────────────────────────────────────────────────────── */
.style-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.style-label {
  font-family: monospace;
  font-size: 0.67rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
  width: 52px;
  flex-shrink: 0;
}
.opt-pill {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px 8px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--surface);
  font-size: 0.68rem;
  font-family: monospace;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.13s ease;
  user-select: none;
  white-space: nowrap;
}
.opt-pill:hover:not(.opt-disabled) {
  border-color: color-mix(in srgb, var(--accent) 50%, transparent);
  color: var(--txt);
}
.opt-pill.on {
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  border-color: var(--accent);
  color: var(--accent);
  font-weight: 600;
}
.opt-disabled {
  opacity: 0.3;
  pointer-events: none;
}

/* ── Editor labels ───────────────────────────────────────────────────── */
.editor-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--muted);
  padding: 0 2px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.editor-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.char-badge {
  font-family: monospace;
  font-size: 0.6rem;
  font-weight: 500;
  padding: 1px 6px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--muted) 10%, transparent);
  color: var(--muted);
  letter-spacing: 0;
  text-transform: none;
}
.load-example-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: monospace;
  font-size: 0.62rem;
  color: var(--muted);
  background: none;
  border: none;
  cursor: pointer;
  padding: 3px 6px;
  border-radius: 5px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  transition: all 0.13s ease;
}
.load-example-btn:hover {
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 8%, transparent);
}

/* ── Paste hint ──────────────────────────────────────────────────────── */
.paste-hint {
  position: absolute;
  bottom: 12px;
  right: 14px;
  pointer-events: none;
}

/* ── Loading overlay ─────────────────────────────────────────────────── */
.loading-overlay {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: color-mix(in srgb, var(--surface) 85%, transparent);
  backdrop-filter: blur(2px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  z-index: 10;
}
.loading-spinner {
  width: 22px;
  height: 22px;
  border: 2px solid color-mix(in srgb, var(--accent) 20%, transparent);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

/* ── Copy button ─────────────────────────────────────────────────────── */
.copy-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 7px;
  font-family: monospace;
  font-size: 0.65rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--muted);
  z-index: 5;
}
.copy-btn:hover {
  border-color: color-mix(in srgb, var(--accent) 50%, transparent);
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 8%, transparent);
}
.copy-btn.copied {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  color: var(--accent);
}

/* ── Stats bar ───────────────────────────────────────────────────────── */
.stats-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface);
  flex-shrink: 0;
}
.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px 0 0;
  margin: 0 14px 0 0;
  border-right: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
}
.stat-item:last-of-type {
  border-right: none;
}
.stat-label {
  font-family: monospace;
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--muted);
}
.stat-value {
  font-family: monospace;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--txt);
}

/* ── Actions bar ─────────────────────────────────────────────────────── */
.actions-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  flex-shrink: 0;
  padding-bottom: 2px;
}
.action-divider {
  width: 1px;
  height: 20px;
  background: var(--border);
  flex-shrink: 0;
  margin: 0 2px;
}

/* Beautify CTA */
.btn-beautify {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 20px;
  border-radius: 9px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  border: none;
  background: var(--accent);
  color: #fff;
  letter-spacing: 0.01em;
  transition: all 0.15s ease;
  position: relative;
  overflow: hidden;
}
.btn-beautify::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%);
  pointer-events: none;
}
.btn-beautify:hover:not(:disabled) {
  filter: brightness(1.1);
  transform: translateY(-1px);
  box-shadow: 0 4px 14px color-mix(in srgb, var(--accent) 40%, transparent);
}
.btn-beautify:active:not(:disabled) {
  transform: translateY(0);
}
.btn-beautify:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.btn-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  flex-shrink: 0;
}

/* Secondary action buttons */
.btn-action {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--muted);
  transition: all 0.13s ease;
}
.btn-action:hover {
  border-color: color-mix(in srgb, var(--accent) 50%, transparent);
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 6%, transparent);
}

/* Ghost / clear */
.btn-ghost-sm {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  background: transparent;
  color: var(--muted);
  transition: all 0.13s ease;
}
.btn-ghost-sm:hover {
  border-color: color-mix(in srgb, #e06060 40%, transparent);
  color: #e06060;
  background: color-mix(in srgb, #e06060 6%, transparent);
}

/* ── Animations ──────────────────────────────────────────────────────── */
@keyframes spin {
  to { transform: rotate(360deg); }
}
@keyframes pulse-soft {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
.animate-pulse-soft {
  animation: pulse-soft 2s ease-in-out infinite;
}

/* ── Transitions ─────────────────────────────────────────────────────── */
.result-enter-active,
.result-leave-active {
  transition: all 0.25s ease;
}
.result-enter-from,
.result-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>