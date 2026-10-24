<script setup lang="ts">
/**
 * /author/<slug> —— 作者页（对齐原站 photogov.net/author/<slug>/）。
 *
 * SEEN（原站 f9-author 取证）：
 *   - 面包屑 Home › Editorial Team › {作者名}
 *   - 主区 grid grid-cols-[1fr_auto] gap-x-[130px]：左 H1(40px)/role/bio，右侧 280px 方头像
 *   - 下半区 bg-[#F3F3F3]：H2「Materials by {作者名}」，按类型分组（H3）+ 三列下划线链接列表
 * 数据来自 data/author.json（经 /api/app/v1/blog/get-author 暴露）。
 * 文章链接按 F7 IA 直达 /knowledge/<category>/<slug>，避免走 /blog/<slug> 的 301。
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useApi } from '~/composables/useApi'
import { useLocalePath, useRequestURL } from '#imports'

const route = useRoute()
const { t, locale } = useI18n()
const slug = computed(() => String(route.params.slug || ''))
const { getAuthor } = useApi()
const localePath = useLocalePath()
const url = useRequestURL()

const { data } = await useAsyncData(
  () => `author-${slug.value}`,
  () => getAuthor(slug.value).catch(() => null),
  { default: () => null as any }
)

const author = computed(() => data.value?.author || null)
const posts = computed<any[]>(() => (data.value?.posts || []) as any[])
const schemaOrg = computed(() => data.value?.schemaOrg || null)

// 职务：author.meta.title 形如「{姓名} - {职务}」，取「-」之后的部分作为 role 行
const role = computed(() => {
  const a = author.value as any
  const mt = String(a?.meta?.title || '')
  const parts = mt.split(' - ')
  return parts.length > 1 ? parts.slice(1).join(' - ') : ''
})

// 文章按分类分组（guides / requirements 优先，其余置后）
const groups = computed(() => {
  const map = new Map<string, { slug: string; name: string; items: any[] }>()
  for (const p of posts.value) {
    const gs = String(p?.category?.slug || 'other')
    const gn = String(p?.category?.name || gs)
    if (!map.has(gs)) map.set(gs, { slug: gs, name: gn, items: [] })
    map.get(gs)!.items.push(p)
  }
  const order = ['guides', 'requirements']
  return [...map.values()].sort(
    (a, b) => (order.indexOf(a.slug) < 0 ? 99 : order.indexOf(a.slug)) - (order.indexOf(b.slug) < 0 ? 99 : order.indexOf(b.slug))
  )
})

const groupLabel = (g: { slug: string; name: string }) =>
  g.slug === 'guides' ? t('author.guides') : g.slug === 'requirements' ? t('author.requirements') : g.name

const authorPath = computed(() => `/author/${slug.value}`)

useHead(() => {
  if (!author.value) {
    return { title: t('blog.authorNotFound'), meta: [{ name: 'robots', content: 'noindex' }] }
  }
  const a = author.value as any
  const canonical = `${url.origin}${localePath(authorPath.value)}`
  const title = `${a.name} | PhotoGov`
  const desc = a.bio || ''
  return {
    title,
    meta: [
      { name: 'description', content: desc },
      { property: 'og:title', content: title },
      { property: 'og:description', content: desc },
      { property: 'og:type', content: 'profile' },
      { name: 'robots', content: 'index,follow' }
    ].filter((m) => m.content !== ''),
    link: [{ rel: 'canonical', href: canonical }],
    script: schemaOrg.value ? [{ type: 'application/ld+json', innerHTML: JSON.stringify(schemaOrg.value) }] : []
  }
})
</script>

<template>
  <div>
    <div class="py-10 pb-12">
      <div class="container lg:grid lg:grid-cols-[1fr_auto] lg:gap-x-[130px]">
        <template v-if="author">
          <!-- 左栏：面包屑 + 姓名 + 职务 + 简介 -->
          <div class="lg:col-start-1">
            <nav aria-label="Breadcrumb" class="text-[12px] text-gray-600">
              <NuxtLink :to="localePath('/')" class="text-blue-600 underline hover:text-red-600">{{ $t('nav.home') }}</NuxtLink>
              <span aria-hidden="true"> › </span>
              <NuxtLink :to="localePath('/editorial-team')" class="text-blue-600 underline hover:text-red-600">{{ $t('author.editorialTeam') }}</NuxtLink>
              <span aria-hidden="true"> › </span>
              <span aria-current="page">{{ author.name }}</span>
            </nav>
            <h1 class="mt-5 text-[40px] font-bold font-serif leading-[1.2] max-lg:text-[36px]">{{ author.name }}</h1>
            <p v-if="role" class="mt-2 text-[18px] font-serif leading-[1.4] text-[#797979]">{{ role }}</p>
            <p v-if="author.bio" class="mt-2.5 font-serif leading-[1.5] text-[#2D2D2D]">{{ author.bio }}</p>
          </div>

          <!-- 右栏：正方形头像 -->
          <div class="mt-8 lg:col-start-2 lg:mt-0 lg:self-center">
            <img
              v-if="author.avatar_url"
              :src="author.avatar_url"
              :alt="author.name"
              width="280"
              height="280"
              class="aspect-square w-[280px] rounded-lg object-cover max-lg:mx-auto"
              loading="lazy"
            />
            <div
              v-else
              class="flex aspect-square w-[280px] items-center justify-center rounded-lg bg-[#ccb38d]/30 text-5xl font-bold text-[#17304B] max-lg:mx-auto"
            >
              {{ (author.name || '?').slice(0, 1) }}
            </div>
          </div>
        </template>

        <!-- 未找到作者 -->
        <div v-else class="lg:col-span-2 py-16 text-center">
          <h1 class="text-2xl font-bold">{{ $t('blog.authorNotFound') }}</h1>
          <p class="mt-3 text-muted">We couldn't find the author you were looking for.</p>
          <NuxtLink :to="localePath('/editorial-team')" class="mt-6 inline-block text-sm text-blue-600 underline hover:text-red-600">
            {{ $t('author.editorialTeam') }}
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- 下半区：Materials by {name}（灰底，按类型分组的三列链接列表） -->
    <div v-if="author" class="bg-[#F3F3F3]">
      <section class="container pt-10 pb-[110px]" aria-labelledby="materials-heading">
        <h2 id="materials-heading" class="text-[32px] font-semibold font-serif leading-[1.3]">
          {{ $t('author.materialsBy', { name: author.name }) }}
        </h2>
        <section v-for="g in groups" :key="g.slug" class="mb-10">
          <h3 class="mt-6 text-2xl font-semibold font-serif">{{ groupLabel(g) }}</h3>
          <ul class="mt-6 grid grid-cols-3 gap-x-5 gap-y-2.5 max-lg:grid-cols-1">
            <li v-for="p in g.items" :key="p.id">
              <NuxtLink
                :to="localePath(`/knowledge/${g.slug}/${p.slug}`)"
                class="font-serif text-blue-600 underline duration-200 hover:text-red-600"
                >{{ p.title }}</NuxtLink
              >
            </li>
          </ul>
        </section>
        <p v-if="!groups.length" class="mt-6 text-muted">No articles published yet.</p>
      </section>
    </div>
  </div>
</template>
