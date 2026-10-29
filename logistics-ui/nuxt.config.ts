export default defineNuxtConfig({
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  
  compatibilityDate: '2026-10-26',
  devtools: { enabled: true },
  
  future: {
    compatibilityVersion: 4,
  },
  
  ssr: false,
  
  runtimeConfig: {
    public: {
      logisticsApi: process.env.NUXT_PUBLIC_LOGISTICS_API || 'http://localhost:8001'
    }
  },
  
  vite: {
    optimizeDeps: {
      include: ['@vue/devtools-core']
    },
    server: {
      watch: {
        usePolling: true,
      },
      hmr: {
        protocol: 'ws',
        host: 'localhost',
        // Make sure port 3001 is correctly exposed on your docker-compose matching your container settings!
        port: 3001, 
      },
    },
  }
})
