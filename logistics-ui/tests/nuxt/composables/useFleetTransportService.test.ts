import { describe, test, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useFleetTransportService } from '~/composables/useFleetTransportService'

const { mockFetch } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
}))

const mockToken = ref<string | null>('mock-token')

mockNuxtImport('$fetch', () => mockFetch)
mockNuxtImport('useAuthService', () => () => ({
  userToken: mockToken,
}))

describe('useFleetTransportService Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockToken.value = 'mock-token'
  })

  test('getFleetTransports sends GET request with auth header', async () => {
    mockFetch.mockResolvedValue({ data: [] })
    const { getFleetTransports } = useFleetTransportService()
    await getFleetTransports()

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/fleet-transports'),
      expect.objectContaining({
        method: 'GET',
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('getFleetTransportById sends GET request with specific ID', async () => {
    mockFetch.mockResolvedValue({ data: { id: 42, scheduledFor: 'LineHaul' } })
    const { getFleetTransportById } = useFleetTransportService()
    await getFleetTransportById(42)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/fleet-transports/42'),
      expect.objectContaining({
        method: 'GET',
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('getCreateData fetches form creation options', async () => {
    mockFetch.mockResolvedValue({ data: { vehicles: [] } })
    const { getCreateData } = useFleetTransportService()
    await getCreateData('?facilityId=1')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/fleet-transports/create?facilityId=1'),
      expect.objectContaining({
        method: 'GET',
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('createFleetTransport sends POST request with payload', async () => {
    mockFetch.mockResolvedValue({ message: 'Success' })
    const { createFleetTransport } = useFleetTransportService()
    const payload = { scheduledFor: 'LineHaul', vehicleId: 1 }
    await createFleetTransport(payload)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/fleet-transports'),
      expect.objectContaining({
        method: 'POST',
        body: payload,
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('deleteFleetTransport sends DELETE request', async () => {
    mockFetch.mockResolvedValue({ message: 'Deleted' })
    const { deleteFleetTransport } = useFleetTransportService()
    await deleteFleetTransport(10)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/fleet-transports/10'),
      expect.objectContaining({
        method: 'DELETE',
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })
})