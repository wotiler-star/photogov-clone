// 客户端图片导出工具：PNG 直接下载；PDF 通过 canvas 重编码为 JPEG 后嵌入最小 PDF（DCTDecode）。
// 仅客户端使用（点击下载时调用），SSR 不会执行。

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

// 把任意图片 URL 转成单页 PDF（图片铺满页面，保持像素尺寸）。
export async function downloadImageAsPdf(imageUrl: string, filename: string) {
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
  bitmap.close?.()

  const enc = new TextEncoder()
  const parts: Uint8Array[] = []
  let len = 0
  const offsets: number[] = [0, 0, 0, 0, 0, 0]
  const addStr = (s: string) => {
    const u = enc.encode(s)
    parts.push(u)
    len += u.length
  }

  const w = canvas.width
  const h = canvas.height

  addStr('%PDF-1.3\n')
  offsets[1] = len
  addStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n')
  offsets[2] = len
  addStr('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n')
  offsets[3] = len
  addStr(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] ` +
      `/Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`
  )
  offsets[4] = len
  addStr(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} ` +
      `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`
  )
  parts.push(jpeg)
  len += jpeg.length
  addStr('\nendstream\nendobj\n')
  offsets[5] = len
  const content = `q ${w} 0 0 ${h} 0 0 cm /Im0 Do Q\n`
  addStr(`5 0 obj\n<< /Length ${content.length} >>\nstream\n${content}endstream\nendobj\n`)

  const xrefStart = len
  let xref = 'xref\n0 6\n0000000000 65535 f \n'
  for (let i = 1; i <= 5; i++) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }
  addStr(xref)
  addStr(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`)

  const pdf = new Blob(parts as BlobPart[], { type: 'application/pdf' })
  downloadBlob(pdf, filename.endsWith('.pdf') ? filename : `${filename}.pdf`)
}
