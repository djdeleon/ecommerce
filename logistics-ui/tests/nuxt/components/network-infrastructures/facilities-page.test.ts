import { describe, test, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import FacilitiesPage from '~/pages/admin/network-infrastructures/facilities.vue'

const { mockGetFacilities, mockCreateFacility, mockUpdateFacility, mockDeleteFacility, mockGetFacilityById } = vi.hoisted(() => ({
  mockGetFacilities: vi.fn(),
  mockCreateFacility: vi.fn(),
  mockUpdateFacility: vi.fn(),
  mockDeleteFacility: vi.fn(),
  mockGetFacilityById: vi.fn(),
}))

mockNuxtImport('useFacilityService', () => () => ({
  getFacilities: mockGetFacilities,
  createFacility: mockCreateFacility,
  updateFacility: mockUpdateFacility,
  deleteFacility: mockDeleteFacility,
  getFacilityById: mockGetFacilityById,
}))

describe('Facilities Management Page (UI Component)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetFacilities.mockResolvedValue({ 
      facilities: [{ id: 1, name: 'Bulacan Mega Gateway', code: 'BUL-01', type: 'MegaGateway', address: 'Bulacan' }],
      facilityTypes: ['MegaGateway', 'DistributionCenter', 'LocalBranch']
    })
  })

  test('renders facilities table with data on mount', async () => {
    const component = await mountSuspended(FacilitiesPage)

    const searchInput = component.find('input[placeholder="Search facility name..."]')
    expect(searchInput.exists()).toBe(true)
    expect(mockGetFacilities).toHaveBeenCalled()

    expect(component.text()).toContain('Bulacan Mega Gateway')
  })

  test('opens create modal and handles facility creation', async () => {
    mockCreateFacility.mockResolvedValueOnce({ message: 'Facility created successfully.' })
    const component = await mountSuspended(FacilitiesPage)
    const vm = component.vm as any

    vm.openCreateModal()
    await component.vm.$nextTick()
    
    vm.newFacility.name = 'Manila Mega Gateway'
    vm.newFacility.type = 'MegaGateway'
    vm.newFacility.address = 'Manila'
    await vm.handleCreateFacility()

    expect(mockCreateFacility).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Manila Mega Gateway',
      type: 'MegaGateway',
      address: 'Manila'
    }))
    expect(mockGetFacilities).toHaveBeenCalledTimes(2) // Initial load + reload after creation
  })

  test('opens view details modal and fetches facility by ID', async () => {
    const detailedFacility = { id: 1, name: 'Bulacan Mega Gateway', code: 'BUL-01', type: 'MegaGateway', address: 'Bulacan' }
    mockGetFacilityById.mockResolvedValueOnce({ data: detailedFacility })

    const component = await mountSuspended(FacilitiesPage)
    const vm = component.vm as any

    await vm.openViewModal(1)
    await component.vm.$nextTick()

    expect(mockGetFacilityById).toHaveBeenCalledWith(1)
    expect(vm.isViewModalOpen).toBe(true)
    expect(vm.viewingFacility.id).toBe(1)
  })

  test('opens edit modal and handles update submission', async () => {
    mockUpdateFacility.mockResolvedValueOnce({ message: 'Facility updated successfully.' })
    const component = await mountSuspended(FacilitiesPage)
    const vm = component.vm as any

    const testFacility = { id: 1, name: 'Bulacan Mega Gateway', type: 'MegaGateway', address: 'Bulacan' }
    vm.openEditModal(testFacility)
    await component.vm.$nextTick()

    expect(vm.isModalOpen).toBe(true)
    vm.editingFacility.name = 'Updated Bulacan Gateway'

    await vm.handleSaveFacility()

    expect(mockUpdateFacility).toHaveBeenCalledWith(1, expect.objectContaining({
      name: 'Updated Bulacan Gateway'
    }))
    expect(vm.isModalOpen).toBe(false)
  })

  test('triggers delete confirmation modal and calls delete service', async () => {
    mockDeleteFacility.mockResolvedValueOnce({ message: 'Facility deleted successfully.' })
    const component = await mountSuspended(FacilitiesPage)
    const vm = component.vm as any
    const testFacility = { id: 1, name: 'Bulacan Mega Gateway' }

    vm.openDeleteModal(testFacility)
    await component.vm.$nextTick()

    expect(vm.isDeleteModalOpen).toBe(true)
    expect(vm.deletingFacility.name).toBe('Bulacan Mega Gateway')

    await vm.handleConfirmDelete()

    expect(mockDeleteFacility).toHaveBeenCalledWith(1)
    expect(vm.isDeleteModalOpen).toBe(false)
  })
})