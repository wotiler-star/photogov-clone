<script setup lang="ts">
useHead({ title: 'Terms of Service' })
</script>

<template>
  <div class="container-pg py-14">
    <div class="mx-auto max-w-3xl">
      <span class="eyebrow">Legal</span>
      <h1 class="mt-2 text-3xl font-bold sm:text-4xl">Terms of Service</h1>
      <p class="mt-3 text-sm text-muted">Last updated: {{ new Date().getFullYear() }}</p>

      <div class="mt-6 space-y-5 text-muted">
        <section>
          <h2 class="text-xl font-semibold text-ink">Use of the service</h2>
          <p class="mt-1">
            PhotoGov provides photo-cropping and formatting tools for informational and
            personal use. We do not guarantee acceptance by any government authority.
          </p>
        </section>
        <section>
          <h2 class="text-xl font-semibold text-ink">No warranty</h2>
          <p class="mt-1">
            The service is provided "as is" without warranties of any kind. You are
            responsible for verifying that your photo meets current official requirements.
          </p>
        </section>
        <section>
          <h2 class="text-xl font-semibold text-ink">Limitation of liability</h2>
          <p class="mt-1">
            We are not liable for any rejection of a photo or any consequential loss.
          </p>
        </section>
        <section>
          <h2 class="text-xl font-semibold text-ink">Changes</h2>
          <p class="mt-1">
            We may update these terms at any time. Continued use constitutes acceptance.
          </p>
        </section>
      </div>
    </div>
  </div>
</template>
