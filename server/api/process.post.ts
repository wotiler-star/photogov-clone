// 服务端图片处理 API —— 裁剪/缩放/背景替换/亮度对比（我们自己的 Nuxt Nitro 实现，对应原站后端图像处理服务）
// 入参（multipart/form-data）：image, width, height, format(jpeg|png), background(#RRGGBB),
// brightness(0-200), contrast(0-200)
import { defineEventHandler, readMultipartFormData, createError, setResponseHeaders } from 'h3'

export default defineEventHandler(async (event) => {
  const parts = await readMultipartFormData(event)
  if (!parts) throw createError({ statusCode: 400, statusMessage: 'No multipart data' })
  const img = parts.find((p) => p.name === 'image')
  if (!img) throw createError({ statusCode: 400, statusMessage: 'Missing image field' })

  const field = (n: string, d = '') => {
    const p = parts.find((x) => x.name === n)
    return p ? p.data.toString() : d
  }
  const w = parseInt(field('width', '600')) || 600
  const h = parseInt(field('height', '600')) || 600
  const format = field('format', 'jpeg')
  const bg = field('background', '#FFFFFF')
  const bright = (parseFloat(field('brightness', '100')) || 100) / 100
  const contrast = (parseFloat(field('contrast', '100')) || 100) / 100

  const sharp = (await import('sharp')).default
  let pipe = sharp(img.data).resize(w, h, { fit: 'cover' })
  pipe = pipe.flatten({ background: bg })
  pipe = pipe.modulate({ brightness: bright })
  pipe = pipe.linear(contrast, 0)

  const buf = await pipe
    .toFormat(format === 'png' ? 'png' : 'jpeg', { quality: 92 })
    .toBuffer()

  setResponseHeaders(event, {
    'Content-Type': format === 'png' ? 'image/png' : 'image/jpeg',
    'Cache-Control': 'no-store'
  })
  return buf
})
