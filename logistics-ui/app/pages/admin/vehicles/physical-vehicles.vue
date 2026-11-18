<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue'
import { getPaginationRowModel } from '@tanstack/vue-table'

const { getPhysicalVehicles, createPhysicalVehicle, getPhysicalVehicleById, updatePhysicalVehicle, deletePhysicalVehicle, getStatusesPhysicalVehicles } = usePhysicalVehicleService()
const { getVehicleProfiles } = useVehicleProfileService()
const toast = useToast()

const vehicles = ref<any[]>([])
const profiles = ref<any[]>([])
const statusOptions = ref<string[]>([])
const selectedStatus = ref<string | undefined>(undefined)
const loading = ref(false)
const searchQuery = ref('')

const filteredVehicles = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  const status = selectedStatus.value

  return vehicles.value.filter((v) => {
    const matchesQuery = !query || v.plateNumber?.toLowerCase().includes(query)
    const matchesStatus = !status || v.status === status
    return matchesQuery && matchesStatus
  })
})

// Table state
const table = ref()
const pagination = ref({ pageIndex: 0, pageSize: 10 })
const sorting = ref([{ id: 'id', desc: true }])

// Modal states
const isModalOpen = ref(false)
const isCreateModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const isViewModalOpen = ref(false)
const editingVehicle = ref<any>(null)
const deletingVehicle = ref<any>(null)
const viewingVehicle = ref<any>(null)
const saving = ref(false)
const loadingDetails = ref(false)


const newVehicle = reactive({
  plateNumber: '',
  vin: '',
  vehicleProfileId: null as number | null,
  status: 'Available'
})

const loadStatuses = async () => {
  try {
    const res: any = await getStatusesPhysicalVehicles()
    statusOptions.value = res.data || res || []
  } catch (error) {
    console.error(error)
    statusOptions.value = ['Available', 'Transit', 'Maintenance']
  }
}

const loadVehicles = async () => {
  loading.value = true
  try {
    const res: any = await getPhysicalVehicles()
    vehicles.value = res.data || res || []
  } catch (err: any) {
    toast.add({ title: 'Loading Lists Failed', description: err?.data?.message, color: 'error' })
  } finally {
    loading.value = false
  }
}
const handleSearchInput = (val: string) => {
  searchQuery.value = val
  pagination.value.pageIndex = 0
}

const handleStatusFilterChange = (val: any) => {
  selectedStatus.value = val || undefined
  pagination.value.pageIndex = 0
}

const clearAllFilters = () => {
  searchQuery.value = ''
  selectedStatus.value = undefined
  pagination.value.pageIndex = 0
}

const openCreateModal = async () => {
  newVehicle.plateNumber = ''
  newVehicle.vin = ''
  newVehicle.vehicleProfileId = null
  isCreateModalOpen.value = true

  try {
    const res: any = await getVehicleProfiles()
    const rawProfiles = res.data || res || []
    // Map profiles into standard { label, value } structure for USelect
    profiles.value = rawProfiles.map((p: any) => ({
      label: `${p.brand} ${p.modelName} (${p.type})`,
      value: p.id
    }))
  } catch (err: any) {
    toast.add({ title: 'Loading Option Failed', description: err?.data?.message, color: 'error' })
  }
}

const openViewModal = async (id: number) => {
  isViewModalOpen.value = true
  loadingDetails.value = true
  try {
    const res: any = await getPhysicalVehicleById(id)
    viewingVehicle.value = res.data || res
  } catch (err: any) {
    toast.add({ title: 'Viewing Failed', description: err?.data?.message, color: 'error' })
    isViewModalOpen.value = false
  } finally {
    loadingDetails.value = false
  }
}

const handleCreateVehicle = async () => {
  saving.value = true
  try {
    const res: any = await createPhysicalVehicle(newVehicle as any)
    isCreateModalOpen.value = false
    toast.add({ title: 'Success', description: res.message || 'Vehicle added to fleet.', color: 'success' })
    await loadVehicles()
  } catch (err: any) {
    toast.add({ title: 'Creation Failed', description: err?.data?.message, color: 'error' })
  } finally {
    saving.value = false
  }
}

const handleSaveVehicle = async () => {
  if (!editingVehicle.value) return
  saving.value = true
  try {
    const res: any = await updatePhysicalVehicle(editingVehicle.value.id, {
      plateNumber: editingVehicle.value.plateNumber,
      vin: editingVehicle.value.vin,
      vehicleProfileId: editingVehicle.value.vehicleProfileId,
      status: editingVehicle.value.status
    })
    isModalOpen.value = false
    toast.add({ title: 'Updated', description: res.message, color: 'success' })
    await loadVehicles()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.message, color: 'error' })
  } finally {
    saving.value = false
  }
}

const handleConfirmDelete = async () => {
  if (!deletingVehicle.value) return
  saving.value = true
  try {
    const res: any = await deletePhysicalVehicle(deletingVehicle.value.id)
    isDeleteModalOpen.value = false
    toast.add({ title: 'Deleted', description: res.message, color: 'success' })
    await loadVehicles()
  } catch (err: any) {
    toast.add({ title: 'Deletion Failed', description: err?.data?.message, color: 'error' })
  }  finally {
    saving.value = false
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
  { accessorKey: 'plateNumber', header: 'Plate Number' },
  {
    id: 'brandModel',
    header: 'Brand/Model',
    cell: ({ row }: any) => {
      const profile = row.original.vehicleProfile
      return profile ? `${profile.brand} ${profile.modelName}` : 'N/A'
    }
  },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'actions', header: 'Actions' }
]

onMounted(() => {
  loadVehicles()
  loadStatuses()
})

definePageMeta({ title: 'Physical Vehicles' })

const headerActions = useState('headerActions')
headerActions.value = h(resolveComponent('UButton'), {
  icon: 'i-lucide-plus',
  label: 'Add Vehicle',
  color: 'primary',
  onClick: openCreateModal
})
</script>

<template>
  <div class="space-y-6">
    <!-- Filters -->
    <div
      class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-gray-800/40 p-4 rounded-xl border border-gray-800">
      <div class="flex flex-col sm:flex-row gap-3 items-stretch flex-1 w-full max-w-xl">
        <UInput :model-value="searchQuery" placeholder="Search plate number..." icon="i-lucide-search" class="w-full"
          @update:model-value="handleSearchInput" />

        <div class="flex gap-2 items-center w-full sm:w-auto">
          <USelect :model-value="selectedStatus" :items="statusOptions" placeholder="Filter by Status"
            icon="i-lucide-filter" clearable class="w-full sm:w-48" @update:model-value="handleStatusFilterChange" />

          <UButton v-if="searchQuery || selectedStatus" label="Clear Filter" color="neutral" variant="subtle" size="sm"
            icon="i-lucide-x" @click="clearAllFilters" />
        </div>
      </div>
    </div>


    <!-- Physical Vehicles Table -->
    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <div class="overflow-x-auto">
        <UTable ref="table" v-model:pagination="pagination" v-model:sorting="sorting" :data="filteredVehicles"
          :columns="columns" :loading="loading" :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
          class="w-full min-w-[700px]">

          <template #status-cell="{ row }">
            <UBadge :color="row.original.status === 'Available' ? 'success' : 'warning'" variant="subtle">
              {{ row.original.status || 'Available' }}
            </UBadge>
          </template>

          <template #actions-cell="{ row }">
            <div class="flex gap-2">
              <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-eye"
                @click="openViewModal(row.original.id)" />
              <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-pencil"
                @click="editingVehicle = { ...row.original }; isModalOpen = true" />
              <UButton size="xs" color="error" variant="ghost" icon="i-lucide-trash-2"
                @click="deletingVehicle = row.original; isDeleteModalOpen = true" />
            </div>
          </template>
        </UTable>
      </div>

      <!-- Pagination Footer -->
      <div v-if="filteredVehicles.length > 0"
        class="flex flex-col sm:flex-row justify-between items-center gap-3 p-4 border-t border-gray-800 text-center sm:text-left">
        <span class="text-xs text-gray-400">
          Showing page {{ (table?.tableApi?.getState().pagination.pageIndex || 0) + 1 }} of {{
            table?.tableApi?.getPageCount() || 1 }} (Total: {{ filteredVehicles.length }})
        </span>
        <UPagination :page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
          :items-per-page="table?.tableApi?.getState().pagination.pageSize" :total="filteredVehicles.length"
          @update:page="(p) => table?.tableApi?.setPageIndex(p - 1)" />
      </div>
    </UCard>

    <!-- Create Modal -->
    <UModal v-model:open="isCreateModalOpen">
      <template #content>
        <div class="p-6 space-y-6">
          <div class="flex justify-between items-center border-b border-gray-800 pb-4">
            <h3 class="text-lg font-semibold">Add Physical Vehicle</h3>
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" @click="isCreateModalOpen = false" />
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Plate Number *</label>
              <UInput v-model="newVehicle.plateNumber" placeholder="ABC-1234" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">VIN / Chassis</label>
              <UInput v-model="newVehicle.vin" placeholder="Optional" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Vehicle Profile *</label>
              <USelect v-model.number="newVehicle.vehicleProfileId" :items="profiles" placeholder="Select Profile"
                class="w-full" />
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <UButton label="Cancel" variant="subtle" color="neutral" @click="isCreateModalOpen = false" />
            <UButton label="Add to Fleet" color="primary" :loading="saving" @click="handleCreateVehicle" />
          </div>
        </div>
      </template>
    </UModal>

    <!-- Edit Modal -->
    <UModal v-model:open="isModalOpen">
      <template #content>
        <div class="p-6 space-y-6">
          <div class="flex justify-between items-center border-b border-gray-800 pb-4">
            <h3 class="text-lg font-semibold">Edit Vehicle</h3>
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" @click="isModalOpen = false" />
          </div>

          <div v-if="editingVehicle" class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Plate Number</label>
              <UInput v-model="editingVehicle.plateNumber" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Status</label>
              <USelect v-model="editingVehicle.status" :items="statusOptions" class="w-full" />
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <UButton label="Cancel" variant="subtle" color="neutral" @click="isModalOpen = false" />
            <UButton label="Save Changes" color="primary" :loading="saving" @click="handleSaveVehicle" />
          </div>
        </div>
      </template>
    </UModal>

    <!-- View Modal -->
    <UModal v-model:open="isViewModalOpen">
      <template #content>
        <div class="p-6 space-y-6">
          <div class="flex justify-between items-center border-b border-gray-800 pb-4">
            <h3 class="text-lg font-semibold">Vehicle Details</h3>
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" @click="isViewModalOpen = false" />
          </div>

          <div v-if="loadingDetails" class="flex justify-center py-8">
            <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
          </div>

          <div v-else-if="viewingVehicle" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Plate Number</label>
                <p class="text-sm font-mono">{{ viewingVehicle.plateNumber }}</p>
              </div>
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Status</label>
                <UBadge :color="viewingVehicle.status === 'Available' ? 'success' : 'warning'" variant="subtle"
                  size="sm">
                  {{ viewingVehicle.status || 'Available' }}
                </UBadge>
              </div>
            </div>
            <div>
              <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Profile</label>
              <p class="text-sm text-white">{{ viewingVehicle.vehicleProfile?.brand }} {{
                viewingVehicle.vehicleProfile?.modelName }}</p>
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
              <h3 class="text-lg font-semibold">Delete Vehicle</h3>
              <p class="text-sm text-gray-400">Remove <span class="text-white font-medium">{{
                deletingVehicle?.plateNumber }}</span> from fleet?</p>
            </div>
          </div>
          <div class="flex justify-end gap-3 border-t border-gray-800 pt-4">
            <UButton label="Cancel" color="neutral" variant="subtle" @click="isDeleteModalOpen = false" />
            <UButton label="Delete" color="error" :loading="saving" @click="handleConfirmDelete" />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>