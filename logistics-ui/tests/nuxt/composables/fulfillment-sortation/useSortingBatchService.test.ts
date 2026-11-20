import { describe, test, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useSortingBatchService } from '~/composables/useSortingBatchService'

const { mockFetch } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
}))

const mockToken = ref<string | null>('mock-token')

mockNuxtImport('$fetch', () => mockFetch)
mockNuxtImport('useAuthService', () => () => ({
  userToken: mockToken,
}))

describe('useSortingBatchService Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockToken.value = 'mock-token'
  })

  test('getSortingBatches sends GET request with auth header', async () => {
    mockFetch.mockResolvedValue({ data: [] })
    const { getSortingBatches } = useSortingBatchService()
    await getSortingBatches()

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/sorting-batches'),
      expect.objectContaining({
        method: 'GET',
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('getSortingBatchById sends GET request with specific ID', async () => {
    mockFetch.mockResolvedValue({ data: { id: 1, code: 'BATCH-001' } })
    const { getSortingBatchById } = useSortingBatchService()
    await getSortingBatchById(1)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/sorting-batches/1'),
      expect.objectContaining({
        method: 'GET',
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('createSortingBatch sends POST request with payload', async () => {
    mockFetch.mockResolvedValue({ message: 'Created' })
    const { createSortingBatch } = useSortingBatchService()
    const payload = { facilityId: 2, cutOffTime: '1970-01-01T23:00:00Z' }
    await createSortingBatch(payload)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/sorting-batches'),
      expect.objectContaining({
        method: 'POST',
        body: payload,
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('updateSortingBatch sends PUT request with payload', async () => {
    mockFetch.mockResolvedValue({ message: 'Updated' })
    const { updateSortingBatch } = useSortingBatchService()
    const payload = { status: 'Active' as const }
    await updateSortingBatch(1, payload)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/sorting-batches/1'),
      expect.objectContaining({
        method: 'PUT',
        body: payload,
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('deleteSortingBatch sends DELETE request', async () => {
    mockFetch.mockResolvedValue({ message: 'Deleted' })
    const { deleteSortingBatch } = useSortingBatchService()
    await deleteSortingBatch(1)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/sorting-batches/1'),
      expect.objectContaining({
        method: 'DELETE',
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('tunnelScan sends POST request for tunnel barcode scan', async () => {
    mockFetch.mockResolvedValue({ tunnelSensorStatus: 'SUCCESS' })
    const { tunnelScan } = useSortingBatchService()
    await tunnelScan('TRK-12345')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/sorting-batches/TRK-12345/tunnel-scan'),
      expect.objectContaining({
        method: 'POST',
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })

  test('completeSortingBatch sends PUT request with completed status', async () => {
    mockFetch.mockResolvedValue({ message: 'Completed' })
    const { completeSortingBatch } = useSortingBatchService()
    await completeSortingBatch(1)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/sortation-batches/1'),
      expect.objectContaining({
        method: 'PUT',
        body: expect.objectContaining({ status: 'Completed' }),
        headers: { Authorization: 'Bearer mock-token' }
      })
    )
  })
})