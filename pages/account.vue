<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from '#imports'
import { useAuth } from '~/composables/useAuth'
import { useApi } from '~/composables/useApi'
import { planStatus } from '~/utils/plans'

const { t } = useI18n()
const router = useRouter()
const { user, loaded, logout, resendVerification, cancelSubscription } = useAuth()
const { myPhotos, myOrders } = useApi()

const initial = computed(() => (user.value?.name || '?').charAt(0).toUpperCase())
const memberSince = computed(() =>
  user.value ? new Date(user.value.createdAt).toLocaleDateString() : ''
)
const status = computed(() => planStatus(user.value))
const expiresOn = computed(() =>
  status.value.expiresAt ? new Date(status.value.expiresAt).toLocaleDateString() : ''
)

const resending = ref(false)
const resendMsg = ref('')
const cancelling = ref(false)

const photos = ref<any[]>([])
const orders = ref<any[]>([])
const loadingData = ref(false)

async function loadUserData() {
  if (!user.value) return
  loadingData.value = true
  try {
    const [p, o] = await Promise.all([myPhotos(), myOrders()])
    photos.value = p.photos || []
    orders.value = o.orders || []
  } finally {
    loadingData.value = false
  }
}

async function onResend() {
  resending.value = true
  resendMsg.value = ''
  try {
    await resendVerification()
    resendMsg.value = t('account.resendSent')
  } finally {
    resending.value = false
  }
}

async function onCancel() {
  cancelling.value = true
  try {
    await cancelSubscription()
  } finally {
    cancelling.value = false
  }
}

async function onLogout() {
  await logout()
  router.push('/signin')
}

watch(
  () => user.value?.id,
  (id) => {
    if (id) loadUserData()
  },
  { immediate: true }
)
onMounted(() => {
  if (user.value) loadUserData()
})

useHead({ title: t('account.title') })
</script>

<template>
  <div class="container-pg py-16">
    <div class="mx-auto max-w-2xl">
      <!-- 已登录：会员中心 -->
      <div v-if="user" class="card-pg p-8">
        <div class="flex items-center gap-4">
          <div class="grid h-14 w-14 place-items-center rounded-full bg-accent text-white text-xl font-bold">
            {{ initial }}
          </div>
          <div>
            <p class="text-sm text-muted">{{ $t('account.welcome') }}</p>
            <h1 class="font-serif text-2xl font-bold text-ink">{{ user.name }}</h1>
          </div>
        </div>

        <!-- 邮箱未验证提示 -->
        <div
          v-if="!user.emailVerified"
          class="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4"
        >
          <p class="text-sm text-amber-800">{{ $t('account.verifyBanner') }}</p>
          <div class="flex items-center gap-2">
            <span v-if="resendMsg" class="text-xs text-green-700">{{ resendMsg }}</span>
            <button class="btn-outline px-3 py-1.5 text-sm" type="button" :disabled="resending" @click="onResend">
              {{ resending ? $t('account.resending') : $t('account.resend') }}
            </button>
          </div>
        </div>
        <p v-else class="mt-6 rounded-xl bg-green-50 p-3 text-sm text-green-700">
          ✓ {{ $t('account.verified') }}
        </p>

        <dl class="mt-6 grid gap-4 sm:grid-cols-2">
          <div class="rounded-xl bg-slate-50 p-4">
            <dt class="text-xs uppercase tracking-wide text-muted">{{ $t('account.email') }}</dt>
            <dd class="mt-1 font-medium text-ink">{{ user.email }}</dd>
          </div>
          <div class="rounded-xl bg-slate-50 p-4">
            <dt class="text-xs uppercase tracking-wide text-muted">{{ $t('account.memberSince') }}</dt>
            <dd class="mt-1 font-medium text-ink">{{ memberSince }}</dd>
          </div>
        </dl>

        <!-- 会员套餐 -->
        <div class="mt-6 rounded-xl border border-slate-200 p-5">
          <div class="flex items-center justify-between">
            <h2 class="font-serif text-lg font-bold text-ink">{{ $t('account.planTitle') }}</h2>
            <span
              class="rounded-full px-3 py-1 text-xs font-semibold"
              :class="status.isPremium ? 'bg-accent/10 text-accent' : 'bg-slate-100 text-muted'"
            >
              {{ status.isPremium ? $t('account.premium') : $t('account.free') }}
            </span>
          </div>
          <p v-if="status.isPremium && expiresOn" class="mt-1 text-sm text-muted">
            {{ $t('account.renewsOn') }} {{ expiresOn }}
          </p>
          <div class="mt-4 flex flex-wrap gap-3">
            <NuxtLink v-if="!status.isPremium" to="/plans" class="btn-primary">
              {{ $t('account.upgradeCta') }}
            </NuxtLink>
            <button
              v-else
              class="btn-outline"
              type="button"
              :disabled="cancelling"
              @click="onCancel"
            >{{ cancelling ? $t('account.cancelling') : $t('account.cancelPlan') }}</button>
            <NuxtLink to="/plans" class="btn-outline">{{ $t('account.managePlans') }}</NuxtLink>
          </div>
        </div>

        <!-- 我的照片 -->
        <div class="mt-6 rounded-xl border border-slate-200 p-5">
          <h2 class="font-serif text-lg font-bold text-ink">{{ $t('account.myPhotos') }}</h2>
          <p class="mt-1 text-xs text-muted">{{ $t('account.myPhotosHint') }}</p>
          <div v-if="loadingData" class="mt-3 text-sm text-muted">{{ $t('account.loading') }}</div>
          <div v-else-if="photos.length" class="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
            <img
              v-for="p in photos"
              :key="p.id"
              :src="p.url"
              :alt="p.docName || 'photo'"
              class="aspect-square w-full rounded-lg border border-slate-200 object-cover"
            />
          </div>
          <p v-else class="mt-3 text-sm text-muted">{{ $t('account.noPhotos') }}</p>
        </div>

        <!-- 我的订单 -->
        <div class="mt-6 rounded-xl border border-slate-200 p-5">
          <h2 class="font-serif text-lg font-bold text-ink">{{ $t('account.myOrders') }}</h2>
          <div v-if="loadingData" class="mt-3 text-sm text-muted">{{ $t('account.loading') }}</div>
          <ul v-else-if="orders.length" class="mt-3 divide-y divide-slate-100">
            <li v-for="o in orders" :key="o.id" class="flex items-center justify-between py-2 text-sm">
              <span class="font-mono text-ink">{{ o.id }}</span>
              <span class="text-muted">{{ new Date(o.createdAt).toLocaleDateString() }}</span>
              <span
                class="rounded-full px-2 py-0.5 text-xs font-semibold"
                :class="o.paid ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-muted'"
              >{{ o.paid ? $t('account.paid') : $t('account.unpaid') }}</span>
            </li>
          </ul>
          <p v-else class="mt-3 text-sm text-muted">{{ $t('account.noOrders') }}</p>
        </div>

        <button class="btn-outline mt-6" type="button" @click="onLogout">
          {{ $t('account.logout') }}
        </button>
      </div>

      <!-- 未登录：引导登录 -->
      <div v-else-if="loaded" class="card-pg p-8 text-center">
        <h1 class="font-serif text-2xl font-bold text-ink">{{ $t('account.needLogin') }}</h1>
        <NuxtLink to="/signin" class="btn-primary mt-6 inline-flex">
          {{ $t('account.goSignIn') }}
        </NuxtLink>
      </div>

      <div v-else class="card-pg p-8 text-center text-muted">
        {{ $t('account.loading') }}
      </div>
    </div>
  </div>
</template>
