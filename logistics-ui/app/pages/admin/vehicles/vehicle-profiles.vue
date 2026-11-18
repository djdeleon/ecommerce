<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getPaginationRowModel } from '@tanstack/vue-table'

const { getVehicleProfiles, createVehicleProfile, getVehicleProfileById, updateVehicleProfile, deleteVehicleProfile } = useVehicleProfileService()
const toast = useToast()

const vehicleProfiles = ref<any[]>([])
const loading = ref(false)
const searchQuery = ref('')

const filteredProfiles = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return vehicleProfiles.value

  return vehicleProfiles.value.filter((profile) => {
    return (
      profile.brand?.toLowerCase().includes(query) ||
      profile.modelName?.toLowerCase().includes(query) ||
      profile.type?.toLowerCase().includes(query)
    )
  })
})

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
const editingProfile = ref<any>(null)
const deletingProfile = ref<any>(null)
const saving = ref(false)

const isViewModalOpen = ref(false)
const viewingProfile = ref<any>(null)
const loadingDetails = ref(false)

const openViewModal = async (id: number) => {
  isViewModalOpen.value = true
  loadingDetails.value = true
  try {
    const res: any = await getVehicleProfileById(id)
    viewingProfile.value = res.data || res
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.message, color: 'error' })
    isViewModalOpen.value = false
  } finally {
    loadingDetails.value = false
  }
}

// New Vehicle Profile Form State aligned with backend schema
const newProfile = reactive({
  brand: '',
  modelName: '',
  variant: '',
  maxWeightCapacityG: 1000000,
  maxUsableVolumeCbm: 3.3,
  allocationVolumeTarget: 0.75,
  lengthMm: 4200,
  widthMm: 1700,
  heightMm: 1900,
  type: 'Van'
})

const typeOptions = ['Van', 'Truck', 'Motorcycle', 'Car']

const loadVehicleProfiles = async () => {
  loading.value = true
  try {
    const res: any = await getVehicleProfiles()
    vehicleProfiles.value = res.data || res || []
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

const clearAllFilters = () => {
  searchQuery.value = ''
  pagination.value.pageIndex = 0
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
  { accessorKey: 'brand', header: 'Brand' },
  { accessorKey: 'modelName', header: 'Model Name' },
  { accessorKey: 'type', header: 'Type' },
  {
    accessorKey: 'maxWeightCapacityG',
    header: 'Max Weight (g)',
    cell: ({ row }: { row: any }) => `${(row.original.maxWeightCapacityG || 0).toLocaleString()} g`
  },
  {
    accessorKey: 'maxUsableVolumeCbm',
    header: 'Max Volume (m³)',
    cell: ({ row }: { row: any }) => `${row.original.maxUsableVolumeCbm || 0} m³`
  },
  { accessorKey: 'actions', header: 'Actions' }
]

const openCreateModal = () => {
  newProfile.brand = ''
  newProfile.modelName = ''
  newProfile.variant = ''
  newProfile.maxWeightCapacityG = 1000000
  newProfile.maxUsableVolumeCbm = 3.3
  newProfile.allocationVolumeTarget = 0.75
  newProfile.lengthMm = 4200
  newProfile.widthMm = 1700
  newProfile.heightMm = 1900
  newProfile.type = 'Van'
  isCreateModalOpen.value = true
}

const openEditModal = (profile: any) => {
  editingProfile.value = { ...profile }
  isModalOpen.value = true
}

const openDeleteModal = (profile: any) => {
  deletingProfile.value = profile
  isDeleteModalOpen.value = true
}

const handleCreateProfile = async () => {
  saving.value = true
  try {
    const res: any = await createVehicleProfile(newProfile)

    isCreateModalOpen.value = false
    toast.add({ title: 'Created', description: res.message || 'Vehicle profile created successfully.', color: 'success' })

    searchQuery.value = ''
    pagination.value.pageIndex = 0

    await loadVehicleProfiles()
  } catch (err: any) {
    toast.add({ title: 'Creation Failed', description: err?.data?.message || 'Failed to create vehicle profile.', color: 'error' })
  } finally {
    saving.value = false
  }
}

const handleSaveProfile = async () => {
  if (!editingProfile.value) return
  saving.value = true
  try {
    const res: any = await updateVehicleProfile(editingProfile.value.id, {
      brand: editingProfile.value.brand,
      modelName: editingProfile.value.modelName,
      variant: editingProfile.value.variant,
      maxWeightCapacityG: Number(editingProfile.value.maxWeightCapacityG),
      maxUsableVolumeCbm: Number(editingProfile.value.maxUsableVolumeCbm),
      allocationVolumeTarget: Number(editingProfile.value.allocationVolumeTarget),
      lengthMm: Number(editingProfile.value.lengthMm),
      widthMm: Number(editingProfile.value.widthMm),
      heightMm: Number(editingProfile.value.heightMm),
      type: editingProfile.value.type,
    })
    isModalOpen.value = false
    toast.add({ title: 'Updated', description: res.message || 'Vehicle profile updated successfully.', color: 'success' })
    await loadVehicleProfiles()
  } catch (err: any) {
    toast.add({ title: 'Update Failed', description: err?.data?.message, color: 'error' })
  } finally {
    saving.value = false
  }
}

const handleConfirmDelete = async () => {
  if (!deletingProfile.value) return
  saving.value = true
  try {
    const res: any = await deleteVehicleProfile(deletingProfile.value.id)
    isDeleteModalOpen.value = false
    toast.add({ title: 'Deleted', description: res.message || 'Vehicle profile deleted successfully.', color: 'success' })
    await loadVehicleProfiles()
  } catch (err: any) {
    toast.add({ title: 'Deletion Failed', description: err?.data?.message, color: 'error' })
    isDeleteModalOpen.value = false
  } finally {
    saving.value = false
    deletingProfile.value = null
  }
}

onMounted(() => {
  loadVehicleProfiles()
})

definePageMeta({
  title: 'Vehicle Profiles'
})

const headerActions = useState('headerActions')

headerActions.value = h(UButton, {
  icon: 'i-lucide-plus',
  label: 'New Profile',
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
        <UInput :model-value="searchQuery" placeholder="Search model name..." icon="i-lucide-search" class="w-full"
          @update:model-value="handleSearchInput" />

        <div class="flex gap-2 items-center w-full sm:w-auto">
          <UButton v-if="searchQuery" label="Clear Filter" color="neutral" variant="subtle" size="sm" icon="i-lucide-x"
            @click="clearAllFilters" />
        </div>
      </div>
    </div>

    <!-- Vehicle Profiles Table -->
    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <div class="overflow-x-auto">
        <UTable ref="table" v-model:pagination="pagination" v-model:sorting="sorting" :data="filteredProfiles"
          :columns="columns" :loading="loading" :pagination-options="{
            getPaginationRowModel: getPaginationRowModel()
          }" class="w-full min-w-[700px]">
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
      <div v-if="filteredProfiles.length > 0"
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

    <!-- Create Profile Modal -->
    <UModal v-model:open="isCreateModalOpen">
      <template #content>
        <div class="p-6 space-y-6">
          <div class="flex justify-between items-center border-b border-gray-800 pb-4">
            <h3 class="text-lg font-semibold">Create Vehicle Profile</h3>
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" @click="isCreateModalOpen = false" />
          </div>

          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1">Brand *</label>
                <UInput v-model="newProfile.brand" class="w-full" placeholder="Mitsubishi" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1">Model Name *</label>
                <UInput v-model="newProfile.modelName" class="w-full" placeholder="L300" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1">Variant</label>
                <UInput v-model="newProfile.variant" class="w-full" placeholder="Aluminum Van" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1">Type</label>
                <USelect v-model="newProfile.type" :items="typeOptions" class="w-full" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1">Max Weight Capacity (g)</label>
                <UInput v-model.number="newProfile.maxWeightCapacityG" type="number" class="w-full" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1">Max Usable Volume (m³)</label>
                <UInput v-model.number="newProfile.maxUsableVolumeCbm" type="number" step="0.1" class="w-full" />
              </div>
            </div>
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1">Length (mm)</label>
                <UInput v-model.number="newProfile.lengthMm" type="number" class="w-full" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1">Width (mm)</label>
                <UInput v-model.number="newProfile.widthMm" type="number" class="w-full" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1">Height (mm)</label>
                <UInput v-model.number="newProfile.heightMm" type="number" class="w-full" />
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-3 border-t border-gray-800 pt-4">
            <UButton label="Cancel" color="neutral" variant="subtle" @click="isCreateModalOpen = false" />
            <UButton label="Create Profile" color="primary" :loading="saving" @click="handleCreateProfile" />
          </div>
        </div>
      </template>
    </UModal>

    <!-- Edit Profile Modal -->
    <UModal v-model:open="isModalOpen">
      <template #content>
        <div class="p-6 space-y-6">
          <div class="flex justify-between items-center border-b border-gray-800 pb-4">
            <h3 class="text-lg font-semibold">Edit Vehicle Profile</h3>
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" @click="isModalOpen = false" />
          </div>

          <div v-if="editingProfile" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1">Brand</label>
                <UInput v-model="editingProfile.brand" class="w-full" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1">Model Name</label>
                <UInput v-model="editingProfile.modelName" class="w-full" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1">Variant</label>
                <UInput v-model="editingProfile.variant" class="w-full" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1">Type</label>
                <USelect v-model="editingProfile.type" :items="typeOptions" class="w-full" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1">Max Weight Capacity (g)</label>
                <UInput v-model.number="editingProfile.maxWeightCapacityG" type="number" class="w-full" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1">Max Usable Volume (m³)</label>
                <UInput v-model.number="editingProfile.maxUsableVolumeCbm" type="number" step="0.1" class="w-full" />
              </div>
            </div>
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1">Length (mm)</label>
                <UInput v-model.number="editingProfile.lengthMm" type="number" class="w-full" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1">Width (mm)</label>
                <UInput v-model.number="editingProfile.widthMm" type="number" class="w-full" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1">Height (mm)</label>
                <UInput v-model.number="editingProfile.heightMm" type="number" class="w-full" />
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-3 border-t border-gray-800 pt-4">
            <UButton label="Cancel" color="neutral" variant="subtle" @click="isModalOpen = false" />
            <UButton label="Save Changes" color="primary" :loading="saving" @click="handleSaveProfile" />
          </div>
        </div>
      </template>
    </UModal>

    <!-- View Vehicle Profile Details Modal -->
    <UModal v-model:open="isViewModalOpen">
      <template #content>
        <div class="p-6 space-y-6">
          <div class="flex justify-between items-center border-b border-gray-800 pb-4">
            <h3 class="text-lg font-semibold">Vehicle Profile Details</h3>
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" @click="isViewModalOpen = false" />
          </div>

          <div v-if="loadingDetails" class="flex justify-center py-8">
            <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
          </div>

          <div v-else-if="viewingProfile" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Profile ID</label>
                <p class="text-sm font-mono">#{{ viewingProfile.id }}</p>
              </div>
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Type</label>
                <UBadge color="info" variant="subtle" size="sm">
                  {{ viewingProfile.type }}
                </UBadge>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Brand / Model</label>
                <p class="text-sm text-white font-medium">{{ viewingProfile.brand }} {{ viewingProfile.modelName }}</p>
              </div>
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Variant</label>
                <p class="text-sm text-gray-300">{{ viewingProfile.variant || '-' }}</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Max Weight
                  Capacity</label>
                <p class="text-sm text-gray-300">{{ (viewingProfile.maxWeightCapacityG || 0).toLocaleString() }} g</p>
              </div>
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Max Usable
                  Volume</label>
                <p class="text-sm text-gray-300">{{ viewingProfile.maxUsableVolumeCbm }} m³</p>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-2">
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Length</label>
                <p class="text-sm text-gray-300">{{ viewingProfile.lengthMm }} mm</p>
              </div>
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Width</label>
                <p class="text-sm text-gray-300">{{ viewingProfile.widthMm }} mm</p>
              </div>
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Height</label>
                <p class="text-sm text-gray-300">{{ viewingProfile.heightMm }} mm</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Created At</label>
                <p class="text-[11px] text-gray-400">{{ new Date(viewingProfile.createdAt).toLocaleString() }}</p>
              </div>
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Updated At</label>
                <p class="text-[11px] text-gray-400">{{ new Date(viewingProfile.updatedAt).toLocaleString() }}</p>
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
              <h3 class="text-lg font-semibold">Delete Vehicle Profile</h3>
              <p class="text-sm text-gray-400">Are you sure you want to delete <span class="text-white font-medium">{{
                deletingProfile?.brand }} {{ deletingProfile?.modelName }}</span>? This action cannot be undone.</p>
            </div>
          </div>

          <div class="flex justify-end gap-3 border-t border-gray-800 pt-4">
            <UButton label="Cancel" color="neutral" variant="subtle" @click="isDeleteModalOpen = false" />
            <UButton label="Delete Profile" color="error" :loading="saving" @click="handleConfirmDelete" />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>