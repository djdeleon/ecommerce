import { describe, test, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import TrackingNumbersPage from '../../../app/pages/admin/tracking-numbers.vue'

const { mockGetTrackingNumbers, mockGetTrackingNumberByNumber, mockGenerateTrackingNumbers, mockGetClients } = vi.hoisted(() => ({
  mockGetTrackingNumbers: vi.fn(),
  mockGetTrackingNumberByNumber: vi.fn(),
  mockGenerateTrackingNumbers: vi.fn(),
  mockGetClients: vi.fn(),
}))

mockNuxtImport('useTrackingNumberService', () => () => ({
  getTrackingNumbers: mockGetTrackingNumbers,
  getTrackingNumberByNumber: mockGetTrackingNumberByNumber,
  generateTrackingNumbers: mockGenerateTrackingNumbers,
}))

mockNuxtImport('useClientService', () => () => ({
  getClients: mockGetClients,
}))

describe('Tracking Numbers Management Page (UI Component)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetTrackingNumbers.mockResolvedValue({ 
      data: [
        { id: 1, number: 'FSTFY12345PH', isAssigned: false, client: { id: 1, name: 'Acme Corp' } },
        { id: 2, number: 'FSTFY67890PH', isAssigned: true, client: { id: 2, name: 'Beta Logistics' } }
      ] 
    })
    mockGetClients.mockResolvedValue({
      data: [{ id: 1, name: 'Acme Corp', apiKey: 'apk_123' }]
    })
  })

  test('renders tracking numbers table with data on mount', async () => {
    const component = await mountSuspended(TrackingNumbersPage)

    const searchInput = component.find('input[placeholder="Search tracking number or client..."]')
    expect(searchInput.exists()).toBe(true)
    expect(mockGetTrackingNumbers).toHaveBeenCalled()
    expect(mockGetClients).toHaveBeenCalled()

    expect(component.text()).toContain('FSTFY12345PH')
    expect(component.text()).toContain('Acme Corp')
  })

  test('filters table rows via search query input', async () => {
    const component = await mountSuspended(TrackingNumbersPage)
    const vm = component.vm as any

    vm.handleSearchInput('Acme')
    await component.vm.$nextTick()

    expect(vm.searchQuery).toBe('Acme')
  })

  test('filters table rows via status assignment filter', async () => {
    const component = await mountSuspended(TrackingNumbersPage)
    const vm = component.vm as any

    vm.handleAssignmentFilterChange('Assigned')
    await component.vm.$nextTick()

    expect(vm.selectedAssignment).toBe('Assigned')

    vm.clearAllFilters()
    await component.vm.$nextTick()

    expect(vm.searchQuery).toBe('')
    expect(vm.selectedAssignment).toBeUndefined()
  })

  test('opens generate modal and handles tracking numbers generation', async () => {
    mockGenerateTrackingNumbers.mockResolvedValueOnce({ message: 'Tracking Numbers generated successfully.' })
    const component = await mountSuspended(TrackingNumbersPage)
    const vm = component.vm as any

    vm.openGenerateModal()
    await component.vm.$nextTick()

    expect(vm.isGenerateModalOpen).toBe(true)
    
    vm.generationForm.apiKey = 'apk_123'
    vm.generationForm.size = 5

    await vm.handleGenerate()

    expect(mockGenerateTrackingNumbers).toHaveBeenCalledWith({ size: 5 }, 'apk_123')
    expect(vm.isGenerateModalOpen).toBe(false)
    expect(mockGetTrackingNumbers).toHaveBeenCalledTimes(2) // Initial load + reload after generation
  })

  test('opens view details modal and fetches tracking number by number', async () => {
    const detailedNumber = { id: 1, number: 'FSTFY12345PH', isAssigned: false, createdAt: new Date().toISOString() }
    mockGetTrackingNumberByNumber.mockResolvedValueOnce({ data: detailedNumber })

    const component = await mountSuspended(TrackingNumbersPage)
    const vm = component.vm as any

    await vm.openViewModal('FSTFY12345PH')
    await component.vm.$nextTick()

    expect(mockGetTrackingNumberByNumber).toHaveBeenCalledWith('FSTFY12345PH')
    expect(vm.isViewModalOpen).toBe(true)
    expect(vm.viewingNumber.number).toBe('FSTFY12345PH')
  })
})