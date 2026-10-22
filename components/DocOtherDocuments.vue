<script setup lang="ts">
import { ref, computed } from 'vue'
import { useLocalePath } from '#imports'

// 对标原站文档页「Other Documents — {国家} ID Photos」折叠列表（F6 取证 SEEN）：
// container > H2 居中（32px serif semibold）
//   > 手风琴头：flex items-center gap-x-5 py-2 px-4 border-[#9ca3af] hover:bg-blue-100/50 hover:border-blue-400
//      （28px 国旗 + flex-1 国家名 24px serif + 「31 doc.」计数 #94a3b8）
//   > grid grid-rows-[var(--rows)] duration-500 列表：px-6 py-2 odd:bg-[#f3f4f6]
// 有 slug 的渲成蓝链，无 slug 的渲成纯文本 span（原站同样没有链接，不造链接）
const props = defineProps<{
  countryCode: string
  countryName: string
  docs: { slug: string; name: string; size?: any }[]
}>()

const localePath = useLocalePath()
const open = ref(true)
const rows = computed(() => (open.value ? '1fr' : '0fr'))
const flagUrl = computed(() => `https://photogov-com.fra1.cdn.digitaloceanspaces.com/frontend/img/svg/flags/4x3/${props.countryCode.toLowerCase()}.svg`)

// 尺寸短标签（对标原站「US Passport 2x2 inch (51x51 mm)」的括号补充）
function sizeLabel(d: any): string {
  const s = d?.size || {}
  if (s.inch && s.mm) return `${s.inch} inch (${s.mm.replace(/x/g, 'x')} mm)`
  if (s.px) return `${s.px} px`
  return ''
}
</script>

<template>
  <div class="container">
    <div class="space-y-3">
      <div class="text-[32px] font-semibold leading-[1.3] font-serif">
        <h2 :id="`other-documents-${countryCode.toLowerCase()}-id-photos`">
          {{ $t('docOther.title', { country: countryName }) }}
        </h2>
      </div>

      <div class="space-y-4">
        <div>
          <!-- 手风琴头 -->
          <div
            class="flex cursor-pointer items-center gap-x-5 border border-[#9ca3af] px-4 py-2 duration-200 hover:border-blue-400 hover:bg-blue-100/50"
            role="button"
            tabindex="0"
            :aria-expanded="open"
            @click="open = !open"
            @keydown.enter.prevent="open = !open"
            @keydown.space.prevent="open = !open"
          >
            <img :src="flagUrl" alt="" width="32" height="24" class="size-8 shrink-0 object-contain">
            <p class="flex-1 font-serif text-[24px]">{{ countryName }}</p>
            <p class="shrink-0 font-serif text-[#94a3b8] max-lg:hidden">{{ $t('docOther.docCount', { count: docs.length }) }}</p>
          </div>

          <!-- 列表（grid-rows 手风琴动画） -->
          <div class="grid w-full grid-rows-[var(--rows)] duration-500 ease-in-out" :style="{ '--rows': rows }">
            <div class="overflow-hidden">
              <ul class="pt-4">
                <li v-for="d in docs" :key="d.slug" class="list-item list-inside px-6 py-2 odd:bg-[#f3f4f6]">
                  <NuxtLink
                    :to="localePath(`/documents/${d.slug}`)"
                    class="text-[14px] text-blue-600 underline duration-200 hover:text-red-600"
                  >
                    {{ d.name }}<template v-if="sizeLabel(d)"> {{ sizeLabel(d) }}</template>
                  </NuxtLink>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
