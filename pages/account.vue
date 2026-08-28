<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuth } from '~/composables/useAuth'

const { t } = useI18n()
const router = useRouter()
const { user, loaded, logout } = useAuth()

const initial = computed(() => (user.value?.name || '?').charAt(0).toUpperCase())
const memberSince = computed(() =>
  user.value ? new Date(user.value.createdAt).toLocaleDateString() : ''
)

async function onLogout() {
  await logout()
  router.push('/signin')
}

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

        <dl class="mt-6 grid gap-4 sm:grid-cols-2">
          <div class="rounded-xl bg-slate-50 p-4">
            <dt class="text-xs uppercase tracking-wide text-muted">{{ $t('account.email') }}</dt>
            <dd class="mt-1 font-medium text-ink">{{ user.email }}</dd>
          </div>
          <div class="rounded-xl bg-slate-50 p-4">
            <dt class="text-xs uppercase tracking-wide text-muted">{{ $t('account.memberSince') }}</dt>
            <dd class="mt-1 font-medium text-ink">{{ memberSince }}</dd>
          </div>
          <div class="rounded-xl bg-slate-50 p-4">
            <dt class="text-xs uppercase tracking-wide text-muted">{{ $t('account.plan') }}</dt>
            <dd class="mt-1 font-medium text-ink">
              {{ user.plan === 'premium' ? $t('account.premium') : $t('account.free') }}
            </dd>
          </div>
        </dl>

        <div class="mt-6 grid gap-3 sm:grid-cols-2">
          <div class="rounded-xl border border-slate-200 p-4">
            <p class="font-medium text-ink">{{ $t('account.myPhotos') }}</p>
            <p class="text-sm text-muted">{{ $t('account.comingSoon') }}</p>
          </div>
          <div class="rounded-xl border border-slate-200 p-4">
            <p class="font-medium text-ink">{{ $t('account.myOrders') }}</p>
            <p class="text-sm text-muted">{{ $t('account.comingSoon') }}</p>
          </div>
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
