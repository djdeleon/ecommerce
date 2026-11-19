import { describe, test, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import ClientsPage from '../../../app/pages/admin/clients.vue'

const { mockGetClients, mockCreateClient, mockUpdateClient, mockDeleteClient, mockGetClientById } = vi.hoisted(() => ({
  mockGetClients: vi.fn(),
  mockCreateClient: vi.fn(),
  mockUpdateClient: vi.fn(),
  mockDeleteClient: vi.fn(),
  mockGetClientById: vi.fn(),
}))

mockNuxtImport('useClientService', () => () => ({
  getClients: mockGetClients,
  createClient: mockCreateClient,
  updateClient: mockUpdateClient,
  deleteClient: mockDeleteClient,
  getClientById: mockGetClientById,
}))

describe('Clients Management Page (UI Component)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetClients.mockResolvedValue({ 
      data: [{ id: 1, name: 'Main Client', apiKey: 'apk_123', webhookUrl: 'http://example.com/wh', isActive: true }] 
    })
  })

  test('renders client table with data on mount', async () => {
    const component = await mountSuspended(ClientsPage)

    const searchInput = component.find('input[placeholder="Search client name..."]')
    expect(searchInput.exists()).toBe(true)
    expect(mockGetClients).toHaveBeenCalled()

    expect(component.text()).toContain('Main Client')
  })

  test('triggers search with searchQuery when loadClients is called', async () => {
    const component = await mountSuspended(ClientsPage)
    const vm = component.vm as any

    vm.searchQuery = 'Acme'
    await vm.loadClients()

    expect(mockGetClients).toHaveBeenCalledWith(expect.objectContaining({
      search: 'Acme'
    }))
  })

  test('opens register modal and handles creation', async () => {
    mockCreateClient.mockResolvedValueOnce({ message: 'Client registered successfully.' })
    const component = await mountSuspended(ClientsPage)
    const vm = component.vm as any

    vm.openCreateModal()
    await component.vm.$nextTick()
    
    vm.newClient.name = 'Test Company'
    await vm.handleCreateClient()

    expect(mockCreateClient).toHaveBeenCalledWith({ name: 'Test Company' })
    expect(mockGetClients).toHaveBeenCalledTimes(2) // Initial load + reload after creation
  })

  test('opens view details modal and fetches client by ID', async () => {
    const detailedClient = { id: 1, name: 'Main Client', apiKey: 'apk_123', webhookUrl: 'http://example.com/wh', isActive: true }
    mockGetClientById.mockResolvedValueOnce({ data: detailedClient })

    const component = await mountSuspended(ClientsPage)
    const vm = component.vm as any

    await vm.openViewModal(1)
    await component.vm.$nextTick()

    expect(mockGetClientById).toHaveBeenCalledWith(1)
    expect(vm.isViewModalOpen).toBe(true)
    expect(vm.viewingClient.id).toBe(1)
  })

  test('opens edit modal and handles update submission', async () => {
    mockUpdateClient.mockResolvedValueOnce({ message: 'Client updated successfully.' })
    const component = await mountSuspended(ClientsPage)
    const vm = component.vm as any

    const testClient = { id: 1, name: 'Old Client Name', webhookUrl: 'http://example.com', isActive: true }
    vm.openEditModal(testClient)
    await component.vm.$nextTick()

    expect(vm.isModalOpen).toBe(true)
    vm.editingClient.name = 'Updated Client Name'

    await vm.handleSaveClient()

    expect(mockUpdateClient).toHaveBeenCalledWith(1, expect.objectContaining({
      name: 'Updated Client Name'
    }))
    expect(vm.isModalOpen).toBe(false)
  })

  test('triggers delete confirmation modal and calls delete service', async () => {
    mockDeleteClient.mockResolvedValueOnce({ message: 'Client deleted successfully.' })
    const component = await mountSuspended(ClientsPage)
    const vm = component.vm as any
    const testClient = { id: 1, name: 'Client to Delete' }

    vm.openDeleteModal(testClient)
    await component.vm.$nextTick()

    expect(vm.isDeleteModalOpen).toBe(true)
    expect(vm.deletingClient.name).toBe('Client to Delete')

    await vm.handleConfirmDelete()

    expect(mockDeleteClient).toHaveBeenCalledWith(1)
    expect(vm.isDeleteModalOpen).toBe(false)
  })
})