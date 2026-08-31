// POST /api/app/v1/photo/save —— 把已上传的照片存入「我的照片」（需登录）
import { defineEventHandler, readBody, createError } from 'h3'
import { getCurrentUser } from '../../../../utils/auth'
import { readJson, writeJson } from '../../../../utils/store'

interface PhotoRecord {
  id: string
  userId: string
  imageId: string
  url: string
  docSlug: string
  docName: string
  createdAt: string
}

export default defineEventHandler(async (event) => {
  const user = getCurrentUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'UNAUTHORIZED' })

  const body = await readBody(event).catch(() => ({}))
  const imageId = String(body?.imageId || '')
  if (!imageId) throw createError({ statusCode: 400, statusMessage: 'IMAGE_REQUIRED' })

  const photos = readJson<PhotoRecord[]>('photos.json', [])
  const record: PhotoRecord = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    userId: user.id,
    imageId,
    url: `${getRequestURL(event).origin}/api/app/v1/photo/file/${imageId}`,
    docSlug: String(body?.docSlug || ''),
    docName: String(body?.docName || ''),
    createdAt: new Date().toISOString()
  }
  photos.unshift(record)
  writeJson('photos.json', photos)

  return { ok: true, photo: record }
})
