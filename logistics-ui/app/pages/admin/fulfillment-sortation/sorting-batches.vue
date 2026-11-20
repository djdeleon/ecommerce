<script setup lang="ts">
import { ref, reactive, computed, onMounted, resolveComponent, h } from 'vue'
import { getPaginationRowModel } from '@tanstack/vue-table'

const { getSortingBatches, getSortingBatchById, createSortingBatch, updateSortingBatch, deleteSortingBatch } = useSortingBatchService()
const { getFacilities } = useFacilityService()
const toast = useToast()

const batches = ref<any[]>([])
const facilities = ref<any[]>([])
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
const isCreateModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const editingBatch = ref<any>(null)
const deletingBatch = ref<any>(null)
const saving = ref(false)

const isViewModalOpen = ref(false)
const viewingBatch = ref<any>(null)
const loadingDetails = ref(false)

const openViewModal = async (id: number) => {
  isViewModalOpen.value = true
  loadingDetails.value = true
  try {
    const res: any = await getSortingBatchById(id)
    viewingBatch.value = res.data || res
  } catch (err: any) {
    toast.add({ title: 'Viewing Failed', description: err?.data?.message, color: 'error' })
    isViewModalOpen.value = false
  } finally {
    loadingDetails.value = false
  }
}

const newBatch = reactive({
  facilityId: undefined as number | undefined,
  cutOffTime: '1970-01-01T23:00:00Z',
  status: 'Scheduled' as const
})

const getSortingBatchStatusColor = (status: string) => {
  switch (status) {
    case 'Scheduled':
      return 'neutral'
    case 'Active':
      return 'info'
    case 'Completed':
      return 'primary'
    case 'Cancelled':
      return 'error'
    default:
      return 'neutral'
  }
}

const loadBatches = async () => {
  loading.value = true
  try {
    const res: any = await getSortingBatches()
    const dataObj = res.data || res

    batches.value = dataObj.sortingBatches || dataObj || []
    if (dataObj.sortingBatchTypes && Array.isArray(dataObj.sortingBatchTypes)) {
      statusOptions.value = dataObj.sortingBatchTypes
    }
  } catch (err: any) {
    toast.add({ title: 'Loading Lists Failed', description: err?.data?.message, color: 'error' })
  } finally {
    loading.value = false
  }
}

const facilityOptions = computed(() => {
  if (!Array.isArray(facilities.value)) return []
  return facilities.value.map(f => ({
    label: `${f.name} (${f.code})`,
    value: f.id
  }))
})

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
  { accessorKey: 'code', header: 'Batch Code' },
  { 
    accessorKey: 'facility', 
    header: 'Facility',
    cell: ({ row }: { row: any }) => row.original.facility?.name || `Facility #${row.original.facilityId}`
  },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'cutOffTime', header: 'Cut-off Time' },
  { accessorKey: 'actions', header: 'Actions' }
]

const openCreateModal = async () => {
  try {
    const facilitiesRes: any = await getFacilities()
    const facData = facilitiesRes.data || facilitiesRes
    facilities.value = Array.isArray(facData) ? facData : (facData.facilities || [])

    newBatch.facilityId = facilities.value[0]?.id || undefined
    newBatch.cutOffTime = '1970-01-01T23:00:00Z'
    newBatch.status = 'Scheduled'
    isCreateModalOpen.value = true
  } catch (err: any) {
    toast.add({ title: 'Failed to Load Facilities', description: err?.data?.message, color: 'error' })
  }
}

const openEditModal = (batch: any) => {
  editingBatch.value = { ...batch }
  isModalOpen.value = true
}

const openDeleteModal = (batch: any) => {
  deletingBatch.value = batch
  isDeleteModalOpen.value = true
}

const handleCreateBatch = async () => {
  saving.value = true
  try {
    const res: any = await createSortingBatch(newBatch)
    isCreateModalOpen.value = false
    toast.add({ title: 'Created', description: res.message, color: 'success' })
    await loadBatches()
  } catch (err: any) {
    toast.add({ title: 'Creation Failed', description: err?.data?.message, color: 'error' })
  } finally {
    saving.value = false
  }
}

const handleSaveBatch = async () => {
  if (!editingBatch.value) return
  saving.value = true
  try {
    const res: any = await updateSortingBatch(editingBatch.value.id, {
      status: editingBatch.value.status,
      cutOffTime: editingBatch.value.cutOffTime,
    })
    isModalOpen.value = false
    toast.add({ title: 'Updated', description: res.message, color: 'success' })
    await loadBatches()
  } catch (err: any) {
    toast.add({ title: 'Update Failed', description: err?.data?.message, color: 'error' })
  } finally {
    saving.value = false
  }
}

const handleConfirmDelete = async () => {
  if (!deletingBatch.value) return
  saving.value = true
  try {
    const res: any = await deleteSortingBatch(deletingBatch.value.id)
    isDeleteModalOpen.value = false
    toast.add({ title: 'Deleted', description: res.message, color: 'success' })
    await loadBatches()
  } catch (err: any) {
    toast.add({ title: 'Deletion Failed', description: err?.data?.message, color: 'error' })
  } finally {
    saving.value = false
    deletingBatch.value = null
  }
}

onMounted(() => {
  loadBatches()
})

definePageMeta({
  title: 'Sorting Batches Management'
})

const headerActions = useState('headerActions')

headerActions.value = h(UButton, {
  icon: 'i-lucide-plus',
  label: 'New Sorting Batch',
  color: 'primary',
  size: 'sm',
  class: 'sm:size-md text-xs sm:text-sm sm:px-3.5 sm:py-2',
  onClick: openCreateModal
})
</script>

<template>
  <div class="space-y-6">
    <!-- Filters & Search Bar -->
    <div
      class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-gray-800/40 p-4 rounded-xl border border-gray-800">
      <div class="flex flex-col sm:flex-row gap-3 items-stretch flex-1 w-full max-w-xl">
        <UInput :model-value="searchQuery" placeholder="Search batch code..." icon="i-lucide-search" class="w-full"
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
        <UTable ref="table" v-model:pagination="pagination" v-model:sorting="sorting" :data="batches" :columns="columns"
          :loading="loading" :pagination-options="{
            getPaginationRowModel: getPaginationRowModel()
          }" class="w-full min-w-[700px]">
          <template #status-cell="{ row }">
            <UBadge :color="getSortingBatchStatusColor((row.original as any).status)" variant="subtle">
              {{ (row.original as any).status }}
            </UBadge>
          </template>

          <template #actions-cell="{ row }">
            <div class="flex items-center gap-2">
              <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-eye"
                @click="openViewModal(row.original.id)" />
              <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-pencil"
                @click="openEditModal(row.original)" />
              <UButton size="xs" color="error" variant="ghost" icon="i-lucide-trash-2"
                @click="openDeleteModal(row.original)" />
            </div>
          </template>
        </UTable>
      </div>

      <!-- Pagination Footer -->
      <div v-if="batches.length > 0"
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

    <!-- Create Modal -->
    <UModal v-model:open="isCreateModalOpen">
      <template #content>
        <div class="p-6 space-y-6">
          <div class="flex justify-between items-center border-b border-gray-800 pb-4">
            <h3 class="text-lg font-semibold">Create Sorting Batch</h3>
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" @click="isCreateModalOpen = false" />
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Target Facility *</label>
              <USelect v-model="newBatch.facilityId" :items="facilityOptions" value-attribute="value" class="w-full"
                placeholder="Select Facility" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Cut-Off Time *</label>
              <UInput v-model="newBatch.cutOffTime" class="w-full" placeholder="1970-01-01T23:00:00Z" />
            </div>
          </div>

          <div class="flex justify-end gap-3 border-t border-gray-800 pt-4">
            <UButton label="Cancel" color="neutral" variant="subtle" @click="isCreateModalOpen = false" />
            <UButton label="Create Batch" color="primary" :loading="saving" @click="handleCreateBatch" />
          </div>
        </div>
      </template>
    </UModal>

    <!-- Edit Modal -->
    <UModal v-model:open="isModalOpen">
      <template #content>
        <div class="p-6 space-y-6">
          <div class="flex justify-between items-center border-b border-gray-800 pb-4">
            <h3 class="text-lg font-semibold">Edit Sorting Batch</h3>
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" @click="isModalOpen = false" />
          </div>

          <div v-if="editingBatch" class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Status</label>
              <USelect v-model="editingBatch.status" :items="statusOptions" class="w-full" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Cut-Off Time</label>
              <UInput v-model="editingBatch.cutOffTime" class="w-full" />
            </div>
          </div>

          <div class="flex justify-end gap-3 border-t border-gray-800 pt-4">
            <UButton label="Cancel" color="neutral" variant="subtle" @click="isModalOpen = false" />
            <UButton label="Save Changes" color="primary" :loading="saving" @click="handleSaveBatch" />
          </div>
        </div>
      </template>
    </UModal>

    <!-- View Details Modal -->
    <UModal v-model:open="isViewModalOpen">
      <template #content>
        <div class="p-6 space-y-6">
          <div class="flex justify-between items-center border-b border-gray-800 pb-4">
            <h3 class="text-lg font-semibold">Sorting Batch Details</h3>
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" @click="isViewModalOpen = false" />
          </div>

          <div v-if="loadingDetails" class="flex justify-center py-8">
            <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
          </div>

          <div v-else-if="viewingBatch" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Batch ID</label>
                <p class="text-sm font-mono">#{{ viewingBatch.id }}</p>
              </div>
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Status</label>
                <UBadge :color="getSortingBatchStatusColor(viewingBatch.status)" variant="subtle" size="sm">
                  {{ viewingBatch.status }}
                </UBadge>
              </div>
            </div>

            <div>
              <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Batch Code</label>
              <p class="text-sm text-primary font-mono">{{ viewingBatch.code }}</p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Master Bags
                  Count</label>
                <p class="text-sm text-white">{{ viewingBatch.masterBags?.length || 0 }}</p>
              </div>
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Loose Parcels
                  Count</label>
                <p class="text-sm text-white">{{ viewingBatch.looseParcels?.length || 0 }}</p>
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
              <h3 class="text-lg font-semibold">Delete Sorting Batch</h3>
              <p class="text-sm text-gray-400">Are you sure you want to delete batch <span
                  class="text-white font-medium">{{ deletingBatch?.code }}</span>? This action cannot be undone.</p>
            </div>
          </div>

          <div class="flex justify-end gap-3 border-t border-gray-800 pt-4">
            <UButton label="Cancel" color="neutral" variant="subtle" @click="isDeleteModalOpen = false" />
            <UButton label="Delete Batch" color="error" :loading="saving" @click="handleConfirmDelete" />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>