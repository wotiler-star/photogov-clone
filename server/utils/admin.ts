// 管理后台共享工具：数据路径解析 + 鉴权
import path from 'node:path'
import { getCookie, createError } from 'h3'

export const DATA_DIR = path.resolve(process.cwd(), 'data')

export function dataFile(name: string): string {
  return path.join(DATA_DIR, name)
}

// 简易会话：比对 ADMIN_PASSWORD 后种下的 cookie 令牌
const ADMIN_PW = process.env.ADMIN_PASSWORD || 'photogov-admin'
const ADMIN_TOKEN = `pg-${ADMIN_PW.length}-${ADMIN_PW.slice(0, 3)}`

export function expectedToken(): string {
  return ADMIN_TOKEN
}

export function requireAdmin(event: any) {
  const token = getCookie(event, 'admin_token')
  if (token !== ADMIN_TOKEN) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
}

export function checkPassword(pw: string): boolean {
  return pw === ADMIN_PW
}
