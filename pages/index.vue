<script setup lang="ts">
import PhotoTool from '~/components/PhotoTool.vue'
import DocCard from '~/components/DocCard.vue'
import BlogCard from '~/components/BlogCard.vue'
import { useData } from '~/composables/useData'
import { useRequestURL } from '#imports'

const { popularDocuments, countriesByCode, quickLinks, documents, blogPosts } = useData()
const url = useRequestURL()

useHead(() => {
  const desc = 'Make compliant passport, visa and ID photos online in seconds. Free tool with country-specific size specs, white/blue background, and instant JPG/PDF download.'
  const canonical = `${url.origin}/`
  return {
    title: 'PhotoGov — Passport Photo, Visa Photo & ID Photo Maker Online',
    meta: [
      { name: 'description', content: desc },
      { property: 'og:title', content: 'PhotoGov — Passport Photo, Visa Photo & ID Photo Maker Online' },
      { property: 'og:description', content: desc },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: canonical },
      { name: 'twitter:title', content: 'PhotoGov — Passport Photo, Visa Photo & ID Photo Maker Online' },
      { name: 'twitter:description', content: desc }
    ],
    link: [{ rel: 'canonical', href: canonical }]
  }
})
const popular = popularDocuments().slice(0, 8)
const quick = quickLinks().slice(0, 6)
const flagFor = (code: string) => countriesByCode[code]?.flag || '📄'
const latestPosts = blogPosts().slice().sort((a: any, b: any) => (a.date < b.date ? 1 : -1)).slice(0, 3)

const docTypes = [
  { cat: 'passport', label: 'Passport photos', desc: 'Travel-ready passport sizes for 190+ countries', count: documents.filter((d) => d.category === 'passport').length },
  { cat: 'visa', label: 'Visa photos', desc: 'Embassy & consulate compliant visa sizes', count: documents.filter((d) => d.category === 'visa').length },
  { cat: 'id', label: 'ID photos', desc: 'National ID and residence card photos', count: documents.filter((d) => d.category === 'id').length },
  { cat: 'driving', label: 'Driving license', desc: "Driver's license photo templates", count: documents.filter((d) => d.category === 'driving').length }
]

const steps = [
  { n: 1, title: 'Take or upload a photo', text: 'Use your phone or webcam. No studio needed.' },
  { n: 2, title: 'Crop to the correct size', text: 'We auto-fit your photo to the official dimensions.' },
  { n: 3, title: 'Fix background & light', text: 'One click white/blue background, brightness and contrast.' },
  { n: 4, title: 'Download JPG or PDF', text: 'Print at home or submit digitally — guaranteed compliant.' }
]

const standards = [
  { t: 'Government-approved sizes', d: '190+ countries, always updated to the latest specs.' },
  { t: 'Correct DPI & head size', d: 'We follow exact head-height and eye-level rules.' },
  { t: 'Print & digital ready', d: 'Export JPG for online forms or PDF for printing.' },
  { t: 'Private by design', d: 'Photos are processed in your browser. We never store them.' }
]

const trust = [
  'Used by travelers in 190+ countries',
  'No account required to make a photo',
  'Free to use, no hidden watermarks',
  'Works on desktop, tablet and phone'
]
</script>

<template>
  <div>
    <!-- HERO -->
    <section class="bg-gradient-to-b from-[#eef4ff] to-white">
      <div class="container-pg grid items-center gap-10 py-12 lg:grid-cols-2">
        <div>
          <span class="eyebrow">{{ $t('home.heroEyebrow') }}</span>
          <h1 class="mt-3 text-4xl font-bold leading-tight sm:text-5xl">
            {{ $t('home.heroTitleA') }}<br />{{ $t('home.heroTitleB') }}
          </h1>
          <p class="mt-4 max-w-md text-lg text-muted">
            {{ $t('home.heroText') }}
          </p>
          <div class="mt-6 flex flex-wrap gap-3">
            <a href="#tool" class="btn-primary">{{ $t('home.makeMyPhoto') }}</a>
            <NuxtLink to="/documents" class="btn-outline">{{ $t('home.browseDocuments') }}</NuxtLink>
          </div>
          <ul class="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
            <li v-for="(t, i) in $tm('home.trust')" :key="i" class="flex items-center gap-1.5">
              <span class="text-accent-green">✓</span>{{ t }}
            </li>
          </ul>
        </div>

        <div id="tool" class="scroll-mt-24">
          <PhotoTool />
        </div>
      </div>
    </section>

    <!-- STEPS -->
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
    </section>

    <!-- COMPLIANCE STANDARDS -->
    <section class="bg-slate-50 py-14">
      <div class="container-pg">
      <div class="text-center">
        <span class="eyebrow">{{ $t('compliance.eyebrow') }}</span>
        <h2 class="mt-2 text-3xl font-bold">{{ $t('home.standardsTitle') }}</h2>
          <p class="mx-auto mt-3 max-w-2xl text-muted">
            {{ $t('home.standardsSub') }}
          </p>
        </div>
        <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div v-for="(st, i) in $tm('home.standards')" :key="i" class="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 class="font-semibold">{{ st.t }}</h3>
            <p class="mt-1 text-sm text-muted">{{ st.d }}</p>
          </div>
        </div>
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
            {{ flagFor(d.country) }} {{ d.name }}
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- BROWSE BY TYPE -->
    <section class="container-pg py-14">
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
          <p class="mt-3 text-sm font-semibold text-brand-blue">
            {{ t.count }} templates →
          </p>
        </NuxtLink>
      </div>
    </section>

    <!-- FROM THE BLOG -->
    <section class="container-pg py-14">
      <div class="flex items-end justify-between">
        <div>
          <span class="eyebrow">{{ $t('home.blogEyebrow') }}</span>
          <h2 class="mt-2 text-3xl font-bold">{{ $t('home.blogTitle') }}</h2>
        </div>
        <NuxtLink to="/blog" class="btn-outline hidden sm:inline-flex">{{ $t('home.viewAllArticles') }}</NuxtLink>
      </div>
      <div class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <BlogCard v-for="p in latestPosts" :key="p.slug" :post="p" />
      </div>
      <div class="mt-6 text-center sm:hidden">
        <NuxtLink to="/blog" class="btn-outline">{{ $t('home.viewAllArticles') }}</NuxtLink>
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
        <NuxtLink to="/faq" class="btn-primary shrink-0">{{ $t('home.readFaq') }}</NuxtLink>
      </div>
    </section>

    <!-- WHY TRUST / STATS -->
    <section class="bg-slate-50 py-14">
      <div class="container-pg">
        <div class="text-center">
          <span class="eyebrow">{{ $t('home.trustEyebrow') }}</span>
          <h2 class="mt-2 text-3xl font-bold">{{ $t('home.trustTitle') }}</h2>
          <p class="mx-auto mt-3 max-w-2xl text-muted">
            {{ $t('home.trustSub') }}
          </p>
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

    <!-- COMPLIANCE STANDARDS (7 pts) -->
    <section class="container-pg py-14">
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
    </section>

    <!-- CTA -->
    <section class="bg-header py-14 text-center text-white">
      <div class="container-pg">
        <h2 class="text-3xl font-bold">{{ $t('home.ctaTitle') }}</h2>
        <p class="mx-auto mt-3 max-w-xl text-white/70">
          {{ $t('home.ctaText') }}
        </p>
        <NuxtLink to="/documents" class="btn-yellow mt-6">{{ $t('home.startNow') }}</NuxtLink>
      </div>
    </section>
  </div>
</template>
