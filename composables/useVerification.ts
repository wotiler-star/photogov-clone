// 邮箱激活引导的共享状态与动作：结账弹窗 / 验证页 / 注册流程共用。
// 设计原则：门控是否生效由服务端 403 EMAIL_NOT_VERIFIED 决定（唯一真相），
// 前端不在本地猜测配置，避免 SMTP 未配置时把用户挡在付款之外。
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useApi } from '~/composables/useApi'
import { useAuth } from '~/composables/useAuth'

export interface MailResult {
  devLink?: string
  mailDelivered?: boolean
}

/** 注册/重发后把邮件状态带到 /verify-email?pending=1（devLink 不进 URL） */
export function storeVerifyState(res: MailResult, email?: string) {
  try {
    sessionStorage.setItem('pg_verify_link', res.devLink || '')
    sessionStorage.setItem('pg_verify_mail', String(res.mailDelivered === true))
    if (email) sessionStorage.setItem('pg_verify_email', email)
  } catch {
    /* SSR 或隐私模式下忽略 */
  }
}

export const useVerifyGate = (onReady?: () => void | Promise<void>) => {
  const { t } = useI18n()
  const { resendVerification } = useApi()
  const { refresh } = useAuth()

  const needsVerify = ref(false)
  const devLink = ref('')
  const mailOff = ref(false)
  const info = ref('')
  const busy = ref(false)

  /** pay()/createCheckout() 捕获到 403 时切入验证引导；返回 true 表示已处理 */
  function isVerifyBlocked(e: any): boolean {
    const msg = e?.data?.statusMessage || e?.message || ''
    if (!msg.includes('EMAIL_NOT_VERIFIED')) return false
    needsVerify.value = true
    info.value = ''
    return true
  }

  async function resend() {
    busy.value = true
    info.value = ''
    try {
      const res = await resendVerification()
      devLink.value = res.devLink || ''
      mailOff.value = res.mailDelivered === false
      info.value = mailOff.value ? t('verify.mailOff') : t('verify.resent')
      storeVerifyState(res)
    } catch {
      mailOff.value = true
      info.value = t('verify.mailOff')
    } finally {
      busy.value = false
    }
  }

  /** 「我已验证，继续」：刷新会话后重试原动作，让服务端再次裁决 */
  async function cont() {
    busy.value = true
    info.value = ''
    try { await refresh() } catch { /* 刷新失败也允许重试，由服务端兜底 */ }
    needsVerify.value = false
    try {
      await onReady?.()
    } finally {
      busy.value = false
    }
  }

  return { needsVerify, devLink, mailOff, info, busy, isVerifyBlocked, resend, cont }
}
