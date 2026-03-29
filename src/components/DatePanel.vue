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
        <svg v-if="m.id === 'enc'" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        {{ m.label }}
        <span v-if="mode === m.id" class="mode-indicator"></span>
      </button>
    </div>

    <!-- ── ENCODE: Date → Timestamp ────────────────────── -->
    <template v-if="mode === 'enc'">

      <div class="info-card shrink-0">
        <div class="info-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </div>
        <div>
          <p class="info-title">Date → Unix Timestamp</p>
          <p class="info-body">Converts a date into seconds since January 1, 1970. Results are based on <strong>{{ userTimezone }}</strong>.</p>
        </div>
      </div>

      <div class="flex flex-col gap-1.5 shrink-0">
        <div class="editor-label">
          <div class="flex items-center gap-1.5">
            <div class="editor-dot" style="background:color-mix(in srgb,var(--accent2) 70%,transparent)"></div>
            <span>Enter a Date</span>
          </div>
        </div>
        <div class="flex flex-col lg:flex-row gap-2">
          <input
            v-model="encInput"
            class="code-area !min-h-0 !h-10 !py-2 flex-1"
            placeholder='e.g.  2026-03-22  or  March 22, 2026  or  "now"'
            @keyup.enter="runEncode"
            spellcheck="false"
          />
          <button class="btn-beautify !rounded-lg" @click="runEncode">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            Encode
          </button>
        </div>
        <p v-if="encError" class="text-[0.72rem] flex items-center gap-1.5" style="color:#ef4444">
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {{ encError }}
        </p>
      </div>

      <Transition name="result">
        <div v-if="encResult" class="flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto">

          <!-- Big timestamp -->
          <div class="relative px-4 py-3 rounded-xl"
            style="background:color-mix(in srgb,var(--accent) 8%,var(--input-bg));border:1px solid color-mix(in srgb,var(--accent) 25%,transparent)"
          >
            <div class="font-mono text-[0.6rem] uppercase tracking-widest mb-1.5" style="color:var(--muted)">Unix Timestamp</div>
            <div class="font-mono font-semibold pr-24" style="font-size:clamp(1rem,3vw,1.3rem);color:var(--accent)">{{ encResult.ts }}</div>
            <button class="copy-btn" :class="{ copied: encTsCopied }" @click="copyBox(String(encResult.ts), 'encTs')">
              <svg v-if="!encTsCopied" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              {{ encTsCopied ? 'Copied!' : 'Copy' }}
            </button>
          </div>

          <!-- Other formats -->
          <div class="flex flex-col gap-1.5">
            <p class="font-mono text-[0.6rem] uppercase tracking-widest px-1" style="color:var(--muted)">Also shown as</p>
            <div
              v-for="(row, i) in encResult.formats" :key="row.label"
              class="relative flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style="background:var(--input-bg);border:1px solid var(--border)"
            >
              <span class="text-[0.68rem] w-24 shrink-0 font-medium" style="color:var(--muted)">{{ row.label }}</span>
              <code class="font-mono text-[0.77rem] break-all flex-1 pr-20" style="color:var(--txt)">{{ row.value }}</code>
              <button
                class="copy-btn"
                :class="{ copied: encFormatCopied === i }"
                @click="copyBox(row.value, 'encFormat', i)"
              >
                <svg v-if="encFormatCopied !== i" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                {{ encFormatCopied === i ? 'Copied!' : 'Copy' }}
              </button>
            </div>
          </div>

        </div>
      </Transition>

      <div v-if="!encResult"
        class="flex-1 flex flex-col items-center justify-center gap-2 rounded-xl"
        style="background:var(--input-bg);border:1px solid var(--border)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--muted);opacity:0.3"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <span class="text-[0.75rem]" style="color:var(--muted)">Your timestamp will appear here…</span>
      </div>

      <div class="actions-bar">
        <button class="btn-ghost-sm" @click="encInput='';encResult=null;encError=''">
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          Clear
        </button>
      </div>

    </template>

    <!-- ── DECODE: Timestamp → Date ────────────────────── -->
    <template v-else>

      <div class="info-card shrink-0">
        <div class="info-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div>
          <p class="info-title">Unix Timestamp → Date</p>
          <p class="info-body">Converts a Unix timestamp back into a readable date. Results shown in <strong>{{ userTimezone }}</strong>.</p>
        </div>
      </div>

      <div class="flex flex-col gap-1.5 shrink-0">
        <div class="editor-label">
          <div class="flex items-center gap-1.5">
            <div class="editor-dot" style="background:color-mix(in srgb,var(--accent2) 70%,transparent)"></div>
            <span>Paste Unix Timestamp</span>
          </div>
        </div>
        <div class="flex flex-col lg:flex-row gap-2">
          <input
            v-model="decInput"
            class="code-area !min-h-0 !h-10 !py-2 flex-1 font-mono"
            placeholder="e.g.  1742601600"
            type="number"
            @keyup.enter="runDecode"
            @input="decResult = null; decFormatCopied = null"
            spellcheck="false"
          />
          <button class="btn-beautify !rounded-lg" @click="runDecode">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            Decode
          </button>
        </div>
      </div>

      <Transition name="result">
        <div v-if="decResult" class="flex flex-col gap-1.5 flex-1 min-h-0 overflow-y-auto">
          <p class="font-mono text-[0.6rem] uppercase tracking-widest px-1" style="color:var(--muted)">This number means</p>
          <div
            v-for="(row, i) in decResult" :key="row.label"
            class="relative flex items-center gap-3 px-4 py-3 rounded-xl"
            style="background:var(--input-bg);border:1px solid var(--border)"
          >
            <div class="flex-1 pr-20">
              <div class="font-mono text-[0.6rem] uppercase tracking-widest mb-1 font-medium" style="color:var(--muted)">{{ row.label }}</div>
              <code class="font-mono text-[0.85rem] font-medium break-all" style="color:var(--txt)">{{ row.value }}</code>
            </div>
            <button
              class="copy-btn"
              :class="{ copied: decFormatCopied === i }"
              @click="copyBox(row.value, 'decFormat', i)"
            >
              <svg v-if="decFormatCopied !== i" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              {{ decFormatCopied === i ? 'Copied!' : 'Copy' }}
            </button>
          </div>
        </div>
      </Transition>

      <!-- Empty state -->
      <div v-if="!decResult"
        class="flex-1 flex flex-col items-center justify-center gap-2 rounded-xl"
        style="background:var(--input-bg);border:1px solid var(--border)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--muted);opacity:0.3"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span class="text-[0.75rem]" style="color:var(--muted)">The date will appear here…</span>
      </div>

      <!-- Quick examples -->
      <div class="card !p-3 shrink-0">
        <div class="card-title !mb-2">Quick Examples</div>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="ex in examples" :key="ex.ts"
            class="example-chip"
            @click="fillExample(ex.ts)"
          >{{ ex.label }}</button>
        </div>
      </div>

      <div class="actions-bar">
        <button class="btn-ghost-sm" @click="decInput='';decResult=null;decFormatCopied=null">
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          Clear
        </button>
      </div>

    </template>

  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['toast'])

const modes = [
  { id: 'enc', label: 'Encode' },
  { id: 'dec', label: 'Decode' },
]
const mode         = ref('enc')
const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

// ── Helpers ───────────────────────────────────────────────────────────────
function pad(n) { return String(n).padStart(2, '0') }
function localISO(d) {
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` +
         `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
function localDateOnly(d) {
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
}

const MONTHS = {
  january:0,february:1,march:2,april:3,may:4,june:5,
  july:6,august:7,september:8,october:9,november:10,december:11,
  jan:0,feb:1,mar:2,apr:3,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11,
}

function parseLocalDate(val) {
  const v = val.trim()
  if (!v) return null
  if (v.toLowerCase() === 'now') return new Date()
  if (/^\d{10,}$/.test(v)) return new Date(parseInt(v) * 1000)
  const iso = v.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/)
  if (iso) return new Date(parseInt(iso[1]), parseInt(iso[2])-1, parseInt(iso[3]))
  const dmy = v.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/)
  if (dmy) return new Date(parseInt(dmy[3]), parseInt(dmy[2])-1, parseInt(dmy[1]))
  const lower = v.toLowerCase().replace(/,/g, '')
  const parts = lower.split(/\s+/)
  let year, month, day
  for (const p of parts) {
    if (/^\d{4}$/.test(p)) { year = parseInt(p); continue }
    if (/^\d{1,2}$/.test(p) && day === undefined) { day = parseInt(p); continue }
    if (MONTHS[p] !== undefined) { month = MONTHS[p]; continue }
  }
  if (year !== undefined && month !== undefined && day !== undefined)
    return new Date(year, month, day)
  return null
}

// ── Encode ────────────────────────────────────────────────────────────────
const encInput        = ref('')
const encResult       = ref(null)
const encError        = ref('')
const encTsCopied     = ref(false)
const encFormatCopied = ref(null)
let encTsTimer = null, encFormatTimer = null

function runEncode() {
  encError.value        = ''
  encResult.value       = null
  encTsCopied.value     = false
  encFormatCopied.value = null

  const val = encInput.value.trim() || 'now'
  const d   = parseLocalDate(val)

  if (!d || isNaN(d.getTime())) {
    encError.value = 'Could not understand that date. Try "2026-03-22" or "March 22, 2026".'
    return
  }

  encResult.value = {
    ts: Math.floor(d.getTime() / 1000),
    formats: [
      { label: 'Your local', value: d.toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'medium' }) },
      { label: 'Date only',  value: localDateOnly(d) },
      { label: 'ISO format', value: localISO(d) },
      { label: 'Timezone',   value: userTimezone },
    ],
  }
}

// ── Decode ────────────────────────────────────────────────────────────────
const decInput        = ref('')
const decResult       = ref(null)
const decFormatCopied = ref(null)
let decFormatTimer = null

const examples = [
  { label: 'Jan 1, 2000',  ts: '946684800'  },
  { label: 'Jan 1, 2024',  ts: '1704067200' },
  { label: 'Mar 22, 2026', ts: '1742601600' },
  { label: 'Unix epoch 0', ts: '0'          },
]

function runDecode() {
  if (!decInput.value.toString().trim()) { emit('toast', 'Paste a timestamp first.'); return }
  const n = parseInt(decInput.value)
  if (isNaN(n)) { emit('toast', 'That does not look like a valid number.'); return }
  decFormatCopied.value = null
  const d = new Date(n * 1000)
  decResult.value = [
    { label: 'Your Local Time', value: d.toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'medium' }) },
    { label: 'Date Only',       value: localDateOnly(d) },
    { label: 'ISO Format',      value: localISO(d) },
    { label: 'Timezone',        value: userTimezone },
  ]
}

function fillExample(ts) {
  decInput.value        = ts
  decResult.value       = null
  decFormatCopied.value = null
  runDecode()
}

// ── Copy ──────────────────────────────────────────────────────────────────
function copyBox(text, box, index = null) {
  if (!text) { emit('toast', 'Nothing to copy.'); return }
  navigator.clipboard.writeText(text).then(() => {
    if (box === 'encTs') {
      encTsCopied.value = true
      clearTimeout(encTsTimer)
      encTsTimer = setTimeout(() => { encTsCopied.value = false }, 2000)
    } else if (box === 'encFormat') {
      encFormatCopied.value = index
      clearTimeout(encFormatTimer)
      encFormatTimer = setTimeout(() => { encFormatCopied.value = null }, 2000)
    } else if (box === 'decFormat') {
      decFormatCopied.value = index
      clearTimeout(decFormatTimer)
      decFormatTimer = setTimeout(() => { decFormatCopied.value = null }, 2000)
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

.editor-dot { width:6px;height:6px;border-radius:50%;flex-shrink:0; }

.copy-btn { position:absolute;top:50%;right:8px;transform:translateY(-50%);display:flex;align-items:center;gap:5px;padding:4px 10px;border-radius:7px;font-family:monospace;font-size:0.65rem;font-weight:600;cursor:pointer;border:1px solid var(--border);background:var(--surface);color:var(--muted);transition:all 0.15s ease;z-index:5;white-space:nowrap; }
.copy-btn:hover { border-color:color-mix(in srgb,var(--accent) 50%,transparent);color:var(--accent);background:color-mix(in srgb,var(--accent) 8%,transparent); }
.copy-btn.copied { border-color:var(--accent);background:color-mix(in srgb,var(--accent) 12%,transparent);color:var(--accent); }

/* Big timestamp copy btn override — top-aligned */
.relative > .copy-btn { top:8px;transform:none; }

.example-chip { padding:5px 12px;border-radius:8px;font-size:0.74rem;font-weight:500;cursor:pointer;background:var(--input-bg);border:1px solid var(--border);color:var(--muted);transition:all 0.13s ease; }
.example-chip:hover { border-color:var(--accent);color:var(--accent);background:color-mix(in srgb,var(--accent) 6%,transparent); }

.actions-bar { display:flex;align-items:center;flex-wrap:wrap;gap:6px;flex-shrink:0;padding-bottom:2px; }
.action-divider { width:1px;height:20px;background:var(--border);flex-shrink:0;margin:0 2px; }

.btn-beautify { display:flex;align-items:center;gap:7px;padding:8px 20px;border-radius:9px;font-size:0.82rem;font-weight:700;cursor:pointer;border:none;background:var(--accent);color:#fff;transition:all 0.15s ease;position:relative;overflow:hidden; }
.btn-beautify::after { content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,0.12) 0%,transparent 60%);pointer-events:none; }
.btn-beautify:hover { filter:brightness(1.1);transform:translateY(-1px);box-shadow:0 4px 14px color-mix(in srgb,var(--accent) 40%,transparent); }
.btn-beautify:active { transform:translateY(0); }

.btn-ghost-sm { display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:8px;font-size:0.78rem;font-weight:600;cursor:pointer;border:1px solid transparent;background:transparent;color:var(--muted);transition:all 0.13s ease; }
.btn-ghost-sm:hover { border-color:color-mix(in srgb,#e06060 40%,transparent);color:#e06060;background:color-mix(in srgb,#e06060 6%,transparent); }

.result-enter-active { transition:opacity 0.25s ease,transform 0.25s ease; }
.result-enter-from { opacity:0;transform:translateY(6px); }
</style>