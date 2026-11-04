#!/usr/bin/env node
/**
 * SMTP 配置自检（在服务器上运行，不改代码、不发业务邮件）
 *
 * 用法：
 *   node scripts/check-smtp.mjs                       # 检查变量 + 测试连接
 *   node scripts/check-smtp.mjs --to you@example.com # 额外发一封测试邮件
 *   node --env-file=.env scripts/check-smtp.mjs      # 显式从 .env 注入
 *
 * 退出码：0 = 全部通过；1 = 配置缺失或连接/发信失败。
 * 密码只显示长度，绝不打印明文。
 */
import fs from 'node:fs'
import nodemailer from 'nodemailer'

// Nitro 生产运行时不读 .env；这里做零依赖兜底解析，方便直接在服务器跑
function loadEnvFile() {
  if (process.env.SMTP_HOST || !fs.existsSync('.env')) return
  const text = fs.readFileSync('.env', 'utf8')
  for (const line of text.split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line)
    if (!m || m[1].startsWith('#')) continue
    const key = m[1]
    let value = m[2].trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = value
  }
  console.log('已从 .env 读取变量（生产服务请用 start.sh / env_file / 平台环境变量注入）')
}

loadEnvFile()

const env = process.env
const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'MAIL_FROM']
const missing = required.filter(k => !String(env[k] || '').trim())
let failed = false

console.log('=== PhotoGov SMTP 自检 ===')
console.log('HOST        :', env.SMTP_HOST || '(未设置)')
console.log('PORT        :', env.SMTP_PORT || '(默认 465)')
console.log('USER        :', env.SMTP_USER || '(未设置)')
console.log('PASS        :', env.SMTP_PASS ? `已设置(${String(env.SMTP_PASS).length} 字符)` : '(未设置)')
console.log('MAIL_FROM   :', env.MAIL_FROM || '(未设置)')
console.log('SECURE      :', env.SMTP_SECURE ?? (Number(env.SMTP_PORT || 465) === 465 ? 'true(按端口推断)' : 'false(按端口推断)'))
console.log('NODE_ENV    :', env.NODE_ENV || '(未设置 → EMAIL_DEBUG 可能意外开启)')
console.log('EMAIL_DEBUG :', env.EMAIL_DEBUG || '(未设置)')

if (missing.length) {
  console.error('\n[FAIL] 缺少变量:', missing.join(', '))
  console.error('修复：在 Hostinger 面板的环境变量（或 .env）里补齐 SMTP_HOST/PORT/USER/PASS/MAIL_FROM，然后重启服务。')
  process.exit(1)
}

const port = Number(env.SMTP_PORT || 465)
const secure = (env.SMTP_SECURE ?? (port === 465 ? 'true' : 'false')) === 'true'
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port,
  secure,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  connectionTimeout: 8000,
  greetingTimeout: 8000,
  socketTimeout: 8000
})

try {
  await transporter.verify()
  console.log('\n[OK] SMTP 连接与认证成功')
} catch (e) {
  failed = true
  console.error('\n[FAIL] SMTP 连接/认证失败:', e.message)
  if (/auth|535|534|username|password/i.test(e.message)) {
    console.error('提示：多数邮件服务商要求 SMTP_USER 为完整邮箱地址、密码为邮箱密码或专用应用密码；MAIL_FROM 需与该账号同域。')
  } else if (/timeout|ETIMEDOUT|ECONNREFUSED|ENOTFOUND/i.test(e.message)) {
    console.error('提示：检查主机/端口与防火墙。465 用 SSL(secure=true)，587 用 STARTTLS(secure=false)。')
  }
}

const toIdx = process.argv.indexOf('--to')
if (!failed && toIdx > -1 && process.argv[toIdx + 1]) {
  const to = process.argv[toIdx + 1]
  try {
    const info = await transporter.sendMail({
      from: env.MAIL_FROM,
      to,
      subject: 'PhotoGov SMTP test',
      text: `PhotoGov SMTP 自检邮件，发送时间 ${new Date().toISOString()}。收到即表示验证/重置邮件可正常送达。`
    })
    console.log('[OK] 测试邮件已发送:', info.messageId, '→', to)
  } catch (e) {
    failed = true
    console.error('[FAIL] 测试邮件发送失败:', e.message)
  }
}

if (!failed) {
  console.log('\n结论：SMTP 可用。重启生产服务后：')
  console.log('  - VERIFICATION_REQUIRED = true，未验证邮箱将被结账门控拦截')
  console.log('  - 验证/重置邮件真实送达，前端不再显示「邮件未送达」警告')
  console.log('  - 生产请保持 EMAIL_DEBUG 未设置或为 0（否则会回传带 token 的 devLink）')
} else {
  console.error('\n结论：SMTP 尚不可用，请勿上线激活策略。')
}
transporter.close()
process.exit(failed ? 1 : 0)
