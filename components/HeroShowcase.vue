<script setup lang="ts">
// hero 右栏展示卡：与原站一致的「VERIFIED 徽章 + 合规保证行」视觉
// 使用本地生成的证件照占位（避免依赖外部 CDN 防盗链图片）
</script>

<template>
  <div class="relative">
    <div class="card-pg overflow-hidden p-0">
      <div class="relative bg-gradient-to-b from-[#e8eefc] to-[#dfe7fb]">
        <!-- 证件照占位（白底合规照风格） -->
        <svg viewBox="0 0 400 420" class="h-[420px] w-full" role="img" aria-label="Compliant ID photo preview">
          <defs>
            <linearGradient id="bgG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#f4f7ff" />
              <stop offset="100%" stop-color="#e6ecfb" />
            </linearGradient>
            <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#f3c9a8" />
              <stop offset="100%" stop-color="#e3b48f" />
            </linearGradient>
          </defs>
          <rect width="400" height="420" fill="url(#bgG)" />
          <!-- 肩部 -->
          <path d="M120 420 C120 350 150 320 200 320 C250 320 280 350 280 420 Z" fill="#2B3E5C" />
          <path d="M150 330 C150 360 170 380 200 380 C230 380 250 360 250 330 L250 320 L150 320 Z" fill="#3a4f72" />
          <!-- 脖子 -->
          <rect x="180" y="285" width="40" height="50" rx="14" fill="url(#skin)" />
          <!-- 头 -->
          <ellipse cx="200" cy="225" rx="62" ry="72" fill="url(#skin)" />
          <!-- 头发 -->
          <path d="M138 215 C138 150 175 120 200 120 C225 120 262 150 262 215 C262 190 245 168 200 168 C155 168 138 190 138 215 Z" fill="#3b2a21" />
          <!-- 眼 -->
          <circle cx="178" cy="222" r="6" fill="#2b2b2b" />
          <circle cx="222" cy="222" r="6" fill="#2b2b2b" />
          <!-- 眉 -->
          <path d="M168 208 q10 -6 20 0" stroke="#5b402a" stroke-width="3" fill="none" />
          <path d="M212 208 q10 -6 20 0" stroke="#5b402a" stroke-width="3" fill="none" />
          <!-- 鼻 -->
          <path d="M200 232 l-6 22 q6 5 12 0 Z" fill="#d9a87f" />
          <!-- 嘴：中性表情 -->
          <path d="M184 268 q16 8 32 0" stroke="#a85f47" stroke-width="4" fill="none" stroke-linecap="round" />
          <!-- 尺寸框（证件照裁剪参考线） -->
          <rect x="118" y="128" width="164" height="214" fill="none" stroke="rgba(43,62,92,0.35)" stroke-width="2" stroke-dasharray="6 6" />
        </svg>

        <!-- VERIFIED 徽章 -->
        <span
          class="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-[#2563EB] px-3 py-1.5 text-sm font-semibold text-white shadow"
        >
          <svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0l-3.5-3.5a1 1 0 011.4-1.4l2.8 2.8 6.8-6.8a1 1 0 011.4 0z" clip-rule="evenodd" />
          </svg>
          VERIFIED
        </span>
      </div>
    </div>

    <!-- 合规保证行（与原站一致） -->
    <div class="mt-4 flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3">
      <span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#2563EB] text-white">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0l-3.5-3.5a1 1 0 011.4-1.4l2.8 2.8 6.8-6.8a1 1 0 011.4 0z" clip-rule="evenodd" />
        </svg>
      </span>
      <span class="text-sm font-medium text-ink">Government Photo Compliance Guaranteed</span>
    </div>
  </div>
</template>
