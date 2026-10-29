import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2024-10-01',
  devtools: { enabled: false },
  ssr: true,

  runtimeConfig: {
    // 服务端密钥（仅 Nitro 侧可读，不会下发客户端）
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    // PAYMENT_DEMO_MODE=1 时强制走内置 Demo 收银台（/payment/simulate），
    // 未配置 Stripe 密钥时同样默认 Demo 模式
    paymentDemoMode: process.env.PAYMENT_DEMO_MODE === '1',
    paymentDemoToken: process.env.PAYMENT_DEMO_TOKEN || 'demo',
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || ''
    }
  },

  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/i18n'],

  i18n: {
    defaultLocale: 'en',
    // Every locale (incl. English) gets its own crawlable subdirectory URL:
    // /en, /zh, /es, /fr — required for per-language SEO.
    strategy: 'prefix',
    langDir: 'locales',
    baseUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://www.photogov.xyz',
    seo: true,
    experimental: {
      strictSeo: true
    },
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root'
    },
    locales: [
      { code: 'en', language: 'en-US', name: 'English', flag: '🇺🇸', file: 'en.json' },
      { code: 'zh', language: 'zh-CN', name: '中文', flag: '🇨🇳', file: 'zh.json' },
      { code: 'es', language: 'es-ES', name: 'Español', flag: '🇪🇸', file: 'es.json' },
      { code: 'fr', language: 'fr-FR', name: 'Français', flag: '🇫🇷', file: 'fr.json' }
    ]
  },

  app: {
    head: {
      title: 'PhotoGov — Passport Photo, Visa Photo & ID Photo Maker Online',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'Make compliant passport, visa and ID photos online in seconds. Free tool with country-specific size specs, white/blue background, and instant JPG/PDF download.'
        },
        { name: 'theme-color', content: '#2B3E5C' },
        { property: 'og:site_name', content: 'PhotoGov' },
        { property: 'og:type', content: 'website' },
        { property: 'og:locale', content: 'en_US' },
        { property: 'og:image', content: 'https://www.photogov.xyz/og-image.png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:type', content: 'image/png' },
        { property: 'og:image:alt', content: 'PhotoGov — make compliant passport, visa and ID photos online' },
        { name: 'twitter:image', content: 'https://www.photogov.xyz/og-image.png' },
        { name: 'twitter:card', content: 'summary_large_image' },
        // 全站 keywords 基线（单页可在各自 useHead 用更具体的 keywords 覆盖）
        {
          name: 'keywords',
          content:
            'passport photo, visa photo, ID photo, photo maker, passport photo app, compliant photos, passport size photo, visa photo online, ID photo editor'
        }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600;700&family=Golos+Text:wght@400;500;600;700&display=swap'
        }
      ]
    }
  },

  // @nuxtjs/tailwindcss options
  tailwindcss: {
    configPath: '~/tailwind.config.js',
    cssPath: '~/assets/css/tailwind.css',
    viewer: false
  },

  nitro: {
    prerender: {
      routes: []
    },
    routeRules: {
      // 后台面板裸路径重定向到带语言前缀的路由
      '/admin': { redirect: '/en/admin' },
      // 旧会员中心路径重定向到新的 /profile 会员中心（保留外部书签有效）
      '/account': { redirect: '/en/profile' }
    }
  }
})
