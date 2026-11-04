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
  autoRenewal: boolean
  emailVerified: boolean
  emailVerifyToken: string | null
  emailVerifyExpires: string | null
  passwordResetToken: string | null
  passwordResetExpires: string | null
  passwordChangedAt: string | null
  deletionScheduledAt: string | null
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
    autoRenewal: true,
    emailVerified: false,
    emailVerifyToken: null,
    emailVerifyExpires: null,
    passwordResetToken: null,
    passwordResetExpires: null,
    passwordChangedAt: new Date().toISOString(),
    deletionScheduledAt: null,
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

// 只有邮件通道可用（已配置 SMTP，或显式开启 EMAIL_DEBUG 走 devLink）时才启用
// 邮箱验证门控；否则用户永远收不到验证链接，门控会把账户永久锁死。
// 生产环境配好 SMTP_* 后该常量自动变为 true，激活策略即完整生效。
export const VERIFICATION_REQUIRED = !!process.env.SMTP_HOST || EMAIL_DEBUG
if (!VERIFICATION_REQUIRED) {
  console.warn('[auth] SMTP unset and EMAIL_DEBUG=0: email verification gate disabled (fail-open) to avoid locking users out')
}

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
    passwordResetExpires: null,
    passwordChangedAt: new Date().toISOString()
  })
  return updated ? publicUser(updated) : null
}

// ---------- 会员中心：改密 / 删除账户（软删除）/ 资料 / 自动续费 ----------
const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/
export const DELETION_RECOVERY_DAYS = 14

export function validatePasswordStrength(password: string): boolean {
  return PASSWORD_RULE.test(password)
}

/** 已登录用户修改密码：需验证当前密码 */
export function changePassword(
  id: string,
  currentPassword: string,
  newPassword: string
): PublicUser | null {
  const user = findUserById(id)
  if (!user) return null
  if (!verifyPassword(currentPassword, user)) {
    throw createError({ statusCode: 400, statusMessage: 'INVALID_CURRENT_PASSWORD' })
  }
  if (!validatePasswordStrength(newPassword)) {
    throw createError({ statusCode: 400, statusMessage: 'WEAK_PASSWORD' })
  }
  const { hash, salt } = hashPassword(newPassword)
  const updated = updateUser(id, {
    passwordHash: hash,
    salt,
    passwordChangedAt: new Date().toISOString()
  })
  return updated ? publicUser(updated) : null
}

/** 软删除：标记 14 天后删除，期间可恢复 */
export function scheduleAccountDeletion(id: string): PublicUser | null {
  const user = findUserById(id)
  if (!user) return null
  if (user.deletionScheduledAt) {
    throw createError({ statusCode: 409, statusMessage: 'DELETION_ALREADY_SCHEDULED' })
  }
  const deletionAt = new Date(Date.now() + DELETION_RECOVERY_DAYS * 24 * 3600 * 1000).toISOString()
  const updated = updateUser(id, { deletionScheduledAt: deletionAt })
  return updated ? publicUser(updated) : null
}

/** 取消待删除 */
export function cancelAccountDeletion(id: string): PublicUser | null {
  const user = findUserById(id)
  if (!user) return null
  if (!user.deletionScheduledAt) {
    throw createError({ statusCode: 409, statusMessage: 'NO_DELETION_SCHEDULED' })
  }
  const updated = updateUser(id, { deletionScheduledAt: null })
  return updated ? publicUser(updated) : null
}

/** 更新个人资料（姓名；邮箱变更需联系技术支持，与目标站一致） */
export function updateProfile(id: string, name: string): PublicUser | null {
  const trimmed = name.trim()
  if (!trimmed) throw createError({ statusCode: 400, statusMessage: 'NAME_REQUIRED' })
  const updated = updateUser(id, { name: trimmed })
  return updated ? publicUser(updated) : null
}

/** 自动续费开关 */
export function setAutoRenewal(id: string, enabled: boolean): PublicUser | null {
  const updated = updateUser(id, { autoRenewal: enabled })
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

/**
 * 激活策略门控（复刻原站账户激活策略）：
 * 要求登录且邮箱已验证，否则抛出 EMAIL_NOT_VERIFIED（403）。
 * 用于结账 / 订阅等「付费解锁」边界——未验证账户无法完成购买。
 *
 * 例外：邮件通道完全不可用（未配 SMTP 且未开 EMAIL_DEBUG）时 fail-open，
 * 因为此时用户不可能完成验证；配好 SMTP 后自动恢复门控。
 */
export function requireVerified(event: H3Event): PublicUser {
  const user = getCurrentUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'UNAUTHORIZED' })
  if (!VERIFICATION_REQUIRED) return user
  if (!user.emailVerified)
    throw createError({ statusCode: 403, statusMessage: 'EMAIL_NOT_VERIFIED' })
  return user
}
