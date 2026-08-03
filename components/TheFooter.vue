<script setup lang="ts">
const year = new Date().getFullYear()
const cols = [
  {
    title: 'footer.colDocuments',
    links: [
      { label: 'footer.links.allDocuments', to: '/documents' },
      { label: 'footer.links.passports', to: '/passports' },
      { label: 'footer.links.visas', to: '/visas' },
      { label: 'footer.links.dvLottery', to: '/dv-lottery' },
      { label: 'footer.links.idPhotos', to: '/documents?category=id' }
    ]
  },
  {
    title: 'footer.colCompany',
    links: [
      { label: 'footer.links.about', to: '/about' },
      { label: 'footer.links.blog', to: '/blog' },
      { label: 'footer.links.faq', to: '/faq' },
      { label: 'footer.links.compliance', to: '/compliance' },
      { label: 'footer.links.contact', to: '/contact' },
      { label: 'footer.links.helpCenter', to: '/help' }
    ]
  },
  {
    title: 'footer.colLegal',
    links: [
      { label: 'footer.links.privacy', to: '/privacy' },
      { label: 'footer.links.terms', to: '/terms' },
      { label: 'footer.links.cookie', to: '/cookies' }
    ]
  }
]
</script>

<template>
  <footer class="bg-header text-white/80">
    <div class="container-pg grid gap-10 py-14 sm:grid-cols-2 md:grid-cols-4">
      <div>
        <div class="flex items-center gap-2 text-xl font-bold text-white">
          <span class="grid h-9 w-9 place-items-center rounded-xl bg-accent-yellow text-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 8.5C3 7.7 3.7 7 4.5 7h15c.8 0 1.5.7 1.5 1.5v9c0 .8-.7 1.5-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-9Z" stroke="currentColor" stroke-width="1.8"/>
              <circle cx="12" cy="12" r="3.2" stroke="currentColor" stroke-width="1.8"/>
              <path d="M9 4.5l1.5 2.5M15 4.5l-1.5 2.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </span>
          <span class="font-serif">Photo<span class="text-accent-yellow">Gov</span></span>
        </div>
        <p class="mt-4 max-w-xs text-sm text-white/60">
          {{ $t('footer.tagline') }}
        </p>
        <p class="mt-4 text-xs text-white/45">
          {{ $t('footer.notAffiliated') }}
        </p>
      </div>

      <div v-for="col in cols" :key="col.title">
        <h4 class="text-sm font-semibold uppercase tracking-wide text-white">
          {{ $t(col.title) }}
        </h4>
        <ul class="mt-4 space-y-2 text-sm">
          <li v-for="l in col.links" :key="l.to">
            <NuxtLink :to="l.to" class="text-white/65 hover:text-white">
              {{ $t(l.label) }}
            </NuxtLink>
          </li>
        </ul>
      </div>
    </div>

    <div class="border-t border-white/10">
      <div class="container-pg flex flex-col items-center justify-between gap-3 py-5 text-xs text-white/50 sm:flex-row">
        <p>{{ $t('footer.copyright', { year }) }}</p>
        <p>{{ $t('footer.madeWith') }}</p>
      </div>
    </div>
  </footer>
</template>
