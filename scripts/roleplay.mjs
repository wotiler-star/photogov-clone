// Roleplay walkthrough v3: netizen needs a passport photo.
// Site: Nuxt SSR on 3200 (EMAIL_DEBUG=1 → gate active + demo devLink).
import fs from 'node:fs'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const puppeteer = require('C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules/puppeteer-core')

const BASE = process.env.BASE || 'http://127.0.0.1:3200'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const OUT = 'shots'
fs.mkdirSync(OUT, { recursive: true })

const problems = []
const notes = []
const log = (...a) => console.log(...a)
const problem = (step, msg) => { problems.push({ step, msg }); log('  ⚠ PROBLEM @' + step, '::', msg) }
const note = (msg) => { notes.push(msg); log('  💡 NOTE:', msg) }
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

async function clickText(page, text, { root = 'body', exact = false } = {}) {
  const handle = await page.evaluateHandle((rootSel, tx, exact) => {
    const rootEl = document.querySelector(rootSel) || document.body
    const els = [...rootEl.querySelectorAll('button,a,label,[role="button"]')]
    const norm = s => (s || '').replace(/\s+/g, ' ').trim()
    return els.find(e => exact ? norm(e.textContent) === tx : norm(e.textContent).includes(tx))
  }, root, text, exact)
  const el = handle.asElement()
  if (!el) throw new Error(`clickText not found: "${text}" in ${root}`)
  await el.click()
  return el
}
async function fill(page, sel, value) {
  await page.waitForSelector(sel, { visible: true, timeout: 8000 })
  // 彻底清空旧值（三连击选择在 Vue 重渲染时可能失效，导致拼接出非法邮箱）
  await page.evaluate((s) => {
    const el = document.querySelector(s)
    el.value = ''
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }, sel)
  await page.type(sel, value, { delay: 8 })
}
async function shot(page, name) { const p = `${OUT}/${name}.png`; await page.screenshot({ path: p }); log('  📸', p); return p }
const modalText = (page) => page.evaluate(() => {
  const d = document.querySelector('[role=dialog]')
  return d ? d.textContent.replace(/\s+/g, ' ').trim().slice(0, 300) : '(no modal)'
})

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
})
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 900 })
const consoleErrors = []
page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()) })
page.on('pageerror', e => consoleErrors.push('PAGEERROR: ' + e.message))

const email = `netizen-${Date.now()}@example.com`
const password = 'Passw0rd!'

try {
  // ── 1. HOMEPAGE ────────────────────────────────────────────────
  log('\n[1] Homepage /en')
  await page.goto(`${BASE}/en`, { waitUntil: 'networkidle2', timeout: 30000 })
  await sleep(700)
  try { await clickText(page, 'Accept'); log('  cookie banner accepted'); await sleep(400) } catch { log('  (no cookie banner)') }
  await shot(page, '01-home-top')
  await page.evaluate(() => {
    const h2 = [...document.querySelectorAll('h2')].find(e => /popular documents/i.test(e.textContent))
    if (h2) { h2.scrollIntoView({ block: 'start' }); window.scrollBy(0, -20) }
  })
  await sleep(500)
  await shot(page, '02-home-popular')
  const cards = await page.evaluate(() => {
    const grid = document.querySelector('.xl\\:grid-cols-4')
    return grid ? { n: grid.children.length, links: grid.querySelectorAll('a[href*="/documents/"]').length } : { n: 0, links: 0 }
  })
  log('  popular cards:', cards.n, '| doc links:', cards.links)
  if (cards.n !== 12) problem('home-popular', `Popular grid renders ${cards.n} cards, expected 12`)

  // ── 2-4. TOOL + DOC + UPLOAD ──────────────────────────────────
  log('\n[2] /en/tool + passport doc + upload')
  await page.goto(`${BASE}/en/tool`, { waitUntil: 'networkidle2', timeout: 30000 })
  await sleep(600)
  await shot(page, '03-tool-empty')
  const docVal = await page.evaluate(() => {
    const sel = [...document.querySelectorAll('select')][1]
    const opt = [...sel.options].find(o => /passport/i.test(o.textContent)) || sel.options[0]
    return { value: opt.value, label: opt.textContent.trim() }
  })
  log('  doc:', docVal.label)
  await page.evaluate((val) => {
    const sel = [...document.querySelectorAll('select')][1]
    sel.value = val
    sel.dispatchEvent(new Event('change', { bubbles: true }))
  }, docVal.value)
  await sleep(400)
  const fileInput = (await page.$$('input[type=file]'))[0]
  await fileInput.uploadFile('shots/sample-portrait.jpg')
  await sleep(1600)
  await shot(page, '05-tool-uploaded')

  // ── 5. DOWNLOAD → GATE ────────────────────────────────────────
  log('\n[5] JPG download → checkout gate')
  await clickText(page, 'JPG')
  await sleep(1200)
  if (!(await page.evaluate(() => !!document.querySelector('[role=dialog]')))) problem('gate', 'download did not open checkout modal')
  await shot(page, '06-checkout-auth')

  // ── 6. REGISTER ───────────────────────────────────────────────
  log('\n[6] Sign up inside checkout')
  await clickText(page, 'Sign up now', { root: '[role=dialog]' })
  await sleep(400)
  await fill(page, '#co-email', email)
  await fill(page, '#co-pw', password)
  await clickText(page, 'Create account', { root: '[role=dialog]' })
  await sleep(1800)
  let mt = await modalText(page)
  log('  after register:', mt.slice(0, 120))
  await shot(page, '07-after-register')
  if (/pay|total|region/i.test(mt)) {
    await clickText(page, 'Pay', { root: '[role=dialog]' })
    await sleep(1500)
    mt = await modalText(page)
    log('  after Pay (403):', mt.slice(0, 120))
  }
  if (!/verify/i.test(mt)) problem('register', 'did not reach verify step: ' + mt)
  await shot(page, '07b-verify-step')
  // UX note: is the register-time devLink shown inline in the modal?
  const inlineDev = await page.evaluate(() => {
    const a = [...document.querySelectorAll('[role=dialog] a')].find(e => /token=/.test(e.getAttribute('href') || ''))
    return a ? a.getAttribute('href') : null
  })
  if (!inlineDev) note('verify step in checkout modal shows NO direct demo link after register (link only appears after clicking "Resend verification email") — stored pg_verify_link is unused here')

  // ── 7. RESEND → demo link → verify in new tab ────────────────
  log('\n[7] Resend → open demo verification link')
  await clickText(page, 'Resend verification', { root: '[role=dialog]' })
  await sleep(1500)
  const tokenLink = await page.evaluate(() => {
    const a = [...document.querySelectorAll('[role=dialog] a')].find(e => /token=/.test(e.getAttribute('href') || ''))
    return a ? a.getAttribute('href') : null
  })
  log('  demo token link:', tokenLink)
  if (!tokenLink) problem('verify', 'after Resend, no token link rendered in modal')
  else {
    const v = await browser.newPage()
    await v.setViewport({ width: 1280, height: 900 })
    await v.goto(tokenLink.startsWith('http') ? tokenLink : BASE + tokenLink, { waitUntil: 'networkidle2', timeout: 30000 })
    await sleep(1800)
    const vt = await v.evaluate(() => document.body.textContent.replace(/\s+/g, ' '))
    const ok = /email verified|account is now active|successfully verified/i.test(vt)
    log('  verify page result:', ok ? '✓ confirmed verified' : vt.slice(0, 180))
    if (!ok) problem('verify', 'token page does not confirm verification')
    await v.screenshot({ path: `${OUT}/08-verify-page.png` }); log('  📸 shots/08-verify-page.png')
    await v.close()
  }

  // ── 8. CONTINUE → cont() re-invokes pay() directly (modal closes on success) ──
  log("\n[8] Click \"I've verified — continue\" (should refresh + auto-pay)")
  await clickText(page, "I've verified", { root: '[role=dialog]' })
  await sleep(2000)
  mt = await modalText(page)
  log('  modal after continue:', mt.slice(0, 140))
  await shot(page, '09-after-continue')
  if (/Create account|Sign in to continue/i.test(mt)) {
    problem('auth-refresh', `BUG REGRESSION: after continue, user state wiped (modal back to auth step): ${mt.slice(0, 120)}`)
  } else if (mt !== '(no modal)') {
    // still on a step (e.g. pay) — finish payment manually
    log('  → modal still open, finishing payment')
    await clickText(page, 'Pay', { root: '[role=dialog]' }).catch(() => {})
    await sleep(1800)
  }
  const gate = await page.evaluate(() => {
    const t = document.body.textContent
    return /unlocked/i.test(t) ? 'unlocked' : (/requires checkout/i.test(t) ? 'still-gated' : 'unknown')
  })
  log('  gate status:', gate)
  if (gate !== 'unlocked') problem('pay', 'photo not unlocked after verify+pay: ' + (await modalText(page)).slice(0, 120))
  await shot(page, '10-tool-unlocked')

  // ── 9. DOWNLOAD ──────────────────────────────────────────────
  log('\n[9] Download JPG (unlocked)')
  const path = await import('node:path')
  const dlDir = path.resolve('shots')
  const bcdp = await browser.target().createCDPSession()
  await bcdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: dlDir, eventsEnabled: true })
  const before = new Set(fs.readdirSync('shots'))
  await clickText(page, 'JPG')
  await sleep(3000)
  const newFiles = fs.readdirSync('shots').filter(f => !before.has(f))
  log('  new files:', newFiles)
  if (!newFiles.length) problem('download', 'no file downloaded after unlock')

  // ── 11. PAGE RELOAD: does login survive? (refresh bug symptom)
  log('\n[11] Reload /en/profile — does login state survive refresh()?')
  await page.goto(`${BASE}/en/profile`, { waitUntil: 'networkidle2', timeout: 30000 })
  await sleep(1500)
  const urlNow = page.url()
  const bodyTxt = await page.evaluate(() => document.body.textContent.replace(/\s+/g, ' ').slice(0, 300))
  log('  url:', urlNow)
  log('  body:', bodyTxt.slice(0, 160))
  await shot(page, '12-profile-after-reload')
  if (/sign-in/i.test(urlNow)) problem('auth-refresh', `logged-in netizen visiting /profile got bounced to ${urlNow} — refresh() bitwise bug destroys session state on every page load`)
  else if (/sign in|log in|create account/i.test(bodyTxt) && !/email|plan|subscription/i.test(bodyTxt)) problem('auth-refresh', 'profile page shows signed-out UI despite valid session')

  // ── 12. FORGOT PASSWORD honest UX（需退出登录：sign-in 页会把已登录用户踢回 /profile）──
  log('\n[12] /en/sign-in?view=reset — honest mail UX (logged out)')
  const ncdp = await page.target().createCDPSession()
  await ncdp.send('Network.clearBrowserCookies')
  await page.goto(`${BASE}/en/sign-in?view=reset`, { waitUntil: 'networkidle2', timeout: 30000 })
  await sleep(600)
  const fpInput = await page.$('input[type=email]')
  if (!fpInput) problem('forgot', 'no email input on reset view')
  else {
    await fpInput.type(email, { delay: 8 })
    await clickText(page, 'Reset').catch(() => clickText(page, 'Send'))
    await sleep(1500)
    const t = await page.evaluate(() => document.body.textContent.replace(/\s+/g, ' ').slice(0, 500))
    log('  result:', t.slice(0, 200))
    await shot(page, '13-forgot-result')
    if (/unavailable|no message was sent|do not rely/i.test(t)) log('  ✓ honest mail-off notice shown')
    else problem('forgot', 'no honest "mail unavailable" notice: ' + t.slice(0, 150))
  }

  // ── 13. SMOKE other key pages ────────────────────────────────
  log('\n[13] Smoke key pages')
  for (const path of ['/en/documents', '/en/documents/us-passport-photo', '/en/prices', '/en/verify-email?pending=1']) {
    const errsBefore = consoleErrors.length
    const resp = await page.goto(BASE + path, { waitUntil: 'networkidle2', timeout: 30000 }).catch(() => null)
    await sleep(400)
    const status = resp ? resp.status() : 'ERR'
    const newErrs = consoleErrors.length - errsBefore
    log(`  ${path} → ${status}${newErrs ? ` (${newErrs} console errors)` : ''}`)
    if (resp && resp.status() >= 400) problem('smoke', `${path} returned ${status}`)
    if (newErrs) problem('smoke', `${path}: ${consoleErrors.slice(errsBefore).join(' | ').slice(0, 160)}`)
  }

} catch (e) {
  problem('FATAL', e.message)
  log('FATAL:', e.stack)
} finally {
  log('\n════════ CONSOLE ERRORS (' + consoleErrors.length + ') ════════')
  consoleErrors.slice(0, 20).forEach(e => log('  •', e.slice(0, 180)))
  log('\n════════ PROBLEMS (' + problems.length + ') ════════')
  if (!problems.length) log('  ✅ none')
  problems.forEach(p => log('  ⚠', p.step, '::', p.msg))
  log('\n════════ NOTES ════════')
  notes.forEach(n => log('  💡', n))
  await browser.close()
}
