<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useData, type PhotoDoc } from '~/composables/useData'
import { useCountry } from '~/composables/useCountry'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{ country?: string; doc?: string }>(),
  { country: '', doc: '' }
)

const {
  countries,
  documents,
  documentsForCountry,
  popularDocuments,
  getDocument,
  countryName
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
const sourceImg = ref<HTMLImageElement | HTMLCanvasElement | null>(null)
const aiImg = ref<HTMLCanvasElement | null>(null) // AI 抠图后的合成图
const aiMask = ref<HTMLCanvasElement | null>(null) // AI 抠图的前景蒙版（用于智能裁剪）
const scale = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)
const rotate = ref(0)
const brightness = ref(100)
const contrast = ref(100)
const bgMode = ref<'white' | 'blue' | 'grey' | 'keep' | 'ai' | 'custom'>('white')
const customColor = ref('#FFFFFF')
// 预裁剪模式：cover=按证件比例填充裁剪；contain=完整保留（四周留白）
const fitMode = ref<'cover' | 'contain'>('cover')
const fileName = ref('')
const isProcessing = ref(false)
const isReading = ref(false)
const dragOver = ref(false)
let dragDepth = 0
const MAX_UPLOAD_SIZE = 25 * 1024 * 1024
const note = ref('')
const aiReady = ref(false)
const showGuides = ref(false) // 裁剪参考线开关
const guidePreset = ref<'thirds' | 'passport' | 'visa'>('thirds') // 参考线证件框预设
// 撤销/重做历史
type ToolState = {
  scale: number; offsetX: number; offsetY: number; rotate: number
  brightness: number; contrast: number
  bgMode: 'white' | 'blue' | 'grey' | 'keep' | 'ai' | 'custom'
  customColor: string; fitMode: 'cover' | 'contain'
}
const history = ref<ToolState[]>([])
const histIndex = ref(-1)
const canUndo = computed(() => histIndex.value > 0)
const canRedo = computed(() => histIndex.value < history.value.length - 1)
// 合规校验结果
const compliance = ref<{ kb: number; sizeOk: boolean; face: 'ok' | 'warn' | 'na' } | null>(null)

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

async function loadFile(file: File) {
  if (!file) return
  // HEIC / HEIF：iPhone 直出格式，多数浏览器无法直接解码 → 运行时转 PNG
  if (isHeicFile(file)) {
    isReading.value = true
    note.value = t('tool.noteHeicDecoding')
    try {
      file = await decodeHeic(file)
    } catch (e) {
      isReading.value = false
      note.value = t('tool.noteHeicFail')
      return
    }
  }
  if (!file.type.startsWith('image/')) {
    note.value = t('tool.notePleaseImage')
    return
  }
  if (file.size > MAX_UPLOAD_SIZE) {
    note.value = t('tool.noteTooLarge')
    return
  }
  fileName.value = file.name.replace(/\.[^.]+$/, '')
  isReading.value = true
  note.value = t('tool.noteReading')
  try {
    const src = await decodeToSource(file)
    sourceImg.value = src
    aiImg.value = null
    aiMask.value = null
    aiReady.value = false
      bgMode.value = defaultBg(selDoc.value?.background)
      resetTransforms()
      fitMode.value = 'cover' // 上传后默认按证件比例填充裁剪
      resetHistory()
      compliance.value = null
      isReading.value = false
      note.value = ''
      nextTick(draw)
  } catch (e) {
    isReading.value = false
    note.value = t('tool.notePleaseImage')
  }
}

// 解码为可绘制源：优先用 createImageBitmap + EXIF 方向校正（摆正手机横/倒置照片），失败回退 FileReader
async function decodeToSource(file: File): Promise<HTMLImageElement | HTMLCanvasElement> {
  const maxSide = 2400
  try {
    if (typeof createImageBitmap === 'function') {
      const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
      const nw = bmp.width
      const nh = bmp.height
      const f = Math.min(1, maxSide / Math.max(nw, nh))
      const c = document.createElement('canvas')
      c.width = Math.max(1, Math.round(nw * f))
      c.height = Math.max(1, Math.round(nh * f))
      c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
      bmp.close?.()
      return c
    }
  } catch (e) { /* 回退 */ }
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('read fail'))
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const nw = img.naturalWidth
        const nh = img.naturalHeight
        const f = Math.min(1, maxSide / Math.max(nw, nh))
        if (f < 1) {
          const c = document.createElement('canvas')
          c.width = Math.max(1, Math.round(nw * f))
          c.height = Math.max(1, Math.round(nh * f))
          c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
          resolve(c)
        } else resolve(img)
      }
      img.onerror = () => reject(new Error('img fail'))
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

// ---- HEIC / HEIF 解码（运行时从 CDN 加载 heic2any，失败则降级提示）----
function isHeicFile(file: File): boolean {
  const t = (file.type || '').toLowerCase()
  if (t === 'image/heic' || t === 'image/heif' || t === 'image/x-heic' || t === 'image/x-heif') return true
  return /\.(heic|heif)$/i.test(file.name)
}

let heicPromise: Promise<any> | null = null
function loadHeic2any(): Promise<any> {
  if (heicPromise) return heicPromise
  heicPromise = new Promise((resolve, reject) => {
    if ((window as any).heic2any) return resolve((window as any).heic2any)
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/heic2any@0.0.3/dist/heic2any.min.js'
    s.crossOrigin = 'anonymous'
    s.onload = () =>
      (window as any).heic2any ? resolve((window as any).heic2any) : reject(new Error('heic2any not found'))
    s.onerror = () => reject(new Error('CDN load failed'))
    document.head.appendChild(s)
  })
  return heicPromise
}

async function decodeHeic(file: File): Promise<File> {
  const lib = await loadHeic2any()
  const blob: Blob | Blob[] = await lib({ blob: file, toType: 'image/png' })
  const out = Array.isArray(blob) ? blob[0] : blob
  return new File([out], file.name.replace(/\.(heic|heif)$/i, '.png'), { type: 'image/png' })
}

// ---- 智能裁剪：有 AI 蒙版时按主体包围盒框住人；否则按证件比例居中填充 ----
function smartCrop() {
  if (!sourceImg.value) return
  fitMode.value = 'cover'
  const img = sourceImg.value
  const { w: nw, h: nh } = getDims(img)
  let bx = nw / 2
  let by = nh / 2
  let bw = nw
  let bh = nh
  if (aiMask.value) {
    const box = maskBoundingBox(aiMask.value)
    if (box) {
      bx = box.x + box.w / 2
      by = box.y + box.h / 2
      bw = box.w
      bh = box.h
    }
  } else {
    // 启发式：证件照主体（头部）偏上，框住上半身区域
    by = nh * 0.42
    bh = nh * 0.82
    bx = nw / 2
    bw = nw
  }
  const margin = 0.08
  const fw = bw * (1 + margin * 2)
  const fh = bh * (1 + margin * 2)
  const cover = (cw.value / ch.value > nw / nh) ? cw.value / nw : ch.value / nh
  const s = Math.min(cw.value / fw, ch.value / fh)
  scale.value = Math.max(0.1, s / cover)
  offsetX.value = -(bx - nw / 2) * s
  offsetY.value = -(by - nh / 2) * s
  rotate.value = 0
  commit()
  draw()
}

// 计算蒙版中不透明像素的包围盒（采样以提升性能）
function maskBoundingBox(mask: HTMLCanvasElement) {
  const w = mask.width
  const h = mask.height
  const data = mask.getContext('2d')!.getImageData(0, 0, w, h).data
  const step = Math.max(1, Math.floor(w / 400))
  let minX = w
  let minY = h
  let maxX = 0
  let maxY = 0
  let found = false
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      if (data[(y * w + x) * 4 + 3] > 30) {
        found = true
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (!found) return null
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }
}

// ---- 按证件比例自动预裁剪（cover 居中填充，作为复位用）----
function autoCrop() {
  if (!sourceImg.value) return
  fitMode.value = 'cover'
  scale.value = 1
  offsetX.value = 0
  offsetY.value = 0
  rotate.value = 0
  draw()
}

function resetTransforms() {
  scale.value = 1
  offsetX.value = 0
  offsetY.value = 0
  rotate.value = 0
  brightness.value = 100
  contrast.value = 100
}

// ---- 撤销 / 重做 ----
function snapshot(): ToolState {
  return {
    scale: scale.value, offsetX: offsetX.value, offsetY: offsetY.value,
    rotate: rotate.value, brightness: brightness.value, contrast: contrast.value,
    bgMode: bgMode.value, customColor: customColor.value, fitMode: fitMode.value
  }
}
function applySnapshot(s: ToolState) {
  scale.value = s.scale; offsetX.value = s.offsetX; offsetY.value = s.offsetY
  rotate.value = s.rotate; brightness.value = s.brightness; contrast.value = s.contrast
  bgMode.value = s.bgMode; customColor.value = s.customColor; fitMode.value = s.fitMode
  draw()
}
function commit() {
  history.value = history.value.slice(0, histIndex.value + 1)
  history.value.push(snapshot())
  histIndex.value = history.value.length - 1
}
function resetHistory() {
  history.value = [snapshot()]
  histIndex.value = 0
}
function undo() {
  if (histIndex.value <= 0) return
  histIndex.value--
  applySnapshot(history.value[histIndex.value])
}
function redo() {
  if (histIndex.value >= history.value.length - 1) return
  histIndex.value++
  applySnapshot(history.value[histIndex.value])
}
function setBg(m: ToolState['bgMode']) {
  bgMode.value = m
  draw()
  commit()
}

// ---- 尺寸合规校验 ----
function checkCompliance() {
  if (!sourceImg.value) return
  const img = sourceImg.value
  const { w: nw, h: nh } = getDims(img)
  const cr = cw.value / ch.value
  const ir = nw / nh
  const cover = cr > ir ? cw.value / nw : ch.value / nh
  const contain = cr > ir ? ch.value / nh : cw.value / nw
  const sDraw = (fitMode.value === 'contain' ? contain : cover) * scale.value
  // 估算导出 JPG 体积
  const out = document.createElement('canvas')
  out.width = cw.value
  out.height = ch.value
  paint(out.getContext('2d')!, cw.value, ch.value, activeSource())
  const url = out.toDataURL('image/jpeg', 0.92)
  const kb = Math.max(1, Math.round(((url.length - 'data:image/jpeg;base64,'.length) * 3) / 4 / 1024))
  // 人脸位置（基于当前取景 + 蒙版）
  let face: 'ok' | 'warn' | 'na' = 'na'
  if (aiMask.value) {
    const box = maskBoundingBox(aiMask.value)
    if (box) {
      const topY = ch.value / 2 + offsetY.value + (box.y - nh / 2) * sDraw
      const botY = ch.value / 2 + offsetY.value + (box.y + box.h - nh / 2) * sDraw
      const topFrac = topY / ch.value
      const botFrac = botY / ch.value
      // 证件照：头顶距上边约 3–18%，下巴不超 92%
      face = topFrac >= 0.03 && topFrac <= 0.18 && botFrac <= 0.92 ? 'ok' : 'warn'
    }
  }
  compliance.value = { kb, sizeOk: kb <= 1000, face }
}

// 导出前自动跑合规，返回警告文案（空串表示合规）
function preExportCheck(): string {
  checkCompliance()
  const c = compliance.value
  if (!c) return ''
  const parts: string[] = []
  if (!c.sizeOk) parts.push(t('tool.sizeWarn', { kb: c.kb }))
  if (c.face === 'warn') parts.push(t('tool.faceWarn'))
  return parts.join(' · ')
}

function onFileInput(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f) loadFile(f)
}

function onDragEnter(e: DragEvent) {
  e.preventDefault()
  dragDepth++
  dragOver.value = true
}
function onDragLeave(e: DragEvent) {
  e.preventDefault()
  dragDepth = Math.max(0, dragDepth - 1)
  if (dragDepth === 0) dragOver.value = false
}
function onDrop(e: DragEvent) {
  e.preventDefault()
  dragDepth = 0
  dragOver.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f) loadFile(f)
}

// 从剪贴板粘贴图片（忽略输入框内的粘贴）
function onPaste(e: ClipboardEvent) {
  const tgt = e.target as HTMLElement | null
  if (tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA' || tgt.isContentEditable)) return
  const items = e.clipboardData?.items
  if (!items) return
  for (const it of Array.from(items)) {
    if (it.type.startsWith('image/')) {
      const f = it.getAsFile()
      if (f) {
        e.preventDefault()
        loadFile(f)
        break
      }
    }
  }
}

// ---- 拖拽平移 ----
let dragging = false
let dragged = false
let lastX = 0
let lastY = 0
function onPointerDown(e: PointerEvent) {
  if (e.pointerType === 'touch') return // 触摸交由 touch 事件处理（含双指缩放）
  dragging = true
  dragged = false
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
  dragged = true
  draw()
}
function onPointerUp() {
  if (dragging && dragged) commit()
  dragging = false
  dragged = false
}

// ---- 移动端触控：单指平移 + 双指捏合缩放 ----
type TouchMode = 'none' | 'pan' | 'pinch'
let touchMode: TouchMode = 'none'
let lastTX = 0
let lastTY = 0
let pinchStartDist = 0
let pinchStartScale = 1
function touchDist(e: TouchEvent): number {
  const a = e.touches[0]
  const b = e.touches[1]
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
}
function onTouchStart(e: TouchEvent) {
  if (e.touches.length === 1) {
    touchMode = 'pan'
    lastTX = e.touches[0].clientX
    lastTY = e.touches[0].clientY
  } else if (e.touches.length >= 2) {
    touchMode = 'pinch'
    pinchStartDist = touchDist(e)
    pinchStartScale = scale.value
  }
}
function onTouchMove(e: TouchEvent) {
  if (!hasImage.value) return
  if (touchMode === 'pan' && e.touches.length === 1) {
    offsetX.value += e.touches[0].clientX - lastTX
    offsetY.value += e.touches[0].clientY - lastTY
    lastTX = e.touches[0].clientX
    lastTY = e.touches[0].clientY
    draw()
  } else if (touchMode === 'pinch' && e.touches.length >= 2) {
    const d = touchDist(e)
    if (pinchStartDist > 0) {
      scale.value = Math.min(3, Math.max(0.5, pinchStartScale * (d / pinchStartDist)))
    }
    draw()
  }
}
function onTouchEnd() {
  if (touchMode !== 'none') commit()
  touchMode = 'none'
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
    const contain = canvasRatio > imgRatio ? chv / nh : cwv / nw
    const s = (fitMode.value === 'contain' ? contain : cover) * sc
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
  if (hasImage.value) { autoCrop(); commit() } // 切换证件后按新比例重新预裁剪
})

onMounted(() => {
  loadPrefs()
  syncCanvasSize()
  draw()
  document.addEventListener('paste', onPaste)
  window.addEventListener('keydown', onKey)
})

// ---- 设置记忆（localStorage）：刷新后保留国家/证件/背景/裁剪模式 ----
const LS_KEY = 'photogov.tool.v1'
function savePrefs() {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({
        country: activeCountry.value,
        doc: selSlug.value,
        bg: bgMode.value === 'ai' ? defaultBg(selDoc.value?.background) : bgMode.value,
        fit: fitMode.value
      })
    )
  } catch { /* 忽略隐私模式等异常 */ }
}
function loadPrefs() {
  if (typeof localStorage === 'undefined') return
  try {
    const s = JSON.parse(localStorage.getItem(LS_KEY) || '{}')
    if (s.country) setCode(s.country)
    if (s.bg) bgMode.value = s.bg
    if (s.fit) fitMode.value = s.fit
    if (s.doc && getDocument(s.doc)) {
      nextTick(() => { if (getDocument(s.doc)) selSlug.value = s.doc })
    }
  } catch { /* 忽略损坏数据 */ }
}
watch([activeCountry, selSlug, bgMode, fitMode], savePrefs)
onBeforeUnmount(() => {
  document.removeEventListener('paste', onPaste)
  window.removeEventListener('keydown', onKey)
})

// Ctrl/Cmd+Z 撤销，Ctrl/Cmd+Shift+Z 或 Ctrl+Y 重做
function onKey(e: KeyboardEvent) {
  const tag = (e.target as HTMLElement | null)?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return
  const k = e.key.toLowerCase()
  if ((e.ctrlKey || e.metaKey) && k === 'z') {
    e.preventDefault()
    if (e.shiftKey) redo()
    else undo()
  } else if ((e.ctrlKey || e.metaKey) && k === 'y') {
    e.preventDefault()
    redo()
  }
}

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
  const warn = preExportCheck()
  const out = exportCanvas()
  const link = document.createElement('a')
  link.download = `${fileName.value || 'photo'}-${selDoc.value?.slug}.jpg`
  link.href = out.toDataURL('image/jpeg', 0.92)
  link.click()
  note.value = t('tool.noteJpg') + (warn ? ' · ' + warn : '')
}

function downloadPNG() {
  if (!hasImage.value) return
  const warn = preExportCheck()
  const out = exportCanvas()
  const link = document.createElement('a')
  link.download = `${fileName.value || 'photo'}-${selDoc.value?.slug}.png`
  link.href = out.toDataURL('image/png')
  link.click()
  note.value = t('tool.notePng') + (warn ? ' · ' + warn : '')
}

async function downloadPDF() {
  if (!hasImage.value) return
  const warn = preExportCheck()
  isProcessing.value = true
  try {
    const out = exportCanvas()
    const { jsPDF } = await import('jspdf')
    const inW = cw.value / 300
    const inH = ch.value / 300
    const pdf = new jsPDF({ orientation: inW > inH ? 'landscape' : 'portrait', unit: 'in', format: [inW, inH] })
    pdf.addImage(out.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, inW, inH)
    pdf.save(`${fileName.value || 'photo'}-${selDoc.value?.slug}.pdf`)
    note.value = t('tool.notePdf') + (warn ? ' · ' + warn : '')
  } catch (e) {
    note.value = t('tool.notePdfFail')
  } finally {
    isProcessing.value = false
  }
}

// ---- 排版打印页（多张同图印在一页）----
const sheetCopies = ref(4)
const sheetPreset = ref<'4x6' | 'A4'>('4x6')

async function downloadSheet() {
  if (!hasImage.value) return
  const warn = preExportCheck()
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
    note.value = t('tool.noteSheetDone', { count: total }) + (warn ? ' · ' + warn : '')
  } catch (e) {
    note.value = t('tool.noteSheetFail')
  } finally {
    isProcessing.value = false
  }
}

// ---- 批量处理（多张图，统一设置，打包 ZIP）----
interface BatchItem { id: number; name: string; img: HTMLImageElement; thumb: string }
const batchItems = ref<BatchItem[]>([])
let batchId = 0

async function onBatchFiles(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files || !files.length) return
  note.value = t('tool.noteBatchLoading', { count: files.length })
  let pending = files.length
  for (const f of Array.from(files)) {
    if (!f.type.startsWith('image/') && !isHeicFile(f)) {
      if (--pending === 0) note.value = ''
      continue
    }
    let ff = f
    if (isHeicFile(f)) {
      try {
        ff = await decodeHeic(f)
      } catch {
        if (--pending === 0) note.value = t('tool.noteBatchReady', { count: batchItems.value.length })
        continue
      }
    }
    const src = await decodeToSource(ff)
    const thumb = 'toDataURL' in src ? (src as HTMLCanvasElement).toDataURL('image/jpeg', 0.7) : (src as HTMLImageElement).src
    batchItems.value.push({ id: batchId++, name: ff.name.replace(/\.[^.]+$/, ''), img: src as HTMLImageElement, thumb })
    if (--pending === 0) note.value = t('tool.noteBatchReady', { count: batchItems.value.length })
  }
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
  const warn = preExportCheck()
  isProcessing.value = true
  note.value = t('tool.noteZipping')
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
    note.value = t('tool.noteZipDone', { count: batchItems.value.length }) + (warn ? ' · ' + warn : '')
  } catch (e) {
    note.value = t('tool.noteZipFail')
  } finally {
    isProcessing.value = false
  }
}

// ---- AI 抠图（MediaPipe，运行时 CDN 加载，失败则降级）----
async function removeBackgroundAI() {
  if (!sourceImg.value) return
  isProcessing.value = true
  note.value = t('tool.noteLoading')
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
        // 另外保存一份前景蒙版，供智能裁剪计算主体包围盒
        const maskC = document.createElement('canvas')
        maskC.width = res.image.width
        maskC.height = res.image.height
        maskC.getContext('2d')!.drawImage(res.segmentationMask, 0, 0, maskC.width, maskC.height)
        aiMask.value = maskC
        resolve(comp)
      })
      seg.send({ image: srcCanvas })
    })
    aiImg.value = result
    bgMode.value = 'ai'
    aiReady.value = true
    commit()
    note.value = t('tool.noteAiReady')
  } catch (e) {
    note.value =
      t('tool.noteAiFail')
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
          class="relative cursor-grab touch-none select-none rounded-lg bg-white shadow-soft ring-1 ring-slate-200 transition active:cursor-grabbing"
          :class="dragOver ? 'ring-2 ring-brand-blue bg-brand-blue/5' : ''"
          :style="previewStyle"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointerleave="onPointerUp"
          @dragenter.prevent="onDragEnter"
          @dragleave.prevent="onDragLeave"
          @dragover.prevent
          @drop="onDrop"
          @touchstart.prevent="onTouchStart"
          @touchmove.prevent="onTouchMove"
          @touchend="onTouchEnd"
        >
          <canvas
            ref="canvasRef"
            class="block h-full w-full rounded-lg"
            :width="cw"
            :height="ch"
          ></canvas>
          <!-- 裁剪参考线（仅预览，不导出）；按证件框预设切换 -->
          <div
            v-if="showGuides && hasImage"
            class="pointer-events-none absolute inset-0 rounded-lg overflow-hidden"
          >
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="absolute inset-0 h-full w-full">
              <line x1="33.33" y1="0" x2="33.33" y2="100" stroke="rgba(255,255,255,.6)" stroke-width="1" stroke-dasharray="2 2" vector-effect="non-scaling-stroke" />
              <line x1="66.67" y1="0" x2="66.67" y2="100" stroke="rgba(255,255,255,.6)" stroke-width="1" stroke-dasharray="2 2" vector-effect="non-scaling-stroke" />
              <line x1="0" y1="33.33" x2="100" y2="33.33" stroke="rgba(255,255,255,.6)" stroke-width="1" stroke-dasharray="2 2" vector-effect="non-scaling-stroke" />
              <line x1="0" y1="66.67" x2="100" y2="66.67" stroke="rgba(255,255,255,.6)" stroke-width="1" stroke-dasharray="2 2" vector-effect="non-scaling-stroke" />
              <ellipse v-if="guidePreset==='thirds'" cx="50" cy="38" rx="22" ry="28" fill="none" stroke="rgba(74,222,128,.9)" stroke-width="1.5" vector-effect="non-scaling-stroke" />
              <rect v-else-if="guidePreset==='passport'" x="25" y="8" width="50" height="65" rx="1.5" fill="none" stroke="rgba(74,222,128,.9)" stroke-width="1.5" vector-effect="non-scaling-stroke" />
              <rect v-else-if="guidePreset==='visa'" x="27" y="10" width="46" height="62" rx="1.5" fill="none" stroke="rgba(74,222,128,.9)" stroke-width="1.5" vector-effect="non-scaling-stroke" />
            </svg>
          </div>
          <div
            v-if="!hasImage"
            class="pointer-events-none absolute inset-0 grid place-items-center rounded-lg text-center text-sm text-muted"
          >
            <div>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" class="mx-auto mb-2 text-brand-blue">
                <path d="M12 16V4m0 0L8 8m4-4l4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
              {{ $t('tool.dropHint') }}
            </div>
          </div>
          <div
            v-if="isReading"
            class="absolute inset-0 grid place-items-center rounded-lg bg-white/70"
          >
            <span class="flex items-center gap-2 text-sm font-medium text-brand-blue">
              <svg class="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" class="opacity-25"/>
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
              </svg>
              {{ $t('tool.noteReading') }}
            </span>
          </div>
        </div>
        <p class="text-xs text-muted">
          {{ $t('tool.dragHint') }}
        </p>
        <p class="text-[11px] text-muted">
          {{ $t('tool.pasteHint') }}
        </p>
      </div>

      <!-- 控制区 -->
      <div class="flex flex-col gap-4 p-5">
        <!-- 文档选择 -->
        <div>
          <label class="eyebrow">{{ $t('tool.document') }}</label>
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

        <!-- 上传 / 拍照 -->
        <div class="grid grid-cols-2 gap-2">
          <label class="btn-primary w-full cursor-pointer text-center">
            <input type="file" accept="image/*" class="hidden" @change="onFileInput" />
            {{ hasImage ? $t('tool.replace') : $t('tool.upload') }}
          </label>
          <label class="btn-secondary w-full cursor-pointer text-center" :title="$t('tool.captureHint')">
            <input type="file" accept="image/*" capture="environment" class="hidden" @change="onFileInput" />
            {{ hasImage ? $t('tool.retake') : $t('tool.capture') }}
          </label>
        </div>

        <!-- 调整 -->
        <div class="space-y-3" :class="{ 'opacity-40': !hasImage }">
          <div class="flex flex-wrap items-center gap-2">
            <button class="rounded-lg border border-slate-300 px-2 py-1.5 text-xs font-medium" :disabled="!canUndo" @click="undo()">↶ {{ $t('tool.undo') }}</button>
            <button class="rounded-lg border border-slate-300 px-2 py-1.5 text-xs font-medium" :disabled="!canRedo" @click="redo()">↷ {{ $t('tool.redo') }}</button>
            <button class="rounded-lg border px-2 py-1.5 text-xs font-medium" :class="showGuides?'border-brand-blue bg-brand-blue/5 text-brand-blue':'border-slate-300'" @click="showGuides=!showGuides">{{ $t('tool.guides') }}</button>
            <select v-model="guidePreset" :disabled="!showGuides" class="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs" :title="$t('tool.guidePreset')">
              <option value="thirds">{{ $t('tool.presetThirds') }}</option>
              <option value="passport">{{ $t('tool.presetPassport') }}</option>
              <option value="visa">{{ $t('tool.presetVisa') }}</option>
            </select>
          </div>
          <div>
            <div class="flex justify-between text-xs text-muted"><span>{{ $t('tool.zoom') }}</span><span>{{ scale.toFixed(2) }}x</span></div>
            <input type="range" min="0.5" max="3" step="0.01" v-model.number="scale" class="w-full accent-brand-blue" :disabled="!hasImage" @change="commit()" />
          </div>
          <div>
            <div class="flex justify-between text-xs text-muted"><span>{{ $t('tool.rotate') }}</span><span>{{ rotate }}°</span></div>
            <input type="range" min="-45" max="45" step="1" v-model.number="rotate" class="w-full accent-brand-blue" :disabled="!hasImage" @change="commit()" />
          </div>
          <div>
            <div class="flex justify-between text-xs text-muted"><span>{{ $t('tool.brightness') }}</span><span>{{ brightness }}%</span></div>
            <input type="range" min="50" max="150" step="1" v-model.number="brightness" class="w-full accent-brand-blue" :disabled="!hasImage" @change="commit()" />
          </div>
          <div>
            <div class="flex justify-between text-xs text-muted"><span>{{ $t('tool.contrast') }}</span><span>{{ contrast }}%</span></div>
            <input type="range" min="50" max="150" step="1" v-model.number="contrast" class="w-full accent-brand-blue" :disabled="!hasImage" @change="commit()" />
          </div>
          <button class="text-xs text-brand-blue underline" :disabled="!hasImage" @click="resetTransforms(); draw(); commit()">{{ $t('tool.reset') }}</button>
          <!-- 裁剪模式 + 自动预裁剪 -->
          <div class="border-t border-slate-200 pt-3">
            <label class="eyebrow">{{ $t('tool.fitMode') }}</label>
            <div class="mt-2 grid grid-cols-2 gap-2">
              <button class="rounded-lg border px-2 py-2 text-xs font-medium" :class="fitMode==='cover'?'border-brand-blue bg-brand-blue/5 text-brand-blue':'border-slate-300'" @click="fitMode='cover';draw();commit()">{{ $t('tool.fitCover') }}</button>
              <button class="rounded-lg border px-2 py-2 text-xs font-medium" :class="fitMode==='contain'?'border-brand-blue bg-brand-blue/5 text-brand-blue':'border-slate-300'" @click="fitMode='contain';draw();commit()">{{ $t('tool.fitContain') }}</button>
            </div>
            <button class="mt-2 text-xs text-brand-blue underline" :disabled="!hasImage" @click="smartCrop()">{{ $t('tool.autoCrop') }}</button>
          </div>
        </div>

        <!-- 背景 -->
        <div>
          <label class="eyebrow">{{ $t('tool.background') }}</label>
          <div class="mt-2 grid grid-cols-3 gap-2">
            <button class="rounded-lg border px-2 py-2 text-xs font-medium" :class="bgMode==='white'?'border-brand-blue bg-brand-blue/5 text-brand-blue':'border-slate-300'" @click="setBg('white')">{{ $t('tool.bgWhite') }}</button>
            <button class="rounded-lg border px-2 py-2 text-xs font-medium" :class="bgMode==='blue'?'border-brand-blue bg-brand-blue/5 text-brand-blue':'border-slate-300'" @click="setBg('blue')">{{ $t('tool.bgBlue') }}</button>
            <button class="rounded-lg border px-2 py-2 text-xs font-medium" :class="bgMode==='grey'?'border-brand-blue bg-brand-blue/5 text-brand-blue':'border-slate-300'" @click="setBg('grey')">{{ $t('tool.bgGrey') }}</button>
            <button class="rounded-lg border px-2 py-2 text-xs font-medium" :class="bgMode==='keep'?'border-brand-blue bg-brand-blue/5 text-brand-blue':'border-slate-300'" @click="setBg('keep')">{{ $t('tool.bgKeep') }}</button>
            <button class="rounded-lg border px-2 py-2 text-xs font-medium" :class="bgMode==='ai'?'border-brand-blue bg-brand-blue/5 text-brand-blue':'border-slate-300'" :disabled="!hasImage||isProcessing" @click="removeBackgroundAI()">{{ $t('tool.bgAi') }}</button>
            <button class="rounded-lg border px-2 py-2 text-xs font-medium" :class="bgMode==='custom'?'border-brand-blue bg-brand-blue/5 text-brand-blue':'border-slate-300'" @click="setBg('custom')">{{ $t('tool.bgCustom') }}</button>
          </div>
          <div v-if="bgMode==='custom'" class="mt-2 flex items-center gap-2 text-xs text-muted">
            <input type="color" v-model="customColor" @input="bgMode='custom';draw()" @change="commit()" class="h-8 w-10 rounded border border-slate-300" />
            <span>{{ $t('tool.customLabel') }}</span>
          </div>
        </div>

        <!-- 下载 -->
        <div class="mt-1 grid grid-cols-3 gap-2">
          <button class="btn-primary" :disabled="!hasImage" @click="downloadJPG()">{{ $t('tool.jpg') }}</button>
          <button class="btn-yellow" :disabled="!hasImage||isProcessing" @click="downloadPDF()">{{ $t('tool.pdf') }}</button>
          <button class="btn-secondary" :disabled="!hasImage" @click="downloadPNG()">{{ $t('tool.png') }}</button>
        </div>

        <!-- 合规校验 -->
        <div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div class="flex items-center justify-between">
            <p class="text-xs font-semibold text-ink">{{ $t('tool.compliance') }}</p>
            <button class="btn-secondary px-3 py-1.5 text-xs" :disabled="!hasImage" @click="checkCompliance()">{{ $t('tool.check') }}</button>
          </div>
          <div v-if="compliance" class="mt-2 space-y-1 text-[11px] leading-relaxed">
            <div class="flex items-center gap-1"><span :class="compliance.sizeOk ? 'text-accent-green' : 'text-amber-600'">●</span> {{ cw }}×{{ ch }} px · {{ $t('tool.dimOk') }}</div>
            <div class="flex items-center gap-1"><span :class="compliance.sizeOk ? 'text-accent-green' : 'text-amber-600'">●</span> {{ $t('tool.sizeLabel') }}: ~{{ compliance.kb }} KB <span v-if="!compliance.sizeOk" class="text-amber-600">{{ $t('tool.sizeWarn', { kb: compliance.kb }) }}</span></div>
            <div v-if="compliance.face !== 'na'" class="flex items-center gap-1"><span :class="compliance.face === 'ok' ? 'text-accent-green' : 'text-amber-600'">●</span> {{ compliance.face === 'ok' ? $t('tool.faceOk') : $t('tool.faceWarn') }}</div>
            <div v-else class="text-muted">{{ $t('tool.faceNa') }}</div>
          </div>
        </div>

        <!-- 排版打印页 -->
        <div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p class="text-xs font-semibold text-ink">{{ $t('tool.sheetTitle') }}</p>
          <div class="mt-2 flex items-center gap-2">
            <select v-model.number="sheetCopies" class="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs">
              <option :value="4">{{ $t('tool.copies4') }}</option>
              <option :value="6">{{ $t('tool.copies6') }}</option>
              <option :value="8">{{ $t('tool.copies8') }}</option>
            </select>
            <select v-model="sheetPreset" class="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs">
              <option value="4x6">{{ $t('tool.preset4x6') }}</option>
              <option value="A4">{{ $t('tool.presetA4') }}</option>
            </select>
            <button class="btn-secondary ml-auto px-3 py-1.5 text-xs" :disabled="!hasImage||isProcessing" @click="downloadSheet()">{{ $t('tool.sheetBtn') }}</button>
          </div>
        </div>

        <p v-if="note" class="text-xs text-accent-green">{{ note }}</p>
        <p v-if="selDoc" class="text-[11px] leading-relaxed text-muted">
          {{ selDoc.size.inch }} in · {{ selDoc.dpi }} dpi · {{ selDoc.format }} · {{ countryName(selDoc.country) }}
        </p>
      </div>
    </div>

    <!-- 批量处理 -->
    <div class="border-t border-slate-200 bg-white p-5">
      <div class="flex items-center justify-between">
        <p class="text-sm font-semibold text-ink">{{ $t('tool.batchTitle') }}</p>
        <span class="text-xs text-muted">{{ $t('tool.loaded', { count: batchItems.length }) }}</span>
      </div>
      <p class="mt-1 text-xs text-muted">
        {{ $t('tool.batchSub') }}
      </p>
      <label class="btn-secondary mt-3 inline-flex cursor-pointer items-center gap-2">
        <input type="file" accept="image/*" multiple class="hidden" @change="onBatchFiles" />
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 16V4m0 0L8 8m4-4l4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        {{ $t('tool.addPhotos') }}
      </label>

      <div v-if="batchItems.length" class="mt-3">
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          <div v-for="it in batchItems" :key="it.id" class="rounded-lg border border-slate-200 p-2">
            <div class="aspect-[3/4] overflow-hidden rounded bg-slate-100">
              <img :src="it.thumb" class="h-full w-full object-cover" alt="" />
            </div>
            <p class="mt-1 truncate text-[11px] text-muted">{{ it.name }}</p>
            <div class="mt-1 flex gap-1">
              <button class="flex-1 rounded bg-brand-blue/10 px-1 py-1 text-[10px] font-medium text-brand-blue" @click="downloadBatchItem(it)">{{ $t('tool.jpg') }}</button>
              <button class="rounded bg-slate-100 px-1 py-1 text-[10px] text-muted" @click="removeBatchItem(it.id)">✕</button>
            </div>
          </div>
        </div>
        <button class="btn-primary mt-3" :disabled="isProcessing" @click="downloadBatchZip()">
          {{ $t('tool.downloadAll') }}
        </button>
      </div>
    </div>
  </div>
</template>
