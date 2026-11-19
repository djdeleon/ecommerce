import { describe, test, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import NetworkLegsPage from '~/pages/admin/network-infrastructures/network-legs.vue'

const { mockGetNetworkLegs, mockCreateNetworkLeg, mockUpdateNetworkLeg, mockDeleteNetworkLeg, mockGetNetworkLegById, mockGetFacilities } = vi.hoisted(() => ({
  mockGetNetworkLegs: vi.fn(),
  mockCreateNetworkLeg: vi.fn(),
  mockUpdateNetworkLeg: vi.fn(),
  mockDeleteNetworkLeg: vi.fn(),
  mockGetNetworkLegById: vi.fn(),
  mockGetFacilities: vi.fn(),
}))

mockNuxtImport('useNetworkLegService', () => () => ({
  getNetworkLegs: mockGetNetworkLegs,
  createNetworkLeg: mockCreateNetworkLeg,
  updateNetworkLeg: mockUpdateNetworkLeg,
  deleteNetworkLeg: mockDeleteNetworkLeg,
  getNetworkLegById: mockGetNetworkLegById,
}))

mockNuxtImport('useFacilityService', () => () => ({
  getFacilities: mockGetFacilities,
}))

describe('Network Legs Management Page (UI Component)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetNetworkLegs.mockResolvedValue({ 
      data: [{ id: 1, laneCode: 'ORG-DST-HL', sourceFacilityId: 1, destinationFacilityId: 2, mode: 'HighwayLinehaul' }] 
    })
    mockGetFacilities.mockResolvedValue({
      facilities: [
        { id: 1, name: 'Origin Hub', type: 'MegaGateway' },
        { id: 2, name: 'Destination Hub', type: 'DistributionCenter' }
      ]
    })
  })

  test('renders network legs table with data on mount', async () => {
    const component = await mountSuspended(NetworkLegsPage)

    const searchInput = component.find('input[placeholder="Search lane code..."]')
    expect(searchInput.exists()).toBe(true)
    expect(mockGetNetworkLegs).toHaveBeenCalled()
    expect(mockGetFacilities).toHaveBeenCalled()

    expect(component.text()).toContain('ORG-DST-HL')
  })

  test('opens create modal and handles network leg creation', async () => {
    mockCreateNetworkLeg.mockResolvedValueOnce({ message: 'Network leg created successfully.' })
    const component = await mountSuspended(NetworkLegsPage)
    const vm = component.vm as any

    vm.openCreateModal()
    await component.vm.$nextTick()
    
    vm.newLeg.laneCode = 'NEW-LANE-HL'
    vm.newLeg.sourceFacilityId = 1
    vm.newLeg.destinationFacilityId = 2
    await vm.handleCreateLeg()

    expect(mockCreateNetworkLeg).toHaveBeenCalledWith(expect.objectContaining({
      laneCode: 'NEW-LANE-HL',
      sourceFacilityId: 1,
      destinationFacilityId: 2
    }))
    expect(mockGetNetworkLegs).toHaveBeenCalledTimes(2) // Initial load + reload after creation
  })

  test('opens view details modal and fetches network leg by ID', async () => {
    const detailedLeg = { 
      id: 1, 
      laneCode: 'ORG-DST-HL', 
      sourceFacilityId: 1, 
      destinationFacilityId: 2, 
      sourceFacility: { name: 'Origin Hub', type: 'MegaGateway' },
      destinationFacility: { name: 'Destination Hub', type: 'DistributionCenter' },
      mode: 'HighwayLinehaul' 
    }
    mockGetNetworkLegById.mockResolvedValueOnce({ data: detailedLeg })

    const component = await mountSuspended(NetworkLegsPage)
    const vm = component.vm as any

    await vm.openViewModal(1)
    await component.vm.$nextTick()

    expect(mockGetNetworkLegById).toHaveBeenCalledWith(1)
    expect(vm.isViewModalOpen).toBe(true)
    expect(vm.viewingLeg.id).toBe(1)
  })

  test('opens edit modal and handles update submission', async () => {
    mockUpdateNetworkLeg.mockResolvedValueOnce({ message: 'Network leg updated successfully.' })
    const component = await mountSuspended(NetworkLegsPage)
    const vm = component.vm as any

    const testLeg = { id: 1, laneCode: 'ORG-DST-HL', sourceFacilityId: 1, destinationFacilityId: 2 }
    vm.openEditModal(testLeg)
    await component.vm.$nextTick()

    expect(vm.isModalOpen).toBe(true)
    vm.editingLeg.laneCode = 'UPDATED-LANE-HL'

    await vm.handleSaveLeg()

    expect(mockUpdateNetworkLeg).toHaveBeenCalledWith(1, expect.objectContaining({
      laneCode: 'UPDATED-LANE-HL'
    }))
    expect(vm.isModalOpen).toBe(false)
  })

  test('triggers delete confirmation modal and calls delete service', async () => {
    mockDeleteNetworkLeg.mockResolvedValueOnce({ message: 'Network leg deleted successfully.' })
    const component = await mountSuspended(NetworkLegsPage)
    const vm = component.vm as any
    const testLeg = { id: 1, laneCode: 'ORG-DST-HL' }

    vm.openDeleteModal(testLeg)
    await component.vm.$nextTick()

    expect(vm.isDeleteModalOpen).toBe(true)
    expect(vm.deletingLeg.laneCode).toBe('ORG-DST-HL')

    await vm.handleConfirmDelete()

    expect(mockDeleteNetworkLeg).toHaveBeenCalledWith(1)
    expect(vm.isDeleteModalOpen).toBe(false)
  })
})