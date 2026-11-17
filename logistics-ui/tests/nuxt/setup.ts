import { vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

export const mockFetch = vi.fn()
export const mockToken = ref<string | null>('mock-token')

mockNuxtImport('$fetch', () => mockFetch)
mockNuxtImport('useAuthService', () => () => ({
  userToken: mockToken,
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockToken.value = 'mock-token'
})
