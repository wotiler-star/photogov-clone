<script setup lang="ts">
import { useLocalePath } from '#imports'

// 对标原站信息页底部服务行（F5 取证 SEEN）：
// "Service provided by Y VISION TECHNOLOGIES LLP · Stoney Works 8 Stoney Lane,
//  London, England, SE19 3BD · Terms · Refund policy · Contact"
// 样式：container pb-10 text-[12px] text-[#6b7280] font-serif text-center
const localePath = useLocalePath()
</script>

<template>
  <p class="container pb-10 text-center font-serif text-[12px] text-[#6b7280]">
    {{ $t('serviceLine.prefix') }} {{ $t('serviceLine.company') }} · {{ $t('serviceLine.address') }} ·
    <NuxtLink :to="localePath('/terms-of-use')" class="underline duration-200 hover:text-red-600">{{ $t('serviceLine.terms') }}</NuxtLink> ·
    <NuxtLink :to="localePath('/refund-policy')" class="underline duration-200 hover:text-red-600">{{ $t('serviceLine.refund') }}</NuxtLink> ·
    <NuxtLink :to="localePath('/contacts')" class="underline duration-200 hover:text-red-600">{{ $t('serviceLine.contact') }}</NuxtLink>
  </p>
</template>
