<script setup lang="ts">
import { ref, onMounted } from 'vue'
const visible = ref(false)
onMounted(() => {
  try {
    if (!localStorage.getItem('pg-cookie-ok')) visible.value = true
  } catch (e) {
    visible.value = true
  }
})
const accept = () => {
  try { localStorage.setItem('pg-cookie-ok', '1') } catch (e) { /* noop */ }
  visible.value = false
}
</script>

<template>
  <Transition name="slide">
    <div
      v-if="visible"
      class="fixed inset-x-0 bottom-0 z-[60] px-4 pb-4"
    >
      <div class="container-pg">
        <div class="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:flex-row sm:justify-between">
          <p class="text-sm text-muted">
            We use cookies to improve your experience and analyze traffic. By continuing you agree to our
            <NuxtLink to="/cookies" class="text-brand-blue underline">Cookie Policy</NuxtLink>.
          </p>
          <div class="flex shrink-0 gap-2">
            <NuxtLink to="/privacy" class="btn-outline">Learn more</NuxtLink>
            <button class="btn-primary" @click="accept">Accept</button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateY(20px);
  opacity: 0;
}
</style>
