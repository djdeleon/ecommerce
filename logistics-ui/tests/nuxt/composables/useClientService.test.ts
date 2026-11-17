import { describe, test, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useClientService } from '~/composables/useClientService'

const { mockFetch } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
}))

const mockToken = ref<string | null>('mock-token')

mockNuxtImport('$fetch', () => mockFetch)
mockNuxtImport('useAuthService', () => () => ({
  userToken: mockToken,
}))

describe('useClientService Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockToken.value = 'mock-token'
  })

  test('getClients sends GET request with auth header and params', async () => {
    mockFetch.mockResolvedValue({ data: [] })
    const { getClients } = useClientService()
    await getClients({ search: 'Acme', isActive: true })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/clients'),
      expect.objectContaining({
        method: 'GET',
        params: { search: 'Acme', isActive: true },
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('getClientById sends GET request with specific ID', async () => {
    mockFetch.mockResolvedValue({ data: { id: 42, name: 'Target Client' } })
    const { getClientById } = useClientService()
    await getClientById(42)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/clients/42'),
      expect.objectContaining({
        method: 'GET',
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('createClient sends POST request with payload', async () => {
    mockFetch.mockResolvedValue({ message: 'Success' })
    const { createClient } = useClientService()
    const payload = { name: 'New Client' }
    await createClient(payload)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/clients'),
      expect.objectContaining({
        method: 'POST',
        body: payload,
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('updateClient sends PUT request with partial payload', async () => {
    mockFetch.mockResolvedValue({ message: 'Updated' })
    const { updateClient } = useClientService()
    const payload = { name: 'Updated Name', isActive: false }
    await updateClient(42, payload)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/clients/42'),
      expect.objectContaining({
        method: 'PUT',
        body: payload,
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('deleteClient sends DELETE request', async () => {
    mockFetch.mockResolvedValue({ message: 'Deleted' })
    const { deleteClient } = useClientService()
    await deleteClient(42)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/clients/42'),
      expect.objectContaining({
        method: 'DELETE',
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('omits Authorization header if userToken is missing', async () => {
    mockToken.value = null // Simulate logged out
    mockFetch.mockResolvedValue({ data: [] })
    
    const { getClients } = useClientService()
    await getClients()

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

    const { getClientById } = useClientService()
    
    await expect(getClientById(999)).rejects.toEqual(errorResponse)
  })
})