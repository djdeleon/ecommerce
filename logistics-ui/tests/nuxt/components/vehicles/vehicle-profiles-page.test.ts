import { describe, test, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import VehicleProfilesPage from '~/pages/admin/vehicles/vehicle-profiles.vue'

const { 
  mockGetVehicleProfiles, 
  mockCreateVehicleProfile, 
  mockUpdateVehicleProfile, 
  mockDeleteVehicleProfile, 
  mockGetVehicleProfileById 
} = vi.hoisted(() => ({
  mockGetVehicleProfiles: vi.fn(),
  mockCreateVehicleProfile: vi.fn(),
  mockUpdateVehicleProfile: vi.fn(),
  mockDeleteVehicleProfile: vi.fn(),
  mockGetVehicleProfileById: vi.fn(),
}))

mockNuxtImport('useVehicleProfileService', () => () => ({
  getVehicleProfiles: mockGetVehicleProfiles,
  createVehicleProfile: mockCreateVehicleProfile,
  updateVehicleProfile: mockUpdateVehicleProfile,
  deleteVehicleProfile: mockDeleteVehicleProfile,
  getVehicleProfileById: mockGetVehicleProfileById,
}))

describe('Vehicle Profiles Management Page (UI Component)', () => {
  const mockData = [
    { id: 1, brand: 'Mitsubishi', modelName: 'L300', type: 'Van', maxWeightCapacityG: 1000000, maxUsableVolumeCbm: 3.3 },
    { id: 2, brand: 'Toyota', modelName: 'Hiace', type: 'Van', maxWeightCapacityG: 1200000, maxUsableVolumeCbm: 4.5 }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetVehicleProfiles.mockResolvedValue({ data: mockData })
  })

  test('renders vehicle profiles table with data on mount', async () => {
    const component = await mountSuspended(VehicleProfilesPage)

    const searchInput = component.find('input[placeholder="Search model name..."]')
    expect(searchInput.exists()).toBe(true)
    expect(mockGetVehicleProfiles).toHaveBeenCalled()

    expect(component.text()).toContain('Mitsubishi')
    expect(component.text()).toContain('L300')
  })

  test('filters profiles client-side via filteredProfiles computed property', async () => {
    const component = await mountSuspended(VehicleProfilesPage)
    const vm = component.vm as any

    // Initially shows all
    expect(vm.filteredProfiles.length).toBe(2)

    // Search for Toyota
    vm.searchQuery = 'Toyota'
    await component.vm.$nextTick()
    
    expect(vm.filteredProfiles.length).toBe(1)
    expect(vm.filteredProfiles[0].brand).toBe('Toyota')
  })

  test('opens create modal and handles submission', async () => {
    mockCreateVehicleProfile.mockResolvedValueOnce({ message: 'Created successfully' })
    const component = await mountSuspended(VehicleProfilesPage)
    const vm = component.vm as any

    vm.openCreateModal()
    expect(vm.isCreateModalOpen).toBe(true)

    Object.assign(vm.newProfile, {
      brand: 'Isuzu',
      modelName: 'Elf',
      maxWeightCapacityG: 3000000,
      maxUsableVolumeCbm: 10
    })

    await vm.handleCreateProfile()

    expect(mockCreateVehicleProfile).toHaveBeenCalledWith(expect.objectContaining({
      brand: 'Isuzu',
      modelName: 'Elf'
    }))
    expect(vm.isCreateModalOpen).toBe(false)
  })

  test('opens view modal and fetches details', async () => {
    mockGetVehicleProfileById.mockResolvedValueOnce({ data: mockData[0] })
    const component = await mountSuspended(VehicleProfilesPage)
    const vm = component.vm as any

    await vm.openViewModal(1)
    
    expect(mockGetVehicleProfileById).toHaveBeenCalledWith(1)
    expect(vm.isViewModalOpen).toBe(true)
    expect(vm.viewingProfile.brand).toBe('Mitsubishi')
  })

  test('opens edit modal and handles update', async () => {
    mockUpdateVehicleProfile.mockResolvedValueOnce({ message: 'Updated successfully' })
    const component = await mountSuspended(VehicleProfilesPage)
    const vm = component.vm as any

    vm.openEditModal(mockData[0])
    expect(vm.isModalOpen).toBe(true)
    
    vm.editingProfile.brand = 'Mitsubishi Updated'
    await vm.handleSaveProfile()

    expect(mockUpdateVehicleProfile).toHaveBeenCalledWith(1, expect.objectContaining({
      brand: 'Mitsubishi Updated'
    }))
    expect(vm.isModalOpen).toBe(false)
  })

  test('triggers delete confirmation and calls service', async () => {
    mockDeleteVehicleProfile.mockResolvedValueOnce({ message: 'Deleted' })
    const component = await mountSuspended(VehicleProfilesPage)
    const vm = component.vm as any

    vm.openDeleteModal(mockData[1])
    expect(vm.isDeleteModalOpen).toBe(true)
    expect(vm.deletingProfile.modelName).toBe('Hiace')

    await vm.handleConfirmDelete()

    expect(mockDeleteVehicleProfile).toHaveBeenCalledWith(2)
    expect(vm.isDeleteModalOpen).toBe(false)
  })
})