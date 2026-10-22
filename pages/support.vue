<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import PageSidebar from '~/components/PageSidebar.vue'

const { t, tm } = useI18n()
useHead({ title: t('support.title') })

// 支持邮箱（与语言无关的固定数据，不走 i18n：@ 会触发 vue-i18n 链接格式解析错误）
const SUPPORT_EMAIL = 'info@photogov.net'

const faqs = tm('support.faq') as Array<{ q: string; a: string }>

// 咨询类型选项（INFERRED：原站为自定义下拉，选项未逐一取证，取通用分类）
const inquiryOptions = tm('support.inquiryOptions') as string[]

// 前端演示表单：原站提交至自有工单系统；复刻版不做后端，本地展示提交结果
const form = reactive({
  inquiry: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  comment: ''
})
const sent = ref(false)

function submit() {
  if (!form.inquiry || !form.firstName || !form.lastName || !form.email || !form.comment) return
  sent.value = true
}
</script>

<template>
  <div class="container-pg py-14">
    <div class="grid gap-12 lg:grid-cols-[1fr_240px]">
      <!-- ═══ 主内容 ═══ -->
      <div class="mx-auto max-w-3xl">
        <span class="eyebrow">{{ $t('support.eyebrow') }}</span>
        <h1 class="mt-2 text-3xl font-bold sm:text-4xl">{{ $t('support.title') }}</h1>
        <p class="mt-3 text-muted">{{ $t('support.sub') }}</p>

        <!-- Hero -->
        <section class="mt-10">
          <h2 class="text-2xl font-semibold">{{ $t('support.heroTitle') }}</h2>
          <p class="mt-3 text-muted">{{ $t('support.heroP1') }}</p>
          <p class="mt-3 text-muted">{{ $t('support.heroP2') }}</p>
        </section>

        <!-- 如何联系我们：表单 + 邮箱 -->
        <section class="mt-10">
          <h2 class="text-2xl font-semibold">{{ $t('support.contactTitle') }}</h2>
          <div class="mt-5 grid gap-6 sm:grid-cols-2">
            <!-- 支持请求表单 -->
            <div class="card-pg p-5">
              <h3 class="font-semibold">{{ $t('support.formTitle') }}</h3>
              <p class="mt-1 text-sm text-muted">{{ $t('support.formIntro') }}</p>
              <form v-if="!sent" class="mt-4 space-y-3" novalidate @submit.prevent="submit">
                <div>
                  <label class="block text-sm font-medium" for="sup-inquiry">{{ $t('support.inquiryType') }}*</label>
                  <select
                    id="sup-inquiry"
                    v-model="form.inquiry"
                    required
                    class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue"
                  >
                    <option value="" disabled>{{ $t('support.selectOption') }}</option>
                    <option v-for="o in inquiryOptions" :key="o" :value="o">{{ o }}</option>
                  </select>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-sm font-medium" for="sup-first">{{ $t('support.firstName') }}*</label>
                    <input
                      id="sup-first"
                      v-model="form.firstName"
                      type="text"
                      required
                      class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-blue"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium" for="sup-last">{{ $t('support.lastName') }}*</label>
                    <input
                      id="sup-last"
                      v-model="form.lastName"
                      type="text"
                      required
                      class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-blue"
                    />
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium" for="sup-email">{{ $t('support.email') }}*</label>
                  <input
                    id="sup-email"
                    v-model="form.email"
                    type="email"
                    required
                    :placeholder="$t('support.emailHint', { email: SUPPORT_EMAIL })"
                    class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-blue"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium" for="sup-phone">{{ $t('support.phone') }}</label>
                  <input
                    id="sup-phone"
                    v-model="form.phone"
                    type="tel"
                    class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-blue"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium" for="sup-comment">{{ $t('support.comment') }}</label>
                  <textarea
                    id="sup-comment"
                    v-model="form.comment"
                    rows="4"
                    required
                    :placeholder="$t('support.commentPlaceholder')"
                    class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-blue"
                  />
                </div>
                <button type="submit" class="btn-primary w-full">{{ $t('support.send') }}</button>
              </form>
              <p v-else class="mt-4 rounded-lg bg-accent-green/10 p-4 text-sm text-accent-green">
                {{ $t('support.sent') }}
              </p>
            </div>

            <!-- 邮箱 -->
            <div class="card-pg p-5">
              <h3 class="font-semibold">{{ $t('support.emailLabel') }}</h3>
              <p class="mt-2 text-sm">
                <a :href="`mailto:${SUPPORT_EMAIL}`" class="font-medium text-brand-blue underline">
                  {{ SUPPORT_EMAIL }}
                </a>
              </p>
              <p class="mt-2 text-sm text-muted">{{ $t('support.emailNote') }}</p>
            </div>
          </div>
        </section>

        <!-- 加速处理要点 -->
        <section class="mt-10">
          <h2 class="text-2xl font-semibold">{{ $t('support.fasterTitle') }}</h2>
          <p class="mt-2 text-muted">{{ $t('support.fasterIntro') }}</p>
          <ul class="mt-4 space-y-2">
            <li v-for="(s, i) in $tm('support.fasterItems')" :key="i" class="flex gap-2 text-muted">
              <span class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-blue" />
              <span>{{ s }}</span>
            </li>
          </ul>
        </section>

        <!-- 服务时间 -->
        <section class="mt-10">
          <h2 class="text-2xl font-semibold">{{ $t('support.availabilityTitle') }}</h2>
          <ul class="mt-4 space-y-2">
            <li v-for="(s, i) in $tm('support.availabilityItems')" :key="i" class="flex gap-2 text-muted">
              <span class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-blue" />
              <span>{{ s }}</span>
            </li>
          </ul>
        </section>

        <!-- FAQ -->
        <section class="mt-10">
          <h2 class="text-2xl font-semibold">{{ $t('support.faqTitle') }}</h2>
          <div class="mt-5 space-y-3">
            <div v-for="(f, i) in faqs" :key="i" class="card-pg p-5">
              <h3 class="font-semibold">{{ f.q }}</h3>
              <p class="mt-1 whitespace-pre-line text-sm text-muted">{{ f.a }}</p>
            </div>
          </div>
        </section>
      </div>

      <!-- ═══ 侧栏（对标原站 info 页 COMPANY/SUPPORT/LEGAL） ═══ -->
      <PageSidebar />
    </div>
  </div>
</template>
