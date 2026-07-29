<script setup lang="ts">
defineProps<{ post: any }>()
function fmt(d: string) {
  try {
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return d
  }
}
</script>

<template>
  <NuxtLink
    :to="`/blog/${post.slug}`"
    class="card-pg group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-card"
  >
    <!-- 封面 -->
    <div
      class="relative flex h-36 items-center justify-center text-5xl"
      :style="{ background: `linear-gradient(135deg, ${post.accent}22, ${post.accent}55)` }"
    >
      <span>{{ post.cover }}</span>
      <span
        class="absolute left-3 top-3 rounded-full bg-white/85 px-2.5 py-0.5 text-[11px] font-semibold text-ink"
      >{{ post.category }}</span>
    </div>
    <!-- 内容 -->
    <div class="flex flex-1 flex-col p-5">
      <h3 class="font-serif text-lg font-bold leading-snug text-ink group-hover:text-brand-blue">
        {{ post.title }}
      </h3>
      <p class="mt-2 line-clamp-3 flex-1 text-sm text-muted">{{ post.excerpt }}</p>
      <div class="mt-4 flex items-center gap-2 text-xs text-muted">
        <span>{{ fmt(post.date) }}</span>
        <span class="text-slate-300">·</span>
        <span>{{ post.readTime }}</span>
      </div>
    </div>
  </NuxtLink>
</template>
