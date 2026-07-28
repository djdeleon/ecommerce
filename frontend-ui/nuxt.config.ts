// https://nuxt.com
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },

  srcDir: "app/",
  runtimeConfig: {
    apiServer: "http://reverse-proxy", 
    public: {
      apiBase: "/api",
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
