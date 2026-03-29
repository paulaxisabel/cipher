<template>
  <div class="h-screen overflow-hidden flex flex-col">

    <!-- Background orbs -->
    <div class="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      <div class="absolute rounded-full" style="width:600px;height:600px;top:-200px;left:-150px;background:var(--orb-a);filter:blur(120px);opacity:var(--orb-opacity);transition:opacity 0.4s"></div>
      <div class="absolute rounded-full" style="width:480px;height:480px;bottom:-120px;right:-100px;background:var(--orb-b);filter:blur(120px);opacity:var(--orb-opacity);transition:opacity 0.4s"></div>
    </div>

    <!-- Sticky nav — mobile: fixed full-width sticky, lg: hidden (rendered inside main) -->
    <div class="lg:hidden relative z-30 w-full px-5 pt-4 pb-2 mobile-nav" style="background:var(--bg);border-bottom:1px solid var(--border)">
      <header class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
            style="background:linear-gradient(135deg,var(--accent),color-mix(in srgb,var(--accent) 60%,var(--accent2)));box-shadow:0 4px 16px var(--accent-glow)">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 16 16">
              <text x="50%" y="54%" font-size="13" text-anchor="middle" dominant-baseline="middle"
                font-family="monospace" font-weight="bold" fill="white">C</text>
            </svg>
          </div>
          <span class="text-[1.25rem] font-semibold tracking-tight"
            style="background:linear-gradient(135deg,var(--accent),var(--accent2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">
            Cipher
          </span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-[0.9rem]">{{ theme === 'dark' ? '🌙' : '☀️' }}</span>
          <button
            class="relative w-10 h-[22px] rounded-full cursor-pointer transition-all duration-300"
            style="background:var(--surface);border:1px solid var(--border);backdrop-filter:blur(12px)"
            @click="toggleTheme"
            aria-label="Toggle theme"
          >
            <span
              class="absolute top-1/2 -translate-y-1/2 left-[3px] w-[16px] h-[16px] rounded-full transition-transform duration-300"
              :class="theme === 'dark' ? 'translate-x-[18px]' : 'translate-x-0'"
              style="background:var(--accent);box-shadow:0 0 8px var(--accent-glow)"
            ></span>
          </button>
        </div>
      </header>
      <!-- Tab scroll — thin scrollbar via .tab-scroll class -->
      <div class="tab-scroll flex gap-1 overflow-x-auto pb-1">
        <button
          v-for="t in tabs" :key="t.id"
          class="relative px-5 py-2 rounded-xl font-sans font-medium text-[0.82rem] border transition-all duration-200 cursor-pointer shrink-0"
          :style="activeTab === t.id
            ? { background: 'var(--surface)', color: 'var(--txt)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }
            : { background: 'transparent', color: 'var(--muted)', borderColor: 'transparent' }"
          @click="switchTab(t.id)"
        >
          {{ t.label }}
          <span v-if="activeTab === t.id"
            class="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full"
            style="height:2px;width:60%;background:var(--accent);box-shadow:0 0 8px var(--accent-glow)">
          </span>
        </button>
      </div>
    </div>

    <!-- Main content -->
    <div class="relative z-10 flex flex-col flex-1 min-h-0 w-full max-w-[1100px] mx-auto px-5 overflow-y-auto lg:overflow-hidden lg:pt-4">

      <!-- Desktop header (hidden on mobile) -->
      <div class="hidden lg:block">
        <header class="flex items-center justify-between mb-3 shrink-0">
          <div class="flex items-center gap-3">
            <div class="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
              style="background:linear-gradient(135deg,var(--accent),color-mix(in srgb,var(--accent) 60%,var(--accent2)));box-shadow:0 4px 16px var(--accent-glow)">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 16 16">
                <text x="50%" y="54%" font-size="13" text-anchor="middle" dominant-baseline="middle"
                  font-family="monospace" font-weight="bold" fill="white">C</text>
              </svg>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-[1.25rem] font-semibold tracking-tight"
                style="background:linear-gradient(135deg,var(--accent),var(--accent2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">
                Cipher
              </span>
              <span class="font-mono text-[0.63rem] uppercase tracking-widest" style="color:var(--muted)">PHP Developer Tools</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[0.9rem]">{{ theme === 'dark' ? '🌙' : '☀️' }}</span>
            <button
              class="relative w-10 h-[22px] rounded-full cursor-pointer transition-all duration-300"
              style="background:var(--surface);border:1px solid var(--border);backdrop-filter:blur(12px)"
              @click="toggleTheme"
              aria-label="Toggle theme"
            >
              <span
                class="absolute top-1/2 -translate-y-1/2 left-[3px] w-[16px] h-[16px] rounded-full transition-transform duration-300"
                :class="theme === 'dark' ? 'translate-x-[18px]' : 'translate-x-0'"
                style="background:var(--accent);box-shadow:0 0 8px var(--accent-glow)"
              ></span>
            </button>
          </div>
        </header>

        <!-- Desktop tabs -->
        <div class="flex gap-1 mb-3 shrink-0">
          <button
            v-for="t in tabs" :key="t.id"
            class="relative px-5 py-2 rounded-xl font-sans font-medium text-[0.82rem] border transition-all duration-200 cursor-pointer"
            :style="activeTab === t.id
              ? { background: 'var(--surface)', color: 'var(--txt)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }
              : { background: 'transparent', color: 'var(--muted)', borderColor: 'transparent' }"
            @click="switchTab(t.id)"
          >
            {{ t.label }}
            <span v-if="activeTab === t.id"
              class="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full"
              style="height:2px;width:60%;background:var(--accent);box-shadow:0 0 8px var(--accent-glow)">
            </span>
          </button>
        </div>
      </div>

      <!-- Panels -->
      <div class="flex-1 min-h-0 lg:overflow-hidden pt-2 lg:pt-0">
        <Transition :name="slideDir" mode="out-in">
          <ObfuscatePanel  v-if="activeTab === 'obf'"       key="obf"  class="h-full" @toast="showToast" />
          <MD5Panel        v-else-if="activeTab === 'md5'"  key="md5"  class="h-full" @toast="showToast" />
          <DatePanel       v-else-if="activeTab === 'date'" key="date" class="h-full" @toast="showToast" />
          <BeautifyPanel   v-else                           key="btf"  class="h-full" @toast="showToast" />
        </Transition>
      </div>

    </div>

    <!-- Footer -->
    <footer class="relative z-10 text-center py-2.5 font-mono text-[0.7rem] tracking-wide shrink-0"
      style="color:var(--muted);border-top:1px solid var(--border)">
      made with
      <span class="inline-block heart" style="color:var(--accent)">&#9829;</span>
      by
      <a href="https://github.com/paulaxisabel" target="_blank"
        class="transition-colors duration-200"
        style="color:var(--accent);text-decoration:none;border-bottom:1px solid transparent"
        @mouseover="e => e.target.style.borderColor='var(--accent)'"
        @mouseleave="e => e.target.style.borderColor='transparent'"
      >paula</a>
    </footer>

    <!-- Toast -->
    <Transition name="toast-pop">
      <div v-if="toastVisible"
        class="fixed bottom-5 left-1/2 -translate-x-1/2 px-5 py-2 rounded-full text-[0.82rem] font-medium pointer-events-none whitespace-nowrap z-50"
        style="background:var(--txt);color:var(--bg);box-shadow:0 4px 24px rgba(0,0,0,0.2)">
        {{ toastMsg }}
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import ObfuscatePanel from './components/ObfuscatePanel.vue'
import MD5Panel       from './components/MD5Panel.vue'
import DatePanel      from './components/DatePanel.vue'
import BeautifyPanel  from './components/BeautifyPanel.vue'

const TAB_ORDER = ['obf', 'md5', 'date', 'btf']
const tabs = [
  { id: 'obf',  label: 'Obfuscate' },
  { id: 'md5',  label: 'MD5' },
  { id: 'date', label: 'Date' },
  { id: 'btf',  label: 'Beautify' },
]

// ── Theme — read from localStorage on boot, fall back to 'light' ──────────
const savedTheme = localStorage.getItem('cipher-theme') || 'light'
const theme      = ref(savedTheme)
document.documentElement.setAttribute('data-theme', savedTheme)

const activeTab    = ref('obf')
const slideDir     = ref('slide-left')
const toastMsg     = ref('')
const toastVisible = ref(false)
let toastTimer = null

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', theme.value)
  localStorage.setItem('cipher-theme', theme.value)
}

function switchTab(id) {
  const prev = TAB_ORDER.indexOf(activeTab.value)
  const next = TAB_ORDER.indexOf(id)
  slideDir.value = next > prev ? 'slide-left' : 'slide-right'
  activeTab.value = id
}

function showToast(msg) {
  toastMsg.value = msg
  toastVisible.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastVisible.value = false }, 2000)
}
</script>

<style>
.toast-pop-enter-active, .toast-pop-leave-active { transition: opacity 0.25s, transform 0.3s cubic-bezier(.34,1.56,.64,1); }
.toast-pop-enter-from { opacity: 0; transform: translateX(-50%) translateY(16px); }
.toast-pop-leave-to   { opacity: 0; transform: translateX(-50%) translateY(16px); }
.heart { animation: hb 1.2s ease-in-out infinite; }
@keyframes hb { 0%,100%{transform:scale(1)} 50%{transform:scale(1.3)} }

/* ── Mobile nav backdrop blur ──────────────────────── */
.mobile-nav {
  backdrop-filter: blur(16px) saturate(1.3);
  -webkit-backdrop-filter: blur(16px) saturate(1.3);
}

/* ── Tab scroll — hair-thin scrollbar on mobile ────── */
.tab-scroll {
  scrollbar-width: thin;                                          /* Firefox */
  scrollbar-color: color-mix(in srgb, var(--accent) 25%, transparent) transparent;
}
.tab-scroll::-webkit-scrollbar {
  height: 2px;                                                    /* very thin */
}
.tab-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.tab-scroll::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--accent) 30%, transparent);
  border-radius: 999px;
}
.tab-scroll::-webkit-scrollbar-thumb:hover {
  background: color-mix(in srgb, var(--accent) 55%, transparent);
}
</style>