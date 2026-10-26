export default defineNuxtConfig({
  compatibilityDate: '2026-10-26',
  devtools: { enabled: true },
  future: {
    compatibilityVersion: 4,
  },
  runtimeConfig: {
    public: {
      logisticsApi: process.env.NUXT_PUBLIC_LOGISTICS_API || 'http://localhost:8001'
    }
  },
  vite: {
    optimizeDeps: {
      include: ['@vue/devtools-core']
    }
  }
})