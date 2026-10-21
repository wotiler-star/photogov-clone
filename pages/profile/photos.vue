<script setup lang="ts">
// /profile/photos —— 已保存照片：格式选择（PNG/PDF）+ 下载 + 删除
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuth } from '~/composables/useAuth'
import { useApi } from '~/composables/useApi'
import { downloadImageAsPng, downloadImageAsPdf } from '~/utils/pdf'

const { t, locale } = useI18n()
const { user } = useAuth()
const { myPhotos, deletePhoto } = useApi()

const photos = ref<any[]>([])
const loading = ref(true)
const formatMap = ref<Record<string, 'png' | 'pdf'>>({})
const downloadingId = ref<string | null>(null)
const deletingId = ref<string | null>(null)

async function load() {
  loading.value = true
  try {
    const r = await myPhotos()
    photos.value = r.photos || []
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
    if (fmt === 'pdf') await downloadImageAsPdf(p.url, base)
    else await downloadImageAsPng(p.url, base)
  } catch (e) {
    console.error(e)
  } finally {
    downloadingId.value = null
  }
}

async function onDelete(p: any) {
  if (!window.confirm(`${t('profile.photos.delete')}?`)) return
  deletingId.value = p.id
  try {
    await deletePhoto(p.id)
    photos.value = photos.value.filter((x) => x.id !== p.id)
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
    <h2 class="font-serif text-xl font-bold text-ink">{{ t('profile.photos.title') }}</h2>
    <p class="mt-1 text-sm text-muted">{{ t('profile.photos.subtitle') }}</p>

    <div v-if="loading" class="mt-6 text-sm text-muted">{{ t('profile.photos.loading') }}</div>

    <div
      v-else-if="!photos.length"
      class="mt-6 rounded-xl border border-dashed border-slate-300 p-10 text-center"
    >
      <p class="text-sm text-muted">{{ t('profile.photos.empty') }}</p>
    </div>

    <div v-else class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <div v-for="p in photos" :key="p.id" class="overflow-hidden rounded-xl border border-slate-200">
        <img
          :src="p.url"
          :alt="p.docName || 'photo'"
          class="aspect-square w-full bg-slate-50 object-cover"
          loading="lazy"
        />
        <div class="p-3">
          <p class="truncate text-sm font-medium text-ink">{{ p.docName || t('profile.photos.docName') }}</p>
          <p class="mt-0.5 text-xs text-muted">{{ t('profile.photos.savedOn') }} {{ fmtDate(p.createdAt) }}</p>

          <div class="mt-3 flex items-center gap-2">
            <label class="sr-only" :for="`fmt-${p.id}`">{{ t('profile.photos.format') }}</label>
            <select :id="`fmt-${p.id}`" v-model="formatMap[p.id]" class="input-pg flex-1 py-1.5">
              <option value="png">{{ t('profile.photos.png') }}</option>
              <option value="pdf">{{ t('profile.photos.pdf') }}</option>
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
  </section>
</template>
