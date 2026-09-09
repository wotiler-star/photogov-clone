<script setup lang="ts">
import PhotoTool from '~/components/PhotoTool.vue'
import HeroToolWizard from '~/components/HeroToolWizard.vue'
import DocCard from '~/components/DocCard.vue'
import BlogCard from '~/components/BlogCard.vue'
import { useData } from '~/composables/useData'
import { useRequestURL } from '#imports'

const { popularDocuments, countriesByCode, quickLinks, documents, blogPosts } = useData()
const url = useRequestURL()
const localePath = useLocalePath()

useHead(() => {
  const desc = 'Make compliant passport, visa and ID photos online in seconds. Free tool with country-specific size specs, white/blue background, and instant JPG/PDF download.'
  const canonical = `${url.origin}/`
  return {
    title: 'Passport Photo Maker – 100% Compliant Passport Size Photo',
    meta: [
      { name: 'description', content: desc },
      { property: 'og:title', content: 'Passport Photo Maker – 100% Compliant Passport Size Photo' },
      { property: 'og:description', content: desc },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: canonical },
      { name: 'twitter:title', content: 'Passport Photo Maker – 100% Compliant Passport Size Photo' },
      { name: 'twitter:description', content: desc }
    ],
    link: [{ rel: 'canonical', href: canonical }]
  }
})

const popular = popularDocuments().slice(0, 8)
const quick = quickLinks().slice(0, 6)
const CDN = 'https://photogov-com.fra1.cdn.digitaloceanspaces.com'
const flagFor = (code: string) => `${CDN}/frontend/img/svg/flags/4x3/${code.toLowerCase()}.svg`
const latestPosts = blogPosts().slice().sort((a: any, b: any) => (a.date < b.date ? 1 : -1)).slice(0, 3)
const previewDoc = popular[0]

// 示例人脸画廊
const samples = computed(() =>
  popular.slice(0, 6).map((d) => ({
    code: d.country,
    name: d.countryName,
    url: `${CDN}/examples-new/original/${d.country}.webp`
  }))
)
const toolRef = ref()
function useSample(url: string) {
  toolRef.value?.loadSampleUrl(url)
  document.getElementById('tool')?.scrollIntoView({ behavior: 'smooth' })
}

const docTypes = [
  { cat: 'passport', label: 'Passport photos', desc: 'Travel-ready passport sizes for 190+ countries', count: documents.filter((d) => d.category === 'passport').length },
  { cat: 'visa', label: 'Visa photos', desc: 'Embassy & consulate compliant visa sizes', count: documents.filter((d) => d.category === 'visa').length },
  { cat: 'id', label: 'ID photos', desc: 'National ID and residence card photos', count: documents.filter((d) => d.category === 'id').length },
  { cat: 'driving', label: 'Driving license', desc: "Driver's license photo templates", count: documents.filter((d) => d.category === 'driving').length }
]
</script>

<template>
  <div>
    <!-- ═══ HERO — 与原站完全一致的左右两栏布局 ═══ -->
    <section class="bg-gradient-to-b from-[#eef4ff] to-white">
      <div class="container-pg grid items-start gap-10 py-12 lg:grid-cols-2">
        <!-- 左栏：标题 + CTA + 评价徽章（原站同款） -->
        <div>
          <span class="eyebrow">{{ $t('home.heroEyebrow') }}</span>
          <h1 class="mt-3 text-4xl font-bold leading-tight sm:text-5xl">
            {{ $t('home.heroTitle') }}
          </h1>
          <p class="mt-4 max-w-md text-lg text-muted">
            {{ $t('home.heroSubtitle') }}
          </p>
          <p class="mt-4 max-w-md text-base font-medium max-lg:text-sm">
            {{ $t('home.heroCtaText') }}
          </p>
          <button
            class="mt-8 inline-flex w-full items-center justify-center gap-x-2.5 border border-transparent bg-[#2563EB] px-7 py-2.5 text-base text-white transition-opacity hover:opacity-75 disabled:bg-[#6b7280] lg:w-[440px] max-lg:mt-6 max-lg:w-full"
            style="--button-progress: 50%;"
            @click="document.getElementById('tool')?.scrollIntoView({ behavior: 'smooth' })"
          >
            <svg class="size-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M5.7 3C4.98 3 4.3 3.28 3.79 3.79C3.28 4.3 3 4.98 3 5.7V14.7C3 15.18 3.19 15.64 3.53 15.97C3.86 16.31 4.32 16.5 4.8 16.5V5.7C4.8 5.46 4.89 5.06 5.06 5.06C5.23 5.06 5.46 4.8 5.7 4.8H18.3C18.3 4.32 18.11 3.86 17.77 3.53C17.43 3.19 16.98 3 16.5 3H5.7ZM5.7 7.5C5.7 7.02 5.89 6.56 6.23 6.23C6.56 5.89 7.02 5.7 7.5 5.7H19.2C19.68 5.7 20.14 5.89 20.47 6.23C20.81 6.56 21 7.02 21 7.5V17.7C21 18.18 20.81 18.64 20.47 18.97C20.14 19.31 19.68 19.5 19.2 19.5H7.5C7.02 19.5 6.56 19.31 6.23 18.97C5.89 18.64 5.7 18.18 5.7 17.7V7.5ZM19.2 7.5H7.5V14.56L11 11.1C11.07 11 11.19 10.91 11.33 10.86C11.47 10.8 11.61 10.77 11.76 10.77C11.91 10.77 12.05 10.8 12.19 10.86C12.33 10.91 12.45 11 12.55 11.1L15.5 14.02L16.3 13.22C16.4 13.12 16.5 13.03 16.63 12.98C16.77 12.92 16.91 12.89 17.06 12.89C17.21 12.89 17.36 12.92 17.49 12.98C17.63 13.03 17.75 13.12 17.86 13.22L19.2 14.56V7.5ZM17.4 10.2C17.4 10.56 17.26 10.9 17 11.15C16.76 11.41 16.41 11.55 16.05 11.55C15.69 11.55 15.35 11.41 15.1 11.15C14.85 10.9 14.7 10.56 14.7 10.2C14.7 9.84 14.85 9.5 15.1 9.25C15.35 9 15.69 8.85 16.05 8.85C16.41 8.85 16.76 9 17 9.25C17.26 9.5 17.4 9.84 17.4 10.2Z" fill="white"/>
            </svg>
            {{ $t('home.heroCtaBtn') }}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-5">
              <path d="M8 18L12 22L16 18" />
              <path d="M12 2V22" />
            </svg>
          </button>

          <!-- 评价徽章（与原站一致：Excellent + 星星 + 评论数 + Google logo） -->
          <div class="mt-6 flex h-[30px] items-center gap-x-3.5 max-lg:mt-3.5">
            <div class="inline-flex items-center gap-x-2.5">
              <span class="font-semibold">{{ $t('home.reviewLabel') }}</span>
              <div class="inline-flex">
                <!-- 4.5 颗星 -->
                <svg v-for="n in 5" :key="n" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="size-6 max-lg:hidden">
                  <defs v-if="n === 5">
                    <linearGradient id="star-half" x1="4.5" y1="11" x2="19.5" y2="11" gradientUnits="userSpaceOnUse">
                      <stop offset="48%" stop-color="#FFD850" />
                      <stop offset="50%" stop-color="#D3D4D5" />
                    </linearGradient>
                  </defs>
                  <path :fill="n < 5 ? '#FFD850' : 'url(#star-half)'" d="M12.8 5.53C12.66 5.2 12.35 5 12 5C11.66 5 11.35 5.2 11.2 5.53L9.42 9.4L5.43 10.02C5.1 10.08 4.82 10.32 4.72 10.66C4.61 11 4.7 11.37 4.93 11.62L7.83 14.64L7.15 18.91C7.09 19.26 7.23 19.62 7.5 19.82C7.78 20.03 8.14 20.06 8.44 19.89L12 17.88L15.57 19.89C15.87 20.06 16.23 20.04 16.51 19.82C16.78 19.61 16.92 19.26 16.87 18.91L16.18 14.64L19.08 11.62C19.31 11.37 19.4 11 19.3 10.66C19.19 10.32 18.92 10.08 18.58 10.02L14.59 9.4L12.8 5.53Z"/>
                </svg>
              </div>
            </div>
            <div class="inline-flex items-center gap-x-1.5">
              <span><b class="font-semibold">{{ $t('home.reviewCount') }}</b> {{ $t('home.reviewOn') }}</span>
              <!-- Google Reviews logo (SVG) -->
              <svg viewBox="0 0 53 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="shrink-0 h-6">
                <path d="M22.92 14.63C22.92 16.99 21.05 18.73 18.75 18.73C16.45 18.73 14.58 16.99 14.58 14.63C14.58 12.25 16.45 10.53 18.75 10.53C21.05 10.53 22.92 12.25 22.92 14.63ZM21.1 14.63C21.1 13.16 20.01 12.15 18.75 12.15C17.49 12.15 16.41 13.16 16.41 14.63C16.41 16.09 17.49 17.11 18.75 17.11C20.01 17.11 21.1 16.09 21.1 14.63Z" fill="#EA4335"/>
                <path d="M32.26 14.63C32.26 16.99 30.39 18.73 28.09 18.73C25.79 18.73 23.92 16.99 23.92 14.63C23.92 12.26 25.79 10.53 28.09 10.53C30.39 10.53 32.26 12.25 32.26 14.63ZM30.44 14.63C30.44 13.16 29.35 12.15 28.09 12.15C26.83 12.15 25.75 13.16 25.75 14.63C25.75 16.09 26.83 17.11 28.09 17.11C29.35 17.11 30.44 16.09 30.44 14.63Z" fill="#FBBC05"/>
                <path d="M41.23 10.78V18.14C41.23 21.17 39.42 22.4 37.28 22.4C35.27 22.4 34.05 21.07 33.6 19.99L35.19 19.3C35.48 20.09 36.27 20.82 37.28 20.82C38.52 20.82 39.29 20.04 39.29 18.59V17.96H39.22C38.74 18.56 37.86 19.1 36.74 19.1C34.33 19.1 32.24 16.94 32.24 14.03C32.24 11.1 34.33 8.93 36.74 8.93C37.85 8.93 38.73 9.46 39.22 10.04H39.29V10.78H41.23ZM39.42 14.03C39.42 12.44 38.41 11.18 37.07 11.18C35.71 11.18 34.62 12.44 34.62 14.03C34.62 15.6 35.71 16.84 37.07 16.84C38.41 16.84 39.42 15.6 39.42 14.03Z" fill="#4285F4"/>
                <path d="M44.06 1.07V18.77H41.88V1.07H44.06Z" fill="#34A853"/>
                <path d="M51.97 15.18L53.45 16.18C52.95 16.89 51.72 18.73 49.09 18.73C46.78 18.73 45.08 16.97 45.08 14.61C45.08 12.11 46.8 10.49 48.87 10.49C50.99 10.49 52.94 12.08 53.5 14.87L53.76 15.83L49.31 17.62C49.69 18.42 50.38 18.87 51.28 18.87C52.19 18.87 52.86 18.38 53.36 17.64L51.97 15.18ZM49.13 16.17L52.19 14.97C52 14.37 51.47 13.91 50.78 13.91C49.88 13.91 49.17 14.57 49.13 16.17Z" fill="#EA4335"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- 右栏：向导式工具表单（与原站一致） -->
        <div class="card-pg p-6 lg:p-8">
          <HeroToolWizard />
        </div>
      </div>
    </section>

    <!-- ═══ 完整编辑器（向下滚动后可见） ═══ -->
    <section id="tool" class="container-pg scroll-mt-24 py-14">
      <PhotoTool ref="toolRef" />
    </section>

    <!-- HOW IT WORKS: Upload → Processing → Checkout → Download -->
    <section class="container-pg py-14">
      <div class="text-center">
        <span class="eyebrow">{{ $t('home.stepsEyebrow') }}</span>
        <h2 class="mt-2 text-3xl font-bold">{{ $t('home.stepsTitle') }}</h2>
      </div>
      <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="(s, i) in $tm('home.steps')" :key="i" class="card-pg p-5">
          <div class="grid h-10 w-10 place-items-center rounded-full bg-brand-blue text-white font-bold">{{ i + 1 }}</div>
          <h3 class="mt-3 text-lg font-semibold">{{ s.title }}</h3>
          <p class="mt-1 text-sm text-muted">{{ s.text }}</p>
        </div>
      </div>
      <p class="mx-auto mt-6 max-w-3xl text-center text-xs text-muted">
        {{ $t('home.usNote') }}
      </p>
    </section>

    <!-- 100% COMPLIANCE (7 pts) -->
    <section class="bg-slate-50 py-14">
      <div class="container-pg">
        <div class="text-center">
          <span class="eyebrow">{{ $t('home.standardsEyebrow') }}</span>
          <h2 class="mt-2 text-3xl font-bold">{{ $t('home.standardsTitle') }}</h2>
        </div>
        <ol class="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
          <li v-for="(s, i) in $tm('home.standards')" :key="i" class="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <span class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-blue text-xs font-bold text-white">{{ i + 1 }}</span>
            <span class="text-sm text-muted">{{ s }}</span>
          </li>
        </ol>
      </div>
    </section>

    <!-- POPULAR DOCUMENTS -->
    <section class="container-pg py-14">
      <div class="flex items-end justify-between">
        <div>
          <span class="eyebrow">{{ $t('home.popularEyebrow') }}</span>
          <h2 class="mt-2 text-3xl font-bold">{{ $t('home.popularTitle') }}</h2>
        </div>
        <NuxtLink to="/documents" class="btn-outline hidden sm:inline-flex">{{ $t('common.viewAll') }}</NuxtLink>
      </div>
      <div class="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DocCard v-for="d in popular" :key="d.slug" :doc="d" :flag="flagFor(d.country)" />
      </div>
    </section>

    <!-- QUICK LINKS -->
    <section v-if="quick.length" class="bg-slate-50 py-14">
      <div class="container-pg">
        <span class="eyebrow">{{ $t('home.quickEyebrow') }}</span>
        <h2 class="mt-2 text-3xl font-bold">{{ $t('home.quickTitle') }}</h2>
        <div class="mt-6 flex flex-wrap gap-3">
          <NuxtLink
            v-for="d in quick"
            :key="d.slug"
            :to="`/document/${d.slug}`"
            class="chip !px-4 !py-2 !text-sm hover:bg-brand-blue hover:text-white"
          >
            <img :src="flagFor(d.country)" :alt="d.country" class="h-4 w-4 rounded-sm" /> {{ d.name }}
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- PREVIEW & EXAMPLES -->
    <section class="container-pg py-14">
      <div class="text-center">
        <span class="eyebrow">{{ $t('home.previewEyebrow') }}</span>
        <h2 class="mt-2 text-3xl font-bold">{{ $t('home.previewTitle') }}</h2>
        <p class="mx-auto mt-3 max-w-2xl text-muted">{{ $t('home.previewSub') }}</p>
      </div>
      <div v-if="previewDoc" class="mx-auto mt-8 max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <p class="text-sm font-semibold text-ink">{{ previewDoc.countryName }} — {{ previewDoc.name }}</p>
        <dl class="mt-3 grid grid-cols-2 gap-y-2 text-sm text-muted">
          <dt>{{ $t('tool.sizeLabel') }}</dt><dd class="text-right text-ink">{{ previewDoc.size.inch }}″</dd>
          <dt>{{ $t('tool.specBackground') }}</dt><dd class="text-right"><span class="inline-block h-3 w-3 rounded-sm border border-slate-300 align-middle" :style="{ background: previewDoc.background }" /></dd>
          <dt>{{ $t('tool.specHead') }}</dt><dd class="text-right text-ink">{{ previewDoc.headHeight }}</dd>
          <dt>{{ $t('tool.specEyes') }}</dt><dd class="text-right text-ink">{{ previewDoc.eyesLevel }}</dd>
          <dt>{{ $t('tool.specFormat') }}</dt><dd class="text-right text-ink">{{ previewDoc.format }}</dd>
          <dt>{{ $t('tool.specDpi') }}</dt><dd class="text-right text-ink">{{ previewDoc.dpi }}</dd>
        </dl>
      </div>
      <div class="mt-8 flex flex-wrap justify-center gap-3">
        <button
          v-for="s in samples"
          :key="s.code"
          class="group relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200 transition hover:-translate-y-0.5 hover:shadow-card"
          :title="s.name"
          @click="useSample(s.url)"
        >
          <img :src="s.url" :alt="s.name" class="h-full w-full object-cover" loading="lazy" />
        </button>
      </div>
      <p class="mt-3 text-center text-xs text-muted">{{ $t('home.previewHint') }}</p>
    </section>

    <!-- HOW TO TAKE AT HOME: DO / DON'T -->
    <section class="bg-slate-50 py-14">
      <div class="container-pg">
        <div class="text-center">
          <span class="eyebrow">{{ $t('home.howEyebrow') }}</span>
          <h2 class="mt-2 text-3xl font-bold">{{ $t('home.howTitle') }}</h2>
          <p class="mx-auto mt-3 max-w-2xl text-muted">{{ $t('home.howSub') }}</p>
        </div>
        <div class="mt-8 grid gap-4 md:grid-cols-2">
          <div class="rounded-2xl border border-accent-green/30 bg-white p-5">
            <h3 class="text-lg font-semibold text-accent-green">{{ $t('home.doTitle') }}</h3>
            <ul class="mt-3 space-y-2 text-sm text-muted">
              <li v-for="(t, i) in $tm('home.doList')" :key="i" class="flex gap-2"><span>✓</span><span>{{ t }}</span></li>
            </ul>
          </div>
          <div class="rounded-2xl border border-amber-300/40 bg-white p-5">
            <h3 class="text-lg font-semibold text-amber-600">{{ $t('home.dontTitle') }}</h3>
            <ul class="mt-3 space-y-2 text-sm text-muted">
              <li v-for="(t, i) in $tm('home.dontList')" :key="i" class="flex gap-2"><span>✕</span><span>{{ t }}</span></li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- BABY PHOTOS -->
    <section class="container-pg py-14">
      <div class="text-center">
        <span class="eyebrow">{{ $t('home.babyEyebrow') }}</span>
        <h2 class="mt-2 text-3xl font-bold">{{ $t('home.babyTitle') }}</h2>
      </div>
      <div class="mt-8 grid gap-4 md:grid-cols-2">
        <div class="rounded-2xl border border-accent-green/30 bg-white p-5">
          <h3 class="text-lg font-semibold text-accent-green">{{ $t('home.babyOkTitle') }}</h3>
          <ul class="mt-3 space-y-2 text-sm text-muted">
            <li v-for="(t, i) in $tm('home.babyOk')" :key="i" class="flex gap-2"><span>✓</span><span>{{ t }}</span></li>
          </ul>
        </div>
        <div class="rounded-2xl border border-amber-300/40 bg-white p-5">
          <h3 class="text-lg font-semibold text-amber-600">{{ $t('home.babyBadTitle') }}</h3>
          <ul class="mt-3 space-y-2 text-sm text-muted">
            <li v-for="(t, i) in $tm('home.babyBad')" :key="i" class="flex gap-2"><span>✕</span><span>{{ t }}</span></li>
          </ul>
        </div>
      </div>
    </section>

    <!-- BROWSE BY TYPE -->
    <section class="bg-slate-50 py-14">
      <div class="container-pg">
        <div class="text-center">
          <span class="eyebrow">{{ $t('home.docTypesEyebrow') }}</span>
          <h2 class="mt-2 text-3xl font-bold">{{ $t('home.docTypesTitle') }}</h2>
        </div>
        <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <NuxtLink
            v-for="t in docTypes"
            :key="t.cat"
            :to="`/documents?category=${t.cat}`"
            class="card-pg group p-5 transition hover:-translate-y-0.5 hover:shadow-card"
          >
            <h3 class="text-lg font-semibold">{{ t.label }}</h3>
            <p class="mt-1 text-sm text-muted">{{ t.desc }}</p>
            <p class="mt-3 text-sm font-semibold text-brand-blue">{{ t.count }} templates →</p>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- WHY TRUST / STATS -->
    <section class="py-14">
      <div class="container-pg">
        <div class="text-center">
          <span class="eyebrow">{{ $t('home.trustEyebrow') }}</span>
          <h2 class="mt-2 text-3xl font-bold">{{ $t('home.trustTitle') }}</h2>
          <p class="mx-auto mt-3 max-w-2xl text-muted">{{ $t('home.trustSub') }}</p>
        </div>
        <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div class="card-pg p-5 text-center">
            <div class="text-3xl font-bold text-brand-blue">1.8M+</div>
            <p class="mt-1 text-sm text-muted">{{ $t('home.trustUsers') }}</p>
          </div>
          <div class="card-pg p-5 text-center">
            <div class="text-3xl font-bold text-brand-blue">99.2%</div>
            <p class="mt-1 text-sm text-muted">{{ $t('home.trustApproval') }}</p>
          </div>
          <div class="card-pg p-5 text-center">
            <div class="text-3xl font-bold text-brand-blue">4.7★</div>
            <p class="mt-1 text-sm text-muted">{{ $t('home.trustRating') }}</p>
          </div>
          <div class="card-pg p-5 text-center">
            <div class="text-3xl font-bold text-brand-blue">150+</div>
            <p class="mt-1 text-sm text-muted">{{ $t('home.trustCountries') }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- TRUSTED GLOBAL PLATFORM -->
    <section class="bg-slate-50 py-14">
      <div class="container-pg">
        <div class="text-center">
          <span class="eyebrow">{{ $t('home.trustedEyebrow') }}</span>
          <h2 class="mt-2 text-3xl font-bold">{{ $t('home.trustedTitle') }}</h2>
          <p class="mx-auto mt-3 max-w-2xl text-muted">{{ $t('home.trustedSub') }}</p>
        </div>
        <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="(t, i) in $tm('home.trustedPoints')" :key="i" class="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 class="font-semibold">{{ t.t }}</h3>
            <p class="mt-1 text-sm text-muted">{{ t.d }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- FROM THE BLOG -->
    <section class="container-pg py-14">
      <div class="flex items-end justify-between">
        <div>
          <span class="eyebrow">{{ $t('home.blogEyebrow') }}</span>
          <h2 class="mt-2 text-3xl font-bold">{{ $t('home.blogTitle') }}</h2>
        </div>
        <NuxtLink :to="localePath('/blog')" class="btn-outline hidden sm:inline-flex">{{ $t('home.viewAllArticles') }}</NuxtLink>
      </div>
      <div class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <BlogCard v-for="p in latestPosts" :key="p.slug" :post="p" />
      </div>
      <div class="mt-6 text-center sm:hidden">
        <NuxtLink :to="localePath('/blog')" class="btn-outline">{{ $t('home.viewAllArticles') }}</NuxtLink>
      </div>
    </section>

    <!-- WHAT OUR USERS SAY -->
    <section class="bg-slate-50 py-14">
      <div class="container-pg">
        <div class="text-center">
          <span class="eyebrow">{{ $t('home.usersSayEyebrow') }}</span>
          <h2 class="mt-2 text-3xl font-bold">{{ $t('home.usersSayTitle') }}</h2>
          <p class="mx-auto mt-3 max-w-2xl text-muted">{{ $t('home.usersSaySub') }}</p>
        </div>
        <div class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <figure
            v-for="(u, i) in $tm('reviewsPage.users')"
            :key="i"
            class="card-pg flex flex-col p-5"
          >
            <div class="flex items-center gap-1 text-amber-500" aria-label="5 / 5">
              <span v-for="s in 5" :key="s">★</span>
            </div>
            <blockquote class="mt-3 flex-1 text-sm text-muted">{{ u.text }}</blockquote>
            <figcaption class="mt-4 text-sm font-semibold">
              {{ u.name }}
              <span v-if="u.when" class="block text-xs font-normal text-muted">{{ u.when }}</span>
            </figcaption>
          </figure>
        </div>
        <div class="mt-8 text-center">
          <NuxtLink :to="localePath('/reviews')" class="btn-outline">{{ $t('home.seeAllReviews') }}</NuxtLink>
        </div>
      </div>
    </section>

    <!-- FAQ CTA -->
    <section class="container-pg pb-14">
      <div class="card-pg flex flex-col items-center gap-4 bg-slate-50 p-8 text-center sm:flex-row sm:text-left">
        <span class="text-4xl">❓</span>
        <div class="flex-1">
          <h2 class="text-xl font-bold">{{ $t('home.faqTitle') }}</h2>
          <p class="mt-1 text-sm text-muted">{{ $t('home.faqText') }}</p>
        </div>
        <NuxtLink :to="localePath('/faq')" class="btn-primary shrink-0">{{ $t('home.readFaq') }}</NuxtLink>
      </div>
    </section>

    <!-- COMPLIANCE & INDEPENDENCE -->
    <section class="container-pg pb-14">
      <p class="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-5 text-xs leading-relaxed text-muted">
        {{ $t('home.independence') }}
      </p>
    </section>

    <!-- CTA -->
    <section class="bg-header py-14 text-center text-white">
      <div class="container-pg">
        <h2 class="text-3xl font-bold">{{ $t('home.ctaTitle') }}</h2>
        <p class="mx-auto mt-3 max-w-xl text-white/70">
          {{ $t('home.ctaText') }}
        </p>
        <NuxtLink :to="localePath('/documents')" class="btn-yellow mt-6">{{ $t('home.startNow') }}</NuxtLink>
      </div>
    </section>
  </div>
</template>
