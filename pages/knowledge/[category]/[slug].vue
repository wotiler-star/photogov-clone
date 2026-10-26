<script setup lang="ts">
/**
 * 知识库文章页（对标原站 /knowledge/<cat>/<slug>/，SSR 实证）。
 *
 * SEEN 结构：
 *   面包屑 Home page / Knowledge / <分类> / <标题>
 *   H1 + 「Published: {日期}」 + 「Last update: {日期}」
 *   「TABLE OF CONTENTS:」（uppercase #313131）+ 锚点列表（= 正文全部 H2）
 *   正文 div.blog-post--content：p（含内联链接/图片）/ h2(slug id) / h3 / ul / table
 *   文末署名（Olia Potiagaeva + Editorial Team + Google 4.8）
 *
 * 富文本说明：段落/列表 item 为原站 HTML 字符串（已把 photogov.net 绝对链接改为
 * 相对路径），因此用 v-html 渲染以保留内联链接与插图；数据来源为本站抓取快照。
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import knowledge from '~/data/knowledge.json'
import posts from '~/data/blog.json'
import { slugifyHeading, stripTags } from '~/utils/docAnchor'

const route = useRoute()
const localePath = useLocalePath()
const { t, locale } = useI18n()

const key = computed(() => `${route.params.category}/${route.params.slug}`)
const entry = computed(() => (knowledge as Record<string, any>)[key.value] || null)
const meta = computed(() =>
  ((posts as any).posts as any[]).find((p) => `${p.categorySlug}/${p.slug}` === key.value) || null,
)

// sections[0] 可能是 h1 或首段；标题用 h1 字段，正文从 sections 开始
const sections = computed(() => (entry.value?.sections || []).filter((s: any) => s.level !== 'h1'))
const headline = computed(() => entry.value?.h1 || meta.value?.title || '')

const catLabel = computed(() => {
  const map: Record<string, string> = {
    requirements: t('knowledge.catRequirements'),
    guides: t('knowledge.catGuides'),
    faq: t('knowledge.catFaq'),
    standards: t('knowledge.catStandards'),
  }
  return map[String(route.params.category)] || t('knowledge.center')
})

// 日期：Published / Last update（原站两行都显示同一日期）
const dateText = computed(() => {
  const raw = meta.value?.date
  if (!raw) return ''
  try {
    return new Intl.DateTimeFormat(locale.value === 'zh' ? 'zh-CN' : locale.value || 'en', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(raw))
  } catch {
    return raw
  }
})

useHead(() => ({
  title: entry.value ? `${headline.value} — PhotoGov` : 'Article not found',
  meta: entry.value
    ? [{ name: 'description', content: stripTags(sections.value[0]?.items?.[0] || headline.value).slice(0, 155) }]
    : [{ name: 'robots', content: 'noindex' }],
}))

// 启发式判断是否表头：单元格短、且不以句号结尾（数据行通常含完整句子）
const isHeaderRow = (row: string[]) => {
  if (!row || row.length < 2) return false
  return row.every((c: string) => c.length < 60 && !/[.;]\s*$/.test(c.trim()))
}
const bodyRows = (rows: string[][]) => (isHeaderRow(rows?.[0]) ? rows.slice(1) : rows)

// 从 <img> HTML 中提取 src（模板属性内不能直接写含双引号的正则）
const imgSrc = (html: unknown) => String(html ?? '').match(/src="([^"]+)"/)?.[1] || ''

// 目录（对标原站「TABLE OF CONTENTS:」）：全部 H2，锚点 id = 标题 slug
const toc = computed(() =>
  sections.value
    .map((s: any, i: number) => ({ s, i }))
    .filter(({ s }: any) => s.level === 'h2' && s.title)
    .map(({ s, i }: any) => ({ id: anchorId(s, i), title: s.title })),
)

// 与正文 section 的 id 生成规则保持一致
const anchorId = (s: any, i: number) => slugifyHeading(s.title) || `kb-section-${i}`

// 阅读时长：优先接口/元数据里的 readTime，否则按词数估算
const readMinutes = computed(() => {
  const rt = /(\d+)/.exec(meta.value?.readTime || '')
  if (rt) return parseInt(rt[1], 10)
  let words = 0
  for (const s of sections.value) {
    if (s.title) words += s.title.split(/\s+/).length
    for (const it of s.items || []) words += stripTags(String(it)).split(/\s+/).length
  }
  return Math.max(1, Math.round(words / 200))
})

// 同分类推荐
const siblings = computed(() =>
  Object.values(knowledge as Record<string, any>)
    .filter((v: any) => v.cat === route.params.category && `${v.cat}/${v.slug}` !== key.value)
    .slice(0, 6),
)
</script>

<template>
  <div class="bg-white">
    <div class="container pt-10 pb-20">
      <div v-if="entry" class="mx-auto max-w-[700px]">
        <!-- 面包屑（原站：Home page / Knowledge / 分类 / 标题） -->
        <nav aria-label="Breadcrumb" class="overflow-auto max-lg:pb-3 max-lg:-mx-4">
          <div class="flex items-center gap-x-2 text-[12px] font-sans text-[#6B7280]">
            <NuxtLink :to="localePath('/')" class="shrink-0 whitespace-nowrap underline duration-200 hover:text-red-600">Home page</NuxtLink>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-3.5 shrink-0" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
            <NuxtLink :to="localePath('/knowledge')" class="shrink-0 whitespace-nowrap underline duration-200 hover:text-red-600">Knowledge</NuxtLink>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-3.5 shrink-0" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
            <NuxtLink :to="localePath(`/knowledge/${route.params.category}`)" class="shrink-0 whitespace-nowrap underline duration-200 hover:text-red-600">{{ catLabel }}</NuxtLink>
          </div>
        </nav>

        <h1 class="mt-10 text-[36px] font-bold leading-[1.2] max-lg:mt-5 max-lg:text-[30px]">{{ headline }}</h1>

        <!-- 日期行（对标原站 Published / Last update） -->
        <div v-if="dateText" class="mt-5 space-y-1 font-sans text-[14px] text-[#414141]">
          <p>{{ $t('knowledge.published') }}: {{ dateText }}</p>
          <p>{{ $t('knowledge.lastUpdate') }}: {{ dateText }}</p>
        </div>

        <!-- TABLE OF CONTENTS（对标原站：正文前、uppercase 标题 + 圆点列表） -->
        <nav v-if="toc.length" aria-label="Table of contents" class="mt-8">
          <p class="font-sans text-[14px] font-semibold uppercase text-[#313131]">{{ $t('knowledge.tocBlockTitle') }}</p>
          <ul class="mt-3 max-w-[490px] list-disc pl-5 leading-[1.5]">
            <li v-for="item in toc" :key="item.id">
              <a :href="`#${item.id}`" class="font-sans text-blue-600 underline duration-200 hover:text-red-600">{{ item.title }}</a>
            </li>
          </ul>
        </nav>

        <!-- 正文（对标原站 div.blog-post--content） -->
        <article class="mt-6">
          <section
            v-for="(s, i) in sections"
            :key="i"
            :id="s.level === 'h2' ? anchorId(s, i) : undefined"
            class="mt-8 scroll-mt-24"
          >
            <!-- 规格表（原站以表格呈现规格清单） -->
            <div v-if="s.level === 'table'" class="overflow-x-auto rounded-lg border border-slate-200">
              <table class="w-full border-collapse text-sm">
                <thead v-if="isHeaderRow(s.rows[0])" class="bg-slate-50">
                  <tr>
                    <th v-for="(c, ci) in s.rows[0]" :key="ci" class="border-b border-slate-200 px-3 py-2.5 text-left font-semibold">{{ c }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, ri) in bodyRows(s.rows)" :key="ri" class="even:bg-slate-50/40">
                    <td
                      v-for="(c, ci) in row"
                      :key="ci"
                      class="border-b border-slate-100 px-3 py-2.5 align-top"
                      :class="{ 'font-medium': ci === 0 }"
                    >
                      {{ c }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <template v-else>
              <h2 v-if="s.level === 'h2'" class="text-[26px] font-semibold leading-[1.3]">{{ s.title }}</h2>
              <h3 v-else-if="s.level === 'h3'" class="mt-6 text-[20px] font-semibold">{{ s.title }}</h3>
              <p v-else-if="s.title" class="font-semibold">{{ s.title }}</p>

              <ul v-if="s.items.length > 1" class="mt-2 list-disc space-y-1.5 pl-5 text-muted">
                <li v-for="(it, k) in s.items" :key="k" v-html="it" />
              </ul>
              <template v-else-if="s.items.length === 1">
                <!-- 纯图小节直接渲染图片，否则渲染富文本段落 -->
                <img
                  v-if="String(s.items[0]).trim().startsWith('<img')"
                  :src="imgSrc(s.items[0])"
                  alt=""
                  class="mt-3 w-full rounded-lg"
                  loading="lazy"
                >
                <p v-else class="mt-2 leading-relaxed" v-html="s.items[0]" />
              </template>
            </template>
          </section>
        </article>

        <!-- 文末署名（复用文档页 byline：作者体系与原站一致） -->
        <DocByline class="mt-12" no-container />

        <!-- 推荐阅读 -->
        <div v-if="siblings.length" class="mt-12 border-t border-slate-200 pt-8">
          <h2 class="text-lg font-semibold">{{ $t('knowledge.moreIn', { category: catLabel }) }}</h2>
          <ul class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <li v-for="s in siblings" :key="s.slug">
              <NuxtLink
                :to="localePath(`/knowledge/${s.cat}/${s.slug}`)"
                class="block rounded-lg border border-slate-200 bg-white p-3 text-sm transition hover:border-brand-blue hover:text-brand-blue"
              >
                {{ s.h1 }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <div class="mt-10">
          <NuxtLink :to="localePath('/knowledge')" class="text-brand-blue underline">
            {{ $t('knowledge.back') }}
          </NuxtLink>
        </div>
      </div>

      <!-- 未找到 -->
      <div v-else class="mx-auto max-w-xl py-20 text-center">
        <h1 class="text-2xl font-bold">{{ $t('knowledge.notFoundTitle') }}</h1>
        <p class="mt-3 text-muted">{{ $t('knowledge.notFoundText') }}</p>
        <NuxtLink :to="localePath('/knowledge')" class="btn-primary mt-6">{{ $t('knowledge.browse') }}</NuxtLink>
      </div>
    </div>
  </div>
</template>
