// POST /api/app/v1/photo/upload  (对齐原站 filesystem/upload)
// 接收 multipart 图片，落盘存储并返回可访问 URL 与 id。
import { defineEventHandler, readMultipartFormData, createError } from 'h3'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

const UPLOAD_DIR = path.join(process.cwd(), '.uploads')

export default defineEventHandler(async (event) => {
  const parts = await readMultipartFormData(event)
  if (!parts) throw createError({ statusCode: 400, statusMessage: 'No multipart data' })
  const img = parts.find((p) => p.name === 'image' || p.name === 'file')
  if (!img) throw createError({ statusCode: 400, statusMessage: 'Missing image field' })

  const ext = (img.filename?.split('.').pop() || 'jpg').toLowerCase()
  const id = `${randomUUID()}.${ext === 'jpeg' ? 'jpg' : ext}`

  await fs.mkdir(UPLOAD_DIR, { recursive: true })
  await fs.writeFile(path.join(UPLOAD_DIR, id), img.data)

  const origin = getRequestURL(event).origin
  return {
    id,
    url: `${origin}/api/app/v1/photo/file/${id}`,
    filename: img.filename || id,
    size: img.data.length
  }
})
