import { describe, test, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useMasterBagService } from '~/composables/useMasterBagService'

const { mockFetch } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
}))

const mockToken = ref<string | null>('mock-token')

mockNuxtImport('$fetch', () => mockFetch)
mockNuxtImport('useAuthService', () => () => ({
  userToken: mockToken,
}))

describe('useMasterBagService Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockToken.value = 'mock-token'
  })

  test('getMasterBags sends GET request with auth header', async () => {
    mockFetch.mockResolvedValue({ data: [] })
    const { getMasterBags } = useMasterBagService()
    await getMasterBags()

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/master-bags'),
      expect.objectContaining({
        method: 'GET',
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('getMasterBagById sends GET request with ID', async () => {
    mockFetch.mockResolvedValue({ data: { id: 1, code: 'BAG-001' } })
    const { getMasterBagById } = useMasterBagService()
    await getMasterBagById(1)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/master-bags/1'),
      expect.objectContaining({
        method: 'GET',
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('createMasterBag sends POST request with payload', async () => {
    mockFetch.mockResolvedValue({ message: 'Created' })
    const { createMasterBag } = useMasterBagService()
    const payload = { sortingBatchId: 1, currentFacilityId: 2, nextFacilityId: 3 }
    await createMasterBag(payload)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/master-bags'),
      expect.objectContaining({
        method: 'POST',
        body: payload,
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('sealMasterBag sends PATCH request to seal endpoint', async () => {
    mockFetch.mockResolvedValue({ message: 'Sealed' })
    const { sealMasterBag } = useMasterBagService()
    await sealMasterBag('BAG-001')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/master-bags/BAG-001/seal'),
      expect.objectContaining({
        method: 'PATCH',
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('dispatchMasterBag sends PATCH request to dispatch endpoint', async () => {
    mockFetch.mockResolvedValue({ message: 'Dispatched' })
    const { dispatchMasterBag } = useMasterBagService()
    await dispatchMasterBag('BAG-001')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/master-bags/BAG-001/dispatched'),
      expect.objectContaining({
        method: 'PATCH',
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('deliverMasterBag sends PATCH request to deliver endpoint', async () => {
    mockFetch.mockResolvedValue({ message: 'Delivered' })
    const { deliverMasterBag } = useMasterBagService()
    await deliverMasterBag('BAG-001')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/master-bags/BAG-001/delivered'),
      expect.objectContaining({
        method: 'PATCH',
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('unbagMasterBag sends PATCH request to unbag endpoint', async () => {
    mockFetch.mockResolvedValue({ message: 'Unbagged' })
    const { unbagMasterBag } = useMasterBagService()
    await unbagMasterBag('BAG-001')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/master-bags/BAG-001/unbag'),
      expect.objectContaining({
        method: 'PATCH',
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('getLabelUrl returns correct print label endpoint URL', async () => {
    const { getLabelUrl } = useMasterBagService()
    const url = getLabelUrl('BAG-001')

    expect(url).toContain('/api/v1/master-bags/BAG-001/label')
  })
})