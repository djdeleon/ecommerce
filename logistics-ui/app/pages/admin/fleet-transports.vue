<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import { getPaginationRowModel } from '@tanstack/vue-table'

const {
  getFleetTransports,
  getFleetTransportById,
  createFleetTransport,
  updateFleetTransport,
  deleteFleetTransport,
  getCreateData,
} = useFleetTransportService()

const toast = useToast()

const transports = ref<any[]>([])
const loading = ref(false)
const saving = ref(false)

// Table state
const table = ref()
const pagination = ref({ pageIndex: 0, pageSize: 10 })
const sorting = ref([{ id: 'id', desc: true }])

// Modal State
const isCreateModalOpen = ref(false)
const isEditModalOpen = ref(false)
const isViewModalOpen = ref(false)
const isDeleteModalOpen = ref(false)

const viewingTransport = ref<any>(null)
const editingTransport = ref<any>(null)
const deletingTransport = ref<any>(null)
const loadingDetails = ref(false)

// Options for forms (Fetched from Backend)
const formOptions = ref<any>(null)

const newTransport = reactive({
  scheduledFor: 'LineHaul',
  vehicleId: undefined,
  courierId: undefined,
  networkLegId: undefined,
  masterBagIds: [] as number[],
  scheduledTime: new Date().toISOString()
})

const loadTransports = async () => {
  loading.value = true
  try {
    const res: any = await getFleetTransports()
    transports.value = res.data || []
  } catch (err: any) {
    toast.add({ title: 'Loading Lists Failed', description: err?.data?.message, color: 'error' })
  } finally {
    loading.value = false
  }
}

const loadFormOptions = async (facilityId?: number) => {
  try {
    const query = facilityId ? `?facilityId=${facilityId}` : ''
    const res: any = await getCreateData(query)
    formOptions.value = res.data
  } catch (err: any) {
    toast.add({ title: 'Loading Options Failed', description: err?.data?.message, color: 'error' })
  }
}

// Mappers for Select Components (Aligning with schedules.vue logic)
const vehicleOptions = computed(() => (formOptions.value?.vehicles || []).map((v: any) => ({
  label: `${v.plateNumber} (${v.vehicleProfile?.variant || 'Vehicle'})`,
  value: v.id
})))

const courierOptions = computed(() => (formOptions.value?.couriers || []).map((c: any) => ({
  label: `${c.firstName} ${c.lastName}`,
  value: c.courier?.id
})))

const networkLegOptions = computed(() => (formOptions.value?.legs || []).map((l: any) => ({
  label: `${l.laneCode} (${l.destinationFacility?.name || 'Hub'})`,
  value: l.id
})))

const masterBagOptions = computed(() => (formOptions.value?.masterBags || []).map((b: any) => ({
  label: `${b.code} → ${b.nextFacility?.name} (${b.totalParcels} parcels)`,
  value: b.id
})))

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

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
    cell: ({ row }: any) => h('span', { class: 'font-mono text-xs text-gray-400' }, `#${row.getValue('id')}`)
  },
  {
    accessorKey: 'scheduledFor',
    header: 'Mission',
    cell: ({ row }: any) => h(UBadge, {
      variant: 'subtle',
      color: row.getValue('scheduledFor') === 'LineHaul' ? 'info' : 'primary'
    }, () => row.getValue('scheduledFor'))
  },
  {
    id: 'assigned_to',
    header: 'Assets',
    cell: ({ row }: any) => {
      const run = row.original
      return h('div', { class: 'flex flex-col gap-0.5' }, [
        h('span', { class: 'text-sm font-medium' }, run.courierName || 'Unassigned'),
        h('span', { class: 'text-[12px] text-gray-500 font-mono' }, run.vehicleDetail || 'No Vehicle')
      ])
    }
  },
  {
    accessorKey: 'scheduledTime',
    header: 'Departure',
    cell: ({ row }: any) => new Date(row.getValue('scheduledTime')).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }: any) => {
      const run = row.original
      if (run.arrivedAt) return h(UBadge, { color: 'success', variant: 'subtle' }, () => 'Arrived')
      if (run.dispatchedAt) return h(UBadge, { color: 'primary', variant: 'subtle' }, () => 'In Transit')
      return h(UBadge, { color: 'warning', variant: 'subtle' }, () => 'Scheduled')
    }
  },
  { accessorKey: 'actions', header: 'Actions' }
]

const openCreateModal = async () => {
  await loadFormOptions()
  // Reset form
  newTransport.vehicleId = undefined
  newTransport.courierId = undefined
  newTransport.networkLegId = undefined
  newTransport.masterBagIds = []
  isCreateModalOpen.value = true
}

const openEditModal = async (transport: any) => {
  await loadFormOptions(transport.facilityId)

  editingTransport.value = {
    id: transport.id,
    scheduledFor: transport.scheduledFor || transport.type,
    vehicleId: transport.vehicleId ?? transport.vehicle?.id ?? undefined,
    courierId: transport.courierId ?? transport.courier?.id ?? undefined,
    networkLegId: transport.networkLegId ?? transport.networkLeg?.id ?? undefined,
  }

  isEditModalOpen.value = true
}

const openViewModal = async (id: number) => {
  isViewModalOpen.value = true
  loadingDetails.value = true
  try {
    const res: any = await getFleetTransportById(id)
    viewingTransport.value = res.data
  } catch (err: any) {
    toast.add({ title: 'Viewing Failed', description: err?.data?.message, color: 'error' })
  } finally {
    loadingDetails.value = false
  }
}

const handleCreate = async () => {
  saving.value = true
  try {
    const res: any = await createFleetTransport(newTransport)
    toast.add({ title: 'Created', description: res.message, color: 'success' })
    isCreateModalOpen.value = false
    await loadTransports()
  } catch (err: any) {
    toast.add({ title: 'Creation Failed', description: err?.data?.message, color: 'error' })
  } finally {
    saving.value = false
  }
}

const handleUpdate = async () => {
  if (!editingTransport.value) return
  saving.value = true
  try {
    const res: any = await updateFleetTransport(editingTransport.value.id, {
      scheduledFor: editingTransport.value.scheduledFor,
      vehicleId: editingTransport.value.vehicleId,
      courierId: editingTransport.value.courierId,
      networkLegId: editingTransport.value.networkLegId,
    })
    isEditModalOpen.value = false
    toast.add({ title: 'Updated', description: res.message, color: 'success' })
    await loadTransports()
  } catch (err: any) {
    toast.add({ title: 'Update Failed', description: err?.data?.message, color: 'error' })
  } finally {
    saving.value = false
  }
}

const handleDelete = async () => {
  saving.value = true
  try {
    const res: any = await deleteFleetTransport(deletingTransport.value.id)
    toast.add({ title: 'Deleted', description: res.message, color: 'success' })
    isDeleteModalOpen.value = false
    await loadTransports()
  } catch (err: any) {
    toast.add({ title: 'Deletion Failed', description: err?.data?.message, color: 'error' })
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await loadTransports()
  await loadFormOptions()
})

definePageMeta({ title: 'Fleet Transports' })

const headerActions = useState('headerActions')
headerActions.value = h(UButton, {
  icon: 'i-lucide-plus', label: 'New Transport', color: 'primary',
  onClick: openCreateModal
})
</script>

<template>
  <div class="space-y-6">
    <!-- Filters -->
    <div class="flex items-center bg-gray-800/40 p-4 rounded-xl border border-gray-800 gap-4">
      <div class="w-full md:max-w-xs">
        <USelect :model-value="(table?.tableApi?.getColumn('scheduledFor'))?.getFilterValue() as string"
          :items="formOptions?.fleetTransportTypes" placeholder="Filter by mission type..." icon="i-lucide-filter"
          clearable class="w-full"
          @update:model-value="(val) => table?.tableApi?.getColumn('scheduledFor')?.setFilterValue(val || undefined)" />
      </div>

      <UButton v-if="(table?.tableApi?.getColumn('scheduledFor'))?.getFilterValue()" label="Clear Filter"
        color="neutral" variant="subtle" size="sm" icon="i-lucide-x"
        @click="table?.tableApi?.getColumn('scheduledFor')?.setFilterValue(undefined)" />
    </div>

    <!-- Table -->
    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <UTable ref="table" v-model:pagination="pagination" v-model:sorting="sorting" :data="transports"
        :columns="columns" :loading="loading" :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }">

        <template #actions-cell="{ row }">
          <div class="flex gap-2">
            <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-eye"
              @click="openViewModal(row.original.id)" />
            <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-pencil"
              @click="openEditModal(row.original)" />
            <UButton size="xs" color="error" variant="ghost" icon="i-lucide-trash-2"
              @click="deletingTransport = row.original; isDeleteModalOpen = true" />
          </div>
        </template>
      </UTable>

      <div v-if="transports.length > 0" class="flex justify-between items-center p-4 border-t border-gray-800">
        <span class="text-xs text-gray-400">
          Showing page {{ (table?.tableApi?.getState().pagination.pageIndex || 0) + 1 }} of {{
            table?.tableApi?.getPageCount() || 1
          }}
        </span>
        <UPagination :page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
          :items-per-page="table?.tableApi?.getState().pagination.pageSize"
          :total="table?.tableApi?.getFilteredRowModel().rows.length || transports.length"
          @update:page="(p) => table?.tableApi?.setPageIndex(p - 1)" />
      </div>
    </UCard>

    <!-- Create Modal -->
    <UModal v-model:open="isCreateModalOpen">
      <template #content>
        <div class="p-6 space-y-4">
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-calendar-plus" class="w-6 h-6 text-primary" />
            <h3 class="text-lg font-semibold">New Transport Schedule</h3>
          </div>

          <div class="space-y-4 pt-2">
            <UFormField label="Mission Type">
              <!-- Corrected from :options to :items -->
              <USelect v-model="newTransport.scheduledFor" :items="formOptions?.fleetTransportTypes" class="w-full" />
            </UFormField>

            <UFormField label="Vehicle">
              <USelect v-model.number="newTransport.vehicleId" :items="vehicleOptions" value-attribute="value"
                placeholder="Select Vehicle" class="w-full" />
            </UFormField>

            <UFormField label="Courier">
              <USelect v-model.number="newTransport.courierId" :items="courierOptions" value-attribute="value"
                placeholder="Select Courier" class="w-full" />
            </UFormField>

            <template v-if="newTransport.scheduledFor === 'LineHaul'">
              <UFormField label="Network Leg (Route)">
                <USelect v-model.number="newTransport.networkLegId" :items="networkLegOptions" value-attribute="value"
                  placeholder="Select Route" class="w-full" />
              </UFormField>

              <UFormField label="Assign Master Bags">
                <USelectMenu v-model="newTransport.masterBagIds" :items="masterBagOptions" value-attribute="value"
                  multiple placeholder="Select bags to dispatch..." class="w-full" />
              </UFormField>
            </template>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <UButton label="Cancel" color="neutral" variant="subtle" @click="isCreateModalOpen = false" />
            <UButton label="Create Schedule" color="primary" :loading="saving" @click="handleCreate" />
          </div>
        </div>
      </template>
    </UModal>

    <!-- Edit Modal -->
    <UModal v-model:open="isEditModalOpen">
      <template #content>
        <div class="p-6 space-y-4">
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-pencil" class="w-6 h-6 text-primary" />
            <h3 class="text-lg font-semibold">Edit Transport Schedule #{{ editingTransport?.id }}</h3>
          </div>

          <div v-if="editingTransport" class="space-y-4 pt-2">
            <UFormField label="Mission Type">
              <USelect v-model="editingTransport.scheduledFor" :items="formOptions?.fleetTransportTypes"
                class="w-full" />
            </UFormField>

            <UFormField label="Vehicle">
              <USelect v-model.number="editingTransport.vehicleId" :items="vehicleOptions" value-attribute="value"
                placeholder="Select Vehicle" class="w-full" />
            </UFormField>

            <UFormField label="Courier">
              <USelect v-model.number="editingTransport.courierId" :items="courierOptions" value-attribute="value"
                placeholder="Select Courier" class="w-full" />
            </UFormField>

            <template v-if="editingTransport.scheduledFor === 'LineHaul'">
              <UFormField label="Network Leg (Route)">
                <USelect v-model.number="editingTransport.networkLegId" :items="networkLegOptions"
                  value-attribute="value" placeholder="Select Route" class="w-full" />
              </UFormField>
            </template>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <UButton label="Cancel" color="neutral" variant="subtle" @click="isEditModalOpen = false" />
            <UButton label="Save Changes" color="primary" :loading="saving" @click="handleUpdate" />
          </div>
        </div>
      </template>
    </UModal>

    <!-- View Modal -->
    <UModal v-model:open="isViewModalOpen">
      <template #content>
        <div class="p-6 space-y-6">
          <h3 class="text-lg font-semibold border-b border-gray-800 pb-2">Transport Details #{{ viewingTransport?.id }}
          </h3>

          <div v-if="loadingDetails" class="flex justify-center py-10">
            <UIcon name="i-lucide-loader-2" class="animate-spin w-8 h-8" />
          </div>

          <div v-else-if="viewingTransport" class="space-y-4">
            <div class="grid grid-cols-2 gap-y-4 text-sm">
              <div class="text-gray-400">Type</div>
              <div class="text-white font-bold">{{ viewingTransport.scheduledFor }}</div>
              <div class="text-gray-400">Status</div>
              <div>
                <UBadge v-if="viewingTransport.arrivedAt" color="success">Arrived</UBadge>
                <UBadge v-else-if="viewingTransport.dispatchedAt" color="primary">In Transit</UBadge>
                <UBadge v-else color="warning">Scheduled</UBadge>
              </div>
              <div class="text-gray-400">Vehicle</div>
              <div class="text-white font-mono">{{ viewingTransport.vehicle?.plateNumber }}</div>
              <div class="text-gray-400">Courier</div>
              <div class="text-white">{{ viewingTransport.courier?.user?.firstName }} {{
                viewingTransport.courier?.user?.lastName }}</div>
            </div>

            <!-- Show Cargo -->
            <div v-if="viewingTransport.masterBags?.length" class="space-y-2">
              <p class="text-xs font-bold text-gray-500 uppercase">Assigned Master Bags</p>
              <div class="flex flex-wrap gap-1">
                <UBadge v-for="bag in viewingTransport.masterBags" :key="bag.id" variant="outline" color="neutral"
                  class="font-mono">
                  📦 {{ bag.code }}
                </UBadge>
              </div>
            </div>
          </div>

          <div class="flex justify-end pt-4 border-t border-gray-800">
            <UButton label="Close" color="neutral" variant="subtle" @click="isViewModalOpen = false" />
          </div>
        </div>
      </template>
    </UModal>

    <!-- Delete Modal -->
    <UModal v-model:open="isDeleteModalOpen">
      <template #content>
        <div class="p-6 space-y-4">
          <div class="flex items-center gap-3 text-error">
            <UIcon name="i-lucide-alert-triangle" class="w-6 h-6" />
            <h3 class="font-bold">Delete Fleet Transport</h3>
          </div>
          <p class="text-sm text-gray-400">Are you sure? Fleet Transport #{{ deletingTransport?.id }} will be
            permanently removed.
          </p>
          <div class="flex justify-end gap-3 pt-2">
            <UButton label="Cancel" color="neutral" variant="subtle" @click="isDeleteModalOpen = false" />
            <UButton label="Delete" color="error" :loading="saving" @click="handleDelete" />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>