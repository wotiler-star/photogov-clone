<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useData, type PhotoDoc } from '~/composables/useData'
import { useCountry } from '~/composables/useCountry'

const { t } = useI18n()
const { countries, documentsForCountry, popularDocuments } = useData()
const { code: countryCode, setCode } = useCountry()

const activeCountry = computed(() => countryCode.value || 'US')

const docOptions = computed<PhotoDoc[]>(() => {
  const list = documentsForCountry(activeCountry.value)
  return list.length ? list : popularDocuments()
})

// 热门国家（与原站一致）
const popularCountries = computed(() => {
  const codes = ['IN', 'TR', 'US']
  const list = Array.isArray(countries) ? countries : []
  return codes.map((c) => list.find((x: any) => x.code === c)).filter(Boolean)
})

// 热门证件类型（与原站一致：Passport / Visa / Driving Licence）
const popularDocTypes = ['passport', 'visa', 'driving']

const selSlug = ref<string>('')
const selDoc = computed<PhotoDoc | null>(() => {
  return docOptions.value.find((d) => d.slug === selSlug.value) || docOptions.value[0] || null
})

watch([activeCountry, docOptions], () => {
  if (!selSlug.value || !docOptions.value.find((d) => d.slug === selSlug.value)) {
    selSlug.value = docOptions.value[0]?.slug || ''
  }
}, { immediate: true })

// 国家下拉开关
const countryOpen = ref(false)
const docOpen = ref(false)

// 医疗例外
const medicalRestriction = ref(false)

// Start 后状态
const started = ref(false)
const fileInputRef = ref<HTMLInputElement>()

function changeCountry(c: string) {
  setCode(c)
  countryOpen.value = false
  const list = documentsForCountry(c)
  if (list.length) selSlug.value = list[0].slug
}

function selectDoc(slug: string) {
  selSlug.value = slug
  docOpen.value = false
}

function startWizard() {
  started.value = true
  // 选择国家已写入全局 store（useCountry），下方 #tool 编辑器会读取
  const el = document.getElementById('tool')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  } else {
    // 非首页时跳转到工具页
    const path = (window as any).__localePath ? (window as any).__localePath('/tool') : '/tool'
    window.location.href = path
  }
}

// 上传后跳转到完整编辑器
function onFileSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) {
    // 触发全局事件或导航到带参数的工具页
    const evt = new CustomEvent('photogov-upload', {
      detail: { file, country: activeCountry.value, doc: selSlug.value?.slug }
    })
    window.dispatchEvent(evt)
  }
}

defineExpose({ started, activeCountry, selDoc, medicalRestriction })
</script>

<template>
  <!-- 原站风格向导表单：选国家 → 选证件 → 医疗例外 → Start -->
  <!-- 顶部标题区：H2「Select Country and Document Type:」+ 右侧「Step 1/4」标记（对标 photogov.net） -->
  <div class="mb-2 flex items-center justify-between gap-x-3 max-lg:flex-col max-lg:items-start max-lg:gap-y-1">
    <h2 class="text-[24px] font-semibold leading-[1.3] text-ink">{{ $t('tool.selectTitle') }}</h2>
    <span class="shrink-0 text-sm text-[#6B7280]">{{ $t('tool.stepLabel', { n: 1, total: 4 }) }}</span>
  </div>
  <form class="space-y-8" @submit.prevent>
    <!-- Step 1: Select country -->
    <div class="space-y-2">
      <label class="block text-sm font-medium text-ink">1. {{ t('tool.selectCountry') }}</label>
      <div class="relative">
        <button
          type="button"
          class="flex w-full items-center gap-x-2 rounded border border-[#D1D5DB] bg-white py-3 px-3.5 text-sm transition-colors hover:border-blue-600"
          @click="countryOpen = !countryOpen"
        >
          <img
            :src="`https://photogov-com.fra1.cdn.digitaloceanspaces.com/frontend/img/svg/flags/4x3/${activeCountry.toLowerCase()}.svg`"
            :alt="activeCountry"
            class="h-6 w-6 shrink-0 object-contain rounded"
            loading="lazy"
          />
          <span class="flex-1 truncate text-left">{{ (countries || []).find((c: any) => c.code === activeCountry)?.name || activeCountry }}</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 shrink-0 text-[#4B5563] transition-transform" :class="{ 'rotate-180': countryOpen }">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        <!-- 下拉面板 -->
        <div
          v-if="countryOpen"
          class="absolute z-20 mt-1 max-h-[300px] w-full overflow-y-auto rounded border border-neutral-100 bg-white shadow-md"
        >
          <button
            v-for="c in (countries || []).slice(0, 50)"
            :key="c.code"
            type="button"
            class="flex w-full items-center gap-x-2 px-2 py-2.5 text-left text-sm transition-colors hover:bg-slate-200"
            @click="changeCountry(c.code)"
          >
            <img
              v-if="c.flag && !c.flag.startsWith('http')"
              :src="`https://photogov-com.fra1.cdn.digitaloceanspaces.com/frontend/img/svg/flags/4x3/${c.code.toLowerCase()}.svg`"
              :alt="c.code"
              class="h-5 w-5 shrink-0 rounded object-contain"
              loading="lazy"
            />
            <span v-else class="h-5 w-5 shrink-0">{{ c.flag || '🌐' }}</span>
            <span class="flex-1 truncate">{{ c.name }}</span>
          </button>
        </div>
      </div>
      <div class="flex items-center gap-x-3 text-xs text-[#475569]">
        <span>{{ $t('tool.popularLabel') }}:</span>
        <button
          v-for="c in popularCountries"
          :key="c!.code"
          type="button"
          class="underline text-blue-600 transition-colors hover:text-red-600"
          @click="changeCountry(c!.code)"
        >{{ c!.name }}</button>
      </div>
    </div>

    <!-- Step 2: Select document type -->
    <div class="space-y-2">
      <label class="block text-sm font-medium text-ink">2. {{ t('tool.selectDocument') }}</label>
      <div class="relative">
        <button
          type="button"
          class="flex w-full items-center gap-x-2 rounded border border-[#D1D5DB] bg-white py-3 px-3.5 text-sm transition-colors hover:border-blue-600"
          @click="docOpen = !docOpen"
        >
          <!-- 证件图标 SVG -->
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="22" viewBox="0 0 18 22" fill="none" class="h-6 w-6 shrink-0 text-[#AAAAAA]">
            <path d="M1.96 0.44C1.23 0.44 0.64 1.03 0.64 1.76V20.24C0.64 20.97 1.23 21.56 1.96 21.56H16.04C16.77 21.56 17.36 20.97 17.36 20.24V1.76C17.36 1.03 16.77 0.44 16.04 0.44H1.96ZM9 3.96C11.67 3.96 13.84 6.13 13.84 8.8C13.84 11.47 11.67 13.64 9 13.64C6.33 13.64 4.16 11.47 4.16 8.8C4.16 6.13 6.33 3.96 9 3.96ZM3.72 16.72H14.28C14.52 16.72 14.72 16.92 14.72 17.16C14.72 17.4 14.52 17.6 14.28 17.6H3.72C3.48 17.6 3.28 17.4 3.28 17.16C3.28 16.92 3.48 16.72 3.72 16.72Z" fill="currentColor"/>
          </svg>
          <span class="flex-1 truncate text-left lg:max-w-[380px] max-lg:max-w-[200px]">
            {{ selDoc ? `${selDoc.name} ${selDoc.size.inch}″ ${selDoc.size.w}×${selDoc.size.h} ${selDoc.format}` : $t('tool.chooseDoc') }}
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 shrink-0 text-[#4B5563] transition-transform" :class="{ 'rotate-180': docOpen }">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        <div
          v-if="docOpen"
          class="absolute z-20 mt-1 max-h-[300px] w-full overflow-y-auto rounded border border-neutral-100 bg-white shadow-md"
        >
          <button
            v-for="d in docOptions"
            :key="d.slug"
            type="button"
            class="flex w-full items-center gap-x-2 px-2 py-2.5 text-left text-sm transition-colors hover:bg-slate-200"
            @click="selectDoc(d.slug)"
          >
            <span class="flex-1 truncate">{{ d.name }} · {{ d.size.inch }}″</span>
          </button>
        </div>
      </div>
      <div class="flex items-center gap-x-3 text-xs text-[#475569]">
        <span>{{ $t('tool.popularLabel') }}:</span>
        <button
          v-for="type in popularDocTypes"
          :key="type"
          type="button"
          class="underline text-blue-600 capitalize transition-colors hover:text-red-600"
          @click="selSlug = docOptions.find(d => d.category === type)?.slug || ''; docOpen = false"
        >{{ type }}</button>
      </div>
    </div>

    <!-- Medical restriction -->
    <div class="flex items-center justify-between gap-x-10 rounded-[6px] bg-white p-3 lg:items-start lg:gap-x-2.5">
      <div class="space-y-2 lg:max-w-[300px]">
        <label class="flex cursor-pointer items-center gap-x-2.5 group">
          <span class="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border border-[#6C757D] bg-transparent transition-colors group-hover:border-[#4068DB]">
            <input v-model="medicalRestriction" type="checkbox" class="opacity-0 invisible size-0" />
            <svg v-if="medicalRestriction" class="h-2.5 w-2.5" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0.56 4.68L3.56 6.68L9.06 0.68" stroke="white" stroke-width="2" />
            </svg>
          </span>
          <span class="text-sm font-semibold">{{ $t('tool.medical') }}</span>
        </label>
        <p class="text-xs leading-snug text-[#414141]">{{ $t('tool.medicalHint') }}</p>
      </div>
      <!-- 无障碍图标 -->
      <svg class="h-[60px] w-[60px] shrink-0 text-slate-400 lg:h-6 lg:w-6" viewBox="0 0 58 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.3 9.8C19.4 9.8 17.2 7.53 17.2 4.9C17.2 2.1 19.6 0 22.3 0C25.2 0 27.4 2.28 27.4 4.9C27.4 7.7 25.2 9.8 22.3 9.8ZM46.6 46.2C47.5 47.43 49.3 47.95 50.75 47.25C52.2 46.38 52.56 44.8 51.84 43.4L43.1 28.88C42.6 28 41.7 27.48 40.6 27.48H27.9L27.7 23.63H36.8C38.1 23.63 39.15 22.75 39.15 21.53C39.15 20.3 38.1 19.43 36.8 19.25H27.55L27.2 15.05C27 12.43 24.65 10.5 21.93 10.5C19.2 10.68 17.2 12.95 17.2 15.58L18.1 30.45C18.3 33.08 20.66 35 23.38 35H39.9L46.6 46.2ZM25.6 52.15C17.2 52.15 10.3 45.68 10.3 37.45C10.3 33.08 12.3 29.05 15.6 26.43L15.4 21.88C10 25.2 6.34 30.98 6.34 37.45C6.34 47.78 14.86 56 25.6 56C33.35 56 40.1 51.45 43 44.9" fill="currentColor"/>
      </svg>
    </div>

    <!-- Start button -->
    <button
      type="button"
      class="inline-flex w-full items-center justify-center gap-x-2.5 border border-transparent bg-[#2563EB] px-7 py-2.5 text-base text-white transition-opacity hover:opacity-75 disabled:bg-[#6b7280]"
      style="--button-progress: 50%;"
      @click="startWizard()"
    >
      <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M5.7 3C4.98 3 4.3 3.28 3.79 3.79C3.28 4.3 3 4.98 3 5.7V14.7C3 15.18 3.19 15.64 3.53 15.97C3.86 16.31 4.32 16.5 4.8 16.5V5.7C4.8 5.46 4.89 4.89 5.06 5.06C5.23 5.23 5.46 4.8 5.7 4.8H18.3C18.3 4.32 18.11 3.86 17.77 3.53C17.43 3.19 16.98 3 16.5 3H5.7ZM5.7 7.5C5.7 7.02 5.89 6.56 6.23 6.23C6.56 5.89 7.02 5.7 7.5 5.7H19.2C19.68 5.7 20.14 5.89 20.47 6.23C20.81 6.56 21 7.02 21 7.5V17.7C21 18.18 20.81 18.64 20.47 18.97C20.14 19.31 19.68 19.5 19.2 19.5H7.5C7.02 19.5 6.56 19.31 6.23 18.97C5.89 18.64 5.7 18.18 5.7 17.7V7.5ZM19.2 7.5H7.5V14.56L11 11.1C11.07 11 11.19 10.91 11.33 10.86C11.47 10.8 11.61 10.77 11.76 10.77C11.91 10.77 12.05 10.8 12.19 10.86C12.33 10.91 12.45 11 12.55 11.1L15.5 14.02L16.3 13.22C16.4 13.12 16.5 13.03 16.63 12.98C16.77 12.92 16.91 12.89 17.06 12.89C17.21 12.89 17.36 12.92 17.49 12.98C17.63 13.03 17.75 13.12 17.86 13.22L19.2 14.56V7.5Z" fill="white"/>
      </svg>
      {{ $t('tool.startBtn') }}
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
        <path d="M8 18L12 22L16 18" />
        <path d="M12 2V22" />
      </svg>
    </button>

    <!-- 隐藏文件输入 -->
    <input ref="fileInputRef" type="file" accept="image/*" class="hidden" @change="onFileSelected" />
  </form>
</template>
