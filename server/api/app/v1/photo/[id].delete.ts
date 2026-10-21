// DELETE /api/app/v1/photo/[id] —— 删除「我的照片」中的一张（需登录且属本人）
import { defineEventHandler, createError, getRouterParam } from 'h3'
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

export default defineEventHandler((event) => {
  const user = getCurrentUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'UNAUTHORIZED' })

  const id = getRouterParam(event, 'id') || ''
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID_REQUIRED' })

  const photos = readJson<PhotoRecord[]>('photos.json', [])
  const target = photos.find((p) => p.id === id)
  if (!target || target.userId !== user.id) {
    throw createError({ statusCode: 404, statusMessage: 'PHOTO_NOT_FOUND' })
  }
  writeJson('photos.json', photos.filter((p) => p.id !== id))
  return { ok: true }
})
