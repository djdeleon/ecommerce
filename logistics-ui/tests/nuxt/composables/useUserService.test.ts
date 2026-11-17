import { describe, test, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useUserService } from '~/composables/useUserService'

const { mockFetch } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
}))

const mockToken = ref<string | null>('mock-token')

mockNuxtImport('$fetch', () => mockFetch)
mockNuxtImport('useAuthService', () => () => ({
  userToken: mockToken,
}))

describe('useUserService Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockToken.value = 'mock-token'
  })

  test('fetchUsers sends GET request with query params and auth header', async () => {
    const mockResponse = { message: 'Success', data: [{ id: 1, firstName: 'Test User' }] }
    mockFetch.mockResolvedValue(mockResponse)

    const { fetchUsers } = useUserService()
    const result = await fetchUsers({ role: 'Courier' })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/users'),
      {
        method: 'GET',
        params: { role: 'Courier' },
        headers: { Authorization: 'Bearer mock-token' },
      }
    )
    expect(result).toEqual(mockResponse)
  })

  test('fetchUsers omits Authorization header if token is missing', async () => {
    mockToken.value = null // simulate logged out state
    mockFetch.mockResolvedValue({ data: [] })

    const { fetchUsers } = useUserService()
    await fetchUsers()

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: {}, // should be empty when no token exists
      })
    )
  })

  test('fetchRoles sends GET request for user roles with auth header', async () => {
    const mockResponse = { data: ['Admin', 'Manager', 'Clerk', 'Courier'] }
    mockFetch.mockResolvedValue(mockResponse)

    const { fetchRoles } = useUserService()
    const result = await fetchRoles()

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/users/roles'),
      {
        method: 'GET',
        headers: { Authorization: 'Bearer mock-token' },
      }
    )
    expect(result).toEqual(mockResponse)
  })

  test('handles API errors gracefully when update fails', async () => {
    mockFetch.mockRejectedValue({ data: { error: 'Validation Failed' } })

    const { updateUser } = useUserService()
    
    await expect(updateUser(1, { firstName: '' })).rejects.toEqual({
      data: { error: 'Validation Failed' }
    })
  })

  test('fetchUserById sends GET request with user ID', async () => {
    mockFetch.mockResolvedValue({ data: { id: 42, firstName: 'Jane' } })

    const { fetchUserById } = useUserService()
    await fetchUserById(42)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/users/42'),
      {
        method: 'GET',
        headers: { Authorization: 'Bearer mock-token' },
      }
    )
  })

  test('updateUser sends PUT request with payload', async () => {
    mockFetch.mockResolvedValue({ message: 'Updated' })

    const { updateUser } = useUserService()
    const payload = { firstName: 'Updated Name', role: 'Manager' as const }
    await updateUser(42, payload)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/users/42'),
      {
        method: 'PUT',
        body: payload,
        headers: { Authorization: 'Bearer mock-token' },
      }
    )
  })

  test('deleteUser sends DELETE request', async () => {
    mockFetch.mockResolvedValue({ message: 'Deleted' })

    const { deleteUser } = useUserService()
    await deleteUser(42)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/users/42'),
      {
        method: 'DELETE',
        headers: { Authorization: 'Bearer mock-token' },
      }
    )
  })
})