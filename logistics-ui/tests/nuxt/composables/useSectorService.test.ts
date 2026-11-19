import { describe, test, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useSectorService } from '~/composables/useSectorService'

const { mockFetch } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
}))

const mockToken = ref<string | null>('mock-token')

mockNuxtImport('$fetch', () => mockFetch)
mockNuxtImport('useAuthService', () => () => ({
  userToken: mockToken,
}))

describe('useSectorService Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockToken.value = 'mock-token'
  })

  test('getSectors sends GET request with auth header and params', async () => {
    mockFetch.mockResolvedValue({ data: [] })
    const { getSectors } = useSectorService()
    await getSectors({ localBranchId: 1 })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/sectors'),
      expect.objectContaining({
        method: 'GET',
        params: { localBranchId: 1 },
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('getSectorById sends GET request with specific ID', async () => {
    mockFetch.mockResolvedValue({ data: { id: 42, code: 'R03-BUL-SJD-01' } })
    const { getSectorById } = useSectorService()
    await getSectorById(42)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/sectors/42'),
      expect.objectContaining({
        method: 'GET',
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('createSector sends POST request with payload', async () => {
    mockFetch.mockResolvedValue({ message: 'Success' })
    const { createSector } = useSectorService()
    const payload = {
      code: 'R03-BUL-SJD-01',
      localBranchId: 1,
      zone: {
        type: 'Polygon' as const,
        coordinates: [[[120.98, 14.75], [120.99, 14.75], [120.99, 14.76], [120.98, 14.76], [120.98, 14.75]]]
      }
    }
    await createSector(payload)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/sectors'),
      expect.objectContaining({
        method: 'POST',
        body: payload,
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('updateSector sends PUT request with partial payload', async () => {
    mockFetch.mockResolvedValue({ message: 'Updated' })
    const { updateSector } = useSectorService()
    const payload = { code: 'R03-BUL-SJD-02' }
    await updateSector(42, payload)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/sectors/42'),
      expect.objectContaining({
        method: 'PUT',
        body: payload,
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('deleteSector sends DELETE request', async () => {
    mockFetch.mockResolvedValue({ message: 'Deleted' })
    const { deleteSector } = useSectorService()
    await deleteSector(42)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/sectors/42'),
      expect.objectContaining({
        method: 'DELETE',
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('omits Authorization header if userToken is missing', async () => {
    mockToken.value = null
    mockFetch.mockResolvedValue({ data: [] })
    
    const { getSectors } = useSectorService()
    await getSectors()

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: {}
      })
    )
  })

  test('handles API errors gracefully', async () => {
    const errorResponse = { data: { error: 'Not Found' } }
    mockFetch.mockRejectedValue(errorResponse)

    const { getSectorById } = useSectorService()
    
    await expect(getSectorById(999)).rejects.toEqual(errorResponse)
  })
})