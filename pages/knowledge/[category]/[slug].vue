<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import knowledge from '~/data/knowledge.json'

const route = useRoute()
const localePath = useLocalePath()

const key = computed(() => `${route.params.category}/${route.params.slug}`)
const entry = computed(() => (knowledge as Record<string, any>)[key.value] || null)

// sections[0] 通常是 h1，正文从其后开始
const sections = computed(() => (entry.value?.sections || []).filter((s: any) => s.level !== 'h1'))
const headline = computed(() => entry.value?.h1 || '')

const CAT_LABEL: Record<string, string> = {
  requirements: 'Requirements',
  guides: 'Guides',
  faq: 'FAQ',
  standards: 'Standards'
}
const catLabel = computed(() => CAT_LABEL[String(route.params.category)] || 'Knowledge')

useHead(() => ({
  title: entry.value ? `${headline.value} — PhotoGov` : 'Article not found',
  meta: entry.value
    ? [{ name: 'description', content: (sections.value[0]?.items?.[0] || headline.value).slice(0, 155) }]
    : [{ name: 'robots', content: 'noindex' }]
}))

// 启发式判断是否表头：单元格短、且不以句号结尾（数据行通常含完整句子）
const isHeaderRow = (row: string[]) => {
  if (!row || row.length < 2) return false
  return row.every((c: string) => c.length < 60 && !/[.;]\s*$/.test(c.trim()))
}
const bodyRows = (rows: string[][]) => (isHeaderRow(rows?.[0]) ? rows.slice(1) : rows)

// 同分类推荐
const siblings = computed(() =>
  Object.values(knowledge as Record<string, any>)
    .filter((v: any) => v.cat === route.params.category && `${v.cat}/${v.slug}` !== key.value)
    .slice(0, 6)
)
</script>

<template>
  <div class="container-pg py-12">
    <div v-if="entry" class="mx-auto max-w-3xl">
      <!-- 面包屑 -->
      <nav class="text-sm text-muted">
        <NuxtLink :to="localePath('/knowledge')" class="hover:text-brand-blue">Knowledge Center</NuxtLink>
        <span class="mx-1">/</span>
        <NuxtLink :to="localePath(`/knowledge/${route.params.category}`)" class="hover:text-brand-blue">
          {{ catLabel }}
        </NuxtLink>
      </nav>

      <h1 class="mt-4 text-3xl font-bold sm:text-4xl">{{ headline }}</h1>

      <!-- 正文章节 -->
      <article class="mt-8">
        <section v-for="(s, i) in sections" :key="i" class="mt-8">
          <!-- 目标站以表格呈现规格清单 → 还原为真实表格（此前被当作普通段落丢失行列结构） -->
          <div v-if="s.level === 'table'" class="overflow-x-auto rounded-lg border border-slate-200">
            <table class="w-full border-collapse text-sm">
              <thead v-if="isHeaderRow(s.rows[0])" class="bg-slate-50">
                <tr>
                  <th
                    v-for="(c, ci) in s.rows[0]"
                    :key="ci"
                    class="border-b border-slate-200 px-3 py-2.5 text-left font-semibold"
                  >
                    {{ c }}
                  </th>
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
            <h2 v-if="s.level === 'h2'" class="text-xl font-semibold">{{ s.title }}</h2>
            <h3 v-else-if="s.level === 'h3'" class="text-lg font-semibold">{{ s.title }}</h3>
            <p v-else class="font-semibold">{{ s.title }}</p>

            <ul v-if="s.items.length > 1" class="mt-2 list-disc space-y-1.5 pl-5 text-muted">
              <li v-for="(it, k) in s.items" :key="k">{{ it }}</li>
            </ul>
            <p v-else-if="s.items.length === 1" class="mt-2 leading-relaxed text-muted">{{ s.items[0] }}</p>
          </template>
        </section>
      </article>

      <!-- 推荐阅读 -->
      <div v-if="siblings.length" class="mt-12 border-t border-slate-200 pt-8">
        <h2 class="text-lg font-semibold">More in {{ catLabel }}</h2>
        <ul class="mt-3 grid gap-2 sm:grid-cols-2">
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
          ← Back to Knowledge Center
        </NuxtLink>
      </div>
    </div>

    <!-- 未找到 -->
    <div v-else class="mx-auto max-w-xl py-20 text-center">
      <h1 class="text-2xl font-bold">Article not found</h1>
      <p class="mt-3 text-muted">The knowledge article you are looking for does not exist.</p>
      <NuxtLink :to="localePath('/knowledge')" class="btn-primary mt-6">Browse Knowledge Center</NuxtLink>
    </div>
  </div>
</template>
