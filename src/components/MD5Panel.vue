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
        <svg v-if="m.id === 'enc'" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        {{ m.label }}
        <span v-if="mode === m.id" class="mode-indicator"></span>
      </button>
    </div>

    <!-- ── ENCODE ──────────────────────────────────────── -->
    <template v-if="mode === 'enc'">

      <div class="info-card shrink-0">
        <div class="info-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <div>
          <p class="info-title">MD5 Hash Generator</p>
          <p class="info-body">Converts any text into a 32-character hash identical to MySQL's <code class="info-code">MD5()</code> function.</p>
        </div>
      </div>

      <div class="flex flex-col gap-1.5 shrink-0">
        <div class="editor-label">
          <div class="flex items-center gap-1.5">
            <div class="editor-dot" style="background:color-mix(in srgb,var(--accent2) 70%,transparent)"></div>
            <span>Input Text</span>
          </div>
        </div>
        <textarea
          v-model="encInput"
          class="code-area !resize-none"
          style="min-height:80px"
          placeholder="Type anything… e.g. hello, mypassword123, 808080"
          @input="runEncode"
          spellcheck="false"
        ></textarea>
      </div>

      <div class="flex flex-col gap-1.5 flex-1 min-h-0">
        <div class="editor-label">
          <div class="flex items-center gap-1.5">
            <div class="editor-dot" style="background:color-mix(in srgb,var(--accent) 70%,transparent)"></div>
            <span>MD5 Hash</span>
          </div>
          <span v-if="encOutput" class="char-badge">32 chars</span>
        </div>

        <Transition name="result">
          <div v-if="encOutput"
            class="flex-1 min-h-0 flex flex-col justify-center px-4 py-4 rounded-xl relative"
            style="background:color-mix(in srgb,var(--accent) 6%,var(--input-bg));border:1px solid color-mix(in srgb,var(--accent) 22%,transparent)"
          >
            <!-- Hash display -->
            <div class="font-mono text-[0.6rem] uppercase tracking-widest mb-2" style="color:var(--muted)">Result</div>
            <code class="font-mono leading-relaxed pr-24 break-all" style="font-size:clamp(0.78rem,2vw,1rem);color:var(--accent);letter-spacing:0.04em">{{ encOutput }}</code>

            <!-- Copy button -->
            <button class="copy-btn" :class="{ copied: encCopied }" @click="copyBox(encOutput, 'enc')">
              <svg v-if="!encCopied" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              {{ encCopied ? 'Copied!' : 'Copy' }}
            </button>
          </div>

          <div v-else
            class="flex-1 min-h-0 flex flex-col items-center justify-center gap-2 rounded-xl"
            style="background:var(--input-bg);border:1px solid var(--border)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--muted);opacity:0.3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span class="text-[0.75rem]" style="color:var(--muted)">Your hash will appear here…</span>
          </div>
        </Transition>
      </div>

      <div class="actions-bar">
        <button class="btn-beautify" @click="runEncode">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Generate Hash
        </button>
        <div class="action-divider"></div>
        <button class="btn-action" @click="copyBox(encOutput, 'enc')">
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copy Hash
        </button>
        <div class="action-divider"></div>
        <button class="btn-ghost-sm" @click="encInput='';encOutput=''">
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          Clear
        </button>
      </div>

    </template>

    <!-- ── DECODE ──────────────────────────────────────── -->
    <template v-else>

      <div class="info-card shrink-0">
        <div class="info-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
        <div>
          <p class="info-title">MD5 Hash Lookup</p>
          <p class="info-body">Searches a large online database to reverse a hash. Works for most common values including MySQL-generated hashes.</p>
        </div>
      </div>

      <div class="flex flex-col gap-1.5 shrink-0">
        <div class="editor-label">
          <div class="flex items-center gap-1.5">
            <div class="editor-dot" style="background:color-mix(in srgb,var(--accent2) 70%,transparent)"></div>
            <span>Paste MD5 Hash</span>
          </div>
        </div>
        <div class="flex flex-col lg:flex-row gap-2">
          <input
            v-model="decInput"
            class="code-area !min-h-0 !h-10 !py-2 flex-1 font-mono"
            placeholder="e.g. 4c68cea7e58591b579fd074bcdaff740"
            @input="resetDecode"
            @keyup.enter="runDecode"
            spellcheck="false"
          />
          <button class="btn-beautify !rounded-lg" :disabled="looking" @click="runDecode">
            <svg v-if="!looking" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <div v-else class="btn-spinner"></div>
            {{ looking ? 'Searching…' : 'Look Up' }}
          </button>
        </div>
        <p v-if="decInput.trim().length > 0 && decInput.trim().length !== 32"
          class="text-[0.72rem] flex items-center gap-1.5"
          style="color:#ef4444"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          MD5 hashes are always 32 characters — yours is {{ decInput.trim().length }}.
        </p>
      </div>

      <!-- Loading -->
      <Transition name="fade">
        <div v-if="looking"
          class="flex-1 flex flex-col items-center justify-center gap-3 rounded-xl"
          style="background:var(--input-bg);border:1px solid var(--border)"
        >
          <div class="loading-spinner"></div>
          <span class="text-[0.75rem]" style="color:var(--muted)">{{ lookingMsg }}</span>
        </div>
      </Transition>

      <!-- Result -->
      <Transition name="result">
        <div v-if="!looking && decChecked"
          class="flex-1 min-h-0 flex flex-col justify-center px-5 py-4 rounded-xl relative"
          :style="decOutput
            ? 'background:color-mix(in srgb,#22c55e 7%,var(--surface));border:1px solid color-mix(in srgb,#22c55e 30%,transparent)'
            : 'background:color-mix(in srgb,#ef4444 6%,var(--surface));border:1px solid color-mix(in srgb,#ef4444 22%,transparent)'"
        >
          <template v-if="decOutput">
            <div class="flex items-center gap-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span class="font-mono text-[0.62rem] uppercase tracking-widest font-semibold" style="color:#22c55e">Match found</span>
            </div>
            <p class="font-mono text-[1.1rem] font-semibold pr-24" style="color:var(--txt)">{{ decOutput }}</p>
            <button class="copy-btn" :class="{ copied: decCopied }" @click="copyBox(decOutput, 'dec')">
              <svg v-if="!decCopied" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              {{ decCopied ? 'Copied!' : 'Copy' }}
            </button>
          </template>
          <template v-else>
            <div class="flex items-center gap-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              <span class="font-mono text-[0.62rem] uppercase tracking-widest font-semibold" style="color:#ef4444">No match found</span>
            </div>
            <p class="text-[0.78rem]" style="color:var(--muted)">This hash was not found in any online database. The original value may be too unique or not indexed.</p>
          </template>
        </div>
      </Transition>

      <!-- Empty state -->
      <div v-if="!looking && !decChecked"
        class="flex-1 flex flex-col items-center justify-center gap-2 rounded-xl"
        style="background:var(--input-bg);border:1px solid var(--border)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--muted);opacity:0.3"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <span class="text-[0.75rem]" style="color:var(--muted)">The original text will appear here if found…</span>
      </div>

      <div class="actions-bar">
        <button class="btn-beautify" :disabled="looking" @click="runDecode">
          <svg v-if="!looking" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <div v-else class="btn-spinner"></div>
          {{ looking ? 'Searching…' : 'Look Up' }}
        </button>
        <template v-if="decOutput">
          <div class="action-divider"></div>
          <button class="btn-action" @click="copyBox(decOutput, 'dec')">
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copy Result
          </button>
        </template>
        <div class="action-divider"></div>
        <button class="btn-ghost-sm" @click="resetDecode(); decInput=''">
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          Clear
        </button>
      </div>

    </template>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { md5 } from '../utils.js'

const emit = defineEmits(['toast'])

const modes = [
  { id: 'enc', label: 'Encode' },
  { id: 'dec', label: 'Decode' },
]
const mode = ref('enc')

// ── Encode ────────────────────────────────────────────────────────────────
const encInput  = ref('')
const encOutput = ref('')
const encCopied = ref(false)
let encCopyTimer = null

function runEncode() {
  encOutput.value = encInput.value ? md5(encInput.value) : ''
}

// ── Decode ────────────────────────────────────────────────────────────────
const decInput   = ref('')
const decOutput  = ref('')
const decChecked = ref(false)
const looking    = ref(false)
const lookingMsg = ref('')
const decCopied  = ref(false)
let decCopyTimer = null

function resetDecode() {
  decOutput.value  = ''
  decChecked.value = false
  decCopied.value  = false
}

async function runDecode() {
  const hash = decInput.value.trim().toLowerCase()
  if (!hash)             { emit('toast', 'Paste an MD5 hash first.'); return }
  if (hash.length !== 32){ emit('toast', 'An MD5 hash is always 32 characters.'); return }

  looking.value    = true
  decChecked.value = false
  decOutput.value  = ''

  const badWords = ['not found','erreur','error','code ','invalid','no result','<!doctype','<html','undefined','null']
  function isValid(str) {
    if (!str || typeof str !== 'string') return false
    const t = str.trim()
    if (t.length === 0 || t.length > 200) return false
    return !badWords.some(b => t.toLowerCase().includes(b))
  }

  async function tryFetch(url, parse, ms = 8000) {
    const ctrl  = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), ms)
    try {
      const r      = await fetch(url, { signal: ctrl.signal })
      const result = await parse(r)
      clearTimeout(timer)
      return result
    } catch { clearTimeout(timer); return '' }
  }

  const attempts = [
    {
      label: 'Searching database 1…',
      url:   `https://corsproxy.io/?url=https%3A%2F%2Fmd5.gromweb.com%2F%3Fmd5%3D${hash}`,
      parse: async r => { const t = await r.text(); const m = t.match(/reversed into the string <a[^>]*>([^<]+)<\/a>/); return m ? m[1].trim() : '' },
    },
    {
      label: 'Searching database 2…',
      url:   `https://api.allorigins.win/raw?url=https%3A%2F%2Fmd5.gromweb.com%2F%3Fmd5%3D${hash}`,
      parse: async r => { const t = await r.text(); const m = t.match(/reversed into the string <a[^>]*>([^<]+)<\/a>/); return m ? m[1].trim() : '' },
    },
    {
      label: 'Searching database 3…',
      url:   `https://corsproxy.io/?url=https%3A%2F%2Fmd5decrypt.net%2FApi%2Fapi.php%3Fhash%3D${hash}%26hash_type%3Dmd5%26email%3Dcipher%40tool.com%26code%3Dcode1`,
      parse: r => r.text().then(t => t.trim()),
    },
    {
      label: 'Searching database 4…',
      url:   `https://api.allorigins.win/raw?url=https%3A%2F%2Fmd5decrypt.net%2FApi%2Fapi.php%3Fhash%3D${hash}%26hash_type%3Dmd5%26email%3Dcipher%40tool.com%26code%3Dcode1`,
      parse: r => r.text().then(t => t.trim()),
    },
  ]

  for (const a of attempts) {
    lookingMsg.value = a.label
    const result = await tryFetch(a.url, a.parse)
    if (isValid(result)) { decOutput.value = result; break }
  }

  decChecked.value = true
  looking.value    = false
}

// ── Copy ──────────────────────────────────────────────────────────────────
function copyBox(text, box) {
  if (!text) { emit('toast', 'Nothing to copy.'); return }
  navigator.clipboard.writeText(text).then(() => {
    if (box === 'enc') {
      encCopied.value = true
      clearTimeout(encCopyTimer)
      encCopyTimer = setTimeout(() => { encCopied.value = false }, 2000)
    } else {
      decCopied.value = true
      clearTimeout(decCopyTimer)
      decCopyTimer = setTimeout(() => { decCopied.value = false }, 2000)
    }
  })
}
</script>

<style scoped>
.mode-bar { display:flex;gap:4px;padding:3px;border-radius:13px;background:var(--input-bg);border:1px solid var(--border);width:fit-content; }
.mode-btn { position:relative;display:flex;align-items:center;gap:6px;padding:5px 16px;border-radius:10px;font-size:0.8rem;font-weight:500;color:var(--muted);background:transparent;border:none;cursor:pointer;transition:all 0.18s ease; }
.mode-btn.active { background:var(--surface);color:var(--txt);box-shadow:var(--shadow); }
.mode-btn.active svg { color:var(--accent); }
.mode-indicator { position:absolute;bottom:2px;left:50%;transform:translateX(-50%);width:50%;height:2px;border-radius:2px;background:var(--accent);box-shadow:0 0 8px var(--accent-glow); }

.info-card { display:flex;align-items:flex-start;gap:12px;padding:12px 14px;border-radius:12px;background:color-mix(in srgb,var(--accent) 5%,var(--surface));border:1px solid color-mix(in srgb,var(--accent) 14%,transparent); }
.info-icon { width:28px;height:28px;border-radius:8px;background:color-mix(in srgb,var(--accent) 12%,transparent);border:1px solid color-mix(in srgb,var(--accent) 22%,transparent);display:flex;align-items:center;justify-content:center;color:var(--accent);flex-shrink:0;margin-top:1px; }
.info-title { font-size:0.82rem;font-weight:600;color:var(--txt);margin-bottom:3px; }
.info-body { font-size:0.74rem;line-height:1.5;color:var(--muted); }
.info-code { font-family:monospace;color:var(--accent);font-size:0.78rem; }

.editor-dot { width:6px;height:6px;border-radius:50%;flex-shrink:0; }
.char-badge { font-family:monospace;font-size:0.6rem;padding:1px 6px;border-radius:4px;background:color-mix(in srgb,var(--muted) 10%,transparent);color:var(--muted); }

.copy-btn { position:absolute;top:8px;right:8px;display:flex;align-items:center;gap:5px;padding:4px 10px;border-radius:7px;font-family:monospace;font-size:0.65rem;font-weight:600;cursor:pointer;border:1px solid var(--border);background:var(--surface);color:var(--muted);transition:all 0.15s ease;z-index:5; }
.copy-btn:hover { border-color:color-mix(in srgb,var(--accent) 50%,transparent);color:var(--accent);background:color-mix(in srgb,var(--accent) 8%,transparent); }
.copy-btn.copied { border-color:var(--accent);background:color-mix(in srgb,var(--accent) 12%,transparent);color:var(--accent); }

.loading-spinner { width:26px;height:26px;border:2px solid color-mix(in srgb,var(--accent) 20%,transparent);border-top-color:var(--accent);border-radius:50%;animation:spin 0.7s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }

.actions-bar { display:flex;align-items:center;flex-wrap:wrap;gap:6px;flex-shrink:0;padding-bottom:2px; }
.action-divider { width:1px;height:20px;background:var(--border);flex-shrink:0;margin:0 2px; }
.btn-beautify { display:flex;align-items:center;gap:7px;padding:8px 20px;border-radius:9px;font-size:0.82rem;font-weight:700;cursor:pointer;border:none;background:var(--accent);color:#fff;transition:all 0.15s ease;position:relative;overflow:hidden; }
.btn-beautify::after { content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,0.12) 0%,transparent 60%);pointer-events:none; }
.btn-beautify:hover:not(:disabled) { filter:brightness(1.1);transform:translateY(-1px);box-shadow:0 4px 14px color-mix(in srgb,var(--accent) 40%,transparent); }
.btn-beautify:disabled { opacity:0.6;cursor:not-allowed; }
.btn-spinner { width:12px;height:12px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 0.6s linear infinite;flex-shrink:0; }
.btn-action { display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:8px;font-size:0.78rem;font-weight:600;cursor:pointer;border:1px solid var(--border);background:var(--surface);color:var(--muted);transition:all 0.13s ease; }
.btn-action:hover { border-color:color-mix(in srgb,var(--accent) 50%,transparent);color:var(--accent);background:color-mix(in srgb,var(--accent) 6%,transparent); }
.btn-ghost-sm { display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:8px;font-size:0.78rem;font-weight:600;cursor:pointer;border:1px solid transparent;background:transparent;color:var(--muted);transition:all 0.13s ease; }
.btn-ghost-sm:hover { border-color:color-mix(in srgb,#e06060 40%,transparent);color:#e06060;background:color-mix(in srgb,#e06060 6%,transparent); }

.result-enter-active { transition:opacity 0.25s ease,transform 0.25s ease; }
.result-enter-from { opacity:0;transform:translateY(6px); }
.fade-enter-active,.fade-leave-active { transition:opacity 0.2s ease; }
.fade-enter-from,.fade-leave-to { opacity:0; }
</style>