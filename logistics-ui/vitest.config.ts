import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['tests/unit/*.{test,spec}.ts'],
          environment: 'node',
        },
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['tests/nuxt/**/*.{test,spec}.ts', 'tests/composables/*.{test,spec}.ts', 'tests/components/*.{test,spec}.ts'],
          environmentOptions: {
            nuxt: {
              rootDir: fileURLToPath(new URL('.', import.meta.url)),
              domEnvironment: 'happy-dom',
              overrides: {
                runtimeConfig: {
                  public: {
                    logisticsApi: '', // Makes `${apiBase}/users` resolve to `/api/v1/users`
                  },
                },
              },
            },
          },
        },
      }),
    ],
  },
})