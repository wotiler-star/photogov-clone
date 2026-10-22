<script setup lang="ts">
import { useLocalePath } from '#imports'

// 对标原站文档页尾部两块小内容（F6 取证 SEEN）：
// ① 独立声明：flex gap-x-4 —— 36px「not affiliated」图标 + 12px「PhotoGov.net strictly adheres to the
//    {Global regulations for ID photos}.」
// ② Related pages：container > .lg:max-w-[700px] > H2 + ul.static-ul 知识库链接
defineProps<{
  /** Related pages 链接（由页面从知识库数据里挑选后传入） */
  related?: { label: string; to: string }[]
}>()

const localePath = useLocalePath()
</script>

<template>
  <div class="container">
    <!-- ① 独立声明 -->
    <div class="flex gap-x-4">
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36" fill="none" class="mt-0.5 size-9 shrink-0">
        <path
          d="M18 3.375 31.5 8.1v9.45c0 7.875-5.4 14.4-13.5 16.2C9.9 21.95 4.5 15.425 4.5 7.55V8.1L18 3.375Z"
          stroke="#212532"
          stroke-width="1.5"
          stroke-linejoin="round"
        />
        <path d="M12.375 18.5 16.5 22.625 24 15.125" stroke="#212532" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <div class="flex-1">
        <div class="font-Golos text-[12px] font-normal">
          <p>
            {{ $t('docNotice.lead') }}
            <NuxtLink :to="localePath('/global-id-photo-compliance')" target="_blank" class="text-blue-600 underline duration-200 hover:text-red-600">
              {{ $t('docNotice.regulations') }}
            </NuxtLink>.
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- ② Related pages -->
  <div v-if="related && related.length" class="container">
    <div class="lg:max-w-[700px]">
      <div class="space-y-4">
        <div class="text-[32px] font-semibold leading-[1.3] font-serif">
          <h2>{{ $t('docNotice.relatedTitle') }}</h2>
        </div>
        <ul class="ml-4 list-outside list-disc space-y-1.5">
          <li v-for="r in related" :key="r.to" class="list-item">
            <NuxtLink :to="localePath(r.to)" class="text-blue-600 underline duration-200 hover:text-red-600">{{ r.label }}</NuxtLink>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
