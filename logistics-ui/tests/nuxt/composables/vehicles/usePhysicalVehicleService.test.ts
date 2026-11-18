import { describe, test, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { usePhysicalVehicleService, type PhysicalVehiclePayload } from '~/composables/usePhysicalVehicleService'

const { mockFetch } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
}))

const mockToken = ref<string | null>('mock-token')

mockNuxtImport('$fetch', () => mockFetch)
mockNuxtImport('useAuthService', () => () => ({
  userToken: mockToken,
}))

describe('usePhysicalVehicleService Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockToken.value = 'mock-token'
  })

  test('getPhysicalVehicles sends GET request with auth header', async () => {
    mockFetch.mockResolvedValue({ data: [] })
    const { getPhysicalVehicles } = usePhysicalVehicleService()
    await getPhysicalVehicles()

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/physical-vehicles'),
      expect.objectContaining({
        method: 'GET',
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('getPhysicalVehicleById sends GET request with specific ID', async () => {
    mockFetch.mockResolvedValue({ data: { id: 123, licensePlate: 'ABC-1234' } })
    const { getPhysicalVehicleById } = usePhysicalVehicleService()
    await getPhysicalVehicleById(123)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/physical-vehicles/123'),
      expect.objectContaining({
        method: 'GET',
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('createPhysicalVehicle sends POST request with payload', async () => {
    mockFetch.mockResolvedValue({ message: 'Created' })
    const { createPhysicalVehicle } = usePhysicalVehicleService()
    const payload: PhysicalVehiclePayload = {
      licensePlate: 'XYZ-9876',
      vin: '1HGBH41JXMN109186',
      vehicleProfileId: 1,
      status: 'Available',
      currentMileage: 0
    }
    await createPhysicalVehicle(payload)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/physical-vehicles'),
      expect.objectContaining({
        method: 'POST',
        body: payload,
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('updatePhysicalVehicle sends PUT request with partial payload', async () => {
    mockFetch.mockResolvedValue({ message: 'Updated' })
    const { updatePhysicalVehicle } = usePhysicalVehicleService()
    const payload = { status: 'Maintenance' as const }
    await updatePhysicalVehicle(123, payload)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/physical-vehicles/123'),
      expect.objectContaining({
        method: 'PUT',
        body: payload,
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('deletePhysicalVehicle sends DELETE request', async () => {
    mockFetch.mockResolvedValue({ message: 'Deleted' })
    const { deletePhysicalVehicle } = usePhysicalVehicleService()
    await deletePhysicalVehicle(123)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/physical-vehicles/123'),
      expect.objectContaining({
        method: 'DELETE',
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('omits Authorization header if userToken is missing', async () => {
    mockToken.value = null // Simulate logged out
    mockFetch.mockResolvedValue({ data: [] })
    
    const { getPhysicalVehicles } = usePhysicalVehicleService()
    await getPhysicalVehicles()

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: {} // Headers should be empty
      })
    )
  })

  test('handles API errors gracefully', async () => {
    const errorResponse = { data: { message: 'Internal Server Error' } }
    mockFetch.mockRejectedValue(errorResponse)

    const { getPhysicalVehicleById } = usePhysicalVehicleService()
    
    await expect(getPhysicalVehicleById(123)).rejects.toEqual(errorResponse)
  })
})