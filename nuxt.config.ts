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
    baseUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://photogov.net',
    seo: true,
    experimental: {
      strictSeo: true
    },
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      // 'all'：任何无语言前缀的路径（如 /documents）也 307 重定向到 /en/...，
      // 避免用户手输域名+路径时 404；sitemap/canonical 仍只用带前缀 URL，不影响 SEO
      redirectOn: 'all'
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
        // og:locale 不再在此硬编码（原为固定 en_US）。改由 app.vue 按当前语言
        // 动态注入 en_US / zh_CN / es_ES / fr_FR，并附带 og:locale:alternate
        // 指向其余语言，让社交平台识别多语言版本。
        { name: 'twitter:card', content: 'summary_large_image' }
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
      routes: ['/']
    },
    routeRules: {
      // 后台面板裸路径重定向到带语言前缀的路由
      '/admin': { redirect: '/en/admin' },
      // 旧会员中心路径重定向到新的 /profile 会员中心（保留外部书签有效）
      '/account': { redirect: '/en/profile' }
    }
  }
})
