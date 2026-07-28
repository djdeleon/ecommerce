// https://nuxt.com
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  
  // Define runtime variables for the network boundary configuration
  runtimeConfig: {
    public: {
      // Used on the client-side (Browser uses standard reverse-proxy mapping)
      apiBase: '/api' 
    }
  },

  vite: {
    server: {
      watch: {
        ignored: ['**/node_modules/**', '**/.nuxt/**', '**/.output/**']
      },
      fs: {
        allow: [
          '/app',
          '/app/node_modules/.cache'
        ]
      }
    }
  }
})
