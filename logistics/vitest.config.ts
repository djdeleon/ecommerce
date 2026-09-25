import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    alias: {
      "#commons": resolve(__dirname, "./src/commons"),
    },
    deps: {
      optimizer: {
        web: {
          enabled: false
        },
        ssr: {
          enabled: true
        }
      }
    },
    execArgv: ["--import", "tsx"]
  }
})
