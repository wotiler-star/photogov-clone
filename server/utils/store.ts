// 通用 JSON 文件存储助手（用于订单、照片等用户数据）
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const DATA_DIR = path.resolve(process.cwd(), 'data')

export function readJson<T>(name: string, fallback: T): T {
  try {
    const file = path.join(DATA_DIR, name)
    if (!existsSync(file)) return fallback
    return JSON.parse(readFileSync(file, 'utf8')) as T
  } catch {
    return fallback
  }
}

export function writeJson(name: string, data: unknown) {
  writeFileSync(path.join(DATA_DIR, name), JSON.stringify(data, null, 2))
}
