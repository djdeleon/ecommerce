<script setup lang="ts">
import { ref, onMounted, resolveComponent, h, reactive } from 'vue'
import { getPaginationRowModel } from '@tanstack/vue-table'

const { getFacilities, createFacility, getFacilityById, updateFacility, deleteFacility } = useFacilityService()
const toast = useToast()

const facilities = ref<any[]>([])
const loading = ref(false)
const searchQuery = ref('')
const selectedType = ref<string | undefined>(undefined)
const facilityTypeOptions = ref<string[]>([])

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
const editingFacility = ref<any>(null)
const deletingFacility = ref<any>(null)
const saving = ref(false)

const isViewModalOpen = ref(false)
const viewingFacility = ref<any>(null)
const loadingDetails = ref(false)

const newFacility = reactive({
  name: '',
  type: 'MegaGateway',
  address: '',
  longitude: 120.9842,
  latitude: 14.5995,
  parentId: null as number | null
})

const loadFacilities = async () => {
  loading.value = true
  try {
    const res: any = await getFacilities()
    const dataObj = res.data || res

    facilities.value = dataObj.facilities || []
    if (dataObj.facilityTypes && Array.isArray(dataObj.facilityTypes)) {
      facilityTypeOptions.value = dataObj.facilityTypes
    }
  } catch (err: any) {
    toast.add({ title: 'Loading Facilities Failed', description: err?.data?.message, color: 'error' })
  } finally {
    loading.value = false
  }
}

const openViewModal = async (id: number) => {
  isViewModalOpen.value = true
  loadingDetails.value = true
  try {
    const res: any = await getFacilityById(id)
    viewingFacility.value = res.data || res
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
  table.value?.tableApi?.getColumn('name')?.setFilterValue(val || undefined)
}

const handleTypeFilterChange = (val: any) => {
  selectedType.value = val || undefined
  pagination.value.pageIndex = 0
  table.value?.tableApi?.getColumn('type')?.setFilterValue(val || undefined)
}

const clearAllFilters = () => {
  searchQuery.value = ''
  selectedType.value = undefined
  pagination.value.pageIndex = 0
  table.value?.tableApi?.getColumn('name')?.setFilterValue(undefined)
  table.value?.tableApi?.getColumn('type')?.setFilterValue(undefined)
}

const getFacilityTypeColor = (type: string) => {
  switch (type) {
    case 'MegaGateway':
      return 'success'
    case 'DistributionCenter':
      return 'info'
    case 'LocalBranch':
      return 'warning'
    default:
      return 'neutral'
  }
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
  { accessorKey: 'name', header: 'Facility Name' },
  { accessorKey: 'code', header: 'Code' },
  { accessorKey: 'type', header: 'Type' },
  {
    accessorKey: 'address',
    header: 'Address',
    cell: ({ row }: { row: any }) => {
      const address = row.getValue('address')
      return h(
        'div',
        {
          class: 'max-w-xs line-clamp-2 whitespace-normal text-gray-300',
          title: address
        },
        address
      )
    }
  },
  { accessorKey: 'actions', header: 'Actions' }
]

const openCreateModal = () => {
  newFacility.name = ''
  newFacility.type = facilityTypeOptions.value[0] || 'MegaGateway'
  newFacility.address = ''
  newFacility.longitude = 120.9842
  newFacility.latitude = 14.5995
  newFacility.parentId = null
  isCreateModalOpen.value = true
}

const openEditModal = (facility: any) => {
  editingFacility.value = { ...facility }
  isModalOpen.value = true
}

const openDeleteModal = (facility: any) => {
  deletingFacility.value = facility
  isDeleteModalOpen.value = true
}

const handleCreateFacility = async () => {
  saving.value = true
  try {
    const res: any = await createFacility(newFacility)

    isCreateModalOpen.value = false
    toast.add({ title: 'Created', description: res.message || 'Facility created successfully.', color: 'success' })

    searchQuery.value = ''
    selectedType.value = undefined
    pagination.value.pageIndex = 0

    await loadFacilities()
  } catch (err: any) {
    toast.add({ title: 'Creation Failed', description: err?.data?.message, color: 'error' })
  } finally {
    saving.value = false
  }
}

const handleSaveFacility = async () => {
  if (!editingFacility.value) return
  saving.value = true
  try {
    const res: any = await updateFacility(editingFacility.value.id, {
      name: editingFacility.value.name,
      type: editingFacility.value.type,
      address: editingFacility.value.address,
      longitude: editingFacility.value.longitude,
      latitude: editingFacility.value.latitude,
      parentId: editingFacility.value.parentId || null,
    })
    isModalOpen.value = false
    toast.add({ title: 'Updated', description: res.message || 'Facility updated successfully.', color: 'success' })
    await loadFacilities()
  } catch (err: any) {
    toast.add({ title: 'Update Failed', description: err?.data?.message, color: 'error' })
  } finally {
    saving.value = false
  }
}

const handleConfirmDelete = async () => {
  if (!deletingFacility.value) return
  saving.value = true
  try {
    const res: any = await deleteFacility(deletingFacility.value.id)
    isDeleteModalOpen.value = false
    toast.add({ title: 'Deleted', description: res.message || 'Facility deleted successfully.', color: 'success' })
    await loadFacilities()
  } catch (err: any) {
    toast.add({ title: 'Deletion Failed', description: err?.data?.message, color: 'error' })
    isDeleteModalOpen.value = false
  } finally {
    saving.value = false
    deletingFacility.value = null
  }
}

onMounted(() => {
  loadFacilities()
})

definePageMeta({
  title: 'Facility Management'
})

const headerActions = useState('headerActions')

headerActions.value = h(UButton, {
  icon: 'i-lucide-plus',
  label: 'New Facility',
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
        <UInput :model-value="searchQuery" placeholder="Search facility name..." icon="i-lucide-search" class="w-full"
          @update:model-value="handleSearchInput" />

        <div class="flex gap-2 items-center w-full sm:w-auto">
          <USelect :model-value="selectedType" :items="facilityTypeOptions" placeholder="Filter by Type"
            icon="i-lucide-filter" clearable class="w-full sm:w-48" @update:model-value="handleTypeFilterChange" />

          <UButton v-if="searchQuery || selectedType" label="Clear Filter" color="neutral" variant="subtle" size="sm"
            icon="i-lucide-x" @click="clearAllFilters" />
        </div>
      </div>
    </div>

    <!-- Facilities Table -->
    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <div class="overflow-x-auto">
        <UTable ref="table" v-model:pagination="pagination" v-model:sorting="sorting" :data="facilities"
          :columns="columns" :loading="loading" :pagination-options="{
            getPaginationRowModel: getPaginationRowModel()
          }" class="w-full min-w-[700px]">
          <template #type-cell="{ row }">
            <UBadge :color="getFacilityTypeColor((row.original as any).type)" variant="subtle">
              {{ (row.original as any).type }}
            </UBadge>
          </template>

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
      <div v-if="facilities.length > 0"
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

    <!-- Create Facility Modal -->
    <UModal v-model:open="isCreateModalOpen">
      <template #content>
        <div class="p-6 space-y-6">
          <div class="flex justify-between items-center border-b border-gray-800 pb-4">
            <h3 class="text-lg font-semibold">Register New Facility</h3>
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" @click="isCreateModalOpen = false" />
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Facility Name *</label>
              <UInput v-model="newFacility.name" class="w-full" placeholder="Bulacan Mega Gateway" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Facility Type *</label>
              <USelect v-model="newFacility.type" :items="facilityTypeOptions" class="w-full" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Address *</label>
              <UInput v-model="newFacility.address" class="w-full" placeholder="Street address..." />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1">Longitude *</label>
                <UInput v-model.number="newFacility.longitude" type="number" step="any" class="w-full" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1">Latitude *</label>
                <UInput v-model.number="newFacility.latitude" type="number" step="any" class="w-full" />
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-3 border-t border-gray-800 pt-4">
            <UButton label="Cancel" color="neutral" variant="subtle" @click="isCreateModalOpen = false" />
            <UButton label="Register Facility" color="primary" :loading="saving" @click="handleCreateFacility" />
          </div>
        </div>
      </template>
    </UModal>

    <!-- Edit Facility Modal -->
    <UModal v-model:open="isModalOpen">
      <template #content>
        <div class="p-6 space-y-6">
          <div class="flex justify-between items-center border-b border-gray-800 pb-4">
            <h3 class="text-lg font-semibold">Edit Facility</h3>
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" @click="isModalOpen = false" />
          </div>

          <div v-if="editingFacility" class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Facility Name</label>
              <UInput v-model="editingFacility.name" class="w-full" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Facility Type</label>
              <USelect v-model="editingFacility.type" :items="facilityTypeOptions" class="w-full" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Address</label>
              <UInput v-model="editingFacility.address" class="w-full" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1">Longitude</label>
                <UInput v-model.number="editingFacility.longitude" type="number" step="any" class="w-full" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1">Latitude</label>
                <UInput v-model.number="editingFacility.latitude" type="number" step="any" class="w-full" />
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-3 border-t border-gray-800 pt-4">
            <UButton label="Cancel" color="neutral" variant="subtle" @click="isModalOpen = false" />
            <UButton label="Save Changes" color="primary" :loading="saving" @click="handleSaveFacility" />
          </div>
        </div>
      </template>
    </UModal>

    <!-- View Facility Details Modal -->
    <UModal v-model:open="isViewModalOpen">
      <template #content>
        <div class="p-6 space-y-6">
          <div class="flex justify-between items-center border-b border-gray-800 pb-4">
            <h3 class="text-lg font-semibold">Facility Details</h3>
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" @click="isViewModalOpen = false" />
          </div>

          <div v-if="loadingDetails" class="flex justify-center py-8">
            <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
          </div>

          <div v-else-if="viewingFacility" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Facility ID</label>
                <p class="text-sm font-mono">#{{ viewingFacility.id }}</p>
              </div>
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Type</label>
                <UBadge :color="getFacilityTypeColor(viewingFacility.type)" variant="subtle" size="sm">
                  {{ viewingFacility.type }}
                </UBadge>
              </div>
            </div>

            <div>
              <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Name</label>
              <p class="text-sm text-white">{{ viewingFacility.name }}</p>
            </div>

            <div>
              <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Code</label>
              <p class="text-sm font-mono text-primary">{{ viewingFacility.code }}</p>
            </div>

            <div>
              <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Address</label>
              <p class="text-sm text-gray-300">{{ viewingFacility.address }}</p>
            </div>

            <div class="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Created At</label>
                <p class="text-[11px] text-gray-400">{{ viewingFacility.createdAt ? new
                  Date(viewingFacility.createdAt).toLocaleString() : 'N/A' }}</p>
              </div>
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Updated At</label>
                <p class="text-[11px] text-gray-400">{{ viewingFacility.updatedAt ? new
                  Date(viewingFacility.updatedAt).toLocaleString() : 'N/A' }}</p>
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
              <h3 class="text-lg font-semibold">Delete Facility</h3>
              <p class="text-sm text-gray-400">Are you sure you want to delete <span class="text-white font-medium">{{
                deletingFacility?.name }}</span>? This action cannot be undone.</p>
            </div>
          </div>

          <div class="flex justify-end gap-3 border-t border-gray-800 pt-4">
            <UButton label="Cancel" color="neutral" variant="subtle" @click="isDeleteModalOpen = false" />
            <UButton label="Delete Facility" color="error" :loading="saving" @click="handleConfirmDelete" />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>