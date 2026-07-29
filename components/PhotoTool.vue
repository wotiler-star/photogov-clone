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
const bgMode = ref<'white' | 'blue' | 'grey' | 'keep' | 'ai' | 'custom'>('white')
const customColor = ref('#FFFFFF')
const fileName = ref('')
const isProcessing = ref(false)
const note = ref('')
const aiReady = ref(false)

const hasImage = computed(() => !!sourceImg.value)
const cw = computed(() => selDoc.value?.size.w || 600)
const ch = computed(() => selDoc.value?.size.h || 600)

const defaultBg = (hex?: string): 'white' | 'blue' | 'grey' => {
  if (hex === '#2B72E0') return 'blue'
  if (hex === '#E8E8E8') return 'grey'
  return 'white'
}

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
      aiReady.value = false
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
  offsetX.value += (e.clientX - lastX)
  offsetY.value += (e.clientY - lastY)
  lastX = e.clientX
  lastY = e.clientY
  draw()
}
function onPointerUp() {
  dragging = false
}

type ImageLike = HTMLImageElement | HTMLCanvasElement | null

// ---- 核心绘制（单图 / 批量 / 排版 共用）----
function getDims(img: ImageLike) {
  const el = img as any
  return { w: el?.naturalWidth || el?.width || 1, h: el?.naturalHeight || el?.height || 1 }
}

function paint(
  ctx: CanvasRenderingContext2D,
  cwv: number,
  chv: number,
  img?: ImageLike,
  opts?: Partial<{ scale: number; rot: number; ox: number; oy: number; bright: number; cont: number; bg: string }>
) {
  const sc = opts?.scale ?? scale.value
  const rot = opts?.rot ?? rotate.value
  const ox = opts?.ox ?? offsetX.value
  const oy = opts?.oy ?? offsetY.value
  const bright = opts?.bright ?? brightness.value
  const cont = opts?.cont ?? contrast.value
  const bm = opts?.bg ?? bgMode.value

  const filter = `brightness(${bright}%) contrast(${cont}%)`
  ctx.save()
  ctx.clearRect(0, 0, cwv, chv)

  let bg = '#FFFFFF'
  if (bm === 'blue') bg = '#2B72E0'
  else if (bm === 'grey') bg = '#E8E8E8'
  else if (bm === 'custom') bg = customColor.value
  else if (bm === 'ai') bg = '#FFFFFF'
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, cwv, chv)

  if (img) {
    ctx.filter = filter
    const { w: nw, h: nh } = getDims(img)
    const imgRatio = nw / nh
    const canvasRatio = cwv / chv
    const cover = canvasRatio > imgRatio ? cwv / nw : chv / nh
    const s = cover * sc
    ctx.translate(cwv / 2 + ox, chv / 2 + oy)
    ctx.rotate((rot * Math.PI) / 180)
    ctx.drawImage(img as CanvasImageSource, (-nw * s) / 2, (-nh * s) / 2, nw * s, nh * s)
  }
  ctx.restore()
}

function activeSource(): ImageLike {
  if (bgMode.value === 'ai' && aiImg.value) return aiImg.value
  return sourceImg.value
}

function draw() {
  const cv = canvasRef.value
  if (!cv) return
  const ctx = cv.getContext('2d')
  if (!ctx) return
  paint(ctx, cw.value, ch.value, activeSource())
}

watch(
  [scale, offsetX, offsetY, rotate, brightness, contrast, bgMode, customColor, selDoc],
  () => { if (hasImage.value) draw() }
)
watch(selDoc, () => {
  if (selDoc.value) bgMode.value = defaultBg(selDoc.value.background)
  if (hasImage.value) draw()
})

onMounted(() => {
  syncCanvasSize()
  draw()
})

// 当证件切换导致画布尺寸变化时同步
watch([cw, ch], () => {
  syncCanvasSize()
  if (hasImage.value) draw()
})
function syncCanvasSize() {
  if (canvasRef.value) {
    canvasRef.value.width = cw.value
    canvasRef.value.height = ch.value
  }
}

// ---- 导出单张 ----
function exportCanvas(): HTMLCanvasElement {
  const out = document.createElement('canvas')
  out.width = cw.value
  out.height = ch.value
  const ctx = out.getContext('2d')!
  paint(ctx, cw.value, ch.value, activeSource())
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

function downloadPNG() {
  if (!hasImage.value) return
  const out = exportCanvas()
  const link = document.createElement('a')
  link.download = `${fileName.value || 'photo'}-${selDoc.value?.slug}.png`
  link.href = out.toDataURL('image/png')
  link.click()
  note.value = 'PNG downloaded (lossless).'
}

async function downloadPDF() {
  if (!hasImage.value) return
  isProcessing.value = true
  try {
    const out = exportCanvas()
    const { jsPDF } = await import('jspdf')
    const inW = cw.value / 300
    const inH = ch.value / 300
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

// ---- 排版打印页（多张同图印在一页）----
const sheetCopies = ref(4)
const sheetPreset = ref<'4x6' | 'A4'>('4x6')

async function downloadSheet() {
  if (!hasImage.value) return
  isProcessing.value = true
  try {
    const { jsPDF } = await import('jspdf')
    const pw = cw.value
    const ph = ch.value
    let sheetW: number, sheetH: number
    if (sheetPreset.value === 'A4') { sheetW = 2480; sheetH = 3508 }
    else { sheetW = 1200; sheetH = 1800 } // 4x6 in @300dpi

    const margin = Math.round(Math.min(sheetW, sheetH) * 0.04)
    const gap = Math.round(Math.min(pw, ph) * 0.08)
    const cols = Math.max(1, Math.floor((sheetW - 2 * margin + gap) / (pw + gap)))
    const rows = Math.max(1, Math.floor((sheetH - 2 * margin + gap) / (ph + gap)))
    const perPage = cols * rows
    const total = Math.min(sheetCopies.value, perPage)
    const usedW = cols * pw + (cols - 1) * gap
    const usedH = rows * ph + (rows - 1) * gap
    const startX = (sheetW - usedW) / 2
    const startY = (sheetH - usedH) / 2

    const sheet = document.createElement('canvas')
    sheet.width = sheetW
    sheet.height = sheetH
    const sctx = sheet.getContext('2d')!
    sctx.fillStyle = '#FFFFFF'
    sctx.fillRect(0, 0, sheetW, sheetH)
    const src = sourceImg.value
    for (let i = 0; i < total; i++) {
      const x = startX + (i % cols) * (pw + gap)
      const y = startY + Math.floor(i / cols) * (ph + gap)
      sctx.save()
      sctx.translate(x, y)
      paint(sctx, pw, ph, src, { ox: 0, oy: 0 })
      sctx.restore()
    }

    const inW = sheetW / 300
    const inH = sheetH / 300
    const pdf = new jsPDF({ orientation: inW > inH ? 'landscape' : 'portrait', unit: 'in', format: [inW, inH] })
    pdf.addImage(sheet.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, inW, inH)
    pdf.save(`photo-sheet-${sheetCopies.value}-${selDoc.value?.slug}.pdf`)
    note.value = `Print sheet (${total} copies) downloaded as PDF.`
  } catch (e) {
    note.value = 'Sheet export failed. Try a single JPG.'
  } finally {
    isProcessing.value = false
  }
}

// ---- 批量处理（多张图，统一设置，打包 ZIP）----
interface BatchItem { id: number; name: string; img: HTMLImageElement }
const batchItems = ref<BatchItem[]>([])
let batchId = 0

function onBatchFiles(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files || !files.length) return
  note.value = `Loading ${files.length} photo(s)…`
  let pending = files.length
  Array.from(files).forEach((f) => {
    if (!f.type.startsWith('image/')) { if (--pending === 0) note.value = ''; return }
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        batchItems.value.push({ id: batchId++, name: f.name.replace(/\.[^.]+$/, ''), img })
        if (--pending === 0) note.value = `${batchItems.value.length} photo(s) ready. Click "Download all (ZIP)".`
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(f)
  })
}

function batchCanvas(it: BatchItem): HTMLCanvasElement {
  const out = document.createElement('canvas')
  out.width = cw.value
  out.height = ch.value
  paint(out.getContext('2d')!, cw.value, ch.value, it.img, { ox: 0, oy: 0 })
  return out
}

function downloadBatchItem(it: BatchItem) {
  const out = batchCanvas(it)
  const link = document.createElement('a')
  link.download = `${it.name}-${selDoc.value?.slug}.jpg`
  link.href = out.toDataURL('image/jpeg', 0.92)
  link.click()
}

function removeBatchItem(id: number) {
  batchItems.value = batchItems.value.filter((b) => b.id !== id)
}

async function downloadBatchZip() {
  if (!batchItems.value.length) return
  isProcessing.value = true
  note.value = 'Zipping photos…'
  try {
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    for (const it of batchItems.value) {
      const cv = batchCanvas(it)
      const data = cv.toDataURL('image/jpeg', 0.92).split(',')[1]
      zip.file(`${it.name}-${selDoc.value?.slug}.jpg`, data, { base64: true })
    }
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'photos.zip'
    a.click()
    URL.revokeObjectURL(url)
    note.value = `ZIP downloaded with ${batchItems.value.length} photo(s).`
  } catch (e) {
    note.value = 'ZIP export failed. Download individually instead.'
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
      return resolve((window as any).SelfieSegmentation ? { SelfieSegmentation: (window as any).SelfieSegmentation } : null)
    }
    const s = document.createElement('script')
    s.id = id
    s.src =
      'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js'
    s.crossOrigin = 'anonymous'
    s.onload = () => {
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
          <div class="mt-2 grid grid-cols-3 gap-2">
            <button class="rounded-lg border px-2 py-2 text-xs font-medium" :class="bgMode==='white'?'border-brand-blue bg-brand-blue/5 text-brand-blue':'border-slate-300'" @click="bgMode='white';draw()">White</button>
            <button class="rounded-lg border px-2 py-2 text-xs font-medium" :class="bgMode==='blue'?'border-brand-blue bg-brand-blue/5 text-brand-blue':'border-slate-300'" @click="bgMode='blue';draw()">Blue</button>
            <button class="rounded-lg border px-2 py-2 text-xs font-medium" :class="bgMode==='grey'?'border-brand-blue bg-brand-blue/5 text-brand-blue':'border-slate-300'" @click="bgMode='grey';draw()">Grey</button>
            <button class="rounded-lg border px-2 py-2 text-xs font-medium" :class="bgMode==='keep'?'border-brand-blue bg-brand-blue/5 text-brand-blue':'border-slate-300'" @click="bgMode='keep';draw()">Keep</button>
            <button class="rounded-lg border px-2 py-2 text-xs font-medium" :class="bgMode==='ai'?'border-brand-blue bg-brand-blue/5 text-brand-blue':'border-slate-300'" :disabled="!hasImage||isProcessing" @click="removeBackgroundAI()">AI Remove</button>
            <button class="rounded-lg border px-2 py-2 text-xs font-medium" :class="bgMode==='custom'?'border-brand-blue bg-brand-blue/5 text-brand-blue':'border-slate-300'" @click="bgMode='custom';draw()">Custom</button>
          </div>
          <div v-if="bgMode==='custom'" class="mt-2 flex items-center gap-2 text-xs text-muted">
            <input type="color" v-model="customColor" @input="bgMode='custom';draw()" class="h-8 w-10 rounded border border-slate-300" />
            <span>Custom background color</span>
          </div>
        </div>

        <!-- 下载 -->
        <div class="mt-1 grid grid-cols-3 gap-2">
          <button class="btn-primary" :disabled="!hasImage" @click="downloadJPG()">JPG</button>
          <button class="btn-yellow" :disabled="!hasImage||isProcessing" @click="downloadPDF()">PDF</button>
          <button class="btn-secondary" :disabled="!hasImage" @click="downloadPNG()">PNG</button>
        </div>

        <!-- 排版打印页 -->
        <div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p class="text-xs font-semibold text-ink">Print sheet (multiple copies)</p>
          <div class="mt-2 flex items-center gap-2">
            <select v-model.number="sheetCopies" class="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs">
              <option :value="4">4 copies</option>
              <option :value="6">6 copies</option>
              <option :value="8">8 copies</option>
            </select>
            <select v-model="sheetPreset" class="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs">
              <option value="4x6">4×6 in</option>
              <option value="A4">A4</option>
            </select>
            <button class="btn-secondary ml-auto px-3 py-1.5 text-xs" :disabled="!hasImage||isProcessing" @click="downloadSheet()">Sheet PDF</button>
          </div>
        </div>

        <p v-if="note" class="text-xs text-accent-green">{{ note }}</p>
        <p v-if="selDoc" class="text-[11px] leading-relaxed text-muted">
          {{ selDoc.size.inch }} in · {{ selDoc.dpi }} dpi · {{ selDoc.format }} · {{ selDoc.countryName }}
        </p>
      </div>
    </div>

    <!-- 批量处理 -->
    <div class="border-t border-slate-200 bg-white p-5">
      <div class="flex items-center justify-between">
        <p class="text-sm font-semibold text-ink">Batch processing — process multiple photos at once</p>
        <span class="text-xs text-muted">{{ batchItems.length }} loaded</span>
      </div>
      <p class="mt-1 text-xs text-muted">
        Upload several photos; they are all cropped to the current document size using the same background & adjustments, then downloaded together as a ZIP.
      </p>
      <label class="btn-secondary mt-3 inline-flex cursor-pointer items-center gap-2">
        <input type="file" accept="image/*" multiple class="hidden" @change="onBatchFiles" />
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 16V4m0 0L8 8m4-4l4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        Add photos (multiple)
      </label>

      <div v-if="batchItems.length" class="mt-3">
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          <div v-for="it in batchItems" :key="it.id" class="rounded-lg border border-slate-200 p-2">
            <div class="aspect-[3/4] overflow-hidden rounded bg-slate-100">
              <img :src="it.img.src" class="h-full w-full object-cover" alt="" />
            </div>
            <p class="mt-1 truncate text-[11px] text-muted">{{ it.name }}</p>
            <div class="mt-1 flex gap-1">
              <button class="flex-1 rounded bg-brand-blue/10 px-1 py-1 text-[10px] font-medium text-brand-blue" @click="downloadBatchItem(it)">JPG</button>
              <button class="rounded bg-slate-100 px-1 py-1 text-[10px] text-muted" @click="removeBatchItem(it.id)">✕</button>
            </div>
          </div>
        </div>
        <button class="btn-primary mt-3" :disabled="isProcessing" @click="downloadBatchZip()">
          Download all (ZIP)
        </button>
      </div>
    </div>
  </div>
</template>
