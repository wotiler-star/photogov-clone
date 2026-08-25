// POST /api/admin/documents  —— 新建证件（需鉴权）
import { defineEventHandler, readBody, createError } from 'h3'
import { promises as fs } from 'node:fs'
import { dataFile, requireAdmin } from '../../utils/admin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readBody(event)
  if (!body?.slug || !body?.name || !body?.country) {
    throw createError({ statusCode: 400, statusMessage: 'slug, name, country required' })
  }
  const file = dataFile('documents.json')
  const raw = JSON.parse(await fs.readFile(file, 'utf-8'))
  if (raw.documents[body.slug]) {
    throw createError({ statusCode: 409, statusMessage: 'slug exists' })
  }
  const doc = {
    slug: body.slug,
    country: body.country,
    countryName: body.countryName || body.country,
    name: body.name,
    title: body.title || body.name,
    category: body.category || 'other',
    popular: !!body.popular,
    quickLink: !!body.quickLink,
    size: body.size || { inch: '2x2', mm: '51x51', cm: '5.1x5.1', px: '600x600', w: 600, h: 600 },
    headHeight: body.headHeight || '1.29 inch',
    eyesLevel: body.eyesLevel || '1.18 inch',
    background: body.background || '#FFFFFF',
    format: body.format || 'JPEG',
    dpi: body.dpi || 300,
    fileSize: body.fileSize || '1 MB-15 MB',
    glasses: body.glasses ?? false,
    expression: body.expression || 'Neutral',
    year: body.year || new Date().getFullYear(),
    source: body.source || 'admin',
    verified: body.verified ?? true
  }
  raw.documents[body.slug] = doc
  await fs.writeFile(file, JSON.stringify(raw, null, 2))
  return { ok: true, document: doc }
})
