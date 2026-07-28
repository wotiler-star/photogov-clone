<script setup lang="ts">
import { ref } from 'vue'
useHead({ title: 'Sign In' })
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
        >Sign In</button>
        <button
          class="flex-1 rounded-full py-2"
          :class="mode === 'signup' ? 'bg-white shadow-soft text-ink' : 'text-muted'"
          @click="mode = 'signup'"
        >Sign Up</button>
      </div>

      <form class="space-y-4" @submit.prevent>
        <div v-if="mode === 'signup'">
          <label class="text-sm font-medium">Name</label>
          <input class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="text-sm font-medium">Email</label>
          <input type="email" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="text-sm font-medium">Password</label>
          <input type="password" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <button class="btn-primary w-full" type="submit">
          {{ mode === 'signin' ? 'Sign In' : 'Create account' }}
        </button>
      </form>

      <p class="mt-4 text-center text-xs text-muted">
        Demo only — no account is created or stored.
      </p>
    </div>
  </div>
</template>
