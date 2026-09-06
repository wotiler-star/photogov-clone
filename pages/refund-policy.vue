<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t, tm } = useI18n()

// 邮箱放在运行时常量里，避免 @ 被 vue-i18n 当成链接消息语法而编译报错
const EMAIL = 'info@photogov.net'

useHead({ title: t('refund.title') })

const principles = computed(() => tm('refund.principles') as string[])
const guides = computed(() => tm('refund.guides') as string[])
const groups = computed(
  () => tm('refund.groups') as Array<{ t: string; items: string[] }>
)
const addOn = computed(() => tm('refund.addOnConditions') as string[])
const procedure = computed(() => tm('refund.procedure') as string[])
const subscription = computed(
  () => tm('refund.subscription') as Array<{ t: string; p: string; items?: string[] }>
)
</script>

<template>
  <div class="container-pg py-14">
    <div class="mx-auto max-w-3xl">
      <span class="eyebrow">{{ $t('refund.eyebrow') }}</span>
      <h1 class="mt-2 text-3xl font-bold sm:text-4xl">{{ $t('refund.title') }}</h1>
      <p class="mt-4 text-muted">{{ $t('refund.lead') }}</p>

      <h2 class="mt-10 text-2xl font-bold">{{ $t('refund.principlesTitle') }}</h2>
      <p v-for="(p, i) in principles" :key="i" class="mt-3 text-muted">{{ p }}</p>

      <div class="card-pg mt-5 p-6">
        <h3 class="font-semibold">{{ $t('refund.guidesTitle') }}</h3>
        <ul class="mt-3 space-y-2 pl-5">
          <li v-for="(g, i) in guides" :key="i" class="list-disc text-sm text-muted">{{ g }}</li>
        </ul>
      </div>

      <h2 class="mt-12 text-2xl font-bold">{{ $t('refund.eligibilityTitle') }}</h2>
      <p class="mt-3 text-muted">{{ $t('refund.eligibilityIntro') }}</p>

      <div v-for="(g, i) in groups" :key="i" class="card-pg mt-5 p-6">
        <h3 class="font-semibold">{{ g.t }}</h3>
        <ul class="mt-3 space-y-2 pl-5">
          <li v-for="(it, j) in g.items" :key="j" class="list-disc text-sm text-muted">{{ it }}</li>
        </ul>
      </div>

      <p class="mt-5 text-muted">{{ $t('refund.eligibilityOutro1') }}</p>
      <p class="mt-3 text-muted">{{ $t('refund.eligibilityOutro2') }}</p>

      <h2 class="mt-12 text-2xl font-bold">{{ $t('refund.addOnTitle') }}</h2>
      <p class="mt-3 text-muted">{{ $t('refund.addOnIntro') }}</p>
      <ul class="mt-4 space-y-2 pl-5">
        <li v-for="(c, i) in addOn" :key="i" class="list-disc text-sm text-muted">{{ c }}</li>
      </ul>
      <p class="mt-4 text-muted">{{ $t('refund.addOnOutro1') }}</p>
      <p class="mt-3 text-muted">{{ $t('refund.addOnOutro2') }}</p>

      <h2 class="mt-12 text-2xl font-bold">{{ $t('refund.procedureTitle') }}</h2>
      <ol class="mt-4 space-y-3 pl-5">
        <li v-for="(s, i) in procedure" :key="i" class="list-decimal text-muted">{{ s }}</li>
      </ol>

      <h2 class="mt-12 text-2xl font-bold">{{ $t('refund.liabilityTitle') }}</h2>
      <p class="mt-3 text-muted">{{ $t('refund.liabilityText') }}</p>

      <h2 class="mt-10 text-2xl font-bold">{{ $t('refund.lawTitle') }}</h2>
      <p class="mt-3 text-muted">{{ $t('refund.lawText') }}</p>

      <h2 class="mt-10 text-2xl font-bold">{{ $t('refund.changesTitle') }}</h2>
      <p class="mt-3 text-muted">{{ $t('refund.changesText') }}</p>

      <h2 class="mt-10 text-2xl font-bold">{{ $t('refund.contactTitle') }}</h2>
      <p class="mt-3 text-muted">{{ $t('refund.contactText', { email: EMAIL }) }}</p>

      <h2 class="mt-12 text-2xl font-bold">{{ $t('refund.subscriptionTitle') }}</h2>
      <div v-for="(s, i) in subscription" :key="i" class="card-pg mt-5 p-6">
        <h3 class="font-semibold">{{ s.t }}</h3>
        <p class="mt-2 text-sm text-muted">{{ s.p }}</p>
        <ul v-if="s.items" class="mt-3 space-y-2 pl-5">
          <li v-for="(it, j) in s.items" :key="j" class="list-disc text-sm text-muted">{{ it.replace('{email}', EMAIL) }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>
