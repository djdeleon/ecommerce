import { describe, test, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useTrackingNumberService } from '~/composables/useTrackingNumberService'

const { mockFetch } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
}))

const mockToken = ref<string | null>('mock-token')

mockNuxtImport('$fetch', () => mockFetch)
mockNuxtImport('useAuthService', () => () => ({
  userToken: mockToken,
}))

describe('useTrackingNumberService Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockToken.value = 'mock-token'
  })

  test('getTrackingNumbers sends GET request for index endpoint with auth header', async () => {
    mockFetch.mockResolvedValue({ data: [] })
    const { getTrackingNumbers } = useTrackingNumberService()
    await getTrackingNumbers()

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/tracking-numbers'),
      expect.objectContaining({
        method: 'GET',
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('getTrackingNumberByNumber sends GET request with specific tracking number', async () => {
    mockFetch.mockResolvedValue({ data: { number: 'FSTFY12345PH', isAssigned: false } })
    const { getTrackingNumberByNumber } = useTrackingNumberService()
    await getTrackingNumberByNumber('FSTFY12345PH')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/tracking-numbers/FSTFY12345PH'),
      expect.objectContaining({
        method: 'GET',
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('generateTrackingNumbers sends POST request with size payload and x-api-key header', async () => {
    mockFetch.mockResolvedValue({ message: 'Tracking Numbers generated successfully.' })
    const { generateTrackingNumbers } = useTrackingNumberService()
    const payload = { size: 10 }
    await generateTrackingNumbers(payload, 'test-api-key')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/tracking-numbers'),
      expect.objectContaining({
        method: 'POST',
        body: payload,
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-token',
          'x-api-key': 'test-api-key'
        })
      })
    )
  })

  test('omits Authorization header if userToken is missing', async () => {
    mockToken.value = null // Simulate logged out
    mockFetch.mockResolvedValue({ data: [] })
    
    const { getTrackingNumbers } = useTrackingNumberService()
    await getTrackingNumbers()

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.not.objectContaining({
          Authorization: expect.any(String)
        })
      })
    )
  })

  test('handles API errors gracefully', async () => {
    const errorResponse = { data: { error: 'Tracking number not found.' } }
    mockFetch.mockRejectedValue(errorResponse)

    const { getTrackingNumberByNumber } = useTrackingNumberService()
    
    await expect(getTrackingNumberByNumber('INVALIDPH')).rejects.toEqual(errorResponse)
  })
})