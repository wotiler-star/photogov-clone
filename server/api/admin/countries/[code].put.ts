// PUT /api/admin/countries/:code  —— 更新国家（需鉴权）
import { defineEventHandler, readBody, createError } from 'h3'
import { promises as fs } from 'node:fs'
import { dataFile, requireAdmin } from '../../../utils/admin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const code = getRouterParam(event, 'code')
  const body = await readBody(event)
  const file = dataFile('countries.json')
  const raw = JSON.parse(await fs.readFile(file, 'utf-8'))
  const idx = raw.countries.findIndex((c: any) => c.code === code)
  if (idx === -1) throw createError({ statusCode: 404, statusMessage: 'Country not found' })
  raw.countries[idx] = { ...raw.countries[idx], ...body, code }
  await fs.writeFile(file, JSON.stringify(raw, null, 2))
  return { ok: true, country: raw.countries[idx] }
})
