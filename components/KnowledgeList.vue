<script setup lang="ts">
/**
 * KnowledgeList —— 知识库 Hub / 分类列表页（对标原站 /knowledge/<cat>/，SSR 实证）。
 *
 * SEEN 结构：
 *   hero 区：面包屑（Home page / Knowledge[ / 分类]）
 *            + H1 `text-[40px] font-bold font-serif leading-[1.2] max-lg:text-[36px]`
 *            + 导语 `mt-5 text-[#2D2D2D] font-serif leading-[1.5]`
 *            + 280×275 插画（Hub 为内联 SVG，分类页为分类图，lg:col-start-2）
 *   tab 条（浅灰底 bg-[#F3F3F3] 内）：Popular / Requirements / Guides / Standards / FAQ
 *            非激活 `px-3 py-1 font-serif underline rounded-[2px] text-[#1A1A1A] hover:text-red-600`
 *            激活   `px-3 py-1 font-serif underline rounded-[2px] font-medium text-white bg-[#2A568A]`
 *   卡片网格 `grid grid-cols-3 gap-5 mt-8 max-lg:grid-cols-1`
 *
 * 数据：blog.json 的 posts 已按原站 Hub 顺序重排（含 views / 阅读时长 / 封面 / 日期 / 作者）。
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import posts from '~/data/blog.json'
import categories from '~/data/knowledgeCategories.json'
import { useOrgLd } from '~/composables/useOrgLd'
import { useRequestURL } from '#imports'

type Kind = 'popular' | 'requirements' | 'guides' | 'standards' | 'faq'

const props = defineProps<{ kind: Kind }>()

const { t } = useI18n()
const localePath = useLocalePath()
const url = useRequestURL()
const { scripts: orgScripts } = useOrgLd()

const CAT = categories as Record<string, { image: string; h1: string; lead: string }>

const tabs = computed(() => [
  { key: 'popular', label: 'Popular', to: '/knowledge' },
  { key: 'requirements', label: 'Requirements', to: '/knowledge/requirements' },
  { key: 'guides', label: 'Guides', to: '/knowledge/guides' },
  { key: 'standards', label: 'Standards', to: '/knowledge/standards' },
  { key: 'faq', label: 'FAQ', to: '/knowledge/faq' }
])

const list = computed(() => {
  const all = (posts as any).posts as any[]
  // Popular = 原站 Hub 默认顺序（posts 已按该顺序重排）
  if (props.kind === 'popular') return all
  return all.filter((p) => p.categorySlug === props.kind)
})

// hero 文案：Hub 用知识库总标题；分类页用 i18n knowledge.cats 四语化文案，fallback 到 knowledgeCategories.json 英文原文
const hero = computed(() => {
  if (props.kind === 'popular') {
    return { title: t('knowledge.title'), lead: t('knowledge.sub'), image: '/img/knowledge-hero.svg' }
  }
  const c = CAT[props.kind]
  const catH1 = t(`knowledge.cats.${props.kind}.h1`)
  const catLead = t(`knowledge.cats.${props.kind}.lead`)
  const missH1 = catH1.startsWith('knowledge.cats.')
  const missLead = catLead.startsWith('knowledge.cats.')
  return {
    title: missH1 ? (c?.h1 || t('knowledge.center')) : catH1,
    lead: missLead ? (c?.lead || '') : catLead,
    image: c?.image || '/img/knowledge-hero.svg'
  }
})

// 面包屑分类名四语化（复用 i18n knowledge.cat* 短标签）
const catLabel = computed(() => t(`knowledge.cat${props.kind.charAt(0).toUpperCase()}${props.kind.slice(1)}`))

// 结构化数据：Organization（原站全站注入）+ BreadcrumbList。
// 此前知识库 Hub / 分类页 JSON-LD 为 0，属 SEO 洼地。
const escLd = (s: string) => s.replace(/</g, '\\u003c')
const breadcrumbLd = computed(() => {
  const items: any[] = [
    { '@type': 'ListItem', position: 1, name: t('nav.home'), item: url.origin + localePath('/') }
  ]
  if (props.kind === 'popular') {
    items.push({ '@type': 'ListItem', position: 2, name: t('knowledge.hubLabel') })
  } else {
    items.push({
      '@type': 'ListItem',
      position: 2,
      name: t('knowledge.hubLabel'),
      item: url.origin + localePath('/knowledge')
    })
    items.push({ '@type': 'ListItem', position: 3, name: catLabel.value })
  }
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items }
})
useHead(() => ({
  script: [
    ...orgScripts.value,
    { key: 'ld-kb-breadcrumb', type: 'application/ld+json', innerHTML: escLd(JSON.stringify(breadcrumbLd.value)) }
  ]
}))
</script>

<template>
  <!-- hero（原站：白底 container，插画 lg 时占右列） -->
  <div class="bg-white">
    <div class="container pt-10">
      <!-- 面包屑 -->
      <div class="overflow-auto max-lg:pb-3 max-lg:-mx-4">
        <div class="flex items-center gap-x-2 text-[12px] font-sans text-[#6B7280]">
          <div class="hidden h-[1px] w-2 shrink-0 max-lg:block" />
          <NuxtLink :to="localePath('/')" class="shrink-0 whitespace-nowrap underline duration-200 hover:text-red-600">
            {{ $t('nav.home') }}
          </NuxtLink>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-3.5 shrink-0" aria-hidden="true">
            <path d="m9 18 6-6-6-6" />
          </svg>
          <NuxtLink v-if="kind !== 'popular'" :to="localePath('/knowledge')" class="shrink-0 whitespace-nowrap underline duration-200 hover:text-red-600">
            {{ $t('knowledge.hubLabel') }}
          </NuxtLink>
          <span v-else class="shrink-0 whitespace-nowrap">{{ $t('knowledge.hubLabel') }}</span>
          <template v-if="kind !== 'popular'">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-3.5 shrink-0" aria-hidden="true">
              <path d="m9 18 6-6-6-6" />
            </svg>
            <span class="shrink-0 whitespace-nowrap">{{ catLabel }}</span>
          </template>
          <div class="hidden h-[1px] w-2 shrink-0 max-lg:block" />
        </div>
      </div>

      <div class="lg:grid lg:grid-cols-[1fr_280px] lg:items-center lg:gap-x-10">
        <div>
          <h1 class="col-start-1 mt-10 text-[40px] font-bold leading-[1.2] max-lg:mt-5 max-lg:text-[36px]">
            {{ hero.title }}
          </h1>
          <p v-if="hero.lead" class="col-start-1 mt-5 leading-[1.5] text-[#2D2D2D]" v-html="hero.lead" />
        </div>
        <!-- 插画：Hub 为本地 SVG（原站内联 280×275 插画），分类页为原站分类图 -->
        <img
          v-if="hero.image"
          :src="hero.image"
          alt=""
          class="mx-auto mt-10 w-[280px] self-center lg:col-start-2 lg:row-start-1 lg:row-span-3 max-lg:mt-10"
          loading="lazy"
        >
      </div>
    </div>
  </div>

  <!-- tab 条 + 卡片网格（原站整体在浅灰区内） -->
  <div class="bg-[#F3F3F3]">
    <div class="container pb-[110px] pt-10">
      <div class="overflow-auto max-lg:pb-3 max-lg:-mx-4">
        <div class="flex items-center gap-x-7 max-lg:gap-x-3 max-lg:[&>*]:shrink-0">
          <template v-for="tab in tabs" :key="tab.key">
            <NuxtLink
              v-if="tab.key !== kind"
              :to="localePath(tab.to)"
              class="rounded-[2px] px-3 py-1 font-serif underline duration-200 max-lg:text-[14px] text-[#1A1A1A] hover:text-red-600"
            >
              {{ tab.label }}
            </NuxtLink>
            <span
              v-else
              class="rounded-[2px] px-3 py-1 font-serif underline duration-200 max-lg:text-[14px] font-medium text-white bg-[#2A568A]"
              aria-current="page"
            >
              {{ tab.label }}
            </span>
          </template>
        </div>
      </div>

      <div v-if="list.length" class="mt-8 grid grid-cols-3 gap-5 max-lg:grid-cols-1">
        <KnowledgeCard
          v-for="p in list"
          :key="p.slug"
          :post="p"
          :category-label="t(`knowledge.cat${p.categorySlug.charAt(0).toUpperCase()}${p.categorySlug.slice(1)}`)"
        />
      </div>
      <p v-else class="mt-10 text-muted">{{ $t('knowledge.empty') }}</p>
    </div>
  </div>
</template>
