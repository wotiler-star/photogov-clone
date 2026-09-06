<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import KnowledgeList from '~/components/KnowledgeList.vue'

const { t } = useI18n()
useHead({ title: `${t('knowledge.tabStandards')} — ${t('knowledge.title')}` })
</script>

<template>
  <KnowledgeList kind="standards" />
</template>
