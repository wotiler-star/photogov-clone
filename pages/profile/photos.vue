<script setup lang="ts">
// /profile/photos —— 已保存照片：单张下载（PNG/PDF）+ 多选批量 PDF 排版导出
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocalePath } from '#imports'
import { useAuth } from '~/composables/useAuth'
import { useApi } from '~/composables/useApi'
import { useBreadcrumbLd } from '~/composables/useBreadcrumbLd'
import { downloadImageAsPng, downloadImagesAsPdf, type PdfPageSize, type PdfPerSheet } from '~/utils/pdf'

const { t, locale } = useI18n()
const localePath = useLocalePath()
const { user } = useAuth()
const { myPhotos, deletePhoto } = useApi()

// BreadcrumbList 结构化数据：首页 → 个人中心 → 已保存照片
const { scripts: breadcrumbScripts } = useBreadcrumbLd(
  computed(() => [
    { name: t('nav.home'), to: localePath('/') },
    { name: t('profile.title'), to: localePath('/profile') },
    { name: t('profile.nav.photos'), to: localePath('/profile/photos') }
  ])
)
useHead({ title: t('profile.photos.title'), script: breadcrumbScripts })

const photos = ref<any[]>([])
const loading = ref(true)
const formatMap = ref<Record<string, 'png' | 'pdf'>>({})
const downloadingId = ref<string | null>(null)
const deletingId = ref<string | null>(null)

// 多选 + 批量排版
const selected = ref<Set<string>>(new Set())
const perSheet = ref<PdfPerSheet>(4)
const pageSize = ref<PdfPageSize>('a4')
const batchDownloading = ref(false)

const selectedPhotos = computed(() => photos.value.filter((p) => selected.value.has(p.id)))
const allSelected = computed(
  () => photos.value.length > 0 && selected.value.size === photos.value.length
)

function toggleSelect(id: string) {
  const next = new Set(selected.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selected.value = next
}

function toggleAll() {
  if (allSelected.value) selected.value = new Set()
  else selected.value = new Set(photos.value.map((p) => p.id))
}

async function load() {
  loading.value = true
  try {
    const r = await myPhotos()
    photos.value = r.photos || []
    selected.value = new Set()
  } finally {
    loading.value = false
  }
}
onMounted(load)

async function onDownload(p: any) {
  const fmt = formatMap.value[p.id] || 'png'
  downloadingId.value = p.id
  try {
    const base = (p.docName || 'photo').replace(/[^\w-]+/g, '_')
    if (fmt === 'pdf') await downloadImagesAsPdf([p.url], base, { layout: 'single' })
    else await downloadImageAsPng(p.url, base)
  } catch (e) {
    console.error(e)
  } finally {
    downloadingId.value = null
  }
}

// 批量：按每页张数把选中照片排版为一个 PDF
async function onBatchDownload() {
  const list = selectedPhotos.value
  if (!list.length) return
  batchDownloading.value = true
  try {
    const base = (list[0].docName || 'photos').replace(/[^\w-]+/g, '_')
    const name = list.length > 1 ? `${base}_x${list.length}` : base
    await downloadImagesAsPdf(
      list.map((p) => p.url),
      name,
      { layout: 'sheet', perSheet: perSheet.value, page: pageSize.value }
    )
  } catch (e) {
    console.error(e)
  } finally {
    batchDownloading.value = false
  }
}

async function onDelete(p: any) {
  if (!window.confirm(`${t('profile.photos.delete')}?`)) return
  deletingId.value = p.id
  try {
    await deletePhoto(p.id)
    photos.value = photos.value.filter((x) => x.id !== p.id)
    selected.value.delete(p.id)
  } catch (e) {
    console.error(e)
  } finally {
    deletingId.value = null
  }
}

const fmtDate = (iso: string) => {
  try {
    return new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium' }).format(new Date(iso))
  } catch {
    return iso
  }
}
</script>

<template>
  <section class="card-pg p-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="font-serif text-xl font-bold text-ink">{{ t('profile.photos.title') }}</h2>
        <p class="mt-1 text-sm text-muted">{{ t('profile.photos.subtitle') }}</p>
      </div>
      <label v-if="photos.length" class="flex cursor-pointer items-center gap-2 text-sm text-muted">
        <input type="checkbox" :checked="allSelected" class="h-4 w-4 rounded border-slate-300" @change="toggleAll" />
        {{ allSelected ? t('profile.photos.deselectAll') : t('profile.photos.selectAll') }}
      </label>
    </div>

    <div v-if="loading" class="mt-6 text-sm text-muted">{{ t('profile.photos.loading') }}</div>

    <div
      v-else-if="!photos.length"
      class="mt-6 rounded-xl border border-dashed border-slate-300 p-10 text-center"
    >
      <p class="text-sm text-muted">{{ t('profile.photos.empty') }}</p>
    </div>

    <template v-else>
      <!-- 批量导出工具栏 -->
      <div
        v-if="selected.size"
        class="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 p-3"
      >
        <span class="text-sm font-medium text-ink">
          {{ t('profile.photos.selected', { count: selected.size }) }}
        </span>

        <label class="sr-only" for="persheet">{{ t('profile.photos.perSheet') }}</label>
        <select id="persheet" v-model="perSheet" class="input-pg w-auto py-1.5 text-sm">
          <option v-for="n in ([1, 2, 4, 6, 8, 9, 12] as const)" :key="n" :value="n">
            {{ t('profile.photos.perPage', { count: n }) }}
          </option>
        </select>

        <label class="sr-only" for="pagesize">{{ t('profile.photos.pageSize') }}</label>
        <select id="pagesize" v-model="pageSize" class="input-pg w-auto py-1.5 text-sm">
          <option value="a4">A4</option>
          <option value="letter">Letter</option>
          <option value="4x6">{{ t('profile.photos.size4x6') }}</option>
        </select>

        <button
          class="btn-primary px-4 py-1.5 text-sm"
          type="button"
          :disabled="batchDownloading"
          @click="onBatchDownload"
        >
          {{ batchDownloading ? t('profile.photos.building') : t('profile.photos.downloadPdf') }}
        </button>

        <button
          class="text-sm text-muted underline decoration-slate-300 underline-offset-4 transition hover:text-ink"
          type="button"
          @click="selected = new Set()"
        >
          {{ t('profile.photos.clearSelection') }}
        </button>
      </div>

      <!-- 照片网格 -->
      <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div
          v-for="p in photos"
          :key="p.id"
          class="overflow-hidden rounded-xl border transition"
          :class="selected.has(p.id) ? 'border-accent ring-1 ring-accent/40' : 'border-slate-200'"
        >
          <div class="relative">
            <img
              :src="p.url"
              :alt="p.docName || 'photo'"
              class="aspect-square w-full bg-slate-50 object-cover"
              loading="lazy"
            />
            <label
              class="absolute left-2 top-2 grid h-7 w-7 cursor-pointer place-items-center rounded-md border bg-white/90 shadow-sm"
              :class="selected.has(p.id) ? 'border-accent' : 'border-slate-300'"
            >
              <span class="sr-only">{{ t('profile.photos.select') }}</span>
              <input
                type="checkbox"
                class="h-4 w-4 rounded border-slate-300"
                :checked="selected.has(p.id)"
                @change="toggleSelect(p.id)"
              />
            </label>
          </div>
          <div class="p-3">
            <p class="truncate text-sm font-medium text-ink">{{ p.docName || t('profile.photos.docName') }}</p>
            <p class="mt-0.5 text-xs text-muted">{{ t('profile.photos.savedOn') }} {{ fmtDate(p.createdAt) }}</p>

            <div class="mt-3 flex items-center gap-2">
              <label class="sr-only" :for="`fmt-${p.id}`">{{ t('profile.photos.format') }}</label>
              <select :id="`fmt-${p.id}`" v-model="formatMap[p.id]" class="input-pg flex-1 py-1.5">
                <option value="png">{{ t('profile.photos.png') }}</option>
                <option value="pdf">{{ t('profile.photos.pdfSingle') }}</option>
              </select>
              <button
                class="btn-primary px-3 py-1.5 text-xs"
                type="button"
                :disabled="downloadingId === p.id"
                @click="onDownload(p)"
              >
                {{ t('profile.photos.download') }}
              </button>
              <button
                class="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                type="button"
                :disabled="deletingId === p.id"
                @click="onDelete(p)"
              >
                {{ deletingId === p.id ? t('profile.photos.deleting') : t('profile.photos.delete') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </section>
</template>
