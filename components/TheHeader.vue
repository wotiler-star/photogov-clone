<script setup lang="ts">
import { ref, computed } from 'vue'
import { useData } from '~/composables/useData'
import { useCountry } from '~/composables/useCountry'
import { useAuth } from '~/composables/useAuth'
import LanguageSwitcher from '~/components/LanguageSwitcher.vue'

const { countries, countryName } = useData()
const { code, setCode } = useCountry()
const { user } = useAuth()
const localePath = useLocalePath()

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
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase() === q ||
      countryName(c.code).toLowerCase().includes(q)
  )
})

// 与 photogov.net 一致的主导航（大写 + 下划线）
const navItems = [
  { label: 'nav.dvLottery', to: '/dv-lottery' },
  { label: 'nav.documents', to: '/documents' },
  { label: 'nav.passports', to: '/passports' },
  { label: 'nav.visas', to: '/visas' },
  { label: 'nav.about', to: '/about-us' }
]

const select = (c: string) => {
  setCode(c)
  open.value = false
  navigateTo(localePath(`/documents?country=${c}`))
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
    <div class="bg-header-2 text-white/85">
      <div class="container-pg flex h-11 items-center justify-end gap-5 text-[13px]">
        <NuxtLink :to="localePath('/support')" class="hover:text-white">
          {{ $t('nav.contactUs') }}
        </NuxtLink>
        <NuxtLink :to="localePath('/help')" class="hover:text-white">
          {{ $t('nav.helpCenter') }}
        </NuxtLink>

        <!-- 国家选择器（边框盒样式，与原站一致） -->
        <button
          type="button"
          class="flex items-center gap-2 rounded border border-white/30 px-3 py-1.5 hover:border-white/60"
          @click="open = !open"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" class="opacity-80">
            <path d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10Z" stroke="currentColor" stroke-width="1.7" />
            <circle cx="12" cy="11" r="2.2" stroke="currentColor" stroke-width="1.7" />
          </svg>
          <span class="font-medium">{{ countryName(current.code) }}</span>
          <svg width="11" height="11" viewBox="0 0 12 12" class="opacity-70">
            <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.6" fill="none" />
          </svg>
        </button>

        <LanguageSwitcher />
      </div>
    </div>

    <!-- 国家下拉面板 -->
    <Transition name="fade">
      <div
        v-if="open"
        class="absolute left-0 right-0 top-11 z-50 border-t border-white/10 bg-header-2 shadow-card"
      >
        <div class="container-pg py-4">
          <input
            v-model="query"
            type="text"
            :placeholder="$t('header.searchCountries')"
            class="mb-3 w-full max-w-md rounded border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder-white/50 outline-none focus:border-white/40"
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
              <span class="truncate">{{ countryName(c.code) }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 主导航 -->
    <div class="bg-header text-white">
      <div class="container-pg flex h-[88px] items-center justify-between border-b-[3px] border-gold">
        <!-- 徽标：圆形徽章 + PhotoGov service + 副标 -->
        <NuxtLink :to="localePath('/')" class="flex items-center gap-3">
          <span class="grid h-14 w-14 place-items-center rounded-full border-2 border-gold/80 bg-white/5">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" class="text-gold">
              <circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.5" />
              <path d="M3.5 12h17M12 3.5c2.6 2.7 2.6 14.3 0 17M12 3.5c-2.6 2.7-2.6 14.3 0 17" stroke="currentColor" stroke-width="1.5" />
              <rect x="8.4" y="10.2" width="7.2" height="4.6" rx="0.9" stroke="currentColor" stroke-width="1.3" />
              <circle cx="10.4" cy="12.5" r="0.9" fill="currentColor" />
            </svg>
          </span>
          <span>
            <span class="block font-serif text-[26px] leading-tight">Photo<span class="text-gold">Gov</span> service</span>
            <span class="block text-[11px] tracking-wide text-white/70">Passport and Visa photo online</span>
          </span>
        </NuxtLink>

        <nav class="hidden items-center gap-7 md:flex">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="localePath(item.to)"
            class="text-[13px] font-semibold uppercase tracking-wide underline decoration-white/60 decoration-1 underline-offset-4 transition hover:decoration-white"
          >
            {{ $t(item.label) }}
          </NuxtLink>
        </nav>

        <div class="flex items-center gap-4">
          <NuxtLink
            v-if="user"
            :to="localePath('/account')"
            class="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide underline decoration-white/60 decoration-1 underline-offset-4 hover:decoration-white"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="3.6" stroke="currentColor" stroke-width="1.7" />
              <path d="M4.5 20c1.4-3.4 4.2-5 7.5-5s6.1 1.6 7.5 5" stroke="currentColor" stroke-width="1.7" />
            </svg>
            {{ $t('nav.account') }}
          </NuxtLink>
          <NuxtLink
            v-else
            :to="localePath('/sign-in')"
            class="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide underline decoration-white/60 decoration-1 underline-offset-4 hover:decoration-white"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="3.6" stroke="currentColor" stroke-width="1.7" />
              <path d="M4.5 20c1.4-3.4 4.2-5 7.5-5s6.1 1.6 7.5 5" stroke="currentColor" stroke-width="1.7" />
            </svg>
            {{ $t('nav.signIn') }}
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
