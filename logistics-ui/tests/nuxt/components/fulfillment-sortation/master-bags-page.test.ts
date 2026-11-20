import { describe, test, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import MasterBagsPage from '../../../../app/pages/admin/fulfillment-sortation/master-bags.vue'

const {
  mockGetMasterBags,
  mockGetMasterBagById,
  mockUpdateMasterBag,
  mockDeleteMasterBag,
  mockSealMasterBag,
  mockDispatchMasterBag,
  mockDeliverMasterBag,
  mockUnbagMasterBag,
  mockGetLabelUrl,
} = vi.hoisted(() => ({
  mockGetMasterBags: vi.fn(),
  mockGetMasterBagById: vi.fn(),
  mockUpdateMasterBag: vi.fn(),
  mockDeleteMasterBag: vi.fn(),
  mockSealMasterBag: vi.fn(),
  mockDispatchMasterBag: vi.fn(),
  mockDeliverMasterBag: vi.fn(),
  mockUnbagMasterBag: vi.fn(),
  mockGetLabelUrl: vi.fn(),
}))

mockNuxtImport('useMasterBagService', () => () => ({
  getMasterBags: mockGetMasterBags,
  getMasterBagById: mockGetMasterBagById,
  updateMasterBag: mockUpdateMasterBag,
  deleteMasterBag: mockDeleteMasterBag,
  sealMasterBag: mockSealMasterBag,
  dispatchMasterBag: mockDispatchMasterBag,
  deliverMasterBag: mockDeliverMasterBag,
  unbagMasterBag: mockUnbagMasterBag,
  getLabelUrl: mockGetLabelUrl,
}))

describe('Master Bags Management Page (UI Component)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetMasterBags.mockResolvedValue({
      data: {
        masterBags: [
          {
            id: 1,
            code: 'BR-MAR-01-20261120-BAG-001',
            totalWeight: 2500,
            totalParcels: 4,
            status: 'Open',
          },
        ],
        masterBagStatuses: ['Open', 'Full', 'Sealed', 'Dispatched', 'Delivered', 'Unbagged'],
      },
    })
  })

  test('renders master bags table with data on mount', async () => {
    const component = await mountSuspended(MasterBagsPage)

    const searchInput = component.find('input[placeholder="Search master bag code..."]')
    expect(searchInput.exists()).toBe(true)
    expect(mockGetMasterBags).toHaveBeenCalled()

    expect(component.text()).toContain('BR-MAR-01-20261120-BAG-001')
  })

  test('opens view details modal and fetches master bag by ID', async () => {
    const detailedBag = {
      id: 1,
      code: 'BR-MAR-01-20261120-BAG-001',
      totalWeight: 2500,
      totalCbm: 0.02,
      totalParcels: 4,
      status: 'Open',
    }
    mockGetMasterBagById.mockResolvedValueOnce({ data: detailedBag })

    const component = await mountSuspended(MasterBagsPage)
    const vm = component.vm as any

    await vm.openViewModal(1)
    await component.vm.$nextTick()

    expect(mockGetMasterBagById).toHaveBeenCalledWith(1)
    expect(vm.isViewModalOpen).toBe(true)
    expect(vm.viewingBag.id).toBe(1)
  })

  test('opens edit modal and handles update submission', async () => {
    mockUpdateMasterBag.mockResolvedValueOnce({ message: 'Master bag updated successfully.' })
    const component = await mountSuspended(MasterBagsPage)
    const vm = component.vm as any

    const testBag = { id: 1, code: 'BR-MAR-01-20261120-BAG-001', status: 'Open', totalWeight: 2500 }
    vm.openEditModal(testBag)
    await component.vm.$nextTick()

    expect(vm.isModalOpen).toBe(true)
    vm.editingBag.status = 'Sealed'

    await vm.handleSaveBag()

    expect(mockUpdateMasterBag).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        status: 'Sealed',
      })
    )
    expect(vm.isModalOpen).toBe(false)
  })

  test('triggers delete confirmation modal and calls delete service', async () => {
    mockDeleteMasterBag.mockResolvedValueOnce({ message: 'Master bag deleted successfully.' })
    const component = await mountSuspended(MasterBagsPage)
    const vm = component.vm as any
    const testBag = { id: 1, code: 'BR-MAR-01-20261120-BAG-001' }

    vm.openDeleteModal(testBag)
    await component.vm.$nextTick()

    expect(vm.isDeleteModalOpen).toBe(true)
    expect(vm.deletingBag.code).toBe('BR-MAR-01-20261120-BAG-001')

    await vm.handleConfirmDelete()

    expect(mockDeleteMasterBag).toHaveBeenCalledWith(1)
    expect(vm.isDeleteModalOpen).toBe(false)
  })

  test('triggers workflow actions correctly (seal, dispatch, deliver, unbag)', async () => {
    mockSealMasterBag.mockResolvedValueOnce({ message: 'Sealed successfully' })
    mockDispatchMasterBag.mockResolvedValueOnce({ message: 'Dispatched successfully' })
    mockDeliverMasterBag.mockResolvedValueOnce({ message: 'Delivered successfully' })
    mockUnbagMasterBag.mockResolvedValueOnce({ message: 'Unbagged successfully' })

    const component = await mountSuspended(MasterBagsPage)
    const vm = component.vm as any
    const code = 'BR-MAR-01-20261120-BAG-001'

    await vm.handleSeal(code)
    expect(mockSealMasterBag).toHaveBeenCalledWith(code)

    await vm.handleDispatch(code)
    expect(mockDispatchMasterBag).toHaveBeenCalledWith(code)

    await vm.handleDeliver(code)
    expect(mockDeliverMasterBag).toHaveBeenCalledWith(code)

    await vm.handleUnbag(code)
    expect(mockUnbagMasterBag).toHaveBeenCalledWith(code)
  })

  test('calls getLabelUrl and opens new window for printing label', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    mockGetLabelUrl.mockReturnValue('http://localhost:8001/api/v1/master-bags/BR-MAR-01-20261120-BAG-001/label')

    const component = await mountSuspended(MasterBagsPage)
    const vm = component.vm as any

    vm.printLabel('BR-MAR-01-20261120-BAG-001')

    expect(mockGetLabelUrl).toHaveBeenCalledWith('BR-MAR-01-20261120-BAG-001')
    expect(openSpy).toHaveBeenCalledWith(
      'http://localhost:8001/api/v1/master-bags/BR-MAR-01-20261120-BAG-001/label',
      '_blank'
    )

    openSpy.mockRestore()
  })
})