<script setup lang="ts">
// 对标原站文档页「On this page」目录卡（F6 取证 SEEN）：
// grid grid-cols-[1fr_auto] gap-4 p-6 mt-8 border-[#E7EAEE] rounded
//   > "ON THIS PAGE:"（uppercase #85929F 14px semibold）
//   > 右侧「⏱ last article update DD/MM/YYYY」（#5D7290 12px）
//   > ul.space-y-3.5 锚点列表（before: 生成 12px 空心圆点，hover 变红）
defineProps<{
  /** 从正文收集的 H2 锚点列表 */
  items: { id: string; text: string }[]
  /** 最后更新日期（已格式化） */
  updated: string
}>()

// 平滑滚动到锚点（原站用 JS 滚动，避免 URL 追加 hash 破坏 SSR 静态路径）
function goto(e: MouseEvent, id: string) {
  e.preventDefault()
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <div class="container">
    <div v-if="items.length" class="mt-8 grid grid-cols-[1fr_auto] gap-x-4 gap-y-3 rounded border border-[#E7EAEE] p-6 font-serif max-lg:grid-cols-1">
      <p class="flex-1 text-[14px] font-semibold uppercase text-[#85929F]">{{ $t('docToc.title') }}</p>

      <div v-if="updated" class="inline-flex shrink-0 items-center gap-x-1 max-lg:row-start-3 max-lg:mt-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 15 15" fill="none" stroke="currentColor" stroke-width="1.2" class="size-4 shrink-0 text-[#5D7290]">
          <circle cx="7.5" cy="7.5" r="6.25"></circle>
          <path d="M7.5 4.5v3.2l2 1.3" stroke-linecap="round"></path>
        </svg>
        <span class="font-Golos text-[12px] text-[#5D7290]">{{ $t('docToc.updated', { date: updated }) }}</span>
      </div>

      <ul class="flex-1 space-y-3.5 max-lg:row-start-2">
        <li
          v-for="it in items"
          :key="it.id"
          class="flex items-start gap-x-3 text-blue-600 before:mt-1.5 before:inline-block before:size-3 before:shrink-0 before:rounded-full before:border-[3px] before:border-[#C7CDD7] before:duration-200 before:content-[''] hover:text-red-600 hover:before:border-red-600"
        >
          <a :href="`#${it.id}`" class="underline duration-200" @click="goto($event, it.id)">{{ it.text }}</a>
        </li>
      </ul>
    </div>
  </div>
</template>
