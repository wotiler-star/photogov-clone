<template>
  <div class="pg-doc-content">
    <DocNode v-for="(n, i) in nodes" :key="i" :node="n" />
  </div>
</template>

<script setup lang="ts">
/**
 * DocContent —— 目标站内容树的入口。
 * nodes 直接来自 data/docContent/<slug>.json 的 content 数组。
 */
import DocNode from './DocNode.vue'

defineProps<{ nodes: any[] }>()
</script>
