// i18n 离线审计：① vue-i18n 消息编译错误 ② 四语键对齐 ③ 模板静态引用是否存在对应键
const fs = require('fs')
const path = require('path')
const { baseCompile } = require('@intlify/message-compiler')
const { CompileErrorCodes } = require('@intlify/message-compiler')

const LOCALES = ['en', 'zh', 'es', 'fr']
const DIR = path.join(__dirname, 'i18n/locales')

function flatten(obj, prefix = '', out = {}) {
  for (const k of Object.keys(obj)) {
    const v = obj[k]
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out)
    else if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (item && typeof item === 'object') flatten(item, `${key}[${i}]`, out)
        else out[`${key}[${i}]`] = item
      })
    } else out[key] = v
  }
  return out
}

const data = {}
let compileErrors = 0
let total = 0
for (const loc of LOCALES) {
  const raw = JSON.parse(fs.readFileSync(path.join(DIR, `${loc}.json`), 'utf8'))
  data[loc] = flatten(raw)
  total += Object.keys(data[loc]).length
  for (const [k, v] of Object.entries(data[loc])) {
    if (typeof v !== 'string') continue
    const errs = []
    try {
      baseCompile(v, { onError: (e) => errs.push(e) })
    } catch (e) {
      errs.push(e)
    }
    if (errs.length) {
      compileErrors++
      console.log(`[COMPILE ${loc}] ${k}: ${errs.map((e) => e.code ?? e.message).join(',')} :: ${v.slice(0, 90)}`)
    }
  }
}
console.log(`编译审计：${total} 条消息，错误 ${compileErrors} 处`)

// 键对齐
const keys = {}
for (const loc of LOCALES) keys[loc] = new Set(Object.keys(data[loc]))
const base = keys.en
for (const loc of LOCALES) {
  if (loc === 'en') continue
  const missing = [...base].filter((k) => !keys[loc].has(k))
  const extra = [...keys[loc]].filter((k) => !base.has(k))
  console.log(`对齐 ${loc}: 缺失 ${missing.length}，多余 ${extra.length}`)
  missing.slice(0, 15).forEach((k) => console.log(`   - ${k}`))
  extra.slice(0, 15).forEach((k) => console.log(`   + ${k}`))
}

// 模板静态引用检查
const files = []
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) walk(p)
    else if (/\.(vue|ts)$/.test(e.name)) files.push(p)
  }
}
for (const d of ['pages', 'components', 'composables', 'layouts']) {
  const full = path.join(__dirname, d)
  if (fs.existsSync(full)) walk(full)
}
const used = new Set()
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8')
  // 需词边界：否则 getContext('2d') / import('jspdf') 会被误当成 t('2d') / t('jspdf')
  for (const m of src.matchAll(/(?:^|[^\w$.])\$?t(?:e)?\(\s*'([a-zA-Z0-9_.]+)'/g)) used.add(m[1])
  for (const m of src.matchAll(/(?:^|[^\w$.])tm\(\s*'([a-zA-Z0-9_.]+)'/g)) used.add(m[1])
  for (const m of src.matchAll(/keypath="([a-zA-Z0-9_.]+)"/g)) used.add(m[1])
}
// 数组/对象键会被展平成 key[0] / key.sub，引用 key 本身属正常
const hasKey = (k) => {
  if (base.has(k)) return true
  for (const b of base) if (b === k + '[' || b.startsWith(k + '[') || b.startsWith(k + '.')) return true
  return false
}
const missingRef = [...used].filter((k) => !hasKey(k))
console.log(`静态引用 ${used.size} 个键，缺失 ${missingRef.length} 个`)
missingRef.slice(0, 30).forEach((k) => console.log(`   ✗ ${k}`))
