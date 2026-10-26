<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useLocalePath } from '#imports'
import { useData } from '~/composables/useData'
import { useCountry } from '~/composables/useCountry'
import { useAuth } from '~/composables/useAuth'
import LanguageSwitcher from '~/components/LanguageSwitcher.vue'

const localePath = useLocalePath()
const { countries, countryName } = useData()
const { code, setCode } = useCountry()
const { user } = useAuth()

const open = ref(false) // 国家选择面板
const drawer = ref(false) // 移动端抽屉
const query = ref('')
const root = ref<HTMLElement | null>(null)

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

const docLabel = (slug: string) => `navDocs.${slug}`
const docTo = (slug: string) => `/documents/${slug}`

// 与原站一致的四大悬停下拉（SEEN 取证：Documents/Passports/Visas/About）
const popularSlugs = [
  'us-passport-photo',
  'ca-passport-photo',
  'cn-passport-photo',
  'au-passport-photo',
  'us-visa-photo',
  'ca-visa-photo',
  'gb-passport-photo'
]
const passportSlugs = [
  'us-passport-photo',
  'cn-passport-photo',
  'ca-passport-photo',
  'gb-passport-photo',
  'au-passport-photo',
  'digital-passport-photo'
]
const visaSlugs = [
  'us-visa-photo',
  'ca-visa-photo',
  'eu-visa-photo',
  'in-visa-photo',
  'canada-temporary-resident-permit-photo'
]

const aboutLinks = [
  { to: '/about-us', labelKey: 'footer.links.aboutUs' },
  { to: '/editorial-team', labelKey: 'footer.links.editorialTeam' },
  { to: '/editorial-policy', labelKey: 'footer.links.editorialPolicy' },
  { to: '/how-it-works', labelKey: 'footer.links.howItWorks' },
  { to: '/prices', labelKey: 'footer.links.prices' },
  { to: '/why-choose-us', labelKey: 'footer.links.whyChooseUs' },
  { to: '/reviews', labelKey: 'footer.links.reviews' },
  { to: '/security', labelKey: 'footer.links.security' },
  { to: '/faq', labelKey: 'footer.links.faq' }
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

// 抽屉打开时锁定 body 滚动
watch(drawer, (v) => {
  if (import.meta.client) {
    document.body.style.overflow = v ? 'hidden' : ''
  }
})
</script>

<template>
  <header ref="root" class="relative border-b-4 border-gold">
    <!-- 顶部工具条（原站移动端隐藏，仅 md+ 显示，避免内容换行溢出 44px 栏高压住主导航） -->
    <div class="hidden bg-header-2 text-white/85 md:block">
      <div class="container-pg flex h-11 items-center justify-end gap-5 text-[13px]">
        <NuxtLink :to="localePath('/contacts')" class="hover:text-white">
          {{ $t('nav.contactUs') }}
        </NuxtLink>
        <NuxtLink :to="localePath('/support')" class="hover:text-white">
          {{ $t('nav.helpCenter') }}
        </NuxtLink>

        <!-- 国家选择器（地球图标 + 当前地区，对标原站） -->
        <button
          type="button"
          class="flex items-center gap-2 rounded border border-white/30 px-3 py-1.5 hover:border-white/60"
          :aria-expanded="open"
          @click="open = !open"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" class="opacity-80">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7" />
            <path d="M3 12h18M12 3c2.6 2.7 2.6 14.3 0 18M12 3c-2.6 2.7-2.6 14.3 0 18" stroke="currentColor" stroke-width="1.4" />
          </svg>
          <span class="font-medium">{{ countryName(code) }}</span>
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

    <!-- 主导航（static，滚动时随页面滚出，对标原站） -->
    <div class="bg-header text-white">
      <div class="container-pg flex h-20 items-center justify-between border-b-[3px] border-gold sm:h-[88px]">
        <!-- 徽标：圆形徽章 + PhotoGov service + 副标 -->
        <NuxtLink :to="localePath('/')" class="flex items-center gap-2.5 sm:gap-3">
          <span class="grid h-12 w-12 place-items-center rounded-full border-2 border-gold/80 bg-white/5 sm:h-14 sm:w-14">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" class="text-gold sm:h-[30px] sm:w-[30px]">
              <circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.5" />
              <path d="M3.5 12h17M12 3.5c2.6 2.7 2.6 14.3 0 17M12 3.5c-2.6 2.7-2.6 14.3 0 17" stroke="currentColor" stroke-width="1.5" />
              <rect x="8.4" y="10.2" width="7.2" height="4.6" rx="0.9" stroke="currentColor" stroke-width="1.3" />
              <circle cx="10.4" cy="12.5" r="0.9" fill="currentColor" />
            </svg>
          </span>
          <span>
            <span class="block font-serif text-[21px] leading-tight sm:text-[26px]">Photo<span class="text-gold">Gov</span> service</span>
            <span class="block text-[10px] tracking-wide text-white/70 sm:text-[11px]">Passport and Visa photo online</span>
          </span>
        </NuxtLink>

        <!-- 桌面端导航：DV Lottery + 四大悬停下拉（对标原站 SEEN 取证） -->
        <nav class="hidden items-center gap-6 lg:flex" aria-label="Main">
          <NuxtLink
            :to="localePath(docTo('dv-lottery-photo-tool'))"
            class="text-[13px] font-semibold uppercase tracking-wide underline decoration-white/60 decoration-1 underline-offset-4 transition hover:decoration-white"
          >
            {{ $t('navDocs.dv-lottery-photo-tool') }}
          </NuxtLink>

          <!-- Documents：Popular documents 快链 -->
          <div class="group relative">
            <button
              type="button"
              class="flex items-center gap-1 text-[13px] font-semibold uppercase tracking-wide underline decoration-white/60 decoration-1 underline-offset-4 transition hover:decoration-white"
            >
              {{ $t('nav.documents') }}
              <svg width="10" height="10" viewBox="0 0 12 12" class="mt-0.5 shrink-0"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.8" fill="none" /></svg>
            </button>
            <div
              class="invisible absolute left-0 top-full z-50 w-60 translate-y-1 rounded-lg bg-header-2 py-2 opacity-0 shadow-card transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
            >
              <p class="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-gold">
                {{ $t('nav.popularDocuments') }}
              </p>
              <NuxtLink
                v-for="slug in popularSlugs"
                :key="slug"
                :to="localePath(docTo(slug))"
                class="block px-4 py-1.5 text-[13px] text-white/85 hover:bg-white/10 hover:text-white"
              >
                {{ $t(docLabel(slug)) }}
              </NuxtLink>
            </div>
          </div>

          <!-- Passports -->
          <div class="group relative">
            <button
              type="button"
              class="flex items-center gap-1 text-[13px] font-semibold uppercase tracking-wide underline decoration-white/60 decoration-1 underline-offset-4 transition hover:decoration-white"
            >
              {{ $t('nav.passports') }}
              <svg width="10" height="10" viewBox="0 0 12 12" class="mt-0.5 shrink-0"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.8" fill="none" /></svg>
            </button>
            <div
              class="invisible absolute left-0 top-full z-50 w-60 translate-y-1 rounded-lg bg-header-2 py-2 opacity-0 shadow-card transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
            >
              <p class="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-gold">
                {{ $t('nav.passportPhotos') }}
              </p>
              <NuxtLink
                v-for="slug in passportSlugs"
                :key="slug"
                :to="localePath(docTo(slug))"
                class="block px-4 py-1.5 text-[13px] text-white/85 hover:bg-white/10 hover:text-white"
              >
                {{ $t(docLabel(slug)) }}
              </NuxtLink>
            </div>
          </div>

          <!-- Visas -->
          <div class="group relative">
            <button
              type="button"
              class="flex items-center gap-1 text-[13px] font-semibold uppercase tracking-wide underline decoration-white/60 decoration-1 underline-offset-4 transition hover:decoration-white"
            >
              {{ $t('nav.visas') }}
              <svg width="10" height="10" viewBox="0 0 12 12" class="mt-0.5 shrink-0"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.8" fill="none" /></svg>
            </button>
            <div
              class="invisible absolute left-0 top-full z-50 w-64 translate-y-1 rounded-lg bg-header-2 py-2 opacity-0 shadow-card transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
            >
              <p class="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-gold">
                {{ $t('nav.visaPhotos') }}
              </p>
              <NuxtLink
                v-for="slug in visaSlugs"
                :key="slug"
                :to="localePath(docTo(slug))"
                class="block px-4 py-1.5 text-[13px] text-white/85 hover:bg-white/10 hover:text-white"
              >
                {{ $t(docLabel(slug)) }}
              </NuxtLink>
            </div>
          </div>

          <!-- About -->
          <div class="group relative">
            <button
              type="button"
              class="flex items-center gap-1 text-[13px] font-semibold uppercase tracking-wide underline decoration-white/60 decoration-1 underline-offset-4 transition hover:decoration-white"
            >
              {{ $t('nav.about') }}
              <svg width="10" height="10" viewBox="0 0 12 12" class="mt-0.5 shrink-0"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.8" fill="none" /></svg>
            </button>
            <div
              class="invisible absolute right-0 top-full z-50 w-56 translate-y-1 rounded-lg bg-header-2 py-2 opacity-0 shadow-card transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
            >
              <p class="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-gold">
                {{ $t('nav.aboutGroup') }}
              </p>
              <NuxtLink
                v-for="l in aboutLinks"
                :key="l.to"
                :to="localePath(l.to)"
                class="block px-4 py-1.5 text-[13px] text-white/85 hover:bg-white/10 hover:text-white"
              >
                {{ $t(l.labelKey) }}
              </NuxtLink>
            </div>
          </div>
        </nav>

        <div class="flex items-center gap-4">
          <NuxtLink
            v-if="user"
            :to="localePath('/profile')"
            class="hidden items-center gap-2 text-[13px] font-semibold uppercase tracking-wide underline decoration-white/60 decoration-1 underline-offset-4 hover:decoration-white md:flex"
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
            class="hidden items-center gap-2 text-[13px] font-semibold uppercase tracking-wide underline decoration-white/60 decoration-1 underline-offset-4 hover:decoration-white md:flex"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="3.6" stroke="currentColor" stroke-width="1.7" />
              <path d="M4.5 20c1.4-3.4 4.2-5 7.5-5s6.1 1.6 7.5 5" stroke="currentColor" stroke-width="1.7" />
            </svg>
            {{ $t('nav.signIn') }}
          </NuxtLink>
          <!-- 汉堡按钮（对标原站 aria-label） -->
          <button
            class="grid h-10 w-10 place-items-center rounded-full hover:bg-white/10 lg:hidden"
            :aria-label="$t('nav.menu')"
            :aria-expanded="drawer"
            @click="drawer = true"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none">
              <path d="M4 7h16M4 12h16M4 17h16" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 移动端抽屉（对标原站：右侧 90vw、深蓝底、平铺三组 + 语言 + Sign in） -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="drawer"
          class="fixed inset-0 z-[60] bg-black/50 lg:hidden"
          @click="drawer = false"
        />
      </Transition>
      <Transition name="slide">
        <aside
          v-if="drawer"
          class="fixed inset-y-0 right-0 z-[61] flex w-[90vw] max-w-sm flex-col overflow-y-auto bg-header text-white lg:hidden"
          :aria-label="$t('nav.menu')"
        >
          <div class="flex items-center justify-between border-b border-white/15 px-5 py-4">
            <span class="font-serif text-lg">Photo<span class="text-gold">Gov</span></span>
            <button
              class="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10"
              :aria-label="$t('nav.closeMenu')"
              @click="drawer = false"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none">
                <path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" />
              </svg>
            </button>
          </div>

          <div class="flex items-center gap-3 border-b border-white/15 px-5 py-4">
            <LanguageSwitcher />
          </div>

          <nav class="flex-1 px-5 py-4 text-sm" @click="drawer = false">
            <NuxtLink
              v-if="user"
              :to="localePath('/profile')"
              class="block py-2 font-semibold uppercase tracking-wide"
            >
              {{ $t('nav.account') }}
            </NuxtLink>
            <NuxtLink
              v-else
              :to="localePath('/sign-in')"
              class="block py-2 font-semibold uppercase tracking-wide"
            >
              {{ $t('nav.signIn') }}
            </NuxtLink>

            <NuxtLink :to="localePath(docTo('dv-lottery-photo-tool'))" class="block py-2">
              {{ $t('navDocs.dv-lottery-photo-tool') }}
            </NuxtLink>
            <NuxtLink :to="localePath('/documents')" class="block py-2">
              {{ $t('nav.documents') }}
            </NuxtLink>

            <p class="mt-4 text-[11px] font-semibold uppercase tracking-wide text-gold">
              {{ $t('nav.passportPhotos') }}
            </p>
            <NuxtLink
              v-for="slug in passportSlugs"
              :key="slug"
              :to="localePath(docTo(slug))"
              class="block py-1.5 text-white/85"
            >
              {{ $t(docLabel(slug)) }}
            </NuxtLink>

            <p class="mt-4 text-[11px] font-semibold uppercase tracking-wide text-gold">
              {{ $t('nav.visaPhotos') }}
            </p>
            <NuxtLink
              v-for="slug in visaSlugs"
              :key="slug"
              :to="localePath(docTo(slug))"
              class="block py-1.5 text-white/85"
            >
              {{ $t(docLabel(slug)) }}
            </NuxtLink>

            <p class="mt-4 text-[11px] font-semibold uppercase tracking-wide text-gold">
              {{ $t('nav.aboutGroup') }}
            </p>
            <NuxtLink
              v-for="l in aboutLinks"
              :key="l.to"
              :to="localePath(l.to)"
              class="block py-1.5 text-white/85"
            >
              {{ $t(l.labelKey) }}
            </NuxtLink>
          </nav>
        </aside>
      </Transition>
    </Teleport>
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
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.25s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
