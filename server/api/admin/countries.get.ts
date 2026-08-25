// GET /api/admin/countries  —— 列出全部国家（需鉴权）
import { defineEventHandler } from 'h3'
import { promises as fs } from 'node:fs'
import { dataFile, requireAdmin } from '../../utils/admin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const raw = JSON.parse(await fs.readFile(dataFile('countries.json'), 'utf-8'))
  return { countries: raw.countries, total: raw.countries.length }
})
