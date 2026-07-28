<script setup lang="ts">
useHead({ title: 'Help Center' })
const faqs = [
  { q: 'Is PhotoGov really free?', a: 'Yes. Making and downloading photos is free, with no watermarks.' },
  { q: 'Do you store my photo?', a: 'No. Processing runs in your browser; we never upload your images.' },
  { q: 'What format should I download?', a: 'Use JPG for online submissions and PDF for printing at a photo lab.' },
  { q: 'My photo was rejected — what now?', a: 'Re-check the document page requirements (background, head size, expression) and retake.' },
  { q: 'Which countries are supported?', a: 'Over 100 countries, with sizes kept up to date.' }
]
</script>

<template>
  <div class="container-pg py-14">
    <div class="mx-auto max-w-3xl">
      <span class="eyebrow">Help</span>
      <h1 class="mt-2 text-3xl font-bold sm:text-4xl">Help Center</h1>
      <p class="mt-3 text-muted">Answers to the most common questions.</p>

      <div class="mt-8 space-y-3">
        <div v-for="f in faqs" :key="f.q" class="card-pg p-5">
          <h2 class="font-semibold">{{ f.q }}</h2>
          <p class="mt-1 text-sm text-muted">{{ f.a }}</p>
        </div>
      </div>

      <div class="mt-8 rounded-2xl bg-slate-50 p-6 text-center">
        <p class="text-muted">Still need help?</p>
        <NuxtLink to="/contact" class="btn-primary mt-3">Contact us</NuxtLink>
      </div>
    </div>
  </div>
</template>
