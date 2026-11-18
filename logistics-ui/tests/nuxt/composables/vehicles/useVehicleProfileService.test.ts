import { describe, test, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useVehicleProfileService } from '~/composables/useVehicleProfileService'

const { mockFetch } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
}))

const mockToken = ref<string | null>('mock-token')

mockNuxtImport('$fetch', () => mockFetch)
mockNuxtImport('useAuthService', () => () => ({
  userToken: mockToken,
}))

describe('useVehicleProfileService Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockToken.value = 'mock-token'
  })

  test('getVehicleProfiles sends GET request with auth header and params', async () => {
    mockFetch.mockResolvedValue({ data: [] })
    const { getVehicleProfiles } = useVehicleProfileService()
    const params = { search: 'Mitsubishi' }
    await getVehicleProfiles(params)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/vehicle-profiles'),
      expect.objectContaining({
        method: 'GET',
        params,
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('getVehicleProfileById sends GET request with specific ID', async () => {
    mockFetch.mockResolvedValue({ data: { id: 1, brand: 'Mitsubishi' } })
    const { getVehicleProfileById } = useVehicleProfileService()
    await getVehicleProfileById(1)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/vehicle-profiles/1'),
      expect.objectContaining({
        method: 'GET',
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('createVehicleProfile sends POST request with payload', async () => {
    mockFetch.mockResolvedValue({ message: 'Success' })
    const { createVehicleProfile } = useVehicleProfileService()
    const payload = {
      brand: 'Toyota',
      modelName: 'Hiace',
      maxWeightCapacityG: 1500000,
      maxUsableVolumeCbm: 6.0,
      type: 'Van'
    }
    await createVehicleProfile(payload)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/vehicle-profiles'),
      expect.objectContaining({
        method: 'POST',
        body: payload,
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('updateVehicleProfile sends PUT request with partial payload', async () => {
    mockFetch.mockResolvedValue({ message: 'Updated' })
    const { updateVehicleProfile } = useVehicleProfileService()
    const payload = { brand: 'Updated Brand' }
    await updateVehicleProfile(1, payload)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/vehicle-profiles/1'),
      expect.objectContaining({
        method: 'PUT',
        body: payload,
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('deleteVehicleProfile sends DELETE request', async () => {
    mockFetch.mockResolvedValue({ message: 'Deleted' })
    const { deleteVehicleProfile } = useVehicleProfileService()
    await deleteVehicleProfile(1)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/vehicle-profiles/1'),
      expect.objectContaining({
        method: 'DELETE',
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('omits Authorization header if userToken is missing', async () => {
    mockToken.value = null // Simulate logged out
    mockFetch.mockResolvedValue({ data: [] })
    
    const { getVehicleProfiles } = useVehicleProfileService()
    await getVehicleProfiles()

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: {} // Headers should be empty
      })
    )
  })

  test('handles API errors gracefully', async () => {
    const errorResponse = { data: { error: 'Not Found' } }
    mockFetch.mockRejectedValue(errorResponse)

    const { getVehicleProfileById } = useVehicleProfileService()
    
    await expect(getVehicleProfileById(999)).rejects.toEqual(errorResponse)
  })
})