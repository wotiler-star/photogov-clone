<script setup lang="ts">
import { useLocalePath } from '#imports'

// 对标原站文档页尾部的作者署名条（F6 取证 SEEN）：
// flex items-start gap-3 p-3 border-[#e7eaee] rounded bg-[#f5f5f5] font-SourceSerif text-sm
//   > 40px 圆形头像 > "Written by {作者}, Managing Editor · Reviewed by the {编辑团队} ·
//     ★ 4.8 / 5.0 Google · Checked against {官方来源}"
defineProps<{
  /** 官方来源名称（如 "U.S. Department of State requirements"），为空则不渲染该段 */
  authority?: string
  /** 官方来源链接 */
  authorityUrl?: string
}>()

const localePath = useLocalePath()
const GOOGLE_REVIEWS = 'https://www.google.com/maps/place/Digital+Passport+Photo+-+Photogov/'
</script>

<template>
  <div class="container">
    <div class="flex items-start gap-3 rounded border border-[#e7eaee] bg-[#f5f5f5] p-3 font-serif text-sm leading-relaxed">
      <img
        src="/img/editorial/olia-potiagaeva.jpg"
        :alt="$t('docByline.author')"
        width="40"
        height="40"
        class="size-10 shrink-0 rounded-full object-cover"
      >
      <p>
        {{ $t('docByline.writtenBy') }}
        <NuxtLink :to="localePath('/editorial-team')" class="underline duration-200 hover:text-red-600">
          {{ $t('docByline.author') }}
        </NuxtLink>{{ $t('docByline.role') }}
        <span aria-hidden="true"> · </span>
        {{ $t('docByline.reviewedPrefix') }}
        <NuxtLink :to="localePath('/editorial-team')" class="underline duration-200 hover:text-red-600">
          {{ $t('docByline.team') }}
        </NuxtLink>
        <span aria-hidden="true"> · </span>
        <a :href="GOOGLE_REVIEWS" target="_blank" rel="noopener" class="whitespace-nowrap underline duration-200 hover:text-red-600">
          ★ {{ $t('docByline.rating') }}
        </a>
        <template v-if="authority">
          <span aria-hidden="true"> · </span>
          {{ $t('docByline.checkedAgainst') }}
          <a :href="authorityUrl" target="_blank" rel="noopener" class="underline duration-200 hover:text-red-600">{{ authority }}</a>
        </template>
      </p>
    </div>
  </div>
</template>
