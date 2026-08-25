// PUT /api/admin/documents/:slug  —— 更新证件（需鉴权）
import { defineEventHandler, readBody, createError } from 'h3'
import { promises as fs } from 'node:fs'
import { dataFile, requireAdmin } from '../../../utils/admin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const slug = getRouterParam(event, 'slug')
  const body = await readBody(event)
  const file = dataFile('documents.json')
  const raw = JSON.parse(await fs.readFile(file, 'utf-8'))
  if (!raw.documents[slug as string]) {
    throw createError({ statusCode: 404, statusMessage: 'Document not found' })
  }
  raw.documents[slug as string] = { ...raw.documents[slug as string], ...body, slug }
  await fs.writeFile(file, JSON.stringify(raw, null, 2))
  return { ok: true, document: raw.documents[slug as string] }
})
