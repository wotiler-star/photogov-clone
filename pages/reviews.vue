<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useApi } from '~/composables/useApi'
import { useLocalePath } from '#imports'

const { t, tm } = useI18n()
const { getReviews } = useApi()
const localePath = useLocalePath()

useHead({ title: t('reviewsPage.title') })

// 真实评价来自 photogov.net Database.Reviews 快照（Trustpilot，1372 条，均分 4.66）
const { data } = await useAsyncData('reviews-real', () => getReviews({ limit: 50 }).catch(() => null), {
  default: () => null as any
})

const stats = computed(() => data.value?.stats || null)
const reviews = computed(() => {
  const list = (data.value?.reviews || []) as any[]
  // 真实数据按时间倒序；展示时按星级降序，让高分评价靠前（数据本身 100% 真实）
  return [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0))
})
const total = computed(() => stats.value?.total_reviews ?? reviews.value.length)
const avg = computed(() => (stats.value?.average_rating ?? 0).toFixed(2))
const dist = computed(() => stats.value?.rating_distribution || {})

const verifyList = computed(() => tm('reviewsPage.verifyList') as string[])
const statCards = computed(
  () =>
    (tm('reviewsPage.stats') as Array<{ value: string; label: string }>) || [
      { value: String(total.value), label: 'Total reviews' },
      { value: `${avg.value} / 5`, label: 'Average rating' },
      { value: `${dist.value[5] || 0}`, label: '5-star reviews' },
      { value: 'Trustpilot', label: 'Source' }
    ]
)

const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n)
const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : ''
</script>

<template>
  <div class="container-pg py-14">
    <div class="mx-auto max-w-3xl">
      <span class="eyebrow">{{ $t('reviewsPage.eyebrow') }}</span>
      <h1 class="mt-2 text-3xl font-bold sm:text-4xl">{{ $t('reviewsPage.title') }}</h1>
      <p class="mt-4 text-muted">{{ $t('reviewsPage.sub') }}</p>

      <div class="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div v-for="(s, i) in statCards" :key="i" class="card-pg p-4 text-center">
          <div class="text-2xl font-bold text-brand">{{ s.value }}</div>
          <div class="mt-1 text-xs text-muted">{{ s.label }}</div>
        </div>
      </div>

      <h2 class="mt-12 text-2xl font-bold">{{ $t('reviewsPage.statsTitle') }}</h2>
      <p class="mt-3 text-muted">{{ $t('reviewsPage.statsP1') }}</p>
      <p class="mt-3 text-muted">{{ $t('reviewsPage.statsP2') }}</p>

      <blockquote class="card-pg mt-6 border-l-4 border-[#ccb38d] p-6">
        <p class="italic text-muted">“{{ $t('reviewsPage.quote') }}”</p>
        <footer class="mt-3 text-sm font-semibold">— {{ $t('reviewsPage.quoteAuthor') }}</footer>
      </blockquote>

      <!-- 真实评分分布 -->
      <div v-if="stats" class="card-pg mt-8 space-y-2 p-6">
        <div class="flex items-center justify-between">
          <span class="text-lg font-semibold">{{ avg }} / 5</span>
          <span class="text-sm text-muted">based on {{ total }} reviews</span>
        </div>
        <div v-for="n in [5, 4, 3, 2, 1]" :key="n" class="flex items-center gap-3 text-sm">
          <span class="w-10 text-muted">{{ n }}★</span>
          <div class="h-2 flex-1 overflow-hidden rounded bg-black/5">
            <div
              class="h-full rounded bg-[#ccb38d]"
              :style="{ width: (total ? ((dist[n] || 0) / total) * 100 : 0) + '%' }"
            />
          </div>
          <span class="w-12 text-right text-muted">{{ dist[n] || 0 }}</span>
        </div>
      </div>

      <h2 class="mt-12 text-2xl font-bold">{{ $t('reviewsPage.sectionTitle') }}</h2>
      <div class="mt-6 space-y-4">
        <article v-for="(u, i) in reviews" :key="i" class="card-pg p-5">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h3 class="font-semibold">{{ u.name }}</h3>
              <div class="mt-0.5 text-xs text-[#cc8a3a]">{{ stars(u.rating) }}</div>
            </div>
            <span class="text-xs text-muted">{{ u.location }} · {{ fmtDate(u.created_at) }}</span>
          </div>
          <p class="mt-2 text-sm text-muted">{{ u.text }}</p>
        </article>
      </div>

      <h2 class="mt-12 text-2xl font-bold">{{ $t('reviewsPage.verifyTitle') }}</h2>
      <p class="mt-3 text-muted">{{ $t('reviewsPage.verifyP1') }}</p>
      <p class="mt-3 text-muted">{{ $t('reviewsPage.verifyP2') }}</p>
      <ul class="mt-4 space-y-2 pl-5">
        <li v-for="(v, i) in verifyList" :key="i" class="list-disc text-sm text-muted">{{ v }}</li>
      </ul>

      <h2 class="mt-12 text-2xl font-bold">{{ $t('reviewsPage.shapeTitle') }}</h2>
      <p class="mt-3 text-muted">{{ $t('reviewsPage.shapeP') }}</p>

      <div class="card-pg mt-8 p-6">
        <h2 class="text-lg font-semibold">{{ $t('reviewsPage.voiceTitle') }}</h2>
        <p class="mt-2 text-sm text-muted">{{ $t('reviewsPage.voiceP1') }}</p>
        <p class="mt-2 text-sm text-muted">{{ $t('reviewsPage.voiceP2') }}</p>
      </div>
    </div>
  </div>
</template>
