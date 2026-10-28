<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import InfoPageShell from '~/components/InfoPageShell.vue'
import { useRichText } from '~/composables/useRichText'
import { useOrgLd } from '~/composables/useOrgLd'
import icons from '~/components/reviewsIcons.json'

// 对标原站 /about-us/（F5 取证 SEEN）
// 结构：InfoPageShell（hero + 侧栏 + 白卡）>
//   卡内出血大图 > H1 > 导语 > 精选评价卡 >
//   H2 起源（图文并排 + 引言块）> H2 时间线（4 段蓝色圆点时间轴）>
//   H2 我们的团队（5 个 border-l 小节）> H2 我们的证件照服务（6 宫格）>
//   H2 合规标准与可靠性 > H3 美国合规声明 > H2 易用性与支持 > H2 我们的愿景 > 独立声明块
const { t, tm } = useI18n()
const { rich } = useRichText()
const localePath = useLocalePath()
const url = useRequestURL()
const { scripts: orgScripts } = useOrgLd()

const timeline = tm('aboutPage.timeline') as any[]
const teams = tm('aboutPage.teams') as any[]
const services = tm('aboutPage.services') as any[]

// 结构化数据：Organization + BreadcrumbList（该页此前 JSON-LD 为 0，属 SEO 洼地）
useHead({
  title: t('aboutPage.metaTitle'),
  meta: [
    { name: 'description', content: t('aboutPage.metaDesc') },
    { property: 'og:title', content: t('aboutPage.metaTitle') },
    { property: 'og:description', content: t('aboutPage.metaDesc') }
  ],
  script: [
    ...orgScripts.value,
    {
      key: 'ld-about-breadcrumb',
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: t('nav.home'), item: url.origin + localePath('/') },
          { '@type': 'ListItem', position: 2, name: t('aboutPage.metaTitle') },
        ],
      }).replace(/</g, '\\u003c'),
    },
  ],
})
</script>

<template>
  <InfoPageShell
    icon="about-us"
    :hero-title="$t('aboutPage.heroTitle')"
    :hero-desc="$t('aboutPage.heroDesc')"
    :breadcrumb="$t('aboutPage.breadcrumb')"
    card-class="flex-1 rounded-lg bg-white px-10 pb-12 font-serif overflow-hidden max-lg:px-5 max-lg:pb-6"
  >
    <!-- 卡内顶部出血大图 -->
    <div class="-mx-10 h-[180px] max-lg:-mx-5 max-lg:h-[150px]">
      <img src="/img/about-us/about-us-1.webp" width="1160" height="180" alt="AI Altering Restriction" class="size-full object-cover">
    </div>

    <h1 class="mt-8 text-[30px] font-bold leading-tight">{{ $t('aboutPage.h1') }}</h1>

    <!-- 导语：首句加粗 -->
    <p class="mt-4 font-sans">
      <b class="font-medium">{{ $t('aboutPage.leadBold') }}</b>{{ $t('aboutPage.leadRest') }}
    </p>
    <p class="mt-4 font-sans">{{ $t('aboutPage.intro2') }}</p>

    <!-- 精选用户评价卡（原站同款灰底卡） -->
    <div class="mt-6 rounded-[6px] bg-[#F4F4F4] p-4 font-sans">
      <div class="flex items-center gap-x-2.5">
        <div class="size-8 overflow-hidden rounded-full border border-[#D8D8D8] bg-blue-700 max-lg:size-7">
          <p class="my-auto text-center text-[18px] font-semibold leading-[30px] text-white max-lg:text-[16px] max-lg:leading-[26px]">
            {{ $t('aboutPage.reviewName').charAt(0) }}
          </p>
        </div>
        <span class="flex-1 text-[18px] font-medium max-lg:text-[16px] max-lg:line-clamp-1 max-lg:whitespace-nowrap max-lg:text-ellipsis">
          {{ $t('aboutPage.reviewName') }}
        </span>
        <div class="inline-flex shrink-0 items-center gap-x-0.5">
          <span class="font-semibold">5</span>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="size-6">
            <path :d="icons.starPath" fill="#FFD850"></path>
          </svg>
        </div>
        <div class="shrink-0 space-y-0.5">
          <p class="text-[12px] leading-none text-[#ADB4BA]">{{ $t('aboutPage.postedOn') }}</p>
          <a
            class="flex items-center gap-x-1 text-[12px] text-blue-600 underline duration-200 hover:text-red-600"
            target="_blank"
            rel="noreferrer, nofollow"
            href="https://www.google.com/maps/place/Digital+Passport+Photo+-+Photogov/"
          >
            <span class="size-3 shrink-0" v-html="icons.google" />
            Google
          </a>
        </div>
      </div>
      <p class="mt-4">{{ $t('aboutPage.reviewText') }}</p>
      <p class="mt-6 text-[13px] text-[#717171]">{{ $t('aboutPage.reviewAgo') }}</p>
    </div>

    <!-- ═══ 起源 ═══ -->
    <h2 class="mt-10 text-[30px] font-bold leading-tight">{{ $t('aboutPage.originsTitle') }}</h2>
    <div class="mt-4 flex items-start gap-x-8 max-lg:flex-col max-lg:gap-y-6">
      <div class="flex-1 space-y-4">
        <p class="font-sans">{{ $t('aboutPage.origins1') }}</p>
        <p class="font-sans" v-html="$t('aboutPage.origins2')" />
      </div>
      <div class="h-[285px] lg:w-[335px]">
        <img src="/img/about-us/about-us-2.webp" width="335" height="285" alt="Online Passport Service" class="size-full rounded object-cover">
        <figcaption class="mt-1 text-center font-sans text-[12px] text-[#727272]">{{ $t('aboutPage.originsCaption') }}</figcaption>
      </div>
    </div>

    <!-- 创始人引言 -->
    <div class="mt-8 flex items-start gap-x-3.5 lg:max-w-[700px] max-lg:gap-x-2.5">
      <span class="size-8 shrink-0 max-lg:size-6" v-html="icons.quote" />
      <div>
        <p class="font-serif text-lg italic">{{ $t('aboutPage.quote') }}</p>
        <p class="mt-1 font-sans text-[#374151]">{{ $t('aboutPage.quoteBy') }}</p>
      </div>
    </div>
    <p class="mt-4 font-sans">{{ $t('aboutPage.origins3') }}</p>

    <!-- ═══ 时间线 ═══ -->
    <h2 class="mt-10 text-[30px] font-bold leading-tight">{{ $t('aboutPage.timelineTitle') }}</h2>
    <div class="mt-6">
      <div v-for="(item, i) in timeline" :key="i" class="flex gap-x-1.5" :class="i > 0 ? '-mt-1.5' : ''">
        <!-- 圆点 + 虚线竖轴 -->
        <div class="flex shrink-0 flex-col items-center gap-y-1 pt-2.5">
          <div class="size-3.5 rounded-full bg-[#84ABE4]"></div>
          <div class="flex-1 border-l-2 border-dashed border-[#84ABE4]"></div>
        </div>
        <div class="flex-1 space-y-3 pb-10">
          <h3 class="font-serif text-[22px] font-semibold">{{ item.year }}</h3>
          <div class="space-y-3 rounded-lg bg-[#84ABE41A] px-5 py-4">
            <p class="font-sans">{{ item.p1 }}</p>
            <p class="font-sans">{{ item.p2 }}</p>
            <img v-if="item.img" :src="item.img" :alt="item.alt" width="357" height="152" class="aspect-[357/152] w-full rounded object-cover">
          </div>
        </div>
      </div>
    </div>
    <p class="mt-6 font-sans font-semibold">
      {{ $t('aboutPage.timelineAfter1') }}<u class="underline">{{ $t('aboutPage.timelineAfterU') }}</u>{{ $t('aboutPage.timelineAfter2') }}
    </p>

    <!-- ═══ 我们的团队 ═══ -->
    <h2 class="mt-10 text-[30px] font-bold leading-tight">{{ $t('aboutPage.teamTitle') }}</h2>
    <p class="mt-4 font-sans">{{ $t('aboutPage.teamIntro') }}</p>

    <template v-for="(team, i) in teams" :key="i">
      <h3 class="mt-10 border-l-4 border-[#BDA887] pl-1.5 text-[22px] font-semibold">{{ team.title }}</h3>
      <p class="mt-1.5 font-sans" v-html="rich(team.text)" />
      <div v-if="team.img" class="mt-6 h-[300px] overflow-hidden rounded max-lg:h-[150px]">
        <img :src="team.img" :alt="team.alt" width="1000" height="300" class="size-full object-cover">
      </div>
    </template>

    <!-- ═══ 我们的证件照服务 ═══ -->
    <h2 class="mt-10 text-[30px] font-bold leading-tight">{{ $t('aboutPage.servicesTitle') }}</h2>
    <p class="mt-4 font-sans">{{ $t('aboutPage.services1') }}</p>
    <p class="mt-4 font-sans">{{ $t('aboutPage.services2') }}</p>

    <div class="mt-6 grid grid-cols-2 gap-6 max-lg:grid-cols-1">
      <div v-for="(s, i) in services" :key="i" class="overflow-hidden rounded-lg bg-[#F1F5F9] font-sans">
        <div class="aspect-[4/3] overflow-hidden rounded-b-lg max-lg:aspect-[3/2]">
          <img :src="s.img" :alt="s.alt" width="520" height="390" class="size-full object-cover">
        </div>
        <div class="px-3.5 pb-6 pt-3">
          <p class="text-center text-[18px] font-semibold">{{ s.title }}</p>
          <div class="mt-1.5 text-center" v-html="rich(s.desc)" />
        </div>
      </div>
    </div>
    <p class="mt-6 font-sans" v-html="rich($t('aboutPage.servicesAfter'))" />

    <!-- ═══ 合规标准与可靠性 ═══ -->
    <h2 class="mt-10 text-[30px] font-bold leading-tight">{{ $t('aboutPage.complianceTitle') }}</h2>
    <p class="mt-4 font-sans" v-html="$t('aboutPage.compliance1')" />
    <img src="/img/about-us/about-us-12.webp" width="1580" height="510" alt="Photogov technical standards" class="mt-6 aspect-[158/51] w-full object-cover">
    <p class="mt-4 font-sans">{{ $t('aboutPage.compliance2') }}</p>
    <p class="mt-4 font-sans">{{ $t('aboutPage.compliance3') }}</p>

    <!-- 美国合规声明（H3 + 灰底提示块） -->
    <h3 class="mt-10 border-l-4 border-[#BDA887] pl-1.5 text-[22px] font-semibold">{{ $t('aboutPage.usTitle') }}</h3>
    <p class="mt-4 font-sans">{{ $t('aboutPage.us1') }}</p>
    <p class="mt-4 font-sans">{{ $t('aboutPage.us2') }}</p>
    <div class="mt-4 flex items-start gap-x-1.5 rounded-[6px] bg-[#F4F4F4] p-4 font-sans leading-[1.5]">
      <svg class="size-6 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 6V18C6 18.5304 6.20752 19.0391 6.57691 19.4142C6.9463 19.7893 7.4473 20 7.9697 20H18.4091C18.5658 20 18.7161 19.9368 18.8269 19.8243C18.9377 19.7117 19 19.5591 19 19.4C19 19.2409 18.9377 19.0883 18.8269 18.9757C18.7161 18.8632 18.5658 18.8 18.4091 18.8H7.9697C7.76074 18.8 7.56034 18.7157 7.41258 18.5657C7.26483 18.4157 7.18182 18.2122 7.18182 18H18.4091C18.5658 18 18.7161 17.9368 18.8269 17.8243C18.9377 17.7117 19 17.5591 19 17.4V6C19 5.73736 18.9491 5.47728 18.8501 5.23463C18.7511 4.99198 18.606 4.7715 18.4231 4.58579C18.2402 4.40007 18.023 4.25275 17.7841 4.15224C17.5451 4.05173 17.289 4 17.0303 4H7.9697C7.4473 4 6.9463 4.21071 6.57691 4.58579C6.20752 4.96086 6 5.46957 6 6ZM11.9091 11.8V7.8C11.9091 7.64087 11.9713 7.48826 12.0822 7.37574C12.193 7.26321 12.3433 7.2 12.5 7.2C12.6567 7.2 12.807 7.26321 12.9178 7.37574C13.0287 7.48826 13.0909 7.64087 13.0909 7.8V11.8C13.0909 11.9591 13.0287 12.1117 12.9178 12.2243C12.807 12.3368 12.6567 12.4 12.5 12.4C12.3433 12.4 12.193 12.3368 12.0822 12.2243C11.9713 12.1117 11.9091 11.9591 11.9091 11.8ZM13.2879 14C13.2879 14.2122 13.2049 14.4157 13.0571 14.5657C12.9094 14.7157 12.709 14.8 12.5 14.8C12.291 14.8 12.0906 14.7157 11.9429 14.5657C11.7951 14.4157 11.7121 14.2122 11.7121 14C11.7121 13.7878 11.7951 13.5843 11.9429 13.4343C12.0906 13.2843 12.291 13.2 12.5 13.2C12.709 13.2 12.9094 13.2843 13.0571 13.4343C13.2049 13.5843 13.2879 13.7878 13.2879 14Z" fill="#212532"></path>
      </svg>
      <p class="flex-1">
        <span v-html="$t('aboutPage.us3')" />
        <br>
        <a
          href="https://travel.state.gov/content/travel/en/passports/how-apply/photos.html"
          target="_blank"
          rel="noopener"
          class="text-blue-600 underline duration-200 hover:text-red-600"
        >{{ $t('aboutPage.usLink') }}</a>
      </p>
    </div>

    <!-- ═══ 易用性与支持 ═══ -->
    <h2 class="mt-10 text-[30px] font-bold leading-tight">{{ $t('aboutPage.accessTitle') }}</h2>
    <div class="mt-4 flex gap-x-8 max-lg:flex-col max-lg:gap-y-6">
      <div class="flex-1 space-y-4">
        <p class="inline-block font-sans">{{ $t('aboutPage.access1') }}</p>
        <p class="inline-block font-sans">{{ $t('aboutPage.access2') }}</p>
      </div>
      <div class="shrink-0">
        <div class="h-[285px] overflow-hidden rounded lg:w-[330px]">
          <img src="/img/about-us/about-us-16.webp" width="330" height="285" alt="Compliance team" class="size-full object-cover">
        </div>
        <figcaption class="mt-1 text-center font-sans text-[12px] text-[#727272]">{{ $t('aboutPage.accessCaption') }}</figcaption>
      </div>
    </div>

    <!-- ═══ 我们的愿景 ═══ -->
    <h2 class="mt-10 text-[30px] font-bold leading-tight">{{ $t('aboutPage.visionTitle') }}</h2>
    <p class="mt-4 font-sans" v-html="$t('aboutPage.vision1')" />
    <div class="mt-4 flex gap-x-8 max-lg:flex-col max-lg:gap-y-6">
      <div class="flex-1 space-y-4">
        <p class="inline-block font-sans" v-html="$t('aboutPage.vision2')" />
        <p class="inline-block font-sans">{{ $t('aboutPage.vision3') }}</p>
      </div>
      <div class="shrink-0">
        <div class="h-[285px] overflow-hidden rounded lg:w-[330px]">
          <img src="/img/about-us/about-us-14.webp" width="330" height="285" alt="Photogov - our vision" class="size-full object-cover">
        </div>
        <figcaption class="mt-1 text-center font-sans text-[12px] text-[#727272]">{{ $t('aboutPage.visionCaption') }}</figcaption>
      </div>
    </div>
    <p class="mt-6 font-sans text-[32px] font-semibold lg:max-w-[570px]">{{ $t('aboutPage.visionSlogan') }}</p>

    <!-- 独立声明 -->
    <div class="mt-16 flex items-start gap-x-1.5 rounded-[6px] bg-[#F4F4F4] p-4 font-medium italic leading-[1.5]">
      <span class="size-8 shrink-0 max-lg:size-6" v-html="icons.quote" />
      <p class="flex-1">{{ $t('aboutPage.nonAffiliation') }}</p>
    </div>
  </InfoPageShell>
</template>
