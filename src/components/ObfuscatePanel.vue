<template>
  <div class="h-full flex flex-col gap-2 lg:overflow-hidden">

    <!-- Mode toggle -->
    <div class="mode-bar shrink-0">
      <button
        v-for="m in modes" :key="m.id"
        class="mode-btn"
        :class="{ active: mode === m.id }"
        @click="mode = m.id"
      >
        <svg v-if="m.id === 'obf'" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/><line x1="12" y1="15" x2="12" y2="17"/></svg>
        {{ m.label }}
        <span v-if="mode === m.id" class="mode-indicator"></span>
      </button>
    </div>

    <!-- ── OBFUSCATE ─────────────────────────────────────── -->
    <template v-if="mode === 'obf'">

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-2 shrink-0">

        <!-- Method -->
        <div class="card !p-3">
          <div class="card-title !mb-2">Method</div>
          <div class="grid grid-cols-2 gap-1.5">
            <div
              v-for="m in methods" :key="m.id"
              class="method-btn !p-2.5"
              :class="{ selected: selectedMethod === m.id }"
              @click="selectedMethod = m.id"
            >
              <div class="m-name !text-[0.78rem]">{{ m.name }}</div>
              <div class="m-desc !text-[0.64rem]">{{ m.desc }}</div>
            </div>
          </div>
        </div>

        <!-- Options -->
        <div class="flex flex-col gap-2">
          <div class="card !p-3 flex-1">
            <div class="card-title !mb-2">Options</div>
            <div class="grid grid-cols-2 gap-1.5">
              <div
                v-for="opt in options" :key="opt.key"
                class="opt-pill !px-2.5 !py-1.5 !text-[0.76rem]"
                :class="{ on: opt.value }"
                @click="opt.value = !opt.value"
              >
                <div class="chk shrink-0"></div>
                <span class="truncate">{{ opt.label }}</span>
              </div>
            </div>
          </div>
          <div class="notice !py-2 !px-3 !text-[0.71rem] leading-relaxed">
            Obfuscation raises the bar for casual inspection — it is not a substitute for proper access controls.
          </div>
        </div>

      </div>

      <!-- Editors -->
      <div class="flex flex-col lg:flex-row gap-2 lg:flex-1 lg:min-h-0">

        <!-- Source -->
        <div class="flex flex-col gap-1.5 lg:flex-1 lg:min-h-0">
          <div class="editor-label">
            <div class="flex items-center gap-1.5">
              <div class="editor-dot" style="background:color-mix(in srgb,var(--accent2) 70%,transparent)"></div>
              <span>Source PHP</span>
              <span class="char-badge">{{ formatCount(obfInput.length) }}</span>
            </div>
          </div>
          <textarea
            v-model="obfInput"
            class="code-area w-full !resize-none lg:flex-1 lg:min-h-0"
            style="min-height:180px"
            placeholder="<?php&#10;echo 'Hello World';&#10;&#10;function greet($name) {&#10;    return 'Hello, ' . $name;&#10;}"
            spellcheck="false"
          ></textarea>
        </div>

        <!-- Divider -->
        <div class="hidden lg:flex flex-col items-center justify-center shrink-0" style="width:20px">
          <div class="h-full w-px" style="background:linear-gradient(to bottom,transparent,var(--border) 30%,var(--border) 70%,transparent)"></div>
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 my-1" style="color:var(--accent);opacity:0.35"><polyline points="9 18 15 12 9 6"/></svg>
          <div class="h-full w-px" style="background:linear-gradient(to bottom,transparent,var(--border) 30%,var(--border) 70%,transparent)"></div>
        </div>

        <!-- Output -->
        <div class="flex flex-col gap-1.5 lg:flex-1 lg:min-h-0">
          <div class="editor-label">
            <div class="flex items-center gap-1.5">
              <div class="editor-dot" style="background:color-mix(in srgb,var(--accent) 70%,transparent)"></div>
              <span>Obfuscated Output</span>
              <span v-if="obfOutput" class="char-badge">{{ formatCount(obfOutput.length) }}</span>
            </div>
          </div>
          <div class="relative lg:flex-1 lg:min-h-0 flex flex-col" style="min-height:180px">
            <textarea
              :value="obfOutput"
              class="code-area w-full !resize-none flex-1"
              style="min-height:180px;padding-top:2.5rem"
              readonly
              placeholder="Obfuscated output will appear here…"
              spellcheck="false"
            ></textarea>
            <button class="copy-btn" :class="{ copied: obfCopied }" @click="copyBox(obfOutput, 'obf')">
              <svg v-if="!obfCopied" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              {{ obfCopied ? 'Copied!' : 'Copy' }}
            </button>
          </div>
        </div>

      </div>

      <!-- Strength bar -->
      <div class="strength-bar shrink-0">
        <span class="strength-label">Strength</span>
        <div class="flex gap-0.5 flex-1">
          <div
            v-for="i in 10" :key="i"
            class="strength-seg"
            :style="{ background: i <= strengthLevel ? strengthColor : 'var(--border)' }"
          ></div>
        </div>
        <span class="strength-value" :style="{ color: strengthColor }">{{ scoreInfo.label }}</span>
      </div>

      <!-- Actions -->
      <div class="actions-bar">
        <button class="btn-beautify" @click="runObf">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Obfuscate
        </button>
        <div class="action-divider"></div>
        <button class="btn-action" @click="copyBox(obfOutput, 'obf')">
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copy
        </button>
        <button class="btn-action" @click="download">
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Download
        </button>
        <div class="action-divider"></div>
        <button class="btn-ghost-sm" @click="obfInput='';obfOutput=''">
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          Clear
        </button>
      </div>

    </template>

    <!-- ── DECODE ──────────────────────────────────────── -->
    <template v-else>

      <div class="flex flex-col lg:flex-row gap-2 lg:flex-1 lg:min-h-0">

        <!-- Input -->
        <div class="flex flex-col gap-1.5 lg:flex-1 lg:min-h-0">
          <div class="editor-label">
            <div class="flex items-center gap-1.5">
              <div class="editor-dot" style="background:color-mix(in srgb,var(--accent2) 70%,transparent)"></div>
              <span>Obfuscated Input</span>
              <span class="char-badge">{{ formatCount(decInput.length) }}</span>
            </div>
          </div>
          <textarea
            v-model="decInput"
            class="code-area w-full !resize-none lg:flex-1 lg:min-h-0"
            style="min-height:180px"
            placeholder="Paste obfuscated PHP here…"
            spellcheck="false"
          ></textarea>
        </div>

        <!-- Divider -->
        <div class="hidden lg:flex flex-col items-center justify-center shrink-0" style="width:20px">
          <div class="h-full w-px" style="background:linear-gradient(to bottom,transparent,var(--border) 30%,var(--border) 70%,transparent)"></div>
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 my-1" style="color:var(--accent);opacity:0.35"><polyline points="9 18 15 12 9 6"/></svg>
          <div class="h-full w-px" style="background:linear-gradient(to bottom,transparent,var(--border) 30%,var(--border) 70%,transparent)"></div>
        </div>

        <!-- Output -->
        <div class="flex flex-col gap-1.5 lg:flex-1 lg:min-h-0">
          <div class="editor-label">
            <div class="flex items-center gap-1.5">
              <div class="editor-dot" style="background:color-mix(in srgb,var(--accent) 70%,transparent)"></div>
              <span>Decoded Output</span>
              <span v-if="decOutput" class="char-badge">{{ formatCount(decOutput.length) }}</span>
            </div>
          </div>
          <div class="relative lg:flex-1 lg:min-h-0 flex flex-col" style="min-height:180px">
            <textarea
              :value="decOutput"
              class="code-area w-full !resize-none flex-1"
              style="min-height:180px;padding-top:2.5rem"
              readonly
              placeholder="Decoded output will appear here…"
              spellcheck="false"
            ></textarea>
            <button class="copy-btn" :class="{ copied: decCopied }" @click="copyBox(decOutput, 'dec')">
              <svg v-if="!decCopied" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              {{ decCopied ? 'Copied!' : 'Copy' }}
            </button>
          </div>
        </div>

      </div>

      <!-- Detected Layers -->
      <div class="card !p-3 shrink-0">
        <div class="card-title !mb-2">Detected Layers</div>
        <div class="flex flex-wrap gap-1.5 min-h-[26px] items-center">
          <span v-if="!layers.length" class="layer-tag" style="opacity:0.5">Paste code above to analyze</span>
          <span v-for="l in layers" :key="l" class="layer-tag active">{{ l }}</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="actions-bar">
        <button class="btn-beautify" @click="runDecode">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/><line x1="12" y1="15" x2="12" y2="17"/></svg>
          Decode
        </button>
        <div class="action-divider"></div>
        <button class="btn-action" @click="copyBox(decOutput, 'dec')">
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copy Output
        </button>
        <div class="action-divider"></div>
        <button class="btn-ghost-sm" @click="decInput='';decOutput='';layers=[]">
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          Clear
        </button>
        <span class="notice !py-1.5 !px-3 !text-[0.7rem] flex-1 min-w-[180px]">
          Supports Base64/eval and Goto/octal obfuscation.
        </span>
      </div>

    </template>

  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { obfuscate, decode, analyzeLayers, strengthScore, strengthLabel } from '../utils.js'

const emit = defineEmits(['toast'])

const modes = [
  { id: 'obf', label: 'Obfuscate' },
  { id: 'dec', label: 'Decode'    },
]
const mode = ref('obf')

// ── Obfuscate ─────────────────────────────────────────────────────────────
const methods = [
  { id: 'base64', name: 'Base64 + Eval',  desc: 'encode & wrap in eval()' },
  { id: 'goto',   name: 'Goto + Octal',   desc: 'shuffled goto + octal strings' },
]

const options = reactive([
  { key: 'strip',  label: 'Strip Comments',   value: true  },
  { key: 'rename', label: 'Rename Variables', value: true  },
  { key: 'junk',   label: 'Add Junk Code',    value: false },
  { key: 'shuf',   label: 'Shuffle Strings',  value: false },
])

const selectedMethod = ref('base64')
const obfInput       = ref('')
const obfOutput      = ref('')
const obfCopied      = ref(false)

const opts      = computed(() => Object.fromEntries(options.map(o => [o.key, o.value])))
const score     = computed(() => strengthScore(selectedMethod.value, opts.value))
const scoreInfo = computed(() => strengthLabel(score.value))

const strengthLevel = computed(() => Math.ceil(score.value / 10))
const strengthColor = computed(() => {
  if (score.value < 35) return '#ef4444'
  if (score.value < 55) return '#f97316'
  if (score.value < 75) return '#eab308'
  return '#22c55e'
})

function runObf() {
  if (!obfInput.value.trim()) { emit('toast', 'Paste PHP code first.'); return }
  obfOutput.value = obfuscate(obfInput.value, selectedMethod.value, opts.value)
}

function download() {
  if (!obfOutput.value) { emit('toast', 'Nothing to download.'); return }
  const a    = document.createElement('a')
  a.href     = URL.createObjectURL(new Blob([obfOutput.value], { type: 'text/plain' }))
  a.download = 'obfuscated.php'
  a.click()
}

// ── Decode ────────────────────────────────────────────────────────────────
const decInput  = ref('')
const decOutput = ref('')
const decCopied = ref(false)
const layers    = ref([])

watch(decInput, val => { layers.value = analyzeLayers(val) })

function runDecode() {
  if (!decInput.value.trim()) { emit('toast', 'Paste obfuscated PHP first.'); return }
  decOutput.value = decode(decInput.value)
}

// ── Helpers ───────────────────────────────────────────────────────────────
function formatCount(n) {
  return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n)
}

let obfCopyTimer = null
let decCopyTimer = null

function copyBox(text, box) {
  if (!text) { emit('toast', 'Nothing to copy.'); return }
  navigator.clipboard.writeText(text).then(() => {
    if (box === 'obf') {
      obfCopied.value = true
      clearTimeout(obfCopyTimer)
      obfCopyTimer = setTimeout(() => { obfCopied.value = false }, 2000)
    } else {
      decCopied.value = true
      clearTimeout(decCopyTimer)
      decCopyTimer = setTimeout(() => { decCopied.value = false }, 2000)
    }
  })
}
</script>

<style scoped>
/* shared with BeautifierPanel — mode bar, editor dots, copy btn, action bar */
.mode-bar {
  display: flex;
  gap: 4px;
  padding: 3px;
  border-radius: 13px;
  background: var(--input-bg);
  border: 1px solid var(--border);
  width: fit-content;
}
.mode-btn {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 16px;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--muted);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.18s ease;
}
.mode-btn.active {
  background: var(--surface);
  color: var(--txt);
  box-shadow: var(--shadow);
}
.mode-btn.active svg { color: var(--accent); }
.mode-indicator {
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 50%;
  height: 2px;
  border-radius: 2px;
  background: var(--accent);
  box-shadow: 0 0 8px var(--accent-glow);
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
  padding: 1px 6px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--muted) 10%, transparent);
  color: var(--muted);
}

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
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--muted);
  transition: all 0.15s ease;
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

/* Strength bar */
.strength-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 10px;
  background: var(--input-bg);
  border: 1px solid var(--border);
}
.strength-label {
  font-family: monospace;
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
  white-space: nowrap;
}
.strength-seg {
  flex: 1;
  height: 5px;
  border-radius: 999px;
  transition: background 0.4s ease;
}
.strength-value {
  font-family: monospace;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
}

/* Actions */
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
.btn-beautify:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
  box-shadow: 0 4px 14px color-mix(in srgb, var(--accent) 40%, transparent);
}
.btn-beautify:active { transform: translateY(0); }
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
</style>