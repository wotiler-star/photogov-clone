<script setup lang="ts">
import { useLocalePath } from '#imports'
import { useI18n } from 'vue-i18n'
import { useOrgLd } from '~/composables/useOrgLd'
import ServiceProvidedLine from '~/components/ServiceProvidedLine.vue'

// 对标原站 /editorial-team/（F5 取证 SEEN）——异类布局：
// main.bg-gray-100 py-10 lg:py-16 > container max-w-[1040px]
//   > 朴素面包屑（Home › Editorial Team，无 hero 封面图）
//   > article.rounded-lg bg-white p-6 lg:p-12（H1 30/36px + 引言 + H2 Editors + 编辑卡 + 尾部 border-t 链接）
//   > Service provided by 行
const localePath = useLocalePath()
const { t } = useI18n()
const url = useRequestURL()
const { scripts: orgScripts } = useOrgLd()

useHead({
  title: t('editorialTeam.title'),
  meta: [
    { name: 'description', content: t('editorialTeam.intro') },
    { property: 'og:title', content: t('editorialTeam.title') },
    { property: 'og:description', content: t('editorialTeam.intro') },
  ],
  script: [
    ...orgScripts.value,
    {
      key: 'ld-edteam-bc',
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: t('nav.home'), item: url.origin + localePath('/') },
          { '@type': 'ListItem', position: 2, name: t('editorialTeam.title') }
        ]
      }).replace(/</g, '\\u003c')
    }
  ]
})
</script>

<template>
  <main class="bg-gray-100 py-10 lg:py-16">
    <div class="container max-w-[1040px]">
      <!-- 面包屑（朴素样式，无 hero 背景） -->
      <nav class="mb-8 text-sm text-gray-600" aria-label="Breadcrumb">
        <NuxtLink :to="localePath('/')" class="underline duration-200 hover:text-red-700">{{ $t('common.homePage') }}</NuxtLink>
        <span aria-hidden="true"> › </span>
        <span aria-current="page">{{ $t('editorialTeam.breadcrumb') }}</span>
      </nav>

      <article class="rounded-lg bg-white p-6 lg:p-12">
        <h1 class="text-[30px] font-bold leading-tight lg:text-[36px]">{{ $t('editorialTeam.title') }}</h1>
        <p class="mt-5 max-w-[700px] font-serif text-lg">{{ $t('editorialTeam.intro') }}</p>

        <h2 class="mt-10 text-2xl font-semibold">{{ $t('editorialTeam.editorsTitle') }}</h2>

        <!-- 编辑卡：64px 头像 + 姓名链接 + 职务 + 简介 + LinkedIn -->
        <div class="mt-6 flex items-start gap-5 max-sm:flex-col">
          <img
            src="/img/editorial/olia-potiagaeva.jpg"
            :alt="$t('editorialTeam.name')"
            width="64"
            height="64"
            class="size-16 shrink-0 rounded-lg object-cover"
          >
          <div class="max-w-[600px]">
            <h3 class="text-xl font-semibold">
              <NuxtLink :to="localePath('/editorial-team')" class="text-blue-700 underline duration-200 hover:text-red-700">
                {{ $t('editorialTeam.name') }}
              </NuxtLink>
            </h3>
            <p class="mt-1 font-serif text-gray-600">{{ $t('editorialTeam.role') }}</p>
            <p class="mt-3 font-serif">{{ $t('editorialTeam.bio') }}</p>
            <a
              href="https://www.linkedin.com/in/olia-potiagaeva"
              target="_blank"
              rel="noopener"
              class="mt-3 inline-block text-blue-700 underline duration-200 hover:text-red-700"
            >
              {{ $t('editorialTeam.linkedin') }}
            </a>
          </div>
        </div>

        <!-- 尾部：border-t 分隔 + 编辑政策链接 -->
        <p class="mt-10 border-t pt-6 font-serif">
          <NuxtLink :to="localePath('/editorial-policy')" class="text-blue-700 underline duration-200 hover:text-red-700">
            {{ $t('editorialTeam.processText') }}
          </NuxtLink>
        </p>
      </article>
    </div>

    <ServiceProvidedLine />
  </main>
</template>
