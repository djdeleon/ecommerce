import { describe, test, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import SortingBatchesPage from '../../../../app/pages/admin/fulfillment-sortation/sorting-batches.vue'

const { mockGetSortingBatches, mockGetSortingBatchById, mockCreateSortingBatch, mockUpdateSortingBatch, mockDeleteSortingBatch, mockGetFacilities } = vi.hoisted(() => ({
  mockGetSortingBatches: vi.fn(),
  mockGetSortingBatchById: vi.fn(),
  mockCreateSortingBatch: vi.fn(),
  mockUpdateSortingBatch: vi.fn(),
  mockDeleteSortingBatch: vi.fn(),
  mockGetFacilities: vi.fn(),
}))

mockNuxtImport('useSortingBatchService', () => () => ({
  getSortingBatches: mockGetSortingBatches,
  getSortingBatchById: mockGetSortingBatchById,
  createSortingBatch: mockCreateSortingBatch,
  updateSortingBatch: mockUpdateSortingBatch,
  deleteSortingBatch: mockDeleteSortingBatch,
}))

mockNuxtImport('useFacilityService', () => () => ({
  getFacilities: mockGetFacilities,
}))

describe('Sorting Batches Management Page (UI Component)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSortingBatches.mockResolvedValue({
      data: {
        sortingBatches: [
          {
            id: 1,
            code: 'GW-MNL-01-20261120-NIGHT-001',
            facilityId: 1,
            status: 'Scheduled',
            cutOffTime: '1970-01-01T23:00:00Z',
            facility: { id: 1, name: 'Manila Gateway', code: 'GW-MNL-01' }
          }
        ],
        sortingBatchTypes: ['Scheduled', 'Active', 'Completed', 'Cancelled']
      }
    })
    mockGetFacilities.mockResolvedValue({
      data: {
        facilities: [
          { id: 1, name: 'Manila Gateway', code: 'GW-MNL-01' }
        ]
      }
    })
  })

  test('renders sorting batches table with data on mount', async () => {
    const component = await mountSuspended(SortingBatchesPage)

    const searchInput = component.find('input[placeholder="Search batch code..."]')
    expect(searchInput.exists()).toBe(true)
    expect(mockGetSortingBatches).toHaveBeenCalled()

    expect(component.text()).toContain('GW-MNL-01-20261120-NIGHT-001')
  })

  test('opens create modal and handles sorting batch creation', async () => {
    mockCreateSortingBatch.mockResolvedValueOnce({ message: 'Sortation batch created successfully.' })
    const component = await mountSuspended(SortingBatchesPage)
    const vm = component.vm as any

    await vm.openCreateModal()
    await component.vm.$nextTick()
    
    vm.newBatch.facilityId = 1
    vm.newBatch.status = 'Scheduled'
    await vm.handleCreateBatch()

    expect(mockCreateSortingBatch).toHaveBeenCalledWith(expect.objectContaining({
      facilityId: 1,
      status: 'Scheduled'
    }))
    expect(mockGetSortingBatches).toHaveBeenCalledTimes(2) // Initial load + reload after creation
  })

  test('opens view details modal and fetches sorting batch by ID', async () => {
    const detailedBatch = {
      id: 1,
      code: 'GW-MNL-01-20261120-NIGHT-001',
      facilityId: 1,
      status: 'Scheduled',
      facility: { id: 1, name: 'Manila Gateway' },
      masterBags: [],
      looseParcels: []
    }
    mockGetSortingBatchById.mockResolvedValueOnce({ data: detailedBatch })

    const component = await mountSuspended(SortingBatchesPage)
    const vm = component.vm as any

    await vm.openViewModal(1)
    await component.vm.$nextTick()

    expect(mockGetSortingBatchById).toHaveBeenCalledWith(1)
    expect(vm.isViewModalOpen).toBe(true)
    expect(vm.viewingBatch.id).toBe(1)
  })

  test('opens edit modal and handles update submission', async () => {
    mockUpdateSortingBatch.mockResolvedValueOnce({ message: 'Sortation batch updated successfully.' })
    const component = await mountSuspended(SortingBatchesPage)
    const vm = component.vm as any

    const testBatch = { id: 1, code: 'GW-MNL-01-20261120-NIGHT-001', status: 'Scheduled', cutOffTime: '1970-01-01T23:00:00Z' }
    vm.openEditModal(testBatch)
    await component.vm.$nextTick()

    expect(vm.isModalOpen).toBe(true)
    vm.editingBatch.status = 'Active'

    await vm.handleSaveBatch()

    expect(mockUpdateSortingBatch).toHaveBeenCalledWith(1, expect.objectContaining({
      status: 'Active'
    }))
    expect(vm.isModalOpen).toBe(false)
  })

  test('triggers delete confirmation modal and calls delete service', async () => {
    mockDeleteSortingBatch.mockResolvedValueOnce({ message: 'Sortation batch deleted successfully.' })
    const component = await mountSuspended(SortingBatchesPage)
    const vm = component.vm as any
    const testBatch = { id: 1, code: 'GW-MNL-01-20261120-NIGHT-001' }

    vm.openDeleteModal(testBatch)
    await component.vm.$nextTick()

    expect(vm.isDeleteModalOpen).toBe(true)
    expect(vm.deletingBatch.code).toBe('GW-MNL-01-20261120-NIGHT-001')

    await vm.handleConfirmDelete()

    expect(mockDeleteSortingBatch).toHaveBeenCalledWith(1)
    expect(vm.isDeleteModalOpen).toBe(false)
  })
})