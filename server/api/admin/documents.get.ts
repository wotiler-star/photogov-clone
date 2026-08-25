// GET /api/admin/documents  —— 列出全部证件（需鉴权）
import { defineEventHandler } from 'h3'
import { promises as fs } from 'node:fs'
import { dataFile, requireAdmin } from '../../utils/admin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const raw = JSON.parse(await fs.readFile(dataFile('documents.json'), 'utf-8'))
  return { documents: Object.values(raw.documents), total: Object.keys(raw.documents).length }
})
