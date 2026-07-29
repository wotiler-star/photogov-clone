<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useData, type PhotoDoc } from '~/composables/useData'
import { useCountry } from '~/composables/useCountry'

const props = withDefaults(
  defineProps<{ country?: string; doc?: string }>(),
  { country: '', doc: '' }
)

const {
  countries,
  documents,
  documentsForCountry,
  popularDocuments,
  getDocument
} = useData()
const { code: countryCode, setCode } = useCountry()

const activeCountry = computed(() =>
  props.country || countryCode.value || 'US'
)

// 可选证件：优先当前国家，否则热门
const docOptions = computed<PhotoDoc[]>(() => {
  const list = documentsForCountry(activeCountry.value)
  return list.length ? list : popularDocuments()
})

const selSlug = ref<string>('')
const selDoc = computed<PhotoDoc | null>(() => {
  const d =
    (selSlug.value && getDocument(selSlug.value)) ||
    (props.doc && getDocument(props.doc)) ||
    docOptions.value[0]
  return d || null
})

watch(
  [activeCountry, docOptions],
  () => {
    if (!selSlug.value || !getDocument(selSlug.value)) {
      selSlug.value = docOptions.value[0]?.slug || ''
    }
  },
  { immediate: true }
)

// ---- 工具状态 ----
const canvasRef = ref<HTMLCanvasElement | null>(null)
const sourceImg = ref<HTMLImageElement | null>(null)
const aiImg = ref<HTMLCanvasElement | null>(null) // AI 抠图后的合成图
const scale = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)
const rotate = ref(0)
const brightness = ref(100)
const contrast = ref(100)
const bgMode = ref<'white' | 'blue' | 'grey' | 'keep' | 'ai'>('white')

const defaultBg = (hex?: string): 'white' | 'blue' | 'grey' => {
  if (hex === '#2B72E0') return 'blue'
  if (hex === '#E8E8E8') return 'grey'
  return 'white'
}
const fileName = ref('')
const isProcessing = ref(false)
const note = ref('')
const aiReady = ref(false)

const hasImage = computed(() => !!sourceImg.value)
const cw = computed(() => selDoc.value?.size.w || 600)
const ch = computed(() => selDoc.value?.size.h || 600)

// 预览显示尺寸（保持比例，限制宽度）
const previewStyle = computed(() => {
  const maxW = 360
  const ratio = ch.value / cw.value
  const w = Math.min(maxW, cw.value)
  return { width: w + 'px', height: w * ratio + 'px' }
})

function loadFile(file: File) {
  if (!file || !file.type.startsWith('image/')) {
    note.value = 'Please choose an image file (JPG/PNG).'
    return
  }
  fileName.value = file.name.replace(/\.[^.]+$/, '')
  const reader = new FileReader()
  reader.onload = () => {
    const img = new Image()
    img.onload = () => {
      sourceImg.value = img
      aiImg.value = null
      bgMode.value = defaultBg(selDoc.value?.background)
      resetTransforms()
      note.value = ''
      nextTick(draw)
    }
    img.src = reader.result as string
  }
  reader.readAsDataURL(file)
}

function resetTransforms() {
  scale.value = 1
  offsetX.value = 0
  offsetY.value = 0
  rotate.value = 0
  brightness.value = 100
  contrast.value = 100
}

function onFileInput(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f) loadFile(f)
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  const f = e.dataTransfer?.files?.[0]
  if (f) loadFile(f)
}

// ---- 拖拽平移 ----
let dragging = false
let lastX = 0
let lastY = 0
function onPointerDown(e: PointerEvent) {
  dragging = true
  lastX = e.clientX
  lastY = e.clientY
  ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
}
function onPointerMove(e: PointerEvent) {
  if (!dragging) return
  const k = 1
  offsetX.value += (e.clientX - lastX) * k
  offsetY.value += (e.clientY - lastY) * k
  lastX = e.clientX
  lastY = e.clientY
  draw()
}
function onPointerUp() {
  dragging = false
}

// ---- 绘制 ----
function activeSource(): CanvasImageSource | null {
  if (bgMode.value === 'ai' && aiImg.value) return aiImg.value
  return sourceImg.value
}

function renderTo(
  ctx: CanvasRenderingContext2D,
  cwv: number,
  chv: number
) {
  const img = activeSource()
  const filter = `brightness(${brightness.value}%) contrast(${contrast.value}%)`
  ctx.save()
  ctx.clearRect(0, 0, cwv, chv)

  // 背景
  let bg = '#FFFFFF'
  if (bgMode.value === 'blue') bg = '#2B72E0'
  if (bgMode.value === 'grey') bg = '#E8E8E8'
  if (bgMode.value === 'ai') bg = '#FFFFFF'
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, cwv, chv)

  if (img) {
    ctx.filter = filter
    const imgRatio = (img as HTMLImageElement).naturalWidth /
      (img as HTMLImageElement).naturalHeight
    const canvasRatio = cwv / chv
    const cover =
      canvasRatio > imgRatio
        ? cwv / (img as HTMLImageElement).naturalWidth
        : chv / (img as HTMLImageElement).naturalHeight
    const s = cover * scale.value
    ctx.translate(cwv / 2 + offsetX.value, chv / 2 + offsetY.value)
    ctx.rotate((rotate.value * Math.PI) / 180)
    const iw = (img as HTMLImageElement).naturalWidth
    const ih = (img as HTMLImageElement).naturalHeight
    ctx.drawImage(img, (-iw * s) / 2, (-ih * s) / 2, iw * s, ih * s)
  }
  ctx.restore()
}

function draw() {
  const cv = canvasRef.value
  if (!cv) return
  const ctx = cv.getContext('2d')
  if (!ctx) return
  renderTo(ctx, cw.value, ch.value)
}

watch(
  [scale, offsetX, offsetY, rotate, brightness, contrast, bgMode, selDoc],
  () => { if (hasImage.value) draw() }
)
watch(selDoc, () => {
  if (selDoc.value) bgMode.value = defaultBg(selDoc.value.background)
  if (hasImage.value) draw()
})

onMounted(() => {
  if (canvasRef.value) {
    canvasRef.value.width = cw.value
    canvasRef.value.height = ch.value
    draw()
  }
})

// 当证件切换导致画布尺寸变化时同步
watch([cw, ch], () => {
  if (canvasRef.value) {
    canvasRef.value.width = cw.value
    canvasRef.value.height = ch.value
    if (hasImage.value) draw()
  }
})

// ---- 导出 ----
function exportCanvas(): HTMLCanvasElement {
  const out = document.createElement('canvas')
  out.width = cw.value
  out.height = ch.value
  const ctx = out.getContext('2d')!
  renderTo(ctx, cw.value, ch.value)
  return out
}

function downloadJPG() {
  if (!hasImage.value) return
  const out = exportCanvas()
  const link = document.createElement('a')
  link.download = `${fileName.value || 'photo'}-${selDoc.value?.slug}.jpg`
  link.href = out.toDataURL('image/jpeg', 0.92)
  link.click()
  note.value = 'JPG downloaded. Check your Downloads folder.'
}

async function downloadPDF() {
  if (!hasImage.value) return
  isProcessing.value = true
  try {
    const out = exportCanvas()
    const { jsPDF } = await import('jspdf')
    const pxW = cw.value
    const pxH = ch.value
    // 以英寸为单位，按 300dpi 估算物理尺寸
    const inW = pxW / 300
    const inH = pxH / 300
    const pdf = new jsPDF({ orientation: inW > inH ? 'landscape' : 'portrait', unit: 'in', format: [inW, inH] })
    pdf.addImage(out.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, inW, inH)
    pdf.save(`${fileName.value || 'photo'}-${selDoc.value?.slug}.pdf`)
    note.value = 'PDF downloaded.'
  } catch (e) {
    note.value = 'PDF export failed. Try JPG instead.'
  } finally {
    isProcessing.value = false
  }
}

// ---- AI 抠图（MediaPipe，运行时 CDN 加载，失败则降级）----
async function removeBackgroundAI() {
  if (!sourceImg.value) return
  isProcessing.value = true
  note.value = 'Loading AI model…'
  try {
    // 动态加载 MediaPipe Selfie Segmentation（CDN）
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mp: any = await loadMediaPipe()
    const seg = new mp.SelfieSegmentation({
      locateFile: (f: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${f}`
    })
    seg.setOptions({ modelSelection: 1 })
    const srcCanvas = document.createElement('canvas')
    srcCanvas.width = sourceImg.value.naturalWidth
    srcCanvas.height = sourceImg.value.naturalHeight
    srcCanvas.getContext('2d')!.drawImage(sourceImg.value, 0, 0)
    const result = await new Promise<HTMLCanvasElement>((resolve) => {
      seg.onResults((res: any) => {
        const comp = document.createElement('canvas')
        comp.width = res.image.width
        comp.height = res.image.height
        const c = comp.getContext('2d')!
        c.drawImage(res.image, 0, 0, comp.width, comp.height)
        c.globalCompositeOperation = 'destination-in'
        c.drawImage(res.segmentationMask, 0, 0, comp.width, comp.height)
        resolve(comp)
      })
      seg.send({ image: srcCanvas })
    })
    aiImg.value = result
    bgMode.value = 'ai'
    aiReady.value = true
    note.value = 'Background removed. Pick a new background or download.'
  } catch (e) {
    note.value =
      'AI removal needs internet access (MediaPipe CDN). Using manual background instead.'
    bgMode.value = defaultBg(selDoc.value?.background)
  } finally {
    isProcessing.value = false
    nextTick(draw)
  }
}

let mpPromise: Promise<any> | null = null
function loadMediaPipe(): Promise<any> {
  if (mpPromise) return mpPromise
  mpPromise = new Promise((resolve, reject) => {
    const id = 'mp-selfie'
    if (document.getElementById(id)) {
      // @ts-ignore
      return resolve((window as any).SelfieSegmentation ? { SelfieSegmentation: (window as any).SelfieSegmentation } : null)
    }
    const s = document.createElement('script')
    s.id = id
    s.src =
      'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js'
    s.crossOrigin = 'anonymous'
    s.onload = () => {
      // @ts-ignore
      const S = (window as any).SelfieSegmentation
      if (S) resolve({ SelfieSegmentation: S })
      else reject(new Error('SelfieSegmentation not found'))
    }
    s.onerror = () => reject(new Error('CDN load failed'))
    document.head.appendChild(s)
  })
  return mpPromise
}

function changeCountry(c: string) {
  setCode(c)
  const list = documentsForCountry(c)
  if (list.length) selSlug.value = list[0].slug
}
</script>

<template>
  <div class="card-pg overflow-hidden">
    <div class="grid gap-0 md:grid-cols-[minmax(0,1fr)_320px]">
      <!-- 预览区 -->
      <div class="flex flex-col items-center justify-center gap-4 border-b border-slate-200 bg-slate-50 p-6 md:border-b-0 md:border-r">
        <div
          class="relative cursor-grab touch-none select-none rounded-lg bg-white shadow-soft ring-1 ring-slate-200 active:cursor-grabbing"
          :style="previewStyle"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointerleave="onPointerUp"
          @dragover.prevent
          @drop="onDrop"
        >
          <canvas
            ref="canvasRef"
            class="block h-full w-full rounded-lg"
            :width="cw"
            :height="ch"
          ></canvas>
          <div
            v-if="!hasImage"
            class="pointer-events-none absolute inset-0 grid place-items-center rounded-lg text-center text-sm text-muted"
          >
            <div>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" class="mx-auto mb-2 text-brand-blue">
                <path d="M12 16V4m0 0L8 8m4-4l4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
              Drop a photo or click below
            </div>
          </div>
        </div>
        <p class="text-xs text-muted">
          Drag to reposition · Scroll-free sliders below
        </p>
      </div>

      <!-- 控制区 -->
      <div class="flex flex-col gap-4 p-5">
        <!-- 文档选择 -->
        <div>
          <label class="eyebrow">Document</label>
          <div class="mt-1 flex gap-2">
            <select
              :value="activeCountry"
              class="w-1/2 rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm"
              @change="changeCountry(($event.target as HTMLSelectElement).value)"
            >
              <option v-for="c in countries" :key="c.code" :value="c.code">
                {{ c.flag }} {{ c.name }}
              </option>
            </select>
            <select
              v-model="selSlug"
              class="w-1/2 rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm"
            >
              <option v-for="d in docOptions" :key="d.slug" :value="d.slug">
                {{ d.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- 上传 -->
        <div>
          <label class="btn-primary w-full cursor-pointer">
            <input type="file" accept="image/*" class="hidden" @change="onFileInput" />
            {{ hasImage ? 'Replace photo' : 'Upload photo' }}
          </label>
        </div>

        <!-- 调整 -->
        <div class="space-y-3" :class="{ 'opacity-40': !hasImage }">
          <div>
            <div class="flex justify-between text-xs text-muted"><span>Zoom</span><span>{{ scale.toFixed(2) }}x</span></div>
            <input type="range" min="1" max="3" step="0.01" v-model.number="scale" class="w-full accent-brand-blue" :disabled="!hasImage" />
          </div>
          <div>
            <div class="flex justify-between text-xs text-muted"><span>Rotate</span><span>{{ rotate }}°</span></div>
            <input type="range" min="-45" max="45" step="1" v-model.number="rotate" class="w-full accent-brand-blue" :disabled="!hasImage" />
          </div>
          <div>
            <div class="flex justify-between text-xs text-muted"><span>Brightness</span><span>{{ brightness }}%</span></div>
            <input type="range" min="50" max="150" step="1" v-model.number="brightness" class="w-full accent-brand-blue" :disabled="!hasImage" />
          </div>
          <div>
            <div class="flex justify-between text-xs text-muted"><span>Contrast</span><span>{{ contrast }}%</span></div>
            <input type="range" min="50" max="150" step="1" v-model.number="contrast" class="w-full accent-brand-blue" :disabled="!hasImage" />
          </div>
          <button class="text-xs text-brand-blue underline" :disabled="!hasImage" @click="resetTransforms(); draw()">Reset adjustments</button>
        </div>

        <!-- 背景 -->
        <div>
          <label class="eyebrow">Background</label>
          <div class="mt-2 grid grid-cols-2 gap-2">
            <button class="rounded-lg border px-2 py-2 text-xs font-medium" :class="bgMode==='white'?'border-brand-blue bg-brand-blue/5 text-brand-blue':'border-slate-300'" @click="bgMode='white';draw()">White</button>
            <button class="rounded-lg border px-2 py-2 text-xs font-medium" :class="bgMode==='blue'?'border-brand-blue bg-brand-blue/5 text-brand-blue':'border-slate-300'" @click="bgMode='blue';draw()">Blue</button>
            <button class="rounded-lg border px-2 py-2 text-xs font-medium" :class="bgMode==='grey'?'border-brand-blue bg-brand-blue/5 text-brand-blue':'border-slate-300'" @click="bgMode='grey';draw()">Grey</button>
            <button class="rounded-lg border px-2 py-2 text-xs font-medium" :class="bgMode==='keep'?'border-brand-blue bg-brand-blue/5 text-brand-blue':'border-slate-300'" @click="bgMode='keep';draw()">Keep</button>
            <button class="rounded-lg border px-2 py-2 text-xs font-medium" :class="bgMode==='ai'?'border-brand-blue bg-brand-blue/5 text-brand-blue':'border-slate-300'" :disabled="!hasImage||isProcessing" @click="removeBackgroundAI()">AI Remove</button>
          </div>
        </div>

        <!-- 下载 -->
        <div class="mt-1 grid grid-cols-2 gap-2">
          <button class="btn-primary" :disabled="!hasImage" @click="downloadJPG()">Download JPG</button>
          <button class="btn-yellow" :disabled="!hasImage||isProcessing" @click="downloadPDF()">Download PDF</button>
        </div>

        <p v-if="note" class="text-xs text-accent-green">{{ note }}</p>
        <p v-if="selDoc" class="text-[11px] leading-relaxed text-muted">
          {{ selDoc.size.inch }} in · {{ selDoc.dpi }} dpi · {{ selDoc.format }} · {{ selDoc.countryName }}
        </p>
      </div>
    </div>
  </div>
</template>
