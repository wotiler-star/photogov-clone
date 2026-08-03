<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
useHead({ title: t('signin.signIn') })
const mode = ref<'signin' | 'signup'>('signin')
</script>

<template>
  <div class="container-pg py-16">
    <div class="mx-auto max-w-md card-pg p-8">
      <div class="mb-6 flex rounded-full bg-slate-100 p-1 text-sm font-medium">
        <button
          class="flex-1 rounded-full py-2"
          :class="mode === 'signin' ? 'bg-white shadow-soft text-ink' : 'text-muted'"
          @click="mode = 'signin'"
        >{{ $t('signin.signIn') }}</button>
        <button
          class="flex-1 rounded-full py-2"
          :class="mode === 'signup' ? 'bg-white shadow-soft text-ink' : 'text-muted'"
          @click="mode = 'signup'"
        >{{ $t('signin.signUp') }}</button>
      </div>

      <form class="space-y-4" @submit.prevent>
        <div v-if="mode === 'signup'">
          <label class="text-sm font-medium">{{ $t('signin.name') }}</label>
          <input class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="text-sm font-medium">{{ $t('signin.email') }}</label>
          <input type="email" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="text-sm font-medium">{{ $t('signin.password') }}</label>
          <input type="password" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <button class="btn-primary w-full" type="submit">
          {{ mode === 'signin' ? $t('signin.signIn') : $t('signin.create') }}
        </button>
      </form>

      <p class="mt-4 text-center text-xs text-muted">
        {{ $t('signin.demo') }}
      </p>
    </div>
  </div>
</template>
