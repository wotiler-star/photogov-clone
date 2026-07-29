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
          <span class="eyebrow">Passport · Visa · ID photos</span>
          <h1 class="mt-3 text-4xl font-bold leading-tight sm:text-5xl">
            Passport photos<br />that <span class="text-brand-blue">just work</span>.
          </h1>
          <p class="mt-4 max-w-md text-lg text-muted">
            Make compliant passport, visa and ID photos online in seconds. Pick your
            country, upload a selfie, and download a print-ready JPG or PDF.
          </p>
          <div class="mt-6 flex flex-wrap gap-3">
            <a href="#tool" class="btn-primary">Make my photo</a>
            <NuxtLink to="/documents" class="btn-outline">Browse documents</NuxtLink>
          </div>
          <ul class="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
            <li v-for="t in trust" :key="t" class="flex items-center gap-1.5">
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
        <span class="eyebrow">How it works</span>
        <h2 class="mt-2 text-3xl font-bold">Four steps to a perfect photo</h2>
      </div>
      <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="s in steps" :key="s.n" class="card-pg p-5">
          <div class="grid h-10 w-10 place-items-center rounded-full bg-brand-blue text-white font-bold">{{ s.n }}</div>
          <h3 class="mt-3 text-lg font-semibold">{{ s.title }}</h3>
          <p class="mt-1 text-sm text-muted">{{ s.text }}</p>
        </div>
      </div>
    </section>

    <!-- COMPLIANCE STANDARDS -->
    <section class="bg-slate-50 py-14">
      <div class="container-pg">
        <div class="text-center">
          <span class="eyebrow">Compliance</span>
          <h2 class="mt-2 text-3xl font-bold">Built to meet official standards</h2>
          <p class="mx-auto mt-3 max-w-2xl text-muted">
            Every template follows the exact rules published by passport and visa authorities.
          </p>
        </div>
        <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div v-for="st in standards" :key="st.t" class="rounded-2xl border border-slate-200 bg-white p-5">
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
          <span class="eyebrow">Popular</span>
          <h2 class="mt-2 text-3xl font-bold">Most requested documents</h2>
        </div>
        <NuxtLink to="/documents" class="btn-outline hidden sm:inline-flex">View all</NuxtLink>
      </div>
      <div class="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DocCard v-for="d in popular" :key="d.slug" :doc="d" :flag="flagFor(d.country)" />
      </div>
    </section>

    <!-- QUICK LINKS -->
    <section v-if="quick.length" class="bg-slate-50 py-14">
      <div class="container-pg">
        <span class="eyebrow">Quick links</span>
        <h2 class="mt-2 text-3xl font-bold">Jump straight to a photo</h2>
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
        <span class="eyebrow">Document types</span>
        <h2 class="mt-2 text-3xl font-bold">Browse by document type</h2>
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
          <span class="eyebrow">Blog</span>
          <h2 class="mt-2 text-3xl font-bold">From the PhotoGov blog</h2>
        </div>
        <NuxtLink to="/blog" class="btn-outline hidden sm:inline-flex">View all</NuxtLink>
      </div>
      <div class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <BlogCard v-for="p in latestPosts" :key="p.slug" :post="p" />
      </div>
      <div class="mt-6 text-center sm:hidden">
        <NuxtLink to="/blog" class="btn-outline">View all articles</NuxtLink>
      </div>
    </section>

    <!-- FAQ CTA -->
    <section class="container-pg pb-14">
      <div class="card-pg flex flex-col items-center gap-4 bg-slate-50 p-8 text-center sm:flex-row sm:text-left">
        <span class="text-4xl">❓</span>
        <div class="flex-1">
          <h2 class="text-xl font-bold">Got questions about photo requirements?</h2>
          <p class="mt-1 text-sm text-muted">Sizes, backgrounds, the tool, downloads and acceptance — answered in our FAQ.</p>
        </div>
        <NuxtLink to="/faq" class="btn-primary shrink-0">Read the FAQ</NuxtLink>
      </div>
    </section>

    <!-- TRUST -->
    <section class="container-pg py-14">
      <div class="card-pg grid gap-6 p-8 sm:grid-cols-3">
        <div>
          <div class="text-3xl font-bold text-brand-blue">190+</div>
          <p class="text-sm text-muted">Countries supported</p>
        </div>
        <div>
          <div class="text-3xl font-bold text-brand-blue">300</div>
          <p class="text-sm text-muted">DPI print quality</p>
        </div>
        <div>
          <div class="text-3xl font-bold text-brand-blue">0</div>
          <p class="text-sm text-muted">Photos stored on our servers</p>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="bg-header py-14 text-center text-white">
      <div class="container-pg">
        <h2 class="text-3xl font-bold">Ready to make your photo?</h2>
        <p class="mx-auto mt-3 max-w-xl text-white/70">
          It takes less than a minute and it's free. No sign-up required.
        </p>
        <NuxtLink to="/documents" class="btn-yellow mt-6">Start now</NuxtLink>
      </div>
    </section>
  </div>
</template>
