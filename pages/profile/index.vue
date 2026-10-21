<script setup lang="ts">
// /profile —— 账户资料 + 登录与安全（改密）+ 账户管理（删除/取消删除）
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuth } from '~/composables/useAuth'
import { useApi } from '~/composables/useApi'

const { t, locale } = useI18n()
const { user } = useAuth()
const { updateProfile, changePassword, deleteAccount, cancelDeletion } = useApi()

// ── 账户资料 ──
const nameModel = ref(user.value?.name || '')
const profileSaving = ref(false)
const profileMsg = ref('')
async function onSaveProfile() {
  profileSaving.value = true
  profileMsg.value = ''
  try {
    const res = await updateProfile(nameModel.value)
    if (user.value && res.user) user.value.name = res.user.name
    profileMsg.value = t('profile.profileSection.saved')
  } catch (e: any) {
    profileMsg.value = e?.data?.statusMessage || 'Error'
  } finally {
    profileSaving.value = false
  }
}

// ── 登录与安全：改密 ──
const curPw = ref('')
const newPw = ref('')
const confirmPw = ref('')
const pwMsg = ref('')
const pwError = ref('')
const pwSaving = ref(false)
async function onChangePassword() {
  pwError.value = ''
  pwMsg.value = ''
  if (newPw.value !== confirmPw.value) {
    pwError.value = t('profile.security.mismatch')
    return
  }
  pwSaving.value = true
  try {
    await changePassword(curPw.value, newPw.value)
    pwMsg.value = t('profile.security.changed')
    curPw.value = ''
    newPw.value = ''
    confirmPw.value = ''
    if (user.value) user.value.passwordChangedAt = new Date().toISOString()
  } catch (e: any) {
    const msg = e?.data?.statusMessage
    if (msg === 'WEAK_PASSWORD') pwError.value = t('profile.security.weak')
    else if (msg === 'INVALID_CURRENT_PASSWORD') pwError.value = t('profile.security.wrongCurrent')
    else pwError.value = 'Error'
  } finally {
    pwSaving.value = false
  }
}

// ── 账户管理：删除 / 取消 ──
const deleting = ref(false)
const delMsg = ref('')
async function onDeleteAccount() {
  if (!window.confirm(t('profile.security.deleteDesc'))) return
  deleting.value = true
  delMsg.value = ''
  try {
    const res = await deleteAccount()
    if (user.value && res.user) user.value.deletionScheduledAt = res.user.deletionScheduledAt ?? null
    delMsg.value = t('profile.security.deleted')
  } catch (e) {
    console.error(e)
  } finally {
    deleting.value = false
  }
}

async function onCancelDeletion() {
  deleting.value = true
  delMsg.value = ''
  try {
    const res = await cancelDeletion()
    if (user.value && res.user) user.value.deletionScheduledAt = res.user.deletionScheduledAt ?? null
    delMsg.value = t('profile.security.cancelled')
  } catch (e) {
    console.error(e)
  } finally {
    deleting.value = false
  }
}

const lastChanged = computed(() =>
  user.value?.passwordChangedAt ? fmtDate(user.value.passwordChangedAt) : t('profile.security.never')
)
const deletionDate = computed(() =>
  user.value?.deletionScheduledAt ? fmtDate(user.value.deletionScheduledAt) : ''
)

function fmtDate(iso: string) {
  try {
    return new Intl.DateTimeFormat(locale.value, { dateStyle: 'long' }).format(new Date(iso))
  } catch {
    return iso
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- 账户资料 -->
    <section class="card-pg p-6">
      <h2 class="font-serif text-xl font-bold text-ink">{{ t('profile.profileSection.title') }}</h2>
      <div class="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <label class="text-xs uppercase tracking-wide text-muted">{{ t('profile.profileSection.name') }}</label>
          <input v-model="nameModel" type="text" class="input-pg mt-1 w-full" />
        </div>
        <div>
          <label class="text-xs uppercase tracking-wide text-muted">{{ t('profile.profileSection.email') }}</label>
          <input :value="user?.email" type="email" disabled class="input-pg mt-1 w-full opacity-70" />
          <p class="mt-1 text-xs text-muted">{{ t('profile.profileSection.emailHint') }}</p>
        </div>
      </div>
      <div class="mt-4 flex items-center gap-3">
        <button class="btn-primary" type="button" :disabled="profileSaving" @click="onSaveProfile">
          {{ profileSaving ? t('profile.profileSection.saving') : t('profile.profileSection.save') }}
        </button>
        <span v-if="profileMsg" class="text-sm text-green-700">{{ profileMsg }}</span>
      </div>
    </section>

    <!-- 登录与安全 -->
    <section id="security" class="card-pg scroll-mt-6 p-6">
      <h2 class="font-serif text-xl font-bold text-ink">{{ t('profile.security.title') }}</h2>

      <!-- 邮箱（只读） -->
      <div class="mt-5 rounded-xl bg-slate-50 p-4">
        <p class="text-xs uppercase tracking-wide text-muted">{{ t('profile.security.emailTitle') }}</p>
        <p class="mt-1 font-medium text-ink">{{ user?.email }}</p>
      </div>

      <!-- 改密 -->
      <div class="mt-5">
        <p class="text-xs uppercase tracking-wide text-muted">{{ t('profile.security.passwordTitle') }}</p>
        <p class="mt-1 text-sm text-muted">
          {{ t('profile.security.lastChanged', { date: lastChanged }) }}
        </p>
        <div class="mt-3 grid gap-3 sm:grid-cols-3">
          <input v-model="curPw" type="password" :placeholder="t('profile.security.current')" class="input-pg w-full" />
          <input v-model="newPw" type="password" :placeholder="t('profile.security.new')" class="input-pg w-full" />
          <input v-model="confirmPw" type="password" :placeholder="t('profile.security.confirm')" class="input-pg w-full" />
        </div>
        <p class="mt-2 text-xs text-muted">{{ t('profile.security.requirement') }}</p>
        <div class="mt-3 flex items-center gap-3">
          <button class="btn-primary" type="button" :disabled="pwSaving" @click="onChangePassword">
            {{ pwSaving ? t('profile.security.changing') : t('profile.security.change') }}
          </button>
          <span v-if="pwMsg" class="text-sm text-green-700">{{ pwMsg }}</span>
          <span v-if="pwError" class="text-sm text-red-600">{{ pwError }}</span>
        </div>
      </div>
    </section>

    <!-- 账户管理 -->
    <section class="card-pg p-6">
      <h2 class="font-serif text-xl font-bold text-ink">{{ t('profile.security.manageTitle') }}</h2>

      <div
        v-if="!user?.deletionScheduledAt"
        class="mt-4 rounded-xl border border-slate-200 p-4"
      >
        <p class="font-medium text-ink">{{ t('profile.security.deleteTitle') }}</p>
        <p class="mt-1 text-sm text-muted">{{ t('profile.security.deleteDesc') }}</p>
        <button
          class="mt-3 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
          type="button"
          :disabled="deleting"
          @click="onDeleteAccount"
        >
          {{ deleting ? t('profile.security.deleting') : t('profile.security.deleteBtn') }}
        </button>
      </div>

      <div
        v-else
        class="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4"
      >
        <p class="font-medium text-amber-900">{{ t('profile.security.scheduledTitle') }}</p>
        <p class="mt-1 text-sm text-amber-800">
          {{ t('profile.security.scheduledNote', { date: deletionDate, days: 14 }) }}
        </p>
        <button
          class="mt-3 btn-primary"
          type="button"
          :disabled="deleting"
          @click="onCancelDeletion"
        >
          {{ deleting ? t('profile.security.cancelling') : t('profile.security.cancelDeletion') }}
        </button>
        <span v-if="delMsg" class="ml-3 text-sm text-green-700">{{ delMsg }}</span>
      </div>
    </section>
  </div>
</template>
