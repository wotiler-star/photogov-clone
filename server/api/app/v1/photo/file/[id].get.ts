// GET /api/app/v1/photo/file/:id  —— 返回上传存储的图片（对齐原站图片 CDN）
import { defineEventHandler, createError, setResponseHeaders } from 'h3'
import { promises as fs } from 'node:fs'
import path from 'node:path'

const UPLOAD_DIR = path.join(process.cwd(), '.uploads')

const TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif'
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') || ''
  // 防目录穿越
  if (id.includes('/') || id.includes('..')) {
    throw createError({ statusCode: 400, statusMessage: 'Bad id' })
  }
  const file = path.join(UPLOAD_DIR, id)
  try {
    const buf = await fs.readFile(file)
    const ext = id.split('.').pop()?.toLowerCase() || 'jpg'
    setResponseHeaders(event, {
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable'
    })
    return buf
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'File not found' })
  }
})
