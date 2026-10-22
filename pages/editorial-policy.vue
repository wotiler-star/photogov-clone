<script setup lang="ts">
import { useLocalePath } from '#imports'
import { useI18n } from 'vue-i18n'
import PageSidebar from '~/components/PageSidebar.vue'

const localePath = useLocalePath()
const { t, tm } = useI18n()
useHead({ title: t('editorialPolicy.title') })

const steps = tm('editorialPolicy.steps') as Array<{ t: string; d: string }>
</script>

<template>
  <div class="container-pg py-14">
    <div class="grid gap-12 lg:grid-cols-[1fr_240px]">
      <div class="mx-auto max-w-3xl">
        <!-- 面包屑（对标原站：Home › Editorial Policy） -->
        <nav class="text-sm text-muted" aria-label="Breadcrumb">
          <NuxtLink :to="localePath('/')" class="hover:text-brand-blue hover:underline">{{ $t('nav.home') }}</NuxtLink>
          <span class="mx-1">›</span>
          <span>{{ $t('editorialPolicy.breadcrumb') }}</span>
        </nav>

        <h1 class="mt-3 text-3xl font-bold sm:text-4xl">{{ $t('editorialPolicy.title') }}</h1>
        <p class="mt-4 text-muted">{{ $t('editorialPolicy.subtitle') }}</p>
        <p class="mt-2 text-xs text-muted">{{ $t('editorialPolicy.lastUpdated') }}</p>

        <section class="mt-10">
          <h2 class="text-2xl font-semibold">{{ $t('editorialPolicy.createTitle') }}</h2>
          <p class="mt-3 text-muted">{{ $t('editorialPolicy.createP') }}</p>
        </section>

        <section class="mt-10">
          <h2 class="text-2xl font-semibold">{{ $t('editorialPolicy.teamTitle') }}</h2>
          <p class="mt-3 text-muted">
            {{ $t('editorialPolicy.teamP') }}
            <NuxtLink :to="localePath('/editorial-team')" class="font-medium text-brand-blue underline">
              {{ $t('editorialPolicy.teamLink') }}
            </NuxtLink>
          </p>
        </section>

        <section class="mt-10">
          <h2 class="text-2xl font-semibold">{{ $t('editorialPolicy.sourcesTitle') }}</h2>
          <p class="mt-3 text-muted">{{ $t('editorialPolicy.sourcesP') }}</p>
        </section>

        <section class="mt-10">
          <h2 class="text-2xl font-semibold">{{ $t('editorialPolicy.stepsTitle') }}</h2>
          <ol class="mt-4 space-y-4">
            <li v-for="(s, i) in steps" :key="i" class="card-pg p-5">
              <h3 class="font-semibold">{{ s.t }}</h3>
              <p class="mt-1 text-sm text-muted">{{ s.d }}</p>
            </li>
          </ol>
        </section>

        <section class="mt-10">
          <h2 class="text-2xl font-semibold">{{ $t('editorialPolicy.updatesTitle') }}</h2>
          <p class="mt-3 text-muted">{{ $t('editorialPolicy.updatesP') }}</p>
        </section>

        <section class="mt-10">
          <h2 class="text-2xl font-semibold">{{ $t('editorialPolicy.correctionsTitle') }}</h2>
          <p class="mt-3 text-muted">
            {{ $t('editorialPolicy.correctionsP') }}
            <NuxtLink :to="localePath('/contacts')" class="font-medium text-brand-blue underline">
              {{ $t('footer.links.contacts') }}
            </NuxtLink>
          </p>
        </section>
      </div>

      <PageSidebar />
    </div>
  </div>
</template>
