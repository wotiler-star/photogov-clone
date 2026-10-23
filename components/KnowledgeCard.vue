<script setup lang="ts">
/**
 * KnowledgeCard —— 知识库文章卡（对标原站 /knowledge/ 卡片，SSR 实证）。
 *
 * SEEN 结构：
 *   <div class="rounded-[8px] overflow-hidden bg-white">
 *     <a class="relative flex items-end justify-start h-[220px] p-5">
 *       <img class="absolute inset-0 size-full object-cover object-left-top" src=封面>
 *       <div class="relative px-6 py-2 text-[14px] font-medium font-sans bg-white rounded-[4px]">分类徽章</div>
 *     </a>
 *     <div class="flex flex-col gap-y-8 pt-3.5 pb-6 px-5">
 *       <div class="flex-1">
 *         <div class="flex justify-between items-center gap-x-4">
 *           <眼睛 #8E8E8E> Reading time 11m    <人形 #A7A7A7> 640 views
 *         </div>
 *         <a class="block mt-3.5 font-sans text-[20px] font-bold underline leading-[1.2] hover:text-red-600">标题</a>
 *         <p class="mt-3 text-[14px] leading-[1.3] font-sans text-[#414141]">摘要</p>
 *       </div>
 *       <div class="shrink-0 flex items-center gap-x-2.5">
 *         40px 圆形头像 + <b>Olia Potiagaeva</b> + 日历 + 日期
 *       </div>
 *     </div>
 *   </div>
 */
import { computed } from 'vue'

const props = defineProps<{
  post: any
  /** 分类徽章文案（原站用英文分类名：Requirements / Guides / Standards / FAQ） */
  categoryLabel: string
}>()

const localePath = useLocalePath()
const { locale } = useI18n()

const to = computed(() => localePath(`/knowledge/${props.post.categorySlug}/${props.post.slug}`))

// 日期格式化为「August 28, 2026」（原站卡片口径）
const dateText = computed(() => {
  try {
    return new Date(props.post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return props.post.date || ''
  }
})

// 原站显示「Reading time 11m」「640 views」，本站 readTime 存的是「11 min read」
const readLabel = computed(() => {
  const m = /(\d+)/.exec(props.post.readTime || '')
  return m ? `Reading time ${m[1]}m` : ''
})
const viewsLabel = computed(() => (props.post.views ? `${props.post.views} views` : ''))
</script>

<template>
  <div class="overflow-hidden rounded-[8px] bg-white">
    <!-- 封面 + 分类徽章 -->
    <NuxtLink :to="to" class="relative flex h-[220px] items-end justify-start p-5">
      <img
        v-if="post.cover"
        class="absolute inset-0 size-full object-cover object-left-top"
        :src="post.cover"
        :alt="post.title"
        loading="lazy"
        decoding="async"
      >
      <div class="relative rounded-[4px] bg-white px-6 py-2 font-sans text-[14px] font-medium">
        {{ categoryLabel }}
      </div>
    </NuxtLink>

    <div class="flex flex-col gap-y-8 px-5 pb-6 pt-3.5">
      <div class="flex-1">
        <div class="flex items-center justify-between gap-x-4">
          <div v-if="readLabel" class="inline-flex shrink-0 items-center gap-x-1">
            <!-- 眼睛图标（原站 #8E8E8E） -->
            <svg class="size-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M8 3C4.909 3 2.145 4.62 1 7c1.145 2.38 3.909 4.5 7 4.5s5.855-2.12 7-4.5C13.855 4.62 11.091 3 8 3Zm0 7.25A2.75 2.75 0 1 1 8 4.75a2.75 2.75 0 0 1 0 5.5Zm0-4.25A1.5 1.5 0 1 0 8 9.5a1.5 1.5 0 0 0 0-3.5Z" fill="#8E8E8E" />
            </svg>
            <span class="font-sans text-[12px] font-medium text-[#8E8E8E]">{{ readLabel }}</span>
          </div>
          <div v-if="viewsLabel" class="inline-flex shrink-0 items-center gap-x-1">
            <!-- 人形图标（原站 #A7A7A7） -->
            <svg class="size-4" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M7 1.75a2.625 2.625 0 1 0 0 5.25 2.625 2.625 0 0 0 0-5.25ZM7 8.167c2.5 0 4.667 1.4 4.667 3.208v.792H2.333v-.792C2.333 9.567 4.5 8.167 7 8.167Z" fill="#A7A7A7" />
            </svg>
            <span class="font-sans text-[12px] font-medium text-[#8E8E8E]">{{ viewsLabel }}</span>
          </div>
        </div>

        <NuxtLink
          :to="to"
          class="mt-3.5 block font-sans text-[20px] font-bold leading-[1.2] underline duration-200 hover:text-red-600"
        >
          <span>{{ post.title }}</span>
        </NuxtLink>

        <p class="mt-3 font-sans text-[14px] leading-[1.3] text-[#414141]">{{ post.excerpt }}</p>
      </div>

      <!-- 作者 + 日期 -->
      <div class="flex shrink-0 items-center gap-x-2.5">
        <div class="size-10 shrink-0 overflow-hidden rounded-full">
          <img src="/img/editorial/olia-potiagaeva.jpg" :alt="post.author" class="size-full object-cover" loading="lazy">
        </div>
        <div class="flex-1 space-y-1.5 leading-none">
          <span class="font-sans text-[14px] underline"><b>{{ post.author }}</b></span>
          <div class="flex items-center gap-x-1.5">
            <!-- 日历图标（原站 size-3.5） -->
            <svg class="size-3.5" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M3.5 1.75h1v1.5h5v-1.5h1v1.5H12.25v10.5H1.75V3.25H3.5v-1.5Zm-1 3v8.5h9v-8.5h-9Z" fill="#8E8E8E" />
            </svg>
            <span class="font-sans text-[12px] text-[#8E8E8E]">{{ dateText }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
