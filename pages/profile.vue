<script setup lang="ts">
// 会员中心父路由：统一的「个人中心」头部 + 侧栏导航 + 登录守卫。
// 子页面（index / photos / subscription）通过 <NuxtPage /> 渲染。
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from '#imports'
import { useAuth } from '~/composables/useAuth'
import { useApi } from '~/composables/useApi'
import { useLocalePath } from '#imports'

const { t, locale } = useI18n()
const router = useRouter()
const route = useRoute()
const localePath = useLocalePath()
const { user, loaded, logout } = useAuth()
const { cancelDeletion } = useApi()

// 去除 i18n 语言前缀，便于侧栏高亮匹配
const basePath = computed(() => route.path.replace(/^\/(en|zh|es|fr)(?=\/|$)/, ''))

const navItems = computed(() => [
  {
    to: '/profile',
    label: t('profile.nav.profile'),
    active: () => basePath.value === '/profile' && !route.hash
  },
  {
    to: '/profile#security',
    label: t('profile.nav.security'),
    active: () => route.hash === '#security'
  },
  {
    to: '/profile/photos',
    label: t('profile.nav.photos'),
    active: () => basePath.value.startsWith('/profile/photos')
  },
  {
    to: '/profile/subscription',
    label: t('profile.nav.subscription'),
    active: () => basePath.value.startsWith('/profile/subscription')
  }
])

const initial = computed(() => (user.value?.name || '?').charAt(0).toUpperCase())

const cancelling = ref(false)
const cancelMsg = ref('')
async function onCancelDeletion() {
  cancelling.value = true
  cancelMsg.value = ''
  try {
    const res = await cancelDeletion()
    if (user.value && res.user) user.value.deletionScheduledAt = res.user.deletionScheduledAt ?? null
    cancelMsg.value = t('profile.security.cancelled')
  } catch (e) {
    console.error(e)
  } finally {
    cancelling.value = false
  }
}

async function onLogout() {
  await logout()
  router.push(localePath('/sign-in'))
}

// 未登录则跳转到登录页
watch(
  [loaded, user],
  ([l, u]) => {
    if (l && !u) router.replace(localePath('/sign-in'))
  },
  { immediate: true }
)

const fmtDate = (iso: string | null) => {
  if (!iso) return ''
  try {
    return new Intl.DateTimeFormat(locale.value, { dateStyle: 'long' }).format(new Date(iso))
  } catch {
    return iso
  }
}

useHead({ title: t('profile.title') })
</script>

<template>
  <div class="min-h-[70vh] bg-slate-50">
    <div class="container-pg py-10">
      <header class="mb-8">
        <h1 class="font-serif text-3xl font-bold text-ink">{{ t('profile.title') }}</h1>
        <p class="mt-1 text-sm text-muted">{{ t('profile.subtitle') }}</p>
      </header>

      <!-- 账户删除待恢复横幅（全局） -->
      <div
        v-if="user?.deletionScheduledAt"
        class="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4"
      >
        <p class="text-sm text-amber-800">
          {{ t('profile.deletionBanner', { date: fmtDate(user.deletionScheduledAt) }) }}
          <span v-if="cancelMsg" class="ml-2 font-medium text-green-700">{{ cancelMsg }}</span>
        </p>
        <button
          class="btn-outline px-3 py-1.5 text-sm"
          type="button"
          :disabled="cancelling"
          @click="onCancelDeletion"
        >
          {{ cancelling ? t('profile.deletionCancelling') : t('profile.deletionCancel') }}
        </button>
      </div>

      <div class="grid gap-8 lg:grid-cols-[260px_1fr]">
        <!-- 侧栏导航 -->
        <aside>
          <div class="card-pg sticky top-6 p-5">
            <div class="flex items-center gap-3">
              <div
                class="grid h-12 w-12 place-items-center rounded-full bg-accent text-lg font-bold text-white"
              >
                {{ initial }}
              </div>
              <div class="min-w-0">
                <p class="truncate font-semibold text-ink">{{ user?.name }}</p>
                <p class="truncate text-xs text-muted">{{ user?.email }}</p>
              </div>
            </div>

            <nav class="mt-5 space-y-1">
              <NuxtLink
                v-for="item in navItems"
                :key="item.to"
                :to="localePath(item.to)"
                class="block rounded-lg px-3 py-2 text-sm font-medium transition"
                :class="
                  item.active()
                    ? 'bg-accent/10 text-accent'
                    : 'text-ink/80 hover:bg-slate-100'
                "
              >
                {{ item.label }}
              </NuxtLink>
            </nav>

            <button
              class="mt-5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-muted transition hover:bg-slate-100"
              type="button"
              @click="onLogout"
            >
              {{ t('profile.signOut') }}
            </button>
          </div>
        </aside>

        <!-- 子页面 -->
        <main>
          <NuxtPage />
        </main>
      </div>
    </div>
  </div>
</template>
