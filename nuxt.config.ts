import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2024-10-01',
  devtools: { enabled: false },
  ssr: true,

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
    }
  }
})
