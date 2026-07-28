<script setup lang="ts">
import { ref } from 'vue'
useHead({ title: 'Contact Us' })
const sent = ref(false)
function submit() { sent.value = true }
</script>

<template>
  <div class="container-pg py-14">
    <div class="mx-auto max-w-2xl">
      <span class="eyebrow">Contact</span>
      <h1 class="mt-2 text-3xl font-bold sm:text-4xl">Contact us</h1>
      <p class="mt-3 text-muted">We usually reply within 1–2 business days.</p>

      <form v-if="!sent" class="mt-8 card-pg space-y-4 p-6" @submit.prevent="submit">
        <div>
          <label class="text-sm font-medium">Name</label>
          <input class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" required />
        </div>
        <div>
          <label class="text-sm font-medium">Email</label>
          <input type="email" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" required />
        </div>
        <div>
          <label class="text-sm font-medium">Message</label>
          <textarea rows="4" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" required></textarea>
        </div>
        <button class="btn-primary w-full" type="submit">Send message</button>
      </form>

      <div v-else class="mt-8 card-pg p-6 text-center text-accent-green">
        Thanks! Your message has been noted (demo form — no email is actually sent).
      </div>
    </div>
  </div>
</template>
