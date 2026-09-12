<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSwitchLocalePath, navigateTo } from '#imports'

const { locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()

const open = ref(false)
const root = ref<HTMLElement | null>(null)

const list = computed(() => (locales.value as any[]) || [])
const current = computed(
  () => list.value.find((l: any) => l.code === locale.value) || list.value[0]
)

function pick(code: string) {
  open.value = false
  if (code === locale.value) return
  navigateTo(switchLocalePath(code))
}

const onDocClick = (e: MouseEvent) => {
  if (root.value && !root.value.contains(e.target as Node)) open.value = false
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <div ref="root" class="relative">
    <button
      type="button"
      class="flex items-center gap-2 rounded border border-white/30 px-3 py-1.5 hover:border-white/60"
      :aria-label="$t('lang.switch')"
      @click="open = !open"
    >
      <span class="text-base leading-none">{{ current?.flag }}</span>
      <span class="text-sm font-medium">{{ current?.name }}</span>
      <svg width="11" height="11" viewBox="0 0 12 12" class="opacity-70">
        <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.6" fill="none" />
      </svg>
    </button>

    <Transition name="fade">
      <div
        v-if="open"
        class="absolute right-0 z-[70] mt-1 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-ink shadow-card"
      >
        <button
          v-for="l in list"
          :key="l.code"
          type="button"
          class="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-slate-100"
          :class="l.code === locale ? 'font-semibold text-brand-blue' : ''"
          @click="pick(l.code)"
        >
          <span class="flex items-center gap-2">
            <span class="text-base leading-none">{{ l.flag }}</span>
            <span>{{ l.name }}</span>
          </span>
          <svg v-if="l.code === locale" width="14" height="14" viewBox="0 0 20 20" fill="currentColor" class="text-brand-blue">
            <path fill-rule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0l-3.5-3.5a1 1 0 011.4-1.4l2.8 2.8 6.8-6.8a1 1 0 011.4 0z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
