<script setup lang="ts">
import type { PhotoDoc } from '~/composables/useData'
import { useData } from '~/composables/useData'
defineProps<{ doc: PhotoDoc; flag?: string; detailed?: boolean }>()
const { countryName } = useData()
const localePath = useLocalePath()
</script>

<template>
  <!-- 详细模式：垂直卡片，展示尺寸/颜色/头高/眼镜政策/官方要求链接（对标原站 Popular 卡片） -->
  <NuxtLink
    v-if="detailed"
    :to="localePath(`/documents/${doc.slug}`)"
    class="card-pg group flex flex-col p-4 transition hover:-translate-y-0.5 hover:shadow-card"
  >
    <div class="flex items-center gap-3">
      <div class="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-brand-blue/10 text-base">
        <img v-if="flag && flag.startsWith('http')" :src="flag" :alt="doc.country" class="h-8 w-8 rounded object-cover" loading="lazy" />
        <span v-else>{{ flag || '📄' }}</span>
      </div>
      <p class="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{{ doc.name }}</p>
      <span
        v-if="doc.verified"
        class="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"
        title="Verified by official source"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" class="h-3 w-3"><path fill-rule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0l-3.5-3.5a1 1 0 011.4-1.4l2.8 2.8 6.8-6.8a1 1 0 011.4 0z" clip-rule="evenodd"/></svg>
      </span>
    </div>

    <dl class="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
      <div class="flex flex-col">
        <dt class="text-muted">{{ $t('doc.reqPhotoSize') }}</dt>
        <dd class="font-medium text-ink">{{ doc.size.inch }}″ · {{ doc.size.mm }} mm</dd>
      </div>
      <div class="flex flex-col">
        <dt class="text-muted">{{ $t('doc.reqBackground') }}</dt>
        <dd class="flex items-center gap-1.5 font-medium text-ink">
          <span class="inline-block h-3 w-3 rounded-sm border border-slate-300" :style="{ background: doc.background }" />
          {{ doc.color || doc.background }}
        </dd>
      </div>
      <div class="flex flex-col">
        <dt class="text-muted">{{ $t('doc.reqHeadHeight') }}</dt>
        <!-- 部分文档未提供官方头高要求，避免渲染空值 -->
        <dd class="font-medium text-ink">{{ doc.headHeight || '—' }}</dd>
      </div>
      <div class="flex flex-col">
        <dt class="text-muted">Glasses</dt>
        <dd class="font-medium text-ink">{{ doc.glasses ? $t('doc.glassesAllowed') : $t('doc.glassesNotAllowed') }}</dd>
      </div>
    </dl>

    <a
      v-if="doc.source && /^https?:\/\//i.test(doc.source)"
      :href="doc.source"
      target="_blank"
      rel="noopener"
      class="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-blue hover:underline"
      @click.stop
    >
      {{ $t('doc.cardOfficial') }}
      <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 5h5v5M19 5l-9 9M12 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6"/></svg>
    </a>
  </NuxtLink>

  <!-- 紧凑模式（默认）：用于文档索引 / 国级页列表 -->
  <NuxtLink
    v-else
    :to="localePath(`/documents/${doc.slug}`)"
    class="card-pg group flex items-center gap-3 p-3 transition hover:-translate-y-0.5 hover:shadow-card"
  >
    <div class="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-brand-blue/10 text-lg">
      <img v-if="flag && flag.startsWith('http')" :src="flag" :alt="doc.country" class="h-9 w-9 rounded object-cover" loading="lazy" />
      <span v-else>{{ flag || '📄' }}</span>
    </div>
    <div class="min-w-0">
      <p class="truncate text-sm font-semibold text-ink">{{ doc.name }}</p>
      <p class="truncate text-xs text-muted">
        {{ doc.size.inch }} in · {{ doc.size.mm }} mm · {{ countryName(doc.country) }}
      </p>
    </div>
    <span
      v-if="doc.verified"
      class="ml-auto inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"
      title="Verified by official source"
    >
      <svg viewBox="0 0 20 20" fill="currentColor" class="h-3 w-3"><path fill-rule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0l-3.5-3.5a1 1 0 011.4-1.4l2.8 2.8 6.8-6.8a1 1 0 011.4 0z" clip-rule="evenodd"/></svg>
    </span>
    <svg class="ml-auto h-4 w-4 shrink-0 text-brand-blue opacity-0 transition group-hover:opacity-100" viewBox="0 0 24 24" fill="none">
      <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </NuxtLink>
</template>
