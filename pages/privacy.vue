<script setup lang="ts">
useHead({ title: 'Privacy Policy' })
</script>

<template>
  <div class="container-pg py-14">
    <div class="mx-auto max-w-3xl">
      <span class="eyebrow">Legal</span>
      <h1 class="mt-2 text-3xl font-bold sm:text-4xl">Privacy Policy</h1>
      <p class="mt-3 text-sm text-muted">Last updated: {{ new Date().getFullYear() }}</p>

      <div class="mt-6 space-y-5 text-muted">
        <section>
          <h2 class="text-xl font-semibold text-ink">Photos stay on your device</h2>
          <p class="mt-1">
            All image processing happens locally in your browser using the Canvas API.
            Your photos are never uploaded to our servers.
          </p>
        </section>
        <section>
          <h2 class="text-xl font-semibold text-ink">Analytics</h2>
          <p class="mt-1">
            We use privacy-friendly, aggregated analytics to understand usage. No
            personally identifiable information is collected from your photos.
          </p>
        </section>
        <section>
          <h2 class="text-xl font-semibold text-ink">Cookies</h2>
          <p class="mt-1">
            We use a minimal cookie to remember your preferences (such as country and
            cookie consent). See our <NuxtLink to="/cookies" class="text-brand-blue underline">Cookie Policy</NuxtLink>.
          </p>
        </section>
        <section>
          <h2 class="text-xl font-semibold text-ink">Contact</h2>
          <p class="mt-1">
            Questions? Reach us via the <NuxtLink to="/contact" class="text-brand-blue underline">contact page</NuxtLink>.
          </p>
        </section>
      </div>
    </div>
  </div>
</template>
