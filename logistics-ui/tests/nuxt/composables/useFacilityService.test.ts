import { describe, test, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useFacilityService } from '~/composables/useFacilityService'

const { mockFetch } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
}))

const mockToken = ref<string | null>('mock-token')

mockNuxtImport('$fetch', () => mockFetch)
mockNuxtImport('useAuthService', () => () => ({
  userToken: mockToken,
}))

describe('useFacilityService Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockToken.value = 'mock-token'
  })

  test('getFacilities sends GET request with auth header', async () => {
    mockFetch.mockResolvedValue({ data: [] })
    const { getFacilities } = useFacilityService()
    await getFacilities()

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/facilities'),
      expect.objectContaining({
        method: 'GET',
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('getFacilityById sends GET request with specific ID', async () => {
    mockFetch.mockResolvedValue({ data: { id: 10, name: 'Main Hub' } })
    const { getFacilityById } = useFacilityService()
    await getFacilityById(10)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/facilities/10'),
      expect.objectContaining({
        method: 'GET',
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('createFacility sends POST request with payload', async () => {
    mockFetch.mockResolvedValue({ message: 'Facility created.' })
    const { createFacility } = useFacilityService()
    const payload = {
      name: 'North Gateway',
      type: 'MegaGateway',
      address: '123 Highway',
      longitude: 121.0,
      latitude: 14.5
    }
    await createFacility(payload)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/facilities'),
      expect.objectContaining({
        method: 'POST',
        body: payload,
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('updateFacility sends PUT request with partial payload', async () => {
    mockFetch.mockResolvedValue({ message: 'Facility updated successfully.' })
    const { updateFacility } = useFacilityService()
    const payload = { name: 'Updated Gateway Name' }
    await updateFacility(10, payload)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/facilities/10'),
      expect.objectContaining({
        method: 'PUT',
        body: payload,
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('deleteFacility sends DELETE request', async () => {
    mockFetch.mockResolvedValue({ message: 'Facility deleted successfully.' })
    const { deleteFacility } = useFacilityService()
    await deleteFacility(10)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/facilities/10'),
      expect.objectContaining({
        method: 'DELETE',
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('assignCourier sends PATCH request with userId body', async () => {
    mockFetch.mockResolvedValue({ message: 'Courier assigned.' })
    const { assignCourier } = useFacilityService()
    await assignCourier(10, 5)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/facilities/10/assign-courier'),
      expect.objectContaining({
        method: 'PATCH',
        body: { userId: 5 },
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('getFacilityCouriers sends GET request for facility couriers', async () => {
    mockFetch.mockResolvedValue({ data: [] })
    const { getFacilityCouriers } = useFacilityService()
    await getFacilityCouriers()

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/facilities/couriers'),
      expect.objectContaining({
        method: 'GET',
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('omits Authorization header if userToken is missing', async () => {
    mockToken.value = null // Simulate logged out
    mockFetch.mockResolvedValue({ data: [] })
    
    const { getFacilities } = useFacilityService()
    await getFacilities()

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: {} // Headers should be empty
      })
    )
  })

  test('handles API errors gracefully', async () => {
    const errorResponse = { data: { error: 'FacilityNotFound' } }
    mockFetch.mockRejectedValue(errorResponse)

    const { getFacilityById } = useFacilityService()
    
    await expect(getFacilityById(999)).rejects.toEqual(errorResponse)
  })
})