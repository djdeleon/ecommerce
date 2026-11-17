import { describe, test, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import FleetTransportsPage from '../../../app/pages/admin/fleet-transports.vue'

const {
  mockGetFleetTransports,
  mockGetFleetTransportById,
  mockCreateFleetTransport,
  mockUpdateFleetTransport,
  mockDeleteFleetTransport,
  mockGetCreateData,
} = vi.hoisted(() => ({
  mockGetFleetTransports: vi.fn(),
  mockGetFleetTransportById: vi.fn(),
  mockCreateFleetTransport: vi.fn(),
  mockUpdateFleetTransport: vi.fn(),
  mockDeleteFleetTransport: vi.fn(),
  mockGetCreateData: vi.fn(),
}))

mockNuxtImport('useFleetTransportService', () => () => ({
  getFleetTransports: mockGetFleetTransports,
  getFleetTransportById: mockGetFleetTransportById,
  createFleetTransport: mockCreateFleetTransport,
  updateFleetTransport: mockUpdateFleetTransport,
  deleteFleetTransport: mockDeleteFleetTransport,
  getCreateData: mockGetCreateData,
}))

describe('Fleet Transports Management Page (UI Component)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetFleetTransports.mockResolvedValue({
      data: [
        {
          id: 1,
          scheduledFor: 'LineHaul',
          courierName: 'John Doe',
          vehicleDetail: 'Van (ABC-123)',
          scheduledTime: new Date().toISOString(),
          facilityId: 1,
        },
      ],
    })
    mockGetCreateData.mockResolvedValue({
      data: {
        fleetTransportTypes: ['LineHaul', 'Delivery', 'Accumulation'],
        vehicles: [{ id: 1, plateNumber: 'ABC-123' }],
        couriers: [{ id: 1, firstName: 'John', lastName: 'Doe' }],
        legs: [{ id: 1, laneCode: 'LANE-01' }],
      },
    })
  })

  test('renders fleet transports table and loads options on mount', async () => {
    const component = await mountSuspended(FleetTransportsPage)

    expect(mockGetFleetTransports).toHaveBeenCalled()
    expect(mockGetCreateData).toHaveBeenCalled()
    expect(component.text()).toContain('LineHaul')
    expect(component.text()).toContain('John Doe')
  })

  test('opens create modal and triggers creation', async () => {
    mockCreateFleetTransport.mockResolvedValueOnce({ message: 'Transport schedule created successfully.' })
    const component = await mountSuspended(FleetTransportsPage)
    const vm = component.vm as any

    await vm.openCreateModal()
    await component.vm.$nextTick()

    expect(vm.isCreateModalOpen).toBe(true)

    vm.newTransport.scheduledFor = 'LineHaul'
    await vm.handleCreate()

    expect(mockCreateFleetTransport).toHaveBeenCalledWith(
      expect.objectContaining({ scheduledFor: 'LineHaul' })
    )
    expect(mockGetFleetTransports).toHaveBeenCalledTimes(2)
  })

  test('opens view details modal and fetches transport by ID', async () => {
    const detailedTransport = { id: 1, scheduledFor: 'LineHaul', vehicle: { plateNumber: 'ABC-123' } }
    mockGetFleetTransportById.mockResolvedValueOnce({ data: detailedTransport })

    const component = await mountSuspended(FleetTransportsPage)
    const vm = component.vm as any

    await vm.openViewModal(1)
    await component.vm.$nextTick()

    expect(mockGetFleetTransportById).toHaveBeenCalledWith(1)
    expect(vm.isViewModalOpen).toBe(true)
    expect(vm.viewingTransport.id).toBe(1)
  })

  test('filters transports table by mission type and clears filter', async () => {
    const component = await mountSuspended(FleetTransportsPage)
    const vm = component.vm as any

    // Simulate selecting a filter value on the scheduledFor column
    const tableApi = vm.table?.tableApi
    expect(tableApi).toBeDefined()

    tableApi.getColumn('scheduledFor').setFilterValue('LineHaul')
    await component.vm.$nextTick()

    expect(tableApi.getColumn('scheduledFor').getFilterValue()).toBe('LineHaul')

    // Simulate clearing the filter
    tableApi.getColumn('scheduledFor').setFilterValue(undefined)
    await component.vm.$nextTick()

    expect(tableApi.getColumn('scheduledFor').getFilterValue()).toBeUndefined()
  })

  test('opens edit modal and handles update submission', async () => {
    mockUpdateFleetTransport.mockResolvedValueOnce({ message: 'Transport schedule updated successfully.' })
    const component = await mountSuspended(FleetTransportsPage)
    const vm = component.vm as any

    const testTransport = { id: 1, scheduledFor: 'LineHaul', facilityId: 1, vehicleId: 1 }
    await vm.openEditModal(testTransport)
    await component.vm.$nextTick()

    expect(vm.isEditModalOpen).toBe(true)
    expect(vm.editingTransport.id).toBe(1)

    vm.editingTransport.scheduledFor = 'Delivery'
    await vm.handleUpdate()

    expect(mockUpdateFleetTransport).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ scheduledFor: 'Delivery' })
    )
    expect(vm.isEditModalOpen).toBe(false)
    expect(mockGetFleetTransports).toHaveBeenCalledTimes(2) // Initial load + reload after update
  })

  test('triggers delete confirmation modal and calls delete service', async () => {
    mockDeleteFleetTransport.mockResolvedValueOnce({ message: 'Transport deleted successfully.' })
    const component = await mountSuspended(FleetTransportsPage)
    const vm = component.vm as any
    const testTransport = { id: 1, scheduledFor: 'LineHaul' }

    vm.deletingTransport = testTransport
    vm.isDeleteModalOpen = true
    await component.vm.$nextTick()

    expect(vm.isDeleteModalOpen).toBe(true)

    await vm.handleDelete()

    expect(mockDeleteFleetTransport).toHaveBeenCalledWith(1)
    expect(vm.isDeleteModalOpen).toBe(false)
  })
})