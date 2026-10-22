<script setup lang="ts">
import { useLocalePath } from '#imports'

// 对标原站文档页「信任三条」条带（F6 取证 SEEN）：
// flex flex-wrap gap-4 内 3 张 flex-1 min-w-[220px] p-4 border-[#E7EAEE] rounded bg-[#F5FAFD]
//   标题 font-semibold #1E1E1E + 说明 13px #5D7290 + 蓝色下划线 CTA
defineProps<{
  /** 官方来源短名（"U.S. Department of State"），用于第三条说明 */
  authority?: string
  /** 最后核验日期（DD.MM.YYYY） */
  lastChecked?: string
}>()

const localePath = useLocalePath()
</script>

<template>
  <div class="container">
    <div class="mt-4 flex flex-wrap gap-4 font-serif">
      <!-- ① 退款保障 -->
      <div class="flex min-w-[220px] flex-1 flex-col gap-y-1.5 rounded border border-[#E7EAEE] bg-[#F5FAFD] p-4">
        <p class="font-semibold leading-[1.3] text-[#1E1E1E]">{{ $t('docTrust.refundTitle') }}</p>
        <p class="flex-1 text-[13px] leading-[1.4] text-[#5D7290]">{{ $t('docTrust.refundText') }}</p>
        <NuxtLink :to="localePath('/refund-policy')" class="text-[13px] text-blue-600 underline duration-200 hover:text-red-600">
          → {{ $t('docTrust.refundCta') }}
        </NuxtLink>
      </div>

      <!-- ② 合规校验 -->
      <div class="flex min-w-[220px] flex-1 flex-col gap-y-1.5 rounded border border-[#E7EAEE] bg-[#F5FAFD] p-4">
        <p class="font-semibold leading-[1.3] text-[#1E1E1E]">{{ $t('docTrust.checkTitle') }}</p>
        <p class="flex-1 text-[13px] leading-[1.4] text-[#5D7290]">{{ $t('docTrust.checkText') }}</p>
        <a href="#page-widget" class="text-[13px] text-blue-600 underline duration-200 hover:text-red-600">
          → {{ $t('docTrust.checkCta') }}
        </a>
      </div>

      <!-- ③ 定期复核 -->
      <div class="flex min-w-[220px] flex-1 flex-col gap-y-1.5 rounded border border-[#E7EAEE] bg-[#F5FAFD] p-4">
        <p class="font-semibold leading-[1.3] text-[#1E1E1E]">{{ $t('docTrust.recheckTitle') }}</p>
        <p class="flex-1 text-[13px] leading-[1.4] text-[#5D7290]">
          {{ $t('docTrust.recheckText', { authority: authority || 'U.S. Department of State' }) }}
          <template v-if="lastChecked"> {{ $t('docTrust.lastChecked', { date: lastChecked }) }}</template>
        </p>
        <a href="#official-government-sources" class="text-[13px] text-blue-600 underline duration-200 hover:text-red-600">
          → {{ $t('docTrust.recheckCta') }}
        </a>
      </div>
    </div>
  </div>
</template>
