<script setup lang="ts">
import { computed } from 'vue'
import type { PhotoDoc } from '~/composables/useData'
import { useData } from '~/composables/useData'
const props = defineProps<{ doc: PhotoDoc; flag?: string; detailed?: boolean }>()
const { countryName } = useData()
const localePath = useLocalePath()

// 部分文档（如 China APEC、UK Passport online）没有官方尺寸，避免出现 "″ ·  mm" 这类空值
const sizeLabel = computed(() => {
  const inch = props.doc.size?.inch?.trim()
  const mm = props.doc.size?.mm?.trim()
  if (!inch && !mm) return '—'
  return [inch ? `${inch}″` : '', mm ? `${mm} mm` : ''].filter(Boolean).join(' · ')
})
</script>

<template>
  <!-- 详细模式：垂直卡片，展示尺寸/颜色/头高/眼镜政策/官方要求链接（对标原站 Popular 卡片）
       注意：整卡不再用 <a> 包裹。HTML 不允许 <a> 嵌套 <a>，SSR 时浏览器会自动闭合外层
       链接，导致后续卡片的 DOM 错位、文字串位重叠。这里用 stretched-link 保持整卡可点。 -->
  <div
    v-if="detailed"
    class="card-pg group relative flex flex-col p-4 transition hover:-translate-y-0.5 hover:shadow-card"
  >
    <NuxtLink
      :to="localePath(`/documents/${doc.slug}`)"
      class="flex items-center gap-3 after:absolute after:inset-0 after:content-['']"
    >
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
    </NuxtLink>

    <dl class="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
      <div class="min-w-0">
        <dt class="text-muted">{{ $t('doc.reqPhotoSize') }}</dt>
        <dd class="break-words font-medium leading-snug text-ink">{{ sizeLabel }}</dd>
      </div>
      <div class="min-w-0">
        <dt class="text-muted">{{ $t('doc.reqBackground') }}</dt>
        <dd class="flex min-w-0 items-center gap-1.5 break-words font-medium leading-snug text-ink">
          <span class="inline-block h-3 w-3 shrink-0 rounded-sm border border-slate-300" :style="{ background: doc.background }" />
          <span class="min-w-0 break-words">{{ doc.color || doc.background }}</span>
        </dd>
      </div>
      <div class="min-w-0">
        <dt class="text-muted">{{ $t('doc.reqHeadHeight') }}</dt>
        <!-- 部分文档未提供官方头高要求，避免渲染空值 -->
        <dd class="break-words font-medium leading-snug text-ink">{{ doc.headHeight || '—' }}</dd>
      </div>
      <div class="min-w-0">
        <dt class="text-muted">{{ $t('doc.reqGlasses') }}</dt>
        <dd class="break-words font-medium leading-snug text-ink">{{ doc.glasses ? $t('doc.glassesAllowed') : $t('doc.glassesNotAllowed') }}</dd>
      </div>
    </dl>

    <a
      v-if="doc.source && /^https?:\/\//i.test(doc.source)"
      :href="doc.source"
      target="_blank"
      rel="noopener noreferrer"
      class="relative z-10 mt-3 inline-flex items-center gap-1 self-start text-xs font-semibold text-brand-blue hover:underline"
    >
      {{ $t('doc.cardOfficial') }}
      <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 5h5v5M19 5l-9 9M12 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6"/></svg>
    </a>
  </div>

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
