// 客户端图片导出工具：PNG 直接下载；PDF 为自研多页生成器（canvas→JPEG→DCTDecode 嵌入）。
// 支持两种排版：
//   - 'single'：每页一张，页面尺寸=图片像素尺寸（适合直接冲印/上传）
//   - 'sheet' ：每页 N 张网格（证件照排版纸），支持 A4 / Letter / 4×6 照片纸
// 仅客户端使用（点击下载时调用），SSR 不会执行。

export type PdfPageSize = 'a4' | 'letter' | '4x6'
export type PdfPerSheet = 1 | 2 | 4 | 6 | 8 | 9 | 12

export interface PdfSheetOptions {
  layout?: 'single' | 'sheet'
  page?: PdfPageSize
  perSheet?: PdfPerSheet
  margin?: number // 页边距（pt）
  gap?: number // 图片间距（pt）
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export async function downloadImageAsPng(imageUrl: string, filename: string) {
  const resp = await fetch(imageUrl)
  const blob = await resp.blob()
  downloadBlob(blob, filename.endsWith('.png') ? filename : `${filename}.png`)
}

// ---------- 最小 PDF 生成器（对象化 xref，多页多图，图片去重） ----------

const PAGE_SIZES: Record<PdfPageSize, { w: number; h: number }> = {
  a4: { w: 595.28, h: 841.89 },
  letter: { w: 612, h: 792 },
  '4x6': { w: 288, h: 432 }
}

type ObjPart = string | Uint8Array

class PdfBuilder {
  private objects: ObjPart[][] = [] // 1-indexed（objects[0] 弃用）

  /** 添加一个间接对象，返回对象号（1-based） */
  add(parts: ObjPart | ObjPart[]): number {
    this.objects.push(Array.isArray(parts) ? parts : [parts])
    return this.objects.length
  }

  /** 回填占位对象内容 */
  set(num: number, parts: ObjPart | ObjPart[]) {
    this.objects[num - 1] = Array.isArray(parts) ? parts : [parts]
  }

  build(): Blob {
    const enc = new TextEncoder()
    const chunks: Uint8Array[] = []
    let len = 0
    const offsets: number[] = []
    const push = (p: ObjPart) => {
      const u = typeof p === 'string' ? enc.encode(p) : p
      chunks.push(u)
      len += u.length
    }

    push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')
    for (let i = 0; i < this.objects.length; i++) {
      offsets[i + 1] = len
      push(`${i + 1} 0 obj\n`)
      for (const part of this.objects[i]) push(part)
      push('\nendobj\n')
    }

    const xrefStart = len
    const total = this.objects.length + 1
    let xref = `xref\n0 ${total}\n0000000000 65535 f \n`
    for (let i = 1; i < total; i++) {
      xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
    }
    push(xref)
    push(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`)

    return new Blob(chunks as BlobPart[], { type: 'application/pdf' })
  }
}

// perSheet → [cols, rows]；按图片方向定向（竖图多行、横图多列）
function gridFor(perSheet: number, landscape: boolean): [number, number] {
  const table: Record<number, [number, number]> = {
    1: [1, 1],
    2: [2, 1],
    4: [2, 2],
    6: [3, 2],
    8: [4, 2],
    9: [3, 3],
    12: [4, 3]
  }
  const [a, b] = table[perSheet] || [2, 2]
  return landscape ? [a, b] : [b, a]
}

function fmtNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}

async function fetchJpeg(imageUrl: string): Promise<{ jpeg: Uint8Array; w: number; h: number }> {
  const resp = await fetch(imageUrl)
  const blob = await resp.blob()
  const bitmap = await createImageBitmap(blob)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas context unavailable')
  ctx.drawImage(bitmap, 0, 0)
  const jpegBlob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.95)
  )
  if (!jpegBlob) throw new Error('toBlob failed')
  const jpeg = new Uint8Array(await jpegBlob.arrayBuffer())
  const dims = { jpeg, w: bitmap.width, h: bitmap.height }
  bitmap.close?.()
  return dims
}

interface DecodedImage {
  jpeg: Uint8Array
  w: number
  h: number
}

/** 嵌入图片 XObject（同 URL 只嵌入一次，返回资源名与像素尺寸） */
function embedImage(
  pdf: PdfBuilder,
  cache: Map<string, { name: string; obj: number; w: number; h: number }>,
  img: DecodedImage,
  url: string
) {
  const hit = cache.get(url)
  if (hit) return hit
  const name = `Im${cache.size}`
  const obj = pdf.add([
    `<< /Type /XObject /Subtype /Image /Width ${img.w} /Height ${img.h} ` +
      `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode ` +
      `/Length ${img.jpeg.length} >>\nstream\n`,
    img.jpeg,
    '\nendstream'
  ])
  const entry = { name, obj, w: img.w, h: img.h }
  cache.set(url, entry)
  return entry
}

// 把一组图片 URL 导出为一个 PDF
export async function downloadImagesAsPdf(
  imageUrls: string[],
  filename: string,
  opts: PdfSheetOptions = {}
) {
  const urls = imageUrls.filter(Boolean)
  if (!urls.length) throw new Error('no images')

  const layout = opts.layout || 'single'
  const pageSize = PAGE_SIZES[opts.page || 'a4']
  const perSheet = opts.perSheet || 4
  const margin = opts.margin ?? 18
  const gap = opts.gap ?? 8

  // 1) 解码全部图片（同 URL 只解码一次）
  const decoded = new Map<string, DecodedImage>()
  for (const url of urls) {
    if (!decoded.has(url)) decoded.set(url, await fetchJpeg(url))
  }

  const pdf = new PdfBuilder()
  const imageCache = new Map<string, { name: string; obj: number; w: number; h: number }>()
  const pageObjNums: number[] = []

  // 2) 页分组
  const perPage = layout === 'sheet' ? perSheet : 1
  const groups: string[][] = []
  for (let i = 0; i < urls.length; i += perPage) groups.push(urls.slice(i, i + perPage))

  // obj 1 = Catalog，obj 2 = Pages（占位，最后回填）
  pdf.add('<< /Type /Catalog /Pages 2 0 R >>')
  pdf.add('')

  for (const group of groups) {
    const first = decoded.get(group[0])!
    const single = layout === 'single'
    const pageW = single ? first.w : pageSize.w
    const pageH = single ? first.h : pageSize.h

    const resources: string[] = []
    const ops: string[] = []

    if (single) {
      // 单页铺满：MediaBox = 图片像素尺寸，1:1 放置
      for (const url of group) {
        const img = embedImage(pdf, imageCache, decoded.get(url)!, url)
        resources.push(`/${img.name} ${img.obj} 0 R`)
        ops.push(`q ${img.w} 0 0 ${img.h} 0 0 cm /${img.name} Do Q`)
      }
    } else {
      // 网格排版：contain-fit 居中，页边距 + 间距
      const landscape = first.w >= first.h
      const [cols, rows] = gridFor(perSheet, landscape)
      const cellW = (pageW - margin * 2 - (cols - 1) * gap) / cols
      const cellH = (pageH - margin * 2 - (rows - 1) * gap) / rows

      group.forEach((url, idx) => {
        const d = decoded.get(url)!
        const col = idx % cols
        const row = Math.floor(idx / cols)
        const scale = Math.min(cellW / d.w, cellH / d.h)
        const dw = d.w * scale
        const dh = d.h * scale
        // PDF 原点在左下；row 0 为最上一行
        const x = margin + col * (cellW + gap) + (cellW - dw) / 2
        const y = pageH - margin - (row + 1) * cellH - row * gap + (cellH - dh) / 2
        const img = embedImage(pdf, imageCache, d, url)
        resources.push(`/${img.name} ${img.obj} 0 R`)
        ops.push(`q ${fmtNum(dw)} 0 0 ${fmtNum(dh)} ${fmtNum(x)} ${fmtNum(y)} cm /${img.name} Do Q`)
      })
    }

    const content = ops.join('\n')
    const enc = new TextEncoder()
    const contentObj = pdf.add([
      `<< /Length ${enc.encode(content).length} >>\nstream\n`,
      enc.encode(content),
      'endstream'
    ])
    const pageObj = pdf.add(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${fmtNum(pageW)} ${fmtNum(pageH)}] ` +
        `/Resources << /XObject << ${resources.join(' ')} >> >> /Contents ${contentObj} 0 R >>`
    )
    pageObjNums.push(pageObj)
  }

  pdf.set(
    2,
    `<< /Type /Pages /Kids [${pageObjNums.map((n) => `${n} 0 R`).join(' ')}] /Count ${pageObjNums.length} >>`
  )

  downloadBlob(pdf.build(), filename.endsWith('.pdf') ? filename : `${filename}.pdf`)
}

// 兼容旧调用：单张图片 → 单页铺满 PDF
export async function downloadImageAsPdf(imageUrl: string, filename: string) {
  await downloadImagesAsPdf([imageUrl], filename, { layout: 'single' })
}
