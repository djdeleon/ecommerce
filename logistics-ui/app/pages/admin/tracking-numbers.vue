<script setup lang="ts">
import { ref, onMounted, resolveComponent, h, reactive } from 'vue'
import { getPaginationRowModel } from '@tanstack/vue-table'

const { getTrackingNumbers, getTrackingNumberByNumber, generateTrackingNumbers } = useTrackingNumberService()
const { getClients } = useClientService()
const toast = useToast()

const trackingNumbers = ref<any[]>([])
const clients = ref<any[]>([])
const loading = ref(false)
const searchQuery = ref('')
const selectedAssignment = ref<string | undefined>(undefined)

// Table ref & pagination state
const table = ref()
const pagination = ref({
  pageIndex: 0,
  pageSize: 10
})
const sorting = ref([{ id: 'id', desc: true }])

// Modal State
const isGenerateModalOpen = ref(false)
const isViewModalOpen = ref(false)
const viewingNumber = ref<any>(null)
const loadingDetails = ref(false)
const saving = ref(false)

const generationForm = reactive({
  apiKey: '',
  size: 10
})

const assignmentOptions = ['Assigned', 'Unassigned']

const loadData = async () => {
  loading.value = true
  try {
    const [tnRes, clientRes]: any = await Promise.all([
      getTrackingNumbers(),
      getClients()
    ])
    trackingNumbers.value = tnRes.data || tnRes || []
    clients.value = clientRes.data || clientRes || []
  } catch (err: any) {
    toast.add({ title: 'Loading Lists Failed', description: err?.data?.message, color: 'error' })
  } finally {
    loading.value = false
  }
}

const openViewModal = async (number: string) => {
  isViewModalOpen.value = true
  loadingDetails.value = true
  try {
    const res: any = await getTrackingNumberByNumber(number)
    viewingNumber.value = res.data || res
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
  table.value?.tableApi?.getColumn('number')?.setFilterValue(val || undefined)
  table.value?.tableApi?.getColumn('client')?.setFilterValue(val || undefined)
}

const handleAssignmentFilterChange = (val: any) => {
  selectedAssignment.value = val || undefined
  pagination.value.pageIndex = 0
  const boolVal = val === 'Assigned' ? true : val === 'Unassigned' ? false : undefined
  table.value?.tableApi?.getColumn('isAssigned')?.setFilterValue(boolVal)
}

const clearAllFilters = () => {
  searchQuery.value = ''
  selectedAssignment.value = undefined
  pagination.value.pageIndex = 0
  table.value?.tableApi?.getColumn('number')?.setFilterValue(undefined)
  table.value?.tableApi?.getColumn('client')?.setFilterValue(undefined)
  table.value?.tableApi?.getColumn('isAssigned')?.setFilterValue(undefined)
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
  { 
    accessorKey: 'number', 
    header: 'Tracking Number',
    filterFn: (row: any, columnId: string, filterValue: string) => {
      const clientName = row.original.client?.name || ''
      const number = row.original.number || ''
      const query = filterValue.toLowerCase()
      return clientName.toLowerCase().includes(query) || number.toLowerCase().includes(query)
    }
  },
  { 
    accessorKey: 'client', 
    header: 'Client',
    cell: ({ row }: { row: any }) => row.original.client?.name || 'N/A',
    filterFn: (row: any, columnId: string, filterValue: string) => {
      const clientName = row.original.client?.name || ''
      const number = row.original.number || ''
      const query = filterValue.toLowerCase()
      return clientName.toLowerCase().includes(query) || number.toLowerCase().includes(query)
    }
  },
  { accessorKey: 'isAssigned', header: 'Status' },
  { accessorKey: 'actions', header: 'Actions' }
]

const openGenerateModal = () => {
  generationForm.apiKey = clients.value[0]?.apiKey || ''
  generationForm.size = 10
  isGenerateModalOpen.value = true
}

const handleGenerate = async () => {
  if (!generationForm.apiKey) {
    toast.add({ title: 'Validation Error', description: 'Please select a client.', color: 'error' })
    return
  }

  saving.value = true
  try {
    const res: any = await generateTrackingNumbers({ size: Number(generationForm.size) }, generationForm.apiKey)

    isGenerateModalOpen.value = false
    toast.add({ title: 'Generated', description: res.message || 'Tracking Numbers generated successfully.', color: 'success' })

    searchQuery.value = ''
    selectedAssignment.value = undefined
    pagination.value.pageIndex = 0

    await loadData()
  } catch (err: any) {
    toast.add({ title: 'Generation Failed', description: err?.data?.message, color: 'error' })
  } finally {
    saving.value = false
  }
}

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
  toast.add({ title: 'Copied', description: 'Value copied to clipboard.', color: 'success' })
}

onMounted(() => {
  loadData()
})

definePageMeta({
  title: 'Tracking Numbers Management'
})

const headerActions = useState('headerActions')

headerActions.value = h(UButton, {
  icon: 'i-lucide-plus',
  label: 'Generate Numbers',
  color: 'primary',
  size: 'sm',
  class: 'sm:size-md text-xs sm:text-sm sm:px-3.5 sm:py-2',
  onClick: openGenerateModal
})
</script>

<template>
  <div class="space-y-6">
    <!-- Filters & Search Bar -->
    <div
      class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-gray-800/40 p-4 rounded-xl border border-gray-800">
      <div class="flex flex-col sm:flex-row gap-3 items-stretch flex-1 w-full max-w-xl">
         <UInput :model-value="searchQuery" placeholder="Search tracking number or client..." icon="i-lucide-search" class="w-full"
          @update:model-value="handleSearchInput" />

        <div class="flex gap-2 items-center w-full sm:w-auto">
          <USelect :model-value="selectedAssignment" :items="assignmentOptions" placeholder="Filter by Status"
            icon="i-lucide-filter" clearable class="w-full sm:w-48" @update:model-value="handleAssignmentFilterChange" />

          <UButton v-if="searchQuery || selectedAssignment" label="Clear Filter" color="neutral" variant="subtle" size="sm"
            icon="i-lucide-x" @click="clearAllFilters" />
        </div>
      </div>
    </div>

    <!-- Tracking Numbers Table -->
    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <div class="overflow-x-auto">
        <UTable ref="table" v-model:pagination="pagination" v-model:sorting="sorting" :data="trackingNumbers" :columns="columns"
          :loading="loading" :pagination-options="{
            getPaginationRowModel: getPaginationRowModel()
          }" class="w-full min-w-[700px]">
          <template #isAssigned-cell="{ row }">
            <UBadge :color="row.original.isAssigned ? 'info' : 'neutral'" variant="subtle">
              {{ row.original.isAssigned ? 'Assigned' : 'Unassigned' }}
            </UBadge>
          </template>

          <template #actions-cell="{ row }">
            <div class="flex items-center gap-2">
              <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-eye"
                @click="openViewModal(row.original.number)" />
              <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-copy"
                @click="copyToClipboard(row.original.number)" />
            </div>
          </template>
        </UTable>
      </div>

      <!-- Pagination Footer -->
      <div v-if="trackingNumbers.length > 0"
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

    <!-- Generate Tracking Numbers Modal -->
    <UModal v-model:open="isGenerateModalOpen">
      <template #content>
        <div class="p-6 space-y-6">
          <div class="flex justify-between items-center border-b border-gray-800 pb-4">
            <h3 class="text-lg font-semibold">Generate Tracking Numbers</h3>
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" @click="isGenerateModalOpen = false" />
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Select Client *</label>
              <USelect v-model="generationForm.apiKey" :items="clients.map(c => ({ label: c.name, value: c.apiKey }))"
                value-attribute="value" placeholder="Choose client..." class="w-full" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Pool Size *</label>
              <UInput v-model.number="generationForm.size" type="number" min="1" max="5000" class="w-full" />
            </div>
          </div>

          <div class="flex justify-end gap-3 border-t border-gray-800 pt-4">
            <UButton label="Cancel" color="neutral" variant="subtle" @click="isGenerateModalOpen = false" />
            <UButton label="Generate" color="primary" :loading="saving" @click="handleGenerate" />
          </div>
        </div>
      </template>
    </UModal>

    <!-- View Tracking Number Details Modal -->
    <UModal v-model:open="isViewModalOpen">
      <template #content>
        <div class="p-6 space-y-6">
          <div class="flex justify-between items-center border-b border-gray-800 pb-4">
            <h3 class="text-lg font-semibold">Tracking Number Details</h3>
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" @click="isViewModalOpen = false" />
          </div>

          <div v-if="loadingDetails" class="flex justify-center py-8">
            <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
          </div>

          <div v-else-if="viewingNumber" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Record ID</label>
                <p class="text-sm font-mono">#{{ viewingNumber.id }}</p>
              </div>
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Assignment Status</label>
                <UBadge :color="viewingNumber.isAssigned ? 'info' : 'neutral'" variant="subtle" size="sm">
                  {{ viewingNumber.isAssigned ? 'Assigned' : 'Unassigned' }}
                </UBadge>
              </div>
            </div>

            <div>
              <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Tracking Number</label>
              <div class="flex items-center gap-2 bg-gray-900 p-2 rounded border border-gray-800 mt-1">
                <code class="text-xs flex-1 truncate text-primary font-mono">{{ viewingNumber.number }}</code>
                <UButton icon="i-lucide-copy" variant="ghost" color="neutral" size="xs"
                  @click="copyToClipboard(viewingNumber.number)" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Assigned At</label>
                <p class="text-[11px] text-gray-400">
                  {{ viewingNumber.assignedAt ? new Date(viewingNumber.assignedAt).toLocaleString() : 'Not assigned yet' }}
                </p>
              </div>
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Created At</label>
                <p class="text-[11px] text-gray-400">{{ new Date(viewingNumber.createdAt).toLocaleString() }}</p>
              </div>
            </div>
          </div>

          <div class="flex justify-end border-t border-gray-800 pt-4">
            <UButton label="Close" color="neutral" variant="subtle" @click="isViewModalOpen = false" />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>