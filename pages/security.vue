<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocalePath, useRequestURL } from '#imports'
import InfoPageShell from '~/components/InfoPageShell.vue'
import HeadingSeal from '~/components/HeadingSeal.vue'

const { t, tm } = useI18n()
const localePath = useLocalePath()
const url = useRequestURL()

const items = tm('securityPage.items') as Array<{ t: string; p: string }>

const escLd = (s: string) => s.replace(/</g, '\\u003c')
const canonical = computed(() => `${url.origin}${localePath('/security')}`)

// 对标原站：仅 BreadcrumbList
const breadcrumbLd = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: t('common.homePage'), item: `${url.origin}/` },
    { '@type': 'ListItem', position: 2, name: t('securityPage.breadcrumb') }
  ]
}))

useHead(() => ({
  title: t('securityPage.metaTitle'),
  meta: [
    { name: 'description', content: t('securityPage.metaDesc') },
    { property: 'og:title', content: t('securityPage.metaTitle') },
    { property: 'og:description', content: t('securityPage.metaDesc') },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: canonical.value },
    { name: 'twitter:title', content: t('securityPage.metaTitle') },
    { name: 'twitter:description', content: t('securityPage.metaDesc') }
  ],
  link: [{ rel: 'canonical', href: canonical.value }],
  script: [
    { key: 'ld-breadcrumb', type: 'application/ld+json', innerHTML: escLd(JSON.stringify(breadcrumbLd.value)) }
  ]
}))
</script>

<template>
  <InfoPageShell
    icon="security"
    :hero-title="$t('securityPage.heroTitle')"
    :hero-desc="$t('securityPage.heroDesc')"
    :breadcrumb="$t('securityPage.breadcrumb')"
  >
    <div class="flex items-start">
      <h1 class="flex-1 text-[30px] font-bold leading-tight">{{ $t('securityPage.title') }}</h1>
      <HeadingSeal />
    </div>

    <!-- 原站为 ul.list-disc 6 项（每项 <b>标题:</b> 正文），非卡片 -->
    <div class="mt-6 space-y-6 text-[#374151]">
      <p>{{ $t('securityPage.lead') }}</p>
      <ul class="list-outside list-disc pl-4">
        <li v-for="(it, i) in items" :key="i" class="list-item">
          <b>{{ it.t }}</b> {{ it.p }}
        </li>
      </ul>
      <p>{{ $t('securityPage.outro') }}</p>
    </div>
  </InfoPageShell>
</template>
