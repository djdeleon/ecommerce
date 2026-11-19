<script setup lang="ts">
import { ref, onMounted, resolveComponent, h, reactive } from 'vue'
import { getPaginationRowModel } from '@tanstack/vue-table'

const { getSectors, createSector, getSectorById, updateSector, deleteSector } = useSectorService()
const { getFacilities } = useFacilityService()
const toast = useToast()

const sectors = ref<any[]>([])
const facilities = ref<any[]>([])
const loading = ref(false)
const searchQuery = ref('')

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
const editingSector = ref<any>(null)
const deletingSector = ref<any>(null)
const saving = ref(false)

const isViewModalOpen = ref(false)
const viewingSector = ref<any>(null)
const loadingDetails = ref(false)

const newSector = reactive({
  code: '',
  localBranchId: undefined as number | undefined,
  zone: {
    type: 'Polygon' as const,
    coordinates: [
      [
        [120.98, 14.75],
        [120.99, 14.75],
        [120.99, 14.76],
        [120.98, 14.76],
        [120.98, 14.75]
      ]
    ]
  },
  barangayIds: [] as string[]
})

const loadData = async () => {
  loading.value = true
  try {
    const [sectorsRes, facilitiesRes]: [any, any] = await Promise.all([
      getSectors(),
      getFacilities()
    ])

    sectors.value = sectorsRes.data || sectorsRes || []
    const facData = facilitiesRes.data || facilitiesRes
    facilities.value = facData.facilities || facData || []
  } catch (err: any) {
    toast.add({ title: 'Loading Failed', description: err?.data?.message, color: 'error' })
  } finally {
    loading.value = false
  }
}

const openViewModal = async (id: number) => {
  isViewModalOpen.value = true
  loadingDetails.value = true
  try {
    const res: any = await getSectorById(id)
    viewingSector.value = res.data || res
  } catch (err: any) {
    toast.add({ title: 'Viewing Failed', description: err?.data?.message, color: 'error' })
    isViewModalOpen.value = false
  } finally {
    loadingDetails.value = false
  }
}

const handleSearchInput = (val: string) => {
  searchQuery.value = val
  pagination.value.pageIndex = 0
  table.value?.tableApi?.getColumn('code')?.setFilterValue(val || undefined)
}

const clearAllFilters = () => {
  searchQuery.value = ''
  pagination.value.pageIndex = 0
  table.value?.tableApi?.getColumn('code')?.setFilterValue(undefined)
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
  { accessorKey: 'code', header: 'Sector Code' },
  {
    accessorKey: 'localBranchId',
    header: 'Facility',
    cell: ({ row }: { row: any }) => {
      const sector = row.original as any
      if (sector.localBranch?.name) {
        return sector.localBranch.name
      }
      const branchId = row.getValue('localBranchId')
      const branch = facilities.value.find((f: any) => f.id === branchId)
      return branch ? branch.name : `Facility #${branchId}`
    }
  },
  {
    accessorKey: 'barangays',
    header: 'Barangays',
    cell: ({ row }: { row: any }) => {
      const barangays = (row.original as any).barangays || []
      return barangays.length ? `${barangays.length} Barangays` : 'No barangays'
    }
  },
  { accessorKey: 'actions', header: 'Actions' }
]

const openCreateModal = () => {
  newSector.code = ''
  newSector.localBranchId = facilities.value[0]?.id || undefined
  newSector.barangayIds = []
  isCreateModalOpen.value = true
}

const openEditModal = (sector: any) => {
  editingSector.value = { ...sector }
  isModalOpen.value = true
}

const openDeleteModal = (sector: any) => {
  deletingSector.value = sector
  isDeleteModalOpen.value = true
}

const handleCreateSector = async () => {
  if (!newSector.localBranchId) return
  saving.value = true
  try {
    const res: any = await createSector({
      ...newSector,
      localBranchId: newSector.localBranchId
    })

    isCreateModalOpen.value = false
    toast.add({ title: 'Created', description: res.message || 'Sector created successfully.', color: 'success' })

    searchQuery.value = ''
    pagination.value.pageIndex = 0

    await loadData()
  } catch (err: any) {
    toast.add({ title: 'Creation Failed', description: err?.data?.message, color: 'error' })
  } finally {
    saving.value = false
  }
}

const handleSaveSector = async () => {
  if (!editingSector.value) return
  saving.value = true
  try {
    const res: any = await updateSector(editingSector.value.id, {
      code: editingSector.value.code,
      localBranchId: editingSector.value.localBranchId,
    })
    isModalOpen.value = false
    toast.add({ title: 'Updated', description: res.message || 'Sector updated successfully.', color: 'success' })
    await loadData()
  } catch (err: any) {
    toast.add({ title: 'Update Failed', description: err?.data?.message, color: 'error' })
  } finally {
    saving.value = false
  }
}

const handleConfirmDelete = async () => {
  if (!deletingSector.value) return
  saving.value = true
  try {
    const res: any = await deleteSector(deletingSector.value.id)
    isDeleteModalOpen.value = false
    toast.add({ title: 'Deleted', description: res.message || 'Sector deleted successfully.', color: 'success' })
    await loadData()
  } catch (err: any) {
    toast.add({ title: 'Deletion Failed', description: err?.data?.message, color: 'error' })
    isDeleteModalOpen.value = false
  } finally {
    saving.value = false
    deletingSector.value = null
  }
}

onMounted(() => {
  loadData()
})

definePageMeta({
  title: 'Sector Management'
})

const headerActions = useState('headerActions')

headerActions.value = h(UButton, {
  icon: 'i-lucide-plus',
  label: 'New Sector',
  color: 'primary',
  size: 'sm',
  class: 'sm:size-md text-xs sm:text-sm sm:px-3.5 sm:py-2',
  onClick: openCreateModal
})
</script>

<template>
  <div class="space-y-6">
    <!-- Search Bar -->
    <div
      class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-gray-800/40 p-4 rounded-xl border border-gray-800">
      <div class="flex flex-col sm:flex-row gap-3 items-stretch flex-1 w-full max-w-md">
        <UInput :model-value="searchQuery" placeholder="Search sector code..." icon="i-lucide-search" class="w-full"
          @update:model-value="handleSearchInput" />

        <UButton v-if="searchQuery" label="Clear Filter" color="neutral" variant="subtle" size="sm" icon="i-lucide-x"
          @click="clearAllFilters" class="self-center" />
      </div>
    </div>

    <!-- Sectors Table -->
    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <div class="overflow-x-auto">
        <UTable ref="table" v-model:pagination="pagination" v-model:sorting="sorting" :data="sectors" :columns="columns"
          :loading="loading" :pagination-options="{
            getPaginationRowModel: getPaginationRowModel()
          }" class="w-full min-w-[700px]">
          <template #actions-cell="{ row }">
            <div class="flex items-center gap-2">
              <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-eye"
                @click="openViewModal((row.original as any).id)" />
              <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-pencil"
                @click="openEditModal(row.original)" />
              <UButton size="xs" color="error" variant="ghost" icon="i-lucide-trash-2"
                @click="openDeleteModal(row.original)" />
            </div>
          </template>
        </UTable>
      </div>

      <!-- Pagination Footer -->
      <div v-if="sectors.length > 0"
        class="flex flex-col sm:flex-row justify-between items-center gap-3 p-4 border-t border-gray-800 text-center sm:text-left">
        <span class="text-xs text-gray-400">
          Showing page {{ (table?.tableApi?.getState().pagination.pageIndex || 0) + 1 }} of {{
            table?.tableApi?.getPageCount()
            || 1 }} (Total: {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }})
        </span>
        <UPagination :page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
          :items-per-page="table?.tableApi?.getState().pagination.pageSize"
          :total="table?.tableApi?.getFilteredRowModel().rows.length"
          @update:page="(p) => table?.tableApi?.setPageIndex(p - 1)" />
      </div>
    </UCard>

    <!-- Create Sector Modal -->
    <UModal v-model:open="isCreateModalOpen">
      <template #content>
        <div class="p-6 space-y-6">
          <div class="flex justify-between items-center border-b border-gray-800 pb-4">
            <h3 class="text-lg font-semibold">Create New Sector</h3>
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" @click="isCreateModalOpen = false" />
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Sector Code *</label>
              <UInput v-model="newSector.code" class="w-full" placeholder="R03-BUL-SJD-01" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Facility *</label>
              <USelect v-model="newSector.localBranchId"
                :items="facilities.map(f => ({ label: `${f.name} (${f.type})`, value: f.id }))" class="w-full"
                placeholder="Select Facility" />
            </div>
          </div>

          <div class="flex justify-end gap-3 border-t border-gray-800 pt-4">
            <UButton label="Cancel" color="neutral" variant="subtle" @click="isCreateModalOpen = false" />
            <UButton label="Create Sector" color="primary" :loading="saving" @click="handleCreateSector" />
          </div>
        </div>
      </template>
    </UModal>

    <!-- Edit Sector Modal -->
    <UModal v-model:open="isModalOpen">
      <template #content>
        <div class="p-6 space-y-6">
          <div class="flex justify-between items-center border-b border-gray-800 pb-4">
            <h3 class="text-lg font-semibold">Edit Sector</h3>
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" @click="isModalOpen = false" />
          </div>

          <div v-if="editingSector" class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Sector Code</label>
              <UInput v-model="editingSector.code" class="w-full" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Facility</label>
              <USelect v-model="editingSector.localBranchId"
                :items="facilities.map(f => ({ label: `${f.name} (${f.type})`, value: f.id }))" class="w-full" />
            </div>
          </div>

          <div class="flex justify-end gap-3 border-t border-gray-800 pt-4">
            <UButton label="Cancel" color="neutral" variant="subtle" @click="isModalOpen = false" />
            <UButton label="Save Changes" color="primary" :loading="saving" @click="handleSaveSector" />
          </div>
        </div>
      </template>
    </UModal>

    <!-- View Sector Details Modal -->
    <UModal v-model:open="isViewModalOpen">
      <template #content>
        <div class="p-6 space-y-6">
          <div class="flex justify-between items-center border-b border-gray-800 pb-4">
            <h3 class="text-lg font-semibold">Sector Details</h3>
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" @click="isViewModalOpen = false" />
          </div>

          <div v-if="loadingDetails" class="flex justify-center py-8">
            <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
          </div>

          <div v-else-if="viewingSector" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Sector ID</label>
                <p class="text-sm font-mono">#{{ viewingSector.id }}</p>
              </div>
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Code</label>
                <p class="text-sm font-mono text-primary">{{ viewingSector.code }}</p>
              </div>
            </div>

            <div>
              <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Local Branch</label>
              <p class="text-sm text-white">{{ viewingSector.localBranch?.name || `Branch
                #${viewingSector.localBranchId}` }}</p>
            </div>

            <div>
              <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Facility</label>
              <p class="text-sm text-white">
                {{ viewingSector.localBranch?.name ? `${viewingSector.localBranch.name}
                (${viewingSector.localBranch.type})` : `Facility #${viewingSector.localBranchId}` }}
              </p>
            </div>

            <div>
              <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Barangays
                Assigned</label>
              <p class="text-sm text-gray-300">
                {{viewingSector.barangays?.length ? viewingSector.barangays.map((b: any) => b.name).join(', ') : 'None'
                }}
              </p>
            </div>

            <div class="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Created At</label>
                <p class="text-[11px] text-gray-400">{{ viewingSector.createdAt ? new
                  Date(viewingSector.createdAt).toLocaleString() : 'N/A' }}</p>
              </div>
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Updated At</label>
                <p class="text-[11px] text-gray-400">{{ viewingSector.updatedAt ? new
                  Date(viewingSector.updatedAt).toLocaleString() : 'N/A' }}</p>
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
              <h3 class="text-lg font-semibold">Delete Sector</h3>
              <p class="text-sm text-gray-400">Are you sure you want to delete sector <span
                  class="text-white font-medium">{{ deletingSector?.code }}</span>? This action cannot be undone.</p>
            </div>
          </div>

          <div class="flex justify-end gap-3 border-t border-gray-800 pt-4">
            <UButton label="Cancel" color="neutral" variant="subtle" @click="isDeleteModalOpen = false" />
            <UButton label="Delete Sector" color="error" :loading="saving" @click="handleConfirmDelete" />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>