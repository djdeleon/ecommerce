import { describe, test, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import SectorsPage from '~/pages/admin/network-infrastructures/sectors.vue'

const { mockGetSectors, mockCreateSector, mockUpdateSector, mockDeleteSector, mockGetSectorById, mockGetFacilities } = vi.hoisted(() => ({
  mockGetSectors: vi.fn(),
  mockCreateSector: vi.fn(),
  mockUpdateSector: vi.fn(),
  mockDeleteSector: vi.fn(),
  mockGetSectorById: vi.fn(),
  mockGetFacilities: vi.fn(),
}))

mockNuxtImport('useSectorService', () => () => ({
  getSectors: mockGetSectors,
  createSector: mockCreateSector,
  updateSector: mockUpdateSector,
  deleteSector: mockDeleteSector,
  getSectorById: mockGetSectorById,
}))

mockNuxtImport('useFacilityService', () => () => ({
  getFacilities: mockGetFacilities,
}))

describe('Sectors Management Page (UI Component)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSectors.mockResolvedValue({ 
      data: [{ id: 1, code: 'R03-BUL-SJD-01', localBranchId: 1, barangays: [] }] 
    })
    mockGetFacilities.mockResolvedValue({
      facilities: [{ id: 1, name: 'Bulacan Mega Gateway', type: 'MegaGateway' }]
    })
  })

  test('renders sectors table with data on mount', async () => {
    const component = await mountSuspended(SectorsPage)

    const searchInput = component.find('input[placeholder="Search sector code..."]')
    expect(searchInput.exists()).toBe(true)
    expect(mockGetSectors).toHaveBeenCalled()
    expect(mockGetFacilities).toHaveBeenCalled()

    expect(component.text()).toContain('R03-BUL-SJD-01')
  })

  test('opens create modal and handles sector creation', async () => {
    mockCreateSector.mockResolvedValueOnce({ message: 'Sector created successfully.' })
    const component = await mountSuspended(SectorsPage)
    const vm = component.vm as any

    vm.openCreateModal()
    await component.vm.$nextTick()
    
    vm.newSector.code = 'R03-BUL-SJD-02'
    vm.newSector.localBranchId = 1
    await vm.handleCreateSector()

    expect(mockCreateSector).toHaveBeenCalledWith(expect.objectContaining({
      code: 'R03-BUL-SJD-02',
      localBranchId: 1
    }))
    expect(mockGetSectors).toHaveBeenCalledTimes(2) // Initial load + reload after creation
  })

  test('opens view details modal and fetches sector by ID', async () => {
    const detailedSector = { id: 1, code: 'R03-BUL-SJD-01', localBranchId: 1, localBranch: { name: 'Bulacan Mega Gateway', type: 'MegaGateway' }, barangays: [] }
    mockGetSectorById.mockResolvedValueOnce({ data: detailedSector })

    const component = await mountSuspended(SectorsPage)
    const vm = component.vm as any

    await vm.openViewModal(1)
    await component.vm.$nextTick()

    expect(mockGetSectorById).toHaveBeenCalledWith(1)
    expect(vm.isViewModalOpen).toBe(true)
    expect(vm.viewingSector.id).toBe(1)
  })

  test('opens edit modal and handles update submission', async () => {
    mockUpdateSector.mockResolvedValueOnce({ message: 'Sector updated successfully.' })
    const component = await mountSuspended(SectorsPage)
    const vm = component.vm as any

    const testSector = { id: 1, code: 'R03-BUL-SJD-01', localBranchId: 1 }
    vm.openEditModal(testSector)
    await component.vm.$nextTick()

    expect(vm.isModalOpen).toBe(true)
    vm.editingSector.code = 'R03-BUL-SJD-02'

    await vm.handleSaveSector()

    expect(mockUpdateSector).toHaveBeenCalledWith(1, expect.objectContaining({
      code: 'R03-BUL-SJD-02'
    }))
    expect(vm.isModalOpen).toBe(false)
  })

  test('triggers delete confirmation modal and calls delete service', async () => {
    mockDeleteSector.mockResolvedValueOnce({ message: 'Sector deleted successfully.' })
    const component = await mountSuspended(SectorsPage)
    const vm = component.vm as any
    const testSector = { id: 1, code: 'R03-BUL-SJD-01' }

    vm.openDeleteModal(testSector)
    await component.vm.$nextTick()

    expect(vm.isDeleteModalOpen).toBe(true)
    expect(vm.deletingSector.code).toBe('R03-BUL-SJD-01')

    await vm.handleConfirmDelete()

    expect(mockDeleteSector).toHaveBeenCalledWith(1)
    expect(vm.isDeleteModalOpen).toBe(false)
  })
})