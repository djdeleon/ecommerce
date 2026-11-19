<script setup lang="ts">
import { ref, onMounted, resolveComponent, h, reactive } from 'vue'
import { getPaginationRowModel } from '@tanstack/vue-table'

const { getNetworkLegs, createNetworkLeg, getNetworkLegById, updateNetworkLeg, deleteNetworkLeg } = useNetworkLegService()
const { getFacilities } = useFacilityService()
const toast = useToast()

const networkLegs = ref<any[]>([])
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
const editingLeg = ref<any>(null)
const deletingLeg = ref<any>(null)
const saving = ref(false)

const isViewModalOpen = ref(false)
const viewingLeg = ref<any>(null)
const loadingDetails = ref(false)

const transitModeOptions = ['LandShuttle', 'HighwayLinehaul', 'MaritimeRoro', 'AirFreight']

const newLeg = reactive({
  sourceFacilityId: undefined as number | undefined,
  destinationFacilityId: undefined as number | undefined,
  laneCode: '',
  route: {
    type: 'LineString' as const,
    coordinates: [
      [120.98, 14.75],
      [121.05, 14.80]
    ]
  },
  distanceMtr: 45,
  vehicleProfile: 'Aluminum Van',
  baseTransitDuration: 7200,
  mode: 'HighwayLinehaul',
  cutOffTime: '18:00:00'
})

const loadData = async () => {
  loading.value = true
  try {
    const [legsRes, facilitiesRes]: [any, any] = await Promise.all([
      getNetworkLegs(),
      getFacilities()
    ])

    networkLegs.value = legsRes.data || legsRes || []
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
    const res: any = await getNetworkLegById(id)
    viewingLeg.value = res.data || res
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
  table.value?.tableApi?.getColumn('laneCode')?.setFilterValue(val || undefined)
}

const clearAllFilters = () => {
  searchQuery.value = ''
  pagination.value.pageIndex = 0
  table.value?.tableApi?.getColumn('laneCode')?.setFilterValue(undefined)
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
  { accessorKey: 'laneCode', header: 'Lane Code' },
  {
    accessorKey: 'sourceFacilityId',
    header: 'Source Facility',
    cell: ({ row }: { row: any }) => {
      const leg = row.original as any
      if (leg.sourceFacility?.name) {
        return `${leg.sourceFacility.name} (${leg.sourceFacility.type})`
      }
      const facility = facilities.value.find((f: any) => f.id === leg.sourceFacilityId)
      return facility ? `${facility.name} (${facility.type})` : `Facility #${leg.sourceFacilityId}`
    }
  },
  {
    accessorKey: 'destinationFacilityId',
    header: 'Destination Facility',
    cell: ({ row }: { row: any }) => {
      const leg = row.original as any
      if (leg.destinationFacility?.name) {
        return `${leg.destinationFacility.name} (${leg.destinationFacility.type})`
      }
      const facility = facilities.value.find((f: any) => f.id === leg.destinationFacilityId)
      return facility ? `${facility.name} (${facility.type})` : `Facility #${leg.destinationFacilityId}`
    }
  },
  { accessorKey: 'mode', header: 'Transit Mode' },
  { accessorKey: 'actions', header: 'Actions' }
]

const openCreateModal = () => {
  newLeg.laneCode = ''
  newLeg.sourceFacilityId = facilities.value[0]?.id || undefined
  newLeg.destinationFacilityId = facilities.value[1]?.id || facilities.value[0]?.id || undefined
  newLeg.distanceMtr = 45
  newLeg.vehicleProfile = 'Aluminum Van'
  newLeg.baseTransitDuration = 7200
  newLeg.mode = 'HighwayLinehaul'
  newLeg.cutOffTime = '18:00:00'
  isCreateModalOpen.value = true
}

const openEditModal = (leg: any) => {
  editingLeg.value = { ...leg }
  isModalOpen.value = true
}

const openDeleteModal = (leg: any) => {
  deletingLeg.value = leg
  isDeleteModalOpen.value = true
}

const handleCreateLeg = async () => {
  if (!newLeg.sourceFacilityId || !newLeg.destinationFacilityId) return
  saving.value = true
  try {
    const res: any = await createNetworkLeg({
      ...newLeg,
      sourceFacilityId: newLeg.sourceFacilityId,
      destinationFacilityId: newLeg.destinationFacilityId
    })

    isCreateModalOpen.value = false
    toast.add({ title: 'Created', description: res.message || 'Network leg created successfully.', color: 'success' })

    searchQuery.value = ''
    pagination.value.pageIndex = 0

    await loadData()
  } catch (err: any) {
    toast.add({ title: 'Creation Failed', description: err?.data?.message, color: 'error' })
  } finally {
    saving.value = false
  }
}

const handleSaveLeg = async () => {
  if (!editingLeg.value) return
  saving.value = true
  try {
    const res: any = await updateNetworkLeg(editingLeg.value.id, {
      laneCode: editingLeg.value.laneCode,
      sourceFacilityId: editingLeg.value.sourceFacilityId,
      destinationFacilityId: editingLeg.value.destinationFacilityId,
      distanceMtr: editingLeg.value.distanceMtr,
      mode: editingLeg.value.mode,
      vehicleProfile: editingLeg.value.vehicleProfile,
      baseTransitDuration: editingLeg.value.baseTransitDuration,
      cutOffTime: editingLeg.value.cutOffTime
    })
    isModalOpen.value = false
    toast.add({ title: 'Updated', description: res.message || 'Network leg updated successfully.', color: 'success' })
    await loadData()
  } catch (err: any) {
    toast.add({ title: 'Update Failed', description: err?.data?.message, color: 'error' })
  } finally {
    saving.value = false
  }
}

const handleConfirmDelete = async () => {
  if (!deletingLeg.value) return
  saving.value = true
  try {
    const res: any = await deleteNetworkLeg(deletingLeg.value.id)
    isDeleteModalOpen.value = false
    toast.add({ title: 'Deleted', description: res.message || 'Network leg deleted successfully.', color: 'success' })
    await loadData()
  } catch (err: any) {
    toast.add({ title: 'Deletion Failed', description: err?.data?.message, color: 'error' })
    isDeleteModalOpen.value = false
  } finally {
    saving.value = false
    deletingLeg.value = null
  }
}

onMounted(() => {
  loadData()
})

definePageMeta({
  title: 'Network Legs Management'
})

const headerActions = useState('headerActions')

headerActions.value = h(UButton, {
  icon: 'i-lucide-plus',
  label: 'New Network Leg',
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
        <UInput :model-value="searchQuery" placeholder="Search lane code..." icon="i-lucide-search" class="w-full"
          @update:model-value="handleSearchInput" />

        <UButton v-if="searchQuery" label="Clear Filter" color="neutral" variant="subtle" size="sm" icon="i-lucide-x"
          @click="clearAllFilters" class="self-center" />
      </div>
    </div>

    <!-- Network Legs Table -->
    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <div class="overflow-x-auto">
        <UTable ref="table" v-model:pagination="pagination" v-model:sorting="sorting" :data="networkLegs" :columns="columns"
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
      <div v-if="networkLegs.length > 0"
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

    <!-- Create Network Leg Modal -->
    <UModal v-model:open="isCreateModalOpen">
      <template #content>
        <div class="p-6 space-y-6">
          <div class="flex justify-between items-center border-b border-gray-800 pb-4">
            <h3 class="text-lg font-semibold">Create New Network Leg</h3>
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" @click="isCreateModalOpen = false" />
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Lane Code *</label>
              <UInput v-model="newLeg.laneCode" class="w-full" placeholder="ORG-DST-HL" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Source Facility *</label>
              <USelect v-model="newLeg.sourceFacilityId" :items="facilities.map(f => ({ label: `${f.name} (${f.type})`, value: f.id }))"
                class="w-full" placeholder="Select Source Facility" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Destination Facility *</label>
              <USelect v-model="newLeg.destinationFacilityId" :items="facilities.map(f => ({ label: `${f.name} (${f.type})`, value: f.id }))"
                class="w-full" placeholder="Select Destination Facility" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1">Transit Mode *</label>
                <USelect v-model="newLeg.mode" :items="transitModeOptions" class="w-full" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1">Vehicle Profile *</label>
                <UInput v-model="newLeg.vehicleProfile" class="w-full" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1">Distance (Meters) *</label>
                <UInput v-model.number="newLeg.distanceMtr" type="number" class="w-full" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1">Base Duration (Seconds) *</label>
                <UInput v-model.number="newLeg.baseTransitDuration" type="number" class="w-full" />
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-3 border-t border-gray-800 pt-4">
            <UButton label="Cancel" color="neutral" variant="subtle" @click="isCreateModalOpen = false" />
            <UButton label="Create Network Leg" color="primary" :loading="saving" @click="handleCreateLeg" />
          </div>
        </div>
      </template>
    </UModal>

    <!-- Edit Network Leg Modal -->
    <UModal v-model:open="isModalOpen">
      <template #content>
        <div class="p-6 space-y-6">
          <div class="flex justify-between items-center border-b border-gray-800 pb-4">
            <h3 class="text-lg font-semibold">Edit Network Leg</h3>
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" @click="isModalOpen = false" />
          </div>

          <div v-if="editingLeg" class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Lane Code</label>
              <UInput v-model="editingLeg.laneCode" class="w-full" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Source Facility</label>
              <USelect v-model="editingLeg.sourceFacilityId"
                :items="facilities.map(f => ({ label: `${f.name} (${f.type})`, value: f.id }))" class="w-full" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Destination Facility</label>
              <USelect v-model="editingLeg.destinationFacilityId"
                :items="facilities.map(f => ({ label: `${f.name} (${f.type})`, value: f.id }))" class="w-full" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1">Transit Mode</label>
                <USelect v-model="editingLeg.mode" :items="transitModeOptions" class="w-full" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1">Vehicle Profile</label>
                <UInput v-model="editingLeg.vehicleProfile" class="w-full" />
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-3 border-t border-gray-800 pt-4">
            <UButton label="Cancel" color="neutral" variant="subtle" @click="isModalOpen = false" />
            <UButton label="Save Changes" color="primary" :loading="saving" @click="handleSaveLeg" />
          </div>
        </div>
      </template>
    </UModal>

    <!-- View Network Leg Details Modal -->
    <UModal v-model:open="isViewModalOpen">
      <template #content>
        <div class="p-6 space-y-6">
          <div class="flex justify-between items-center border-b border-gray-800 pb-4">
            <h3 class="text-lg font-semibold">Network Leg Details</h3>
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" @click="isViewModalOpen = false" />
          </div>

          <div v-if="loadingDetails" class="flex justify-center py-8">
            <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
          </div>

          <div v-else-if="viewingLeg" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Leg ID</label>
                <p class="text-sm font-mono">#{{ viewingLeg.id }}</p>
              </div>
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Lane Code</label>
                <p class="text-sm font-mono text-primary">{{ viewingLeg.laneCode }}</p>
              </div>
            </div>

            <div>
              <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Source Facility</label>
              <p class="text-sm text-white">
                {{ viewingLeg.sourceFacility?.name ? `${viewingLeg.sourceFacility.name} (${viewingLeg.sourceFacility.type})` : `Facility #${viewingLeg.sourceFacilityId}` }}
              </p>
            </div>

            <div>
              <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Destination Facility</label>
              <p class="text-sm text-white">
                {{ viewingLeg.destinationFacility?.name ? `${viewingLeg.destinationFacility.name} (${viewingLeg.destinationFacility.type})` : `Facility #${viewingLeg.destinationFacilityId}` }}
              </p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Transit Mode</label>
                <p class="text-sm text-white">{{ viewingLeg.mode }}</p>
              </div>
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Vehicle Profile</label>
                <p class="text-sm text-white">{{ viewingLeg.vehicleProfile }}</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Distance</label>
                <p class="text-sm text-white">{{ viewingLeg.distanceMtr }} meters</p>
              </div>
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Base Duration</label>
                <p class="text-sm text-white">{{ viewingLeg.baseTransitDuration }} seconds</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Created At</label>
                <p class="text-[11px] text-gray-400">{{ viewingLeg.createdAt ? new Date(viewingLeg.createdAt).toLocaleString() : 'N/A' }}</p>
              </div>
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Updated At</label>
                <p class="text-[11px] text-gray-400">{{ viewingLeg.updatedAt ? new Date(viewingLeg.updatedAt).toLocaleString() : 'N/A' }}</p>
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
              <h3 class="text-lg font-semibold">Delete Network Leg</h3>
              <p class="text-sm text-gray-400">Are you sure you want to delete network leg lane <span class="text-white font-medium">{{ deletingLeg?.laneCode }}</span>? This action cannot be undone.</p>
            </div>
          </div>

          <div class="flex justify-end gap-3 border-t border-gray-800 pt-4">
            <UButton label="Cancel" color="neutral" variant="subtle" @click="isDeleteModalOpen = false" />
            <UButton label="Delete Network Leg" color="error" :loading="saving" @click="handleConfirmDelete" />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>