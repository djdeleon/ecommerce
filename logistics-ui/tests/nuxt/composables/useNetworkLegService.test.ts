import { describe, test, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useNetworkLegService } from '~/composables/useNetworkLegService'

const { mockFetch } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
}))

const mockToken = ref<string | null>('mock-token')

mockNuxtImport('$fetch', () => mockFetch)
mockNuxtImport('useAuthService', () => () => ({
  userToken: mockToken,
}))

describe('useNetworkLegService Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockToken.value = 'mock-token'
  })

  test('getNetworkLegs sends GET request with auth header', async () => {
    mockFetch.mockResolvedValue({ data: [] })
    const { getNetworkLegs } = useNetworkLegService()
    await getNetworkLegs()

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/network-legs'),
      expect.objectContaining({
        method: 'GET',
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('getNetworkLegById sends GET request with specific ID', async () => {
    mockFetch.mockResolvedValue({ data: { id: 42, laneCode: 'ORG-DST-HL' } })
    const { getNetworkLegById } = useNetworkLegService()
    await getNetworkLegById(42)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/network-legs/42'),
      expect.objectContaining({
        method: 'GET',
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('createNetworkLeg sends POST request with payload', async () => {
    mockFetch.mockResolvedValue({ message: 'Success' })
    const { createNetworkLeg } = useNetworkLegService()
    const payload = {
      sourceFacilityId: 1,
      destinationFacilityId: 2,
      laneCode: 'ORG-DST-HL',
      route: {
        type: 'LineString' as const,
        coordinates: [[120.98, 14.75], [121.05, 14.80]]
      },
      distanceMtr: 45,
      vehicleProfile: 'Aluminum Van',
      baseTransitDuration: 7200,
      mode: 'HighwayLinehaul',
      cutOffTime: '18:00:00'
    }
    await createNetworkLeg(payload)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/network-legs'),
      expect.objectContaining({
        method: 'POST',
        body: payload,
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('updateNetworkLeg sends PUT request with partial payload', async () => {
    mockFetch.mockResolvedValue({ message: 'Updated' })
    const { updateNetworkLeg } = useNetworkLegService()
    const payload = { laneCode: 'UPDATED-LANE' }
    await updateNetworkLeg(42, payload)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/network-legs/42'),
      expect.objectContaining({
        method: 'PUT',
        body: payload,
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('deleteNetworkLeg sends DELETE request', async () => {
    mockFetch.mockResolvedValue({ message: 'Deleted' })
    const { deleteNetworkLeg } = useNetworkLegService()
    await deleteNetworkLeg(42)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/network-legs/42'),
      expect.objectContaining({
        method: 'DELETE',
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('omits Authorization header if userToken is missing', async () => {
    mockToken.value = null
    mockFetch.mockResolvedValue({ data: [] })
    
    const { getNetworkLegs } = useNetworkLegService()
    await getNetworkLegs()

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

    const { getNetworkLegById } = useNetworkLegService()
    
    await expect(getNetworkLegById(999)).rejects.toEqual(errorResponse)
  })
})