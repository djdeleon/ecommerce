import { describe, test, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import PhysicalVehiclesPage from '~/pages/admin/vehicles/physical-vehicles.vue'

const {
  mockGetVehicles,
  mockCreateVehicle,
  mockUpdateVehicle,
  mockDeleteVehicle,
  mockGetVehicleById,
  mockGetProfiles,
  mockGetStatuses
} = vi.hoisted(() => ({
  mockGetVehicles: vi.fn(),
  mockCreateVehicle: vi.fn(),
  mockUpdateVehicle: vi.fn(),
  mockDeleteVehicle: vi.fn(),
  mockGetVehicleById: vi.fn(),
  mockGetProfiles: vi.fn(),
  mockGetStatuses: vi.fn(),
}))

mockNuxtImport('usePhysicalVehicleService', () => () => ({
  getPhysicalVehicles: mockGetVehicles,
  createPhysicalVehicle: mockCreateVehicle,
  updatePhysicalVehicle: mockUpdateVehicle,
  deletePhysicalVehicle: mockDeleteVehicle,
  getPhysicalVehicleById: mockGetVehicleById,
  getStatusesPhysicalVehicles: mockGetStatuses,
}))

mockNuxtImport('useVehicleProfileService', () => () => ({
  getVehicleProfiles: mockGetProfiles,
}))

describe('Physical Vehicles Management Page (UI Component)', () => {
  const mockProfiles = [
    { id: 101, brand: 'Mitsubishi', modelName: 'L300' },
    { id: 102, brand: 'Toyota', modelName: 'Hiace' }
  ]

  const mockVehicles = [
    {
      id: 1,
      plateNumber: 'ABC-123',
      vin: 'VIN001',
      status: 'Available',
      vehicleProfileId: 101,
      vehicleProfile: mockProfiles[0]
    },
    {
      id: 2,
      plateNumber: 'XYZ-789',
      vin: 'VIN002',
      status: 'In Use',
      vehicleProfileId: 102,
      vehicleProfile: mockProfiles[1]
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetVehicles.mockResolvedValue({ data: mockVehicles })
    mockGetProfiles.mockResolvedValue({ data: mockProfiles })
    mockGetStatuses.mockResolvedValue({ data: ['Available', 'Transit', 'Maintenance'] })
  })

  test('renders physical vehicles table with data and profiles on mount', async () => {
    const component = await mountSuspended(PhysicalVehiclesPage)

    expect(mockGetVehicles).toHaveBeenCalled()
    expect(mockGetStatuses).toHaveBeenCalled()

    const text = component.text()
    expect(text).toContain('ABC-123')
    expect(text).toContain('Mitsubishi L300')
    expect(text).toContain('XYZ-789')
    expect(text).toContain('Toyota Hiace')
  })

  test('filters vehicles client-side via filteredVehicles computed property', async () => {
    const component = await mountSuspended(PhysicalVehiclesPage)
    const vm = component.vm as any

    // Search by Plate Number
    vm.searchQuery = 'ABC'
    expect(vm.filteredVehicles.length).toBe(1)
    expect(vm.filteredVehicles[0].plateNumber).toBe('ABC-123')
  })

  test('opens create modal and handles submission', async () => {
    mockCreateVehicle.mockResolvedValueOnce({ message: 'Vehicle added' })
    const component = await mountSuspended(PhysicalVehiclesPage)
    const vm = component.vm as any

    // Mock open modal via the state logic in the component
    vm.isCreateModalOpen = true

    Object.assign(vm.newVehicle, {
      plateNumber: 'NEW-456',
      vin: 'VIN-NEW-99',
      vehicleProfileId: 101,
      status: 'Available'
    })

    await vm.handleCreateVehicle()

    expect(mockCreateVehicle).toHaveBeenCalledWith(expect.objectContaining({
      plateNumber: 'NEW-456',
      vehicleProfileId: 101
    }))
    expect(vm.isCreateModalOpen).toBe(false)
    expect(mockGetVehicles).toHaveBeenCalledTimes(2) // Initial + Refresh
  })

  test('opens view modal and fetches specific vehicle details', async () => {
    mockGetVehicleById.mockResolvedValueOnce({ data: mockVehicles[0] })
    const component = await mountSuspended(PhysicalVehiclesPage)
    const vm = component.vm as any

    await vm.openViewModal(1)

    expect(mockGetVehicleById).toHaveBeenCalledWith(1)
    expect(vm.isViewModalOpen).toBe(true)
    expect(vm.viewingVehicle.plateNumber).toBe('ABC-123')
  })

  test('opens edit modal and handles updates', async () => {
    mockUpdateVehicle.mockResolvedValueOnce({ message: 'Updated' })
    const component = await mountSuspended(PhysicalVehiclesPage)
    const vm = component.vm as any

    // Simulate clicking edit on first row
    vm.editingVehicle = { ...mockVehicles[0] }
    vm.isModalOpen = true

    vm.editingVehicle.status = 'Maintenance'
    await vm.handleSaveVehicle()

    expect(mockUpdateVehicle).toHaveBeenCalledWith(1, expect.objectContaining({
      status: 'Maintenance'
    }))
    expect(vm.isModalOpen).toBe(false)
  })

  test('triggers delete confirmation and calls removal service', async () => {
    mockDeleteVehicle.mockResolvedValueOnce({ message: 'Deleted' })
    const component = await mountSuspended(PhysicalVehiclesPage)
    const vm = component.vm as any

    vm.deletingVehicle = mockVehicles[1]
    vm.isDeleteModalOpen = true

    await vm.handleConfirmDelete()

    expect(mockDeleteVehicle).toHaveBeenCalledWith(2)
    expect(vm.isDeleteModalOpen).toBe(false)
  })
})