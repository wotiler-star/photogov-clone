<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PhotoTool from '~/components/PhotoTool.vue'
import DocCard from '~/components/DocCard.vue'
import { useData } from '~/composables/useData'

const route = useRoute()
const slug = computed(() => route.params.slug as string)
const { getDocument, documents, countriesByCode } = useData()
const doc = computed(() => getDocument(slug.value))

useHead(() => ({
  title: doc.value ? doc.value.title : 'Document not found',
  meta: [{ name: 'description', content: doc.value ? `${doc.value.name} photo requirements` : '' }]
}))

const flagFor = (code: string) => countriesByCode[code]?.flag || '📄'

const bgLabel = (hex?: string): string => {
  if (!hex) return 'White'
  const h = hex.toLowerCase()
  if (h === '#2b72e0') return 'Light blue'
  if (h === '#e8e8e8') return 'Light grey / cream'
  if (h === '#ffffff') return 'White'
  return 'Light grey / cream'
}

const related = computed(() => {
  if (!doc.value) return []
  return documents
    .filter((d) => d.country === doc.value!.country && d.slug !== doc.value!.slug)
    .slice(0, 4)
})

const reqs = computed(() => {
  const d = doc.value
  if (!d) return []
  return [
    { k: 'Photo size', v: `${d.size.inch} in (${d.size.mm} mm)` },
    { k: 'Pixel size', v: d.size.px },
    { k: 'Resolution', v: `${d.dpi} DPI` },
    { k: 'Background', v: bgLabel(d.background) },
    { k: 'Head height', v: d.headHeight },
    { k: ' Eyes level', v: d.eyesLevel },
    { k: 'File format', v: d.format },
    { k: 'File size', v: d.fileSize },
    { k: 'Glasses', v: d.glasses ? 'Allowed (no glare)' : 'Not allowed' },
    { k: 'Expression', v: d.expression },
    { k: 'Color', v: d.color || 'In color' },
    { k: 'Attire', v: d.attire || 'Casual' }
  ]
})
</script>

<template>
  <div v-if="doc" class="bg-slate-50 min-h-[70vh]">
    <div class="container-pg py-10">
      <!-- 面包屑 -->
      <nav class="text-sm text-muted">
        <NuxtLink to="/documents" class="hover:text-brand-blue">Documents</NuxtLink>
        <span class="mx-1">/</span>
        <span>{{ flagFor(doc.country) }} {{ doc.countryName }}</span>
        <span class="mx-1">/</span>
        <span class="text-ink">{{ doc.name }}</span>
      </nav>

      <div class="mt-4 grid gap-8 lg:grid-cols-[1fr_minmax(0,420px)]">
        <!-- 左：说明 -->
        <div>
          <h1 class="text-3xl font-bold sm:text-4xl">{{ doc.name }} Photo</h1>
          <p class="mt-2 text-muted">
            Official photo requirements for the {{ doc.countryName }} {{ doc.name }},
            updated for {{ doc.year }}.
          </p>

          <!-- 规格图 -->
          <div class="mt-6 card-pg p-6">
            <div class="grid items-center gap-6 sm:grid-cols-[200px_1fr]">
              <svg viewBox="0 0 200 240" class="mx-auto h-56 w-44">
                <rect x="6" y="6" width="188" height="228" rx="6" fill="#fff" stroke="#2B72E0" stroke-width="2"/>
                <!-- 头部示意 -->
                <circle cx="100" cy="92" r="34" fill="#cde0ff"/>
                <path d="M58 210c0-30 18-52 42-52s42 22 42 52z" fill="#cde0ff"/>
                <!-- 眼睛线 -->
                <line x1="6" y1="100" x2="194" y2="100" stroke="#E5484D" stroke-width="1.5" stroke-dasharray="5 4"/>
                <text x="198" y="103" font-size="11" fill="#E5484D">eyes</text>
                <!-- 头高括号 -->
                <line x1="20" y1="62" x2="20" y2="120" stroke="#2BB673" stroke-width="1.5"/>
                <line x1="15" y1="62" x2="25" y2="62" stroke="#2BB673" stroke-width="1.5"/>
                <line x1="15" y1="120" x2="25" y2="120" stroke="#2BB673" stroke-width="1.5"/>
                <text x="28" y="94" font-size="10" fill="#2BB673">head</text>
              </svg>
              <dl class="space-y-2 text-sm">
                <div v-for="r in reqs" :key="r.k" class="flex justify-between gap-4 border-b border-slate-100 pb-2">
                  <dt class="text-muted">{{ r.k }}</dt>
                  <dd class="text-right font-medium">{{ r.v }}</dd>
                </div>
              </dl>
            </div>
            <p class="mt-4 text-xs text-muted">
              Source:
              <a :href="doc.source" target="_blank" rel="noopener" class="text-brand-blue underline">{{ doc.source }}</a>
            </p>
          </div>

          <!-- 小贴士 -->
          <div class="mt-6 card-pg p-6">
            <h2 class="text-xl font-semibold">Tips for a compliant photo</h2>
            <ul class="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted">
              <li>Face the camera directly with a neutral expression and both eyes open.</li>
              <li>Use even, plain lighting — no shadows on the face or background.</li>
              <li>Remove hats and head coverings unless for religious reasons.</li>
              <li>Wear everyday clothing; avoid uniforms or camouflage.</li>
              <li>Glasses are {{ doc.glasses ? 'allowed' : 'not allowed' }} for this document.</li>
            </ul>
          </div>

          <!-- 相关证件 -->
          <div v-if="related.length" class="mt-8">
            <h2 class="text-xl font-semibold">Related documents</h2>
            <div class="mt-3 grid gap-3 sm:grid-cols-2">
              <DocCard v-for="d in related" :key="d.slug" :doc="d" :flag="flagFor(d.country)" />
            </div>
          </div>
        </div>

        <!-- 右：工具 -->
        <div class="lg:sticky lg:top-24 lg:self-start">
          <PhotoTool :country="doc.country" :doc="doc.slug" />
        </div>
      </div>
    </div>
  </div>

  <div v-else class="container-pg py-20 text-center">
    <h1 class="text-2xl font-bold">Document not found</h1>
    <NuxtLink to="/documents" class="btn-primary mt-4">Browse documents</NuxtLink>
  </div>
</template>
