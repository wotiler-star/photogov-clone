<script setup lang="ts">
useHead({ title: 'About PhotoGov' })
</script>

<template>
  <div class="container-pg py-14">
    <div class="mx-auto max-w-3xl">
      <span class="eyebrow">About</span>
      <h1 class="mt-2 text-3xl font-bold sm:text-4xl">About PhotoGov</h1>
      <p class="mt-4 text-muted">
        PhotoGov is a free online tool that helps travelers create compliant passport,
        visa and ID photos without a photo studio. We replicate the document standards
        published by government agencies in 100+ countries and let you crop, adjust and
        export a print-ready photo in seconds.
      </p>
      <h2 class="mt-8 text-2xl font-semibold">Our mission</h2>
      <p class="mt-2 text-muted">
        Official photo rules are confusing and change often. Our goal is to make a
        compliant photo accessible to everyone — on any device, in any country, for free.
      </p>
      <h2 class="mt-8 text-2xl font-semibold">Privacy first</h2>
      <p class="mt-2 text-muted">
        Your photos are processed entirely in your browser. We do not upload or store
        them on our servers. Read our <NuxtLink to="/privacy" class="text-brand-blue underline">Privacy Policy</NuxtLink>.
      </p>
      <p class="mt-8 rounded-2xl bg-slate-50 p-5 text-sm text-muted">
        This is an unofficial demo clone of www.photogov.net, built for educational and
        replication purposes. Not affiliated with any government agency.
      </p>
    </div>
  </div>
</template>
