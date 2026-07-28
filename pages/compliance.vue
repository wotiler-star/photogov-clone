<script setup lang="ts">
useHead({ title: 'Compliance Standards' })
</script>

<template>
  <div class="container-pg py-14">
    <div class="mx-auto max-w-3xl">
      <span class="eyebrow">Compliance</span>
      <h1 class="mt-2 text-3xl font-bold sm:text-4xl">How we stay compliant</h1>
      <p class="mt-4 text-muted">
        Every photo template follows the exact size, background, head-size and
        resolution rules published by passport and visa authorities.
      </p>

      <div class="mt-8 space-y-6">
        <div class="card-pg p-6">
          <h2 class="text-xl font-semibold">Sizes &amp; DPI</h2>
          <p class="mt-2 text-sm text-muted">
            We encode each document's official dimensions in millimetres, inches and
            pixels, and export at the required DPI (typically 300) for crisp prints.
          </p>
        </div>
        <div class="card-pg p-6">
          <h2 class="text-xl font-semibold">Head &amp; eye position</h2>
          <p class="mt-2 text-sm text-muted">
            The editor guides head height and eye level so your photo matches the
            authority's acceptance criteria.
          </p>
        </div>
        <div class="card-pg p-6">
          <h2 class="text-xl font-semibold">Background</h2>
          <p class="mt-2 text-sm text-muted">
            One-click white or light-blue backgrounds meet the most common requirements.
            AI background removal helps when the original background isn't plain.
          </p>
        </div>
      </div>

      <p class="mt-8 text-sm text-muted">
        Always double-check the latest rules on the official authority website linked on
        each document page before submitting.
      </p>
    </div>
  </div>
</template>
