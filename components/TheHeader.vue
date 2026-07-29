<script setup lang="ts">
import { ref, computed } from 'vue'
import { useData } from '~/composables/useData'
import { useCountry } from '~/composables/useCountry'

const { countries } = useData()
const { code, setCode } = useCountry()

const open = ref(false)
const query = ref('')
const root = ref<HTMLElement | null>(null)

const current = computed(
  () => countries.find((c) => c.code === code.value) || countries[0]
)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return countries
  return countries.filter(
    (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q
  )
})

const navItems = [
  { label: 'DV Lottery', to: '/dv-lottery' },
  { label: 'Documents', to: '/documents' },
  { label: 'Passports', to: '/passports' },
  { label: 'Visas', to: '/visas' },
  { label: 'Blog', to: '/blog' },
  { label: 'FAQ', to: '/faq' },
  { label: 'About', to: '/about' }
]

const select = (c: string) => {
  setCode(c)
  open.value = false
  navigateTo(`/documents?country=${c}`)
}

const onDocClick = (e: MouseEvent) => {
  if (root.value && !root.value.contains(e.target as Node)) open.value = false
}

onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <header ref="root" class="sticky top-0 z-50">
    <!-- 顶部条 -->
    <div class="bg-header-2 text-white/90">
      <div class="container-pg flex h-10 items-center justify-between text-xs">
        <div class="flex items-center gap-3">
          <button
            class="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-white/10"
            @click="open = !open"
          >
            <span class="text-base leading-none">{{ current.flag }}</span>
            <span class="font-medium">{{ current.name }}</span>
            <svg width="12" height="12" viewBox="0 0 12 12" class="opacity-70">
              <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.6" fill="none" />
            </svg>
          </button>
          <span class="hidden sm:inline opacity-60">Passport photo requirements by country</span>
        </div>
        <nav class="flex items-center gap-4">
          <NuxtLink to="/help" class="hover:text-white">Help</NuxtLink>
          <NuxtLink to="/signin" class="hover:text-white">Sign In</NuxtLink>
        </nav>
      </div>

      <!-- 国家下拉面板 -->
      <Transition name="fade">
        <div
          v-if="open"
          class="absolute left-0 right-0 top-10 z-50 border-t border-white/10 bg-header-2 shadow-card"
        >
          <div class="container-pg py-4">
            <input
              v-model="query"
              type="text"
              placeholder="Search 100+ countries…"
              class="mb-3 w-full max-w-md rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder-white/50 outline-none focus:border-white/40"
            />
            <div class="grid max-h-72 grid-cols-2 gap-x-6 gap-y-1 overflow-y-auto sm:grid-cols-3 md:grid-cols-4">
              <button
                v-for="c in filtered"
                :key="c.code"
                class="flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-white/10"
                :class="c.code === code ? 'bg-white/15 font-semibold' : ''"
                @click="select(c.code)"
              >
                <span class="text-base leading-none">{{ c.flag }}</span>
                <span class="truncate">{{ c.name }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- 主导航 -->
    <div class="bg-header text-white shadow-soft">
      <div class="container-pg flex h-16 items-center justify-between">
        <NuxtLink to="/" class="flex items-center gap-2 text-xl font-bold">
          <span class="grid h-9 w-9 place-items-center rounded-xl bg-accent-yellow text-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 8.5C3 7.7 3.7 7 4.5 7h15c.8 0 1.5.7 1.5 1.5v9c0 .8-.7 1.5-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-9Z" stroke="currentColor" stroke-width="1.8"/>
              <circle cx="12" cy="12" r="3.2" stroke="currentColor" stroke-width="1.8"/>
              <path d="M9 4.5l1.5 2.5M15 4.5l-1.5 2.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </span>
          <span class="font-serif">Photo<span class="text-accent-yellow">Gov</span></span>
        </NuxtLink>

        <nav class="hidden items-center gap-1 md:flex">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="rounded-full px-4 py-2 text-sm font-medium text-white/85 hover:bg-white/10 hover:text-white"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>

        <div class="flex items-center gap-2">
          <NuxtLink to="/documents" class="btn-primary hidden sm:inline-flex">
            Make Photo
          </NuxtLink>
          <button
            class="grid h-10 w-10 place-items-center rounded-full hover:bg-white/10 md:hidden"
            aria-label="Menu"
            @click="open = false"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none">
              <path d="M4 7h16M4 12h16M4 17h16" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
