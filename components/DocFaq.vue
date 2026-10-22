<script setup lang="ts">
/**
 * DocFaq —— 文档页 FAQ 手风琴（对标原站 DDFaq 的渲染结果）。
 *
 * SEEN（/documents/us-passport-photo/ SSR，21 问）：
 *   外层   div.space-y-0
 *   每项   div.border-t.border-[#E8EAEB].first:border-t-0.bg-white
 *   头行   div.flex.items-start.gap-x-1.5.px-4.py-[18px].cursor-pointer.duration-200.hover:bg-black/5
 *          ├ 24px 信息图标（#315FB6）
 *          ├ span.flex-1.max-lg:text-[14px]  ← 问题
 *          └ 24px 加号图标（#315FB6，展开时旋转）
 *   答案   div.grid.grid-rows-[var(--rows)].duration-500  style="--rows: 0fr|1fr"
 *          └ div.overflow-hidden > div.pl-[2.875rem].max-w-[700px].pb-6.pt-2.space-y-2.text-[14px]
 *
 * 默认全部收起（--rows: 0fr），可同时展开多项；动画沿用 F4 已验证的 grid-rows 方案。
 */
import { ref, computed } from 'vue'

const props = defineProps<{ items: { q: string; a: string }[] }>()

/** 展开项下标集合（原站默认全收起，SEEN） */
const open = ref<Set<number>>(new Set())
const isOpen = (i: number) => open.value.has(i)
const rowsOf = (i: number) => (isOpen(i) ? '1fr' : '0fr')
const toggle = (i: number) => {
  const next = new Set(open.value)
  next.has(i) ? next.delete(i) : next.add(i)
  open.value = next
}

/**
 * 答案富文本清洗：
 * 1. 原站答案里的绝对站内链接（https://photogov.net/xxx）改成本站相对路径，避免出站；
 * 2. 剩余外链补 target="_blank" rel="noopener"（安全与 SEO 惯例）。
 */
const fmt = (html: string) =>
  String(html || '')
    // 1) 原站答案里的绝对站内链接改成本站相对路径，避免把用户带出站
    .replace(/https:\/\/photogov\.net/g, '')
    // 2) 站内链接（href 以 / 开头）：去掉 target/rel——原站数据里部分站内链
    //    自带 target='_blank'，会把用户带出当前标签页，这里统一拉回本窗口
    .replace(
      /<a([^>]*?href=["']\/[^>]*?)>/g,
      (_m, attrs: string) =>
        `<a${attrs.replace(/\s*target=["'][^"']*["']/g, '').replace(/\s*rel=["'][^"']*["']/g, '')}>`,
    )
    // 3) 剩下的外链补安全属性：站内链接（href 以 / 开头）与已有 target 的都跳过
    .replace(/<a(?![^>]*href=["']\/)(?![^>]*\starget=)(?=\s)/g, '<a target="_blank" rel="noopener"')

const list = computed(() =>
  (props.items || []).filter((it) => it && it.q).map((it) => ({ q: String(it.q), a: fmt(it.a) }))
)
</script>

<template>
  <div v-if="list.length" class="space-y-0">
    <div
      v-for="(it, i) in list"
      :key="i"
      class="border-t border-[#E8EAEB] bg-white first:border-t-0"
    >
      <!-- 头行：整行可点，键盘可达（role=button + Enter/Space） -->
      <div
        class="flex cursor-pointer items-start gap-x-1.5 px-4 py-[18px] duration-200 hover:bg-black/5"
        role="button"
        tabindex="0"
        :aria-expanded="isOpen(i)"
        @click="toggle(i)"
        @keydown.enter.prevent="toggle(i)"
        @keydown.space.prevent="toggle(i)"
      >
        <!-- 信息图标（原站 DDFaq 问号图形，#315FB6） -->
        <svg class="size-6 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path
            d="M12 3C10.22 3 8.47991 3.52784 6.99987 4.51677C5.51983 5.50571 4.36628 6.91131 3.68509 8.55585C3.0039 10.2004 2.82567 12.01 3.17294 13.7558C3.5202 15.5016 4.37737 17.1053 5.63604 18.364C6.89471 19.6226 8.49836 20.4798 10.2442 20.8271C11.99 21.1743 13.7996 20.9961 15.4442 20.3149C17.0887 19.6337 18.4943 18.4802 19.4832 17.0001C20.4722 15.5201 21 13.78 21 12C20.9974 9.61384 20.0484 7.32616 18.3611 5.63889C16.6738 3.95162 14.3862 3.00258 12 3ZM12 17.25C11.8517 17.25 11.7067 17.206 11.5833 17.1236C11.46 17.0412 11.3639 16.9241 11.3071 16.787C11.2503 16.65 11.2355 16.4992 11.2644 16.3537C11.2934 16.2082 11.3648 16.0746 11.4697 15.9697C11.5746 15.8648 11.7082 15.7933 11.8537 15.7644C11.9992 15.7355 12.15 15.7503 12.287 15.8071C12.4241 15.8639 12.5412 15.96 12.6236 16.0833C12.706 16.2067 12.75 16.3517 12.75 16.5C12.75 16.6989 12.671 16.8897 12.5303 17.0303C12.3897 17.171 12.1989 17.25 12 17.25ZM13.1453 12.525C13.0224 12.5848 12.9196 12.679 12.8494 12.7962C12.7792 12.9134 12.7447 13.0485 12.75 13.185V13.5C12.75 13.6989 12.671 13.8897 12.5303 14.0303C12.3897 14.171 12.1989 14.25 12 14.25C11.8011 14.25 11.6103 14.171 11.4697 14.0303C11.329 13.8897 11.25 13.6989 11.25 13.5V13.185C11.2423 12.7508 11.3639 12.3242 11.5996 11.9594C11.8352 11.5946 12.174 11.3082 12.573 11.1367C12.8915 11.0049 13.1548 10.7674 13.3188 10.4641C13.4827 10.1609 13.5371 9.81043 13.473 9.47175C13.4152 9.17496 13.2702 8.90219 13.0564 8.6884C12.8426 8.4746 12.5698 8.32952 12.273 8.27175C12.0563 8.23164 11.8334 8.23977 11.6202 8.29557C11.407 8.35138 11.2087 8.45347 11.0394 8.5946C10.8702 8.73574 10.7341 8.91243 10.6408 9.11213C10.5476 9.31182 10.4995 9.52961 10.5 9.75C10.5 9.94891 10.421 10.1397 10.2803 10.2803C10.1397 10.421 9.94892 10.5 9.75 10.5C9.55109 10.5 9.36033 10.421 9.21967 10.2803C9.07902 10.1397 9 9.94891 9 9.75C9.0004 9.2067 9.14833 8.67371 9.428 8.20792C9.70767 7.74213 10.1086 7.36103 10.5879 7.1053C11.0673 6.84958 11.6071 6.72883 12.1497 6.75594C12.6923 6.78305 13.2174 6.95701 13.6689 7.25925C14.1204 7.56148 14.4813 7.98065 14.7131 8.472C14.945 8.96334 15.039 9.50843 14.9853 10.0491C14.9315 10.5897 14.7319 11.1056 14.4079 11.5416C14.0838 11.9777 13.6474 12.3176 13.1453 12.525Z"
            fill="#315FB6"
          />
        </svg>

        <span class="max-lg:mt-0.5 max-lg:text-[14px] flex-1">{{ it.q }}</span>

        <!-- 加号 → 展开时旋转 45°（INFERRED 旋转角度，原站仅见 duration-300 与两条线） -->
        <svg
          class="size-6 shrink-0 duration-300"
          :class="isOpen(i) ? 'rotate-45' : ''"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M6.75 12H17.25" stroke="#315FB6" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M12 6.75V17.25" stroke="#315FB6" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>

      <!-- 答案：grid-rows 高度动画 -->
      <div class="grid grid-rows-[var(--rows)] duration-500" :style="`--rows: ${rowsOf(i)}`">
        <div class="overflow-hidden">
          <div
            class="max-w-[700px] space-y-2 pb-6 pl-[2.875rem] pt-2 text-[14px] max-lg:px-3.5 max-lg:pb-4 max-lg:pt-2"
            v-html="it.a"
          />
        </div>
      </div>
    </div>
  </div>
</template>
