<script setup lang="ts">
import { useLocalePath } from '#imports'
import { useI18n } from 'vue-i18n'
import PageSidebar from '~/components/PageSidebar.vue'

const localePath = useLocalePath()
const { t } = useI18n()
useHead({ title: t('editorialTeam.title') })
</script>

<template>
  <div class="container-pg py-14">
    <div class="grid gap-12 lg:grid-cols-[1fr_240px]">
      <div class="mx-auto max-w-3xl">
        <!-- 面包屑（对标原站：Home › Editorial Team） -->
        <nav class="text-sm text-muted" aria-label="Breadcrumb">
          <NuxtLink :to="localePath('/')" class="hover:text-brand-blue hover:underline">{{ $t('nav.home') }}</NuxtLink>
          <span class="mx-1">›</span>
          <span>{{ $t('editorialTeam.breadcrumb') }}</span>
        </nav>

        <h1 class="mt-3 text-3xl font-bold sm:text-4xl">{{ $t('editorialTeam.title') }}</h1>
        <p class="mt-4 text-muted">{{ $t('editorialTeam.intro') }}</p>

        <!-- 编辑介绍卡 -->
        <section class="mt-10">
          <h2 class="text-2xl font-semibold">{{ $t('editorialTeam.editorsTitle') }}</h2>
          <div class="card-pg mt-5 p-6">
            <h3 class="text-lg font-semibold">{{ $t('editorialTeam.name') }}</h3>
            <p class="mt-1 text-sm font-medium text-brand-blue">{{ $t('editorialTeam.role') }}</p>
            <p class="mt-3 text-muted">{{ $t('editorialTeam.bio') }}</p>
            <a
              href="https://www.linkedin.com/in/olia-potiagaeva"
              target="_blank"
              rel="noopener"
              class="mt-3 inline-flex items-center gap-2 text-sm font-medium text-brand-blue underline"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.7h.05c.53-.95 1.83-1.95 3.76-1.95C20.4 8.75 22 10.6 22 14.1V21h-4v-6.1c0-1.5-.54-2.5-1.87-2.5-1.02 0-1.63.68-1.9 1.34-.1.23-.13.55-.13.88V21h-4V9Z"/>
              </svg>
              {{ $t('editorialTeam.linkedin') }}
            </a>
          </div>
        </section>

        <!-- 流程入口（对标原站链接到 editorial-policy） -->
        <p class="mt-8 text-muted">
          <NuxtLink :to="localePath('/editorial-policy')" class="font-medium text-brand-blue underline">
            {{ $t('editorialTeam.processText') }}
          </NuxtLink>
        </p>
      </div>

      <PageSidebar />
    </div>
  </div>
</template>
