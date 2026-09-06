<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import KnowledgeList from '~/components/KnowledgeList.vue'

const { t } = useI18n()
useHead({ title: `${t('knowledge.tabRequirements')} — ${t('knowledge.title')}` })
</script>

<template>
  <KnowledgeList kind="requirements" />
</template>
