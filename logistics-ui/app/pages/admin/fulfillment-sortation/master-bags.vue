<script setup lang="ts">
import { ref, reactive, onMounted, resolveComponent, h } from 'vue'
import { getPaginationRowModel } from '@tanstack/vue-table'
import { useMasterBagService, type MasterBag } from '~/composables/useMasterBagService'

const {
  getMasterBags,
  getMasterBagById,
  updateMasterBag,
  deleteMasterBag,
  sealMasterBag,
  dispatchMasterBag,
  deliverMasterBag,
  unbagMasterBag,
  getLabelUrl
} = useMasterBagService()
const toast = useToast()

const masterBags = ref<MasterBag[]>([])
const loading = ref(false)
const searchQuery = ref('')
const selectedStatus = ref<string | undefined>(undefined)
const statusOptions = ref<string[]>([])

// Table ref & pagination state
const table = ref()
const pagination = ref({
  pageIndex: 0,
  pageSize: 10
})
const sorting = ref([{ id: 'id', desc: true }])

// Modal State
const isModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const editingBag = ref<any>(null)
const deletingBag = ref<any>(null)
const saving = ref(false)

const isViewModalOpen = ref(false)
const viewingBag = ref<any>(null)
const loadingDetails = ref(false)

const openViewModal = async (id: number) => {
  isViewModalOpen.value = true
  loadingDetails.value = true
  try {
    const res: any = await getMasterBagById(id)
    viewingBag.value = res.data || res
  } catch (err: any) {
    toast.add({ title: 'Viewing Failed', description: err?.data?.message, color: 'error' })
    isViewModalOpen.value = false
  } finally {
    loadingDetails.value = false
  }
}

const getMasterBagStatusColor = (status: string) => {
  switch (status) {
    case 'Open':
      return 'neutral'
    case 'Full':
      return 'warning'
    case 'Sealed':
      return 'primary'
    case 'Dispatched':
      return 'info'
    case 'Delivered':
      return 'success'
    case 'Unbagged':
      return 'error'
    default:
      return 'neutral'
  }
}

const loadMasterBags = async () => {
  loading.value = true
  try {
    const res: any = await getMasterBags()
    const dataObj = res.data || res

    masterBags.value = dataObj.masterBags || dataObj || []
    if (dataObj.masterBagStatuses && Array.isArray(dataObj.masterBagStatuses)) {
      statusOptions.value = dataObj.masterBagStatuses
    }
  } catch (err: any) {
    toast.add({ title: 'Loading Lists Failed', description: err?.data?.message, color: 'error' })
  } finally {
    loading.value = false
  }
}

const handleSearchInput = (val: string) => {
  searchQuery.value = val
  pagination.value.pageIndex = 0
  table.value?.tableApi?.getColumn('code')?.setFilterValue(val || undefined)
}

const handleStatusFilterChange = (val: any) => {
  selectedStatus.value = val || undefined
  pagination.value.pageIndex = 0
  table.value?.tableApi?.getColumn('status')?.setFilterValue(val || undefined)
}

const clearAllFilters = () => {
  searchQuery.value = ''
  selectedStatus.value = undefined
  pagination.value.pageIndex = 0
  table.value?.tableApi?.getColumn('code')?.setFilterValue(undefined)
  table.value?.tableApi?.getColumn('status')?.setFilterValue(undefined)
}

const UButton = resolveComponent('UButton')

const columns = [
  {
    accessorKey: 'id',
    header: ({ column }: { column: any }) => {
      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'ID',
        icon: column.getIsSorted() === 'asc' ? 'i-lucide-arrow-up' : column.getIsSorted() === 'desc' ? 'i-lucide-arrow-down' : 'i-lucide-arrow-up-down',
        class: '-p-2 font-semibold',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
      })
    },
    cell: ({ row }: { row: any }) => row.getValue('id')
  },
  { accessorKey: 'code', header: 'Master Bag Code' },
  { accessorKey: 'totalWeight', header: 'Weight (g)' },
  { accessorKey: 'totalParcels', header: 'Parcels' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'actions', header: 'Actions' }
]

const openEditModal = (bag: any) => {
  editingBag.value = { ...bag }
  isModalOpen.value = true
}

const openDeleteModal = (bag: any) => {
  deletingBag.value = bag
  isDeleteModalOpen.value = true
}

const handleSaveBag = async () => {
  if (!editingBag.value) return
  saving.value = true
  try {
    const res: any = await updateMasterBag(editingBag.value.id, {
      status: editingBag.value.status,
      totalWeight: editingBag.value.totalWeight,
    })
    isModalOpen.value = false
    toast.add({ title: 'Updated', description: res.message, color: 'success' })
    await loadMasterBags()
  } catch (err: any) {
    toast.add({ title: 'Update Failed', description: err?.data?.message, color: 'error' })
  } finally {
    saving.value = false
  }
}

const handleConfirmDelete = async () => {
  if (!deletingBag.value) return
  saving.value = true
  try {
    const res: any = await deleteMasterBag(deletingBag.value.id)
    isDeleteModalOpen.value = false
    toast.add({ title: 'Deleted', description: res.message, color: 'success' })
    await loadMasterBags()
  } catch (err: any) {
    toast.add({ title: 'Deletion Failed', description: err?.data?.message, color: 'error' })
  } finally {
    saving.value = false
    deletingBag.value = null
  }
}

const handleSeal = async (code: string) => {
  try {
    await sealMasterBag(code)
    toast.add({ title: 'Sealed', description: 'Master bag sealed successfully.', color: 'success' })
    await loadMasterBags()
  } catch (err: any) {
    toast.add({ title: 'Action Failed', description: err?.data?.message, color: 'error' })
  }
}

const handleDispatch = async (code: string) => {
  try {
    await dispatchMasterBag(code)
    toast.add({ title: 'Dispatched', description: 'Master bag dispatched successfully.', color: 'success' })
    await loadMasterBags()
  } catch (err: any) {
    toast.add({ title: 'Action Failed', description: err?.data?.message, color: 'error' })
  }
}

const handleDeliver = async (code: string) => {
  try {
    await deliverMasterBag(code)
    toast.add({ title: 'Delivered', description: 'Master bag delivered successfully.', color: 'success' })
    await loadMasterBags()
  } catch (err: any) {
    toast.add({ title: 'Action Failed', description: err?.data?.message, color: 'error' })
  }
}

const handleUnbag = async (code: string) => {
  try {
    await unbagMasterBag(code)
    toast.add({ title: 'Unbagged', description: 'Master bag unbagged successfully.', color: 'success' })
    await loadMasterBags()
  } catch (err: any) {
    toast.add({ title: 'Action Failed', description: err?.data?.message, color: 'error' })
  }
}

const printLabel = (code: string) => {
  window.open(getLabelUrl(code), '_blank')
}

onMounted(() => {
  loadMasterBags()
})

definePageMeta({
  title: 'Master Bags Management'
})

const headerActions = useState('headerActions')
headerActions.value = null
</script>

<template>
  <div class="space-y-6">
    <!-- Filters & Search Bar -->
    <div
      class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-gray-800/40 p-4 rounded-xl border border-gray-800">
      <div class="flex flex-col sm:flex-row gap-3 items-stretch flex-1 w-full max-w-xl">
        <UInput :model-value="searchQuery" placeholder="Search master bag code..." icon="i-lucide-search" class="w-full"
          @update:model-value="handleSearchInput" />

        <div class="flex gap-2 items-center w-full sm:w-auto">
          <USelect :model-value="selectedStatus" :items="statusOptions" placeholder="Filter by Status"
            icon="i-lucide-filter" clearable class="w-full sm:w-48" @update:model-value="handleStatusFilterChange" />

          <UButton v-if="searchQuery || selectedStatus" label="Clear Filter" color="neutral" variant="subtle" size="sm"
            icon="i-lucide-x" @click="clearAllFilters" />
        </div>
      </div>
    </div>

    <!-- Table Card -->
    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <div class="overflow-x-auto">
        <UTable ref="table" v-model:pagination="pagination" v-model:sorting="sorting" :data="masterBags"
          :columns="columns" :loading="loading" :pagination-options="{
            getPaginationRowModel: getPaginationRowModel()
          }" class="w-full min-w-[700px]">
          <template #status-cell="{ row }">
            <UBadge :color="getMasterBagStatusColor((row.original as any).status)" variant="subtle">
              {{ (row.original as any).status }}
            </UBadge>
          </template>

          <template #actions-cell="{ row }">
            <div class="flex items-center gap-1">
              <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-printer" title="Print Label"
                @click="printLabel(row.original.code)" />
              <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-eye" title="View Details"
                @click="openViewModal(row.original.id)" />
              <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-pencil" title="Edit"
                @click="openEditModal(row.original)" />

              <UButton v-if="row.original.status === 'Open'" size="xs" color="primary" variant="ghost"
                icon="i-lucide-lock" title="Seal" @click="handleSeal(row.original.code)" />
              <UButton v-if="row.original.status === 'Sealed'" size="xs" color="primary" variant="ghost"
                icon="i-lucide-truck" title="Dispatch" @click="handleDispatch(row.original.code)" />
              <UButton v-if="row.original.status === 'Dispatched'" size="xs" color="success" variant="ghost"
                icon="i-lucide-check-circle-2" title="Deliver" @click="handleDeliver(row.original.code)" />
              <UButton v-if="row.original.status === 'Delivered'" size="xs" color="warning" variant="ghost"
                icon="i-lucide-package-open" title="Unbag" @click="handleUnbag(row.original.code)" />

              <UButton size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" title="Delete"
                @click="openDeleteModal(row.original)" />
            </div>
          </template>
        </UTable>
      </div>

      <!-- Pagination Footer -->
      <div v-if="masterBags.length > 0"
        class="flex flex-col sm:flex-row justify-between items-center gap-3 p-4 border-t border-gray-800 text-center sm:text-left">
        <span class="text-xs text-gray-400">
          Showing page {{ (table?.tableApi?.getState().pagination.pageIndex || 0) + 1 }} of {{
            table?.tableApi?.getPageCount() || 1 }} (Total: {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }})
        </span>
        <UPagination :page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
          :items-per-page="table?.tableApi?.getState().pagination.pageSize"
          :total="table?.tableApi?.getFilteredRowModel().rows.length"
          @update:page="(p) => table?.tableApi?.setPageIndex(p - 1)" />
      </div>
    </UCard>

    <!-- Edit Modal -->
    <UModal v-model:open="isModalOpen">
      <template #content>
        <div class="p-6 space-y-6">
          <div class="flex justify-between items-center border-b border-gray-800 pb-4">
            <h3 class="text-lg font-semibold">Edit Master Bag</h3>
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" @click="isModalOpen = false" />
          </div>

          <div v-if="editingBag" class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Status</label>
              <USelect v-model="editingBag.status" :items="statusOptions" class="w-full" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Total Weight (g)</label>
              <UInput v-model.number="editingBag.totalWeight" type="number" class="w-full" />
            </div>
          </div>

          <div class="flex justify-end gap-3 border-t border-gray-800 pt-4">
            <UButton label="Cancel" color="neutral" variant="subtle" @click="isModalOpen = false" />
            <UButton label="Save Changes" color="primary" :loading="saving" @click="handleSaveBag" />
          </div>
        </div>
      </template>
    </UModal>

    <!-- View Details Modal -->
    <UModal v-model:open="isViewModalOpen">
      <template #content>
        <div class="p-6 space-y-6">
          <div class="flex justify-between items-center border-b border-gray-800 pb-4">
            <h3 class="text-lg font-semibold">Master Bag Details</h3>
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" @click="isViewModalOpen = false" />
          </div>

          <div v-if="loadingDetails" class="flex justify-center py-8">
            <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
          </div>

          <div v-else-if="viewingBag" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Master Bag ID</label>
                <p class="text-sm font-mono">#{{ viewingBag.id }}</p>
              </div>
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Status</label>
                <UBadge :color="getMasterBagStatusColor(viewingBag.status)" variant="subtle" size="sm">
                  {{ viewingBag.status }}
                </UBadge>
              </div>
            </div>

            <div>
              <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Bag Code</label>
              <p class="text-sm text-primary font-mono">{{ viewingBag.code }}</p>
            </div>

            <div class="grid grid-cols-3 gap-2">
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Weight</label>
                <p class="text-sm text-white">{{ viewingBag.totalWeight }}g</p>
              </div>
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Volume</label>
                <p class="text-sm text-white">{{ viewingBag.totalCbm }} CBM</p>
              </div>
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Parcels</label>
                <p class="text-sm text-white">{{ viewingBag.totalParcels }}</p>
              </div>
            </div>
          </div>

          <div class="flex justify-end border-t border-gray-800 pt-4">
            <UButton label="Close" color="neutral" variant="subtle" @click="isViewModalOpen = false" />
          </div>
        </div>
      </template>
    </UModal>

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="isDeleteModalOpen">
      <template #content>
        <div class="p-6 space-y-6">
          <div class="flex items-center gap-4">
            <div class="p-3 bg-red-500/10 text-red-500 rounded-full">
              <UIcon name="i-lucide-alert-triangle" class="w-6 h-6" />
            </div>
            <div>
              <h3 class="text-lg font-semibold">Delete Master Bag</h3>
              <p class="text-sm text-gray-400">Are you sure you want to delete master bag <span
                  class="text-white font-medium">{{ deletingBag?.code }}</span>? This action cannot be undone.</p>
            </div>
          </div>

          <div class="flex justify-end gap-3 border-t border-gray-800 pt-4">
            <UButton label="Cancel" color="neutral" variant="subtle" @click="isDeleteModalOpen = false" />
            <UButton label="Delete Bag" color="error" :loading="saving" @click="handleConfirmDelete" />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>