<script setup lang="ts">
useHead({ title: 'Cookie Policy' })
</script>

<template>
  <div class="container-pg py-14">
    <div class="mx-auto max-w-3xl">
      <span class="eyebrow">Legal</span>
      <h1 class="mt-2 text-3xl font-bold sm:text-4xl">Cookie Policy</h1>
      <p class="mt-3 text-sm text-muted">Last updated: {{ new Date().getFullYear() }}</p>

      <div class="mt-6 space-y-5 text-muted">
        <section>
          <h2 class="text-xl font-semibold text-ink">What we use</h2>
          <p class="mt-1">
            We use a small number of cookies to remember your selected country and your
            cookie-consent choice. These are strictly functional.
          </p>
        </section>
        <section>
          <h2 class="text-xl font-semibold text-ink">Analytics</h2>
          <p class="mt-1">
            Aggregated, anonymized analytics help us improve the tool. No photo data is
            involved.
          </p>
        </section>
        <section>
          <h2 class="text-xl font-semibold text-ink">Managing cookies</h2>
          <p class="mt-1">
            You can clear cookies in your browser settings at any time.
          </p>
        </section>
      </div>
    </div>
  </div>
</template>
