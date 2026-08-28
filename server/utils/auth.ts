// 会员（前台用户）鉴权与用户存储工具
// 设计：JSON 文件存储（data/users.json） + scrypt 密码哈希 + HMAC 签名会话 cookie
// 与项目既有 admin 鉴权风格保持一致，但面向真实多用户注册场景。
import { randomBytes, randomUUID, scryptSync, createHmac, timingSafeEqual } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { getCookie, setCookie, deleteCookie, H3Event, createError } from 'h3'

export interface UserRecord {
  id: string
  name: string
  email: string
  passwordHash: string
  salt: string
  plan: 'free' | 'premium'
  planExpiresAt: string | null
  emailVerified: boolean
  emailVerifyToken: string | null
  emailVerifyExpires: string | null
  passwordResetToken: string | null
  passwordResetExpires: string | null
  createdAt: string
}

export type PublicUser = Omit<UserRecord, 'passwordHash' | 'salt'>

const USERS_FILE = path.resolve(process.cwd(), 'data', 'users.json')
const SESSION_COOKIE = 'pg_session'
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-insecure-session-secret-change-me'
const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 天

// ---------- 用户存储 ----------
function loadUsers(): UserRecord[] {
  try {
    if (!existsSync(USERS_FILE)) return []
    return JSON.parse(readFileSync(USERS_FILE, 'utf8')) as UserRecord[]
  } catch {
    return []
  }
}

function saveUsers(users: UserRecord[]) {
  writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))
}

export function findUserByEmail(email: string): UserRecord | undefined {
  const e = email.trim().toLowerCase()
  return loadUsers().find((u) => u.email === e)
}

export function findUserById(id: string): UserRecord | undefined {
  return loadUsers().find((u) => u.id === id)
}

// ---------- 密码哈希 ----------
function hashPassword(password: string): { hash: string; salt: string } {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return { hash, salt }
}

export function verifyPassword(password: string, record: UserRecord): boolean {
  const expected = Buffer.from(record.passwordHash, 'hex')
  const hash = scryptSync(password, record.salt, 64)
  return hash.length === expected.length && timingSafeEqual(hash, expected)
}

export function publicUser(u: UserRecord): PublicUser {
  const { passwordHash, salt, ...rest } = u
  void passwordHash
  void salt
  return rest
}

export function createUser(input: { name: string; email: string; password: string }): UserRecord {
  const email = input.email.trim().toLowerCase()
  const users = loadUsers()
  if (users.some((u) => u.email === email)) {
    throw createError({ statusCode: 409, statusMessage: 'EMAIL_EXISTS' })
  }
  const { hash, salt } = hashPassword(input.password)
  const user: UserRecord = {
    id: randomUUID(),
    name: input.name.trim(),
    email,
    passwordHash: hash,
    salt,
    plan: 'free',
    planExpiresAt: null,
    emailVerified: false,
    emailVerifyToken: null,
    emailVerifyExpires: null,
    passwordResetToken: null,
    passwordResetExpires: null,
    createdAt: new Date().toISOString()
  }
  users.push(user)
  saveUsers(users)
  return user
}

// ---------- 邮箱验证 / 密码找回 / 订阅 ----------
function genToken(): string {
  return randomBytes(32).toString('hex')
}

const HOUR = 3600 * 1000
const DAY = 24 * HOUR

// 无 SMTP 时把邮件内容打到服务端日志；EMAIL_DEBUG=1 或开发环境额外回传操作链接便于演示。
export const EMAIL_DEBUG = process.env.EMAIL_DEBUG === '1' || process.env.NODE_ENV !== 'production'

function updateUser(id: string, patch: Partial<UserRecord>): UserRecord | undefined {
  const users = loadUsers()
  const i = users.findIndex((u) => u.id === id)
  if (i === -1) return undefined
  users[i] = { ...users[i], ...patch }
  saveUsers(users)
  return users[i]
}

export function createEmailVerifyToken(email: string): string | null {
  const user = findUserByEmail(email)
  if (!user) return null
  const token = genToken()
  updateUser(user.id, {
    emailVerifyToken: token,
    emailVerifyExpires: new Date(Date.now() + DAY).toISOString()
  })
  return token
}

export function verifyEmailToken(token: string): PublicUser | null {
  const users = loadUsers()
  const user = users.find((u) => u.emailVerifyToken === token)
  if (!user || !user.emailVerifyExpires) return null
  if (Date.now() > new Date(user.emailVerifyExpires).getTime()) return null
  const updated = updateUser(user.id, {
    emailVerified: true,
    emailVerifyToken: null,
    emailVerifyExpires: null
  })
  return updated ? publicUser(updated) : null
}

export function createPasswordResetToken(email: string): string | null {
  const user = findUserByEmail(email)
  if (!user) return null
  const token = genToken()
  updateUser(user.id, {
    passwordResetToken: token,
    passwordResetExpires: new Date(Date.now() + HOUR).toISOString()
  })
  return token
}

export function resetPasswordWithToken(token: string, newPassword: string): PublicUser | null {
  const users = loadUsers()
  const user = users.find((u) => u.passwordResetToken === token)
  if (!user || !user.passwordResetExpires) return null
  if (Date.now() > new Date(user.passwordResetExpires).getTime()) return null
  const { hash, salt } = hashPassword(newPassword)
  const updated = updateUser(user.id, {
    passwordHash: hash,
    salt,
    passwordResetToken: null,
    passwordResetExpires: null
  })
  return updated ? publicUser(updated) : null
}

export function setPlan(
  id: string,
  plan: 'free' | 'premium',
  expiresAt: string | null
): PublicUser | null {
  const updated = updateUser(id, { plan, planExpiresAt: expiresAt })
  return updated ? publicUser(updated) : null
}

// ---------- 会话（签名 cookie） ----------
function signSession(userId: string): string {
  const sig = createHmac('sha256', SESSION_SECRET).update(userId).digest('hex')
  return `${userId}.${sig}`
}

function verifySession(token?: string | null): string | null {
  if (!token || !token.includes('.')) return null
  const [userId, sig] = token.split('.')
  const expected = createHmac('sha256', SESSION_SECRET).update(userId).digest('hex')
  const a = Buffer.from(sig || '', 'hex')
  const b = Buffer.from(expected, 'hex')
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  return userId
}

export function setSessionCookie(event: H3Event, userId: string) {
  setCookie(event, SESSION_COOKIE, signSession(userId), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE
  })
}

export function clearSessionCookie(event: H3Event) {
  deleteCookie(event, SESSION_COOKIE, { path: '/' })
}

export function getCurrentUser(event: H3Event): PublicUser | null {
  const token = getCookie(event, SESSION_COOKIE)
  const userId = verifySession(token)
  if (!userId) return null
  const user = findUserById(userId)
  return user ? publicUser(user) : null
}
