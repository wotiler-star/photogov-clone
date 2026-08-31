// GET /api/app/v1/photo/my —— 当前用户的「我的照片」
import { defineEventHandler } from 'h3'
import { getCurrentUser } from '../../../../utils/auth'
import { readJson } from '../../../../utils/store'

export default defineEventHandler((event) => {
  const user = getCurrentUser(event)
  if (!user) return { photos: [] }
  const photos = readJson<any[]>('photos.json', [])
  return { photos: photos.filter((p) => p.userId === user.id) }
})
