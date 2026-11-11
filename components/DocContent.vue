<template>
  <div class="pg-doc-content">
    <DocNode v-for="(n, i) in localized" :key="i" :node="n" />
  </div>
</template>

<script setup lang="ts">
/**
 * DocContent —— 目标站内容树的入口。
 * nodes 直接来自 data/docContent/<slug>.json 的 content 数组。
 * 渲染前统一把站内相对链接补上当前语言前缀（strategy:'prefix' 下裸路径 404）。
 */
import { computed } from 'vue'
import { useLocalePath } from '#imports'
import DocNode from './DocNode.vue'
import { localizeNodes } from '~/utils/localizeHtml'

const props = defineProps<{ nodes: any[] }>()
const localePath = useLocalePath()
const localized = computed(() => localizeNodes(props.nodes || [], localePath))
</script>
