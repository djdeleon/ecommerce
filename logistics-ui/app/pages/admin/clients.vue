<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getPaginationRowModel } from '@tanstack/vue-table'

const { getClients, createClient, getClientById, updateClient, deleteClient } = useClientService()
const toast = useToast()

const clients = ref<any[]>([])
const loading = ref(false)
const searchQuery = ref('')
const selectedStatus = ref<string | undefined>(undefined)

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
const editingClient = ref<any>(null)
const deletingClient = ref<any>(null)
const saving = ref(false)

const isViewModalOpen = ref(false)
const viewingClient = ref<any>(null)
const loadingDetails = ref(false)

const openViewModal = async (id: number) => {
  isViewModalOpen.value = true
  loadingDetails.value = true
  try {
    const res: any = await getClientById(id)
    viewingClient.value = res.data || res
  } catch (err: any) {
    toast.add({ title: 'Viewing Failed', description: err?.data?.message, color: 'error' })
    isViewModalOpen.value = false
  } finally {
    loadingDetails.value = false
  }
}

const newClient = reactive({
  name: ''
})

const statusOptions = ['Active', 'Inactive']

const loadClients = async () => {
  loading.value = true
  try {
    const res: any = await getClients({
      search: searchQuery.value || undefined,
      isActive: selectedStatus.value ? selectedStatus.value === 'Active' : undefined,
    })
    clients.value = res.data || res || []
  } catch (err: any) {
    toast.add({ title: 'Loading Lists Failed', description: err?.data?.message, color: 'error' })
  } finally {
    loading.value = false
  }
}

const handleSearchInput = (val: string) => {
  searchQuery.value = val
  pagination.value.pageIndex = 0
  table.value?.tableApi?.getColumn('name')?.setFilterValue(val || undefined)
}

const handleStatusFilterChange = (val: any) => {
  selectedStatus.value = val || undefined
  pagination.value.pageIndex = 0
  const boolVal = val === 'Active' ? true : val === 'Inactive' ? false : undefined
  table.value?.tableApi?.getColumn('isActive')?.setFilterValue(boolVal)
}

const clearAllFilters = () => {
  searchQuery.value = ''
  selectedStatus.value = undefined
  pagination.value.pageIndex = 0
  table.value?.tableApi?.getColumn('name')?.setFilterValue(undefined)
  table.value?.tableApi?.getColumn('isActive')?.setFilterValue(undefined)
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
  { accessorKey: 'name', header: 'Client Name' },
  { accessorKey: 'apiKey', header: 'API Key' },
  { accessorKey: 'webhookUrl', header: 'Webhook URL' },
  { accessorKey: 'isActive', header: 'Status' },
  { accessorKey: 'actions', header: 'Actions' }
]

const openCreateModal = () => {
  newClient.name = ''
  isCreateModalOpen.value = true
}

const openEditModal = (client: any) => {
  editingClient.value = { ...client }
  isModalOpen.value = true
}

const openDeleteModal = (client: any) => {
  deletingClient.value = client
  isDeleteModalOpen.value = true
}

const handleCreateClient = async () => {
  saving.value = true
  try {
    const res: any = await createClient(newClient)

    isCreateModalOpen.value = false
    toast.add({ title: 'Created', description: res.message, color: 'success' })

    searchQuery.value = ''
    selectedStatus.value = undefined
    pagination.value.pageIndex = 0

    await loadClients()
  } catch (err: any) {
    toast.add({ title: 'Creation Failed', description: err?.data?.message, color: 'error' })
  } finally {
    saving.value = false
  }
}

const handleSaveClient = async () => {
  if (!editingClient.value) return
  saving.value = true
  try {
    const res: any = await updateClient(editingClient.value.id, {
      name: editingClient.value.name,
      webhookUrl: editingClient.value.webhookUrl,
      isActive: editingClient.value.isActive,
    })
    isModalOpen.value = false
    toast.add({ title: 'Updated', description: res.message, color: 'success' })
    await loadClients()
  } catch (err: any) {
    toast.add({ title: 'Update Failed', description: err?.data?.message, color: 'error' })
  } finally {
    saving.value = false
  }
}

const handleConfirmDelete = async () => {
  if (!deletingClient.value) return
  saving.value = true
  try {
    const res: any = await deleteClient(deletingClient.value.id)
    isDeleteModalOpen.value = false
    toast.add({ title: 'Deleted', description: res.message, color: 'success' })
    await loadClients()
  } catch (err: any) {
    toast.add({ title: 'Deletion Failed', description: err?.data?.message, color: 'error' })
    isDeleteModalOpen.value = false
  } finally {
    saving.value = false
    deletingClient.value = null
  }
}

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
  toast.add({ title: 'Copied', description: 'Value copied to clipboard.', color: 'success' })
}

onMounted(() => {
  loadClients()
})

definePageMeta({
  title: 'Clients Management'
})

const headerActions = useState('headerActions')

headerActions.value = h(UButton, {
  icon: 'i-lucide-plus',
  label: 'New Client',
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
        <UInput :model-value="searchQuery" placeholder="Search client name..." icon="i-lucide-search" class="w-full"
          @update:model-value="handleSearchInput" />

        <div class="flex gap-2 items-center w-full sm:w-auto">
          <USelect :model-value="selectedStatus" :items="statusOptions" placeholder="Filter by Status"
            icon="i-lucide-filter" clearable class="w-full sm:w-48" @update:model-value="handleStatusFilterChange" />

          <UButton v-if="searchQuery || selectedStatus" label="Clear Filter" color="neutral" variant="subtle" size="sm"
            icon="i-lucide-x" @click="clearAllFilters" />
        </div>
      </div>
    </div>

    <!-- Clients Table -->
    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <div class="overflow-x-auto">
        <UTable ref="table" v-model:pagination="pagination" v-model:sorting="sorting" :data="clients" :columns="columns"
          :loading="loading" :pagination-options="{
            getPaginationRowModel: getPaginationRowModel()
          }" class="w-full min-w-[700px]">
          <template #isActive-cell="{ row }">
            <UBadge :color="row.original.isActive ? 'success' : 'error'" variant="subtle">
              {{ row.original.isActive ? 'Active' : 'Inactive' }}
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
      <div v-if="clients.length > 0"
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

    <!-- Create Client Modal -->
    <UModal v-model:open="isCreateModalOpen">
      <template #content>
        <div class="p-6 space-y-6">
          <div class="flex justify-between items-center border-b border-gray-800 pb-4">
            <h3 class="text-lg font-semibold">Register New Client</h3>
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" @click="isCreateModalOpen = false" />
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Client Name *</label>
              <UInput v-model="newClient.name" class="w-full" placeholder="Laravel E-Commerce PH" />
            </div>
          </div>

          <div class="flex justify-end gap-3 border-t border-gray-800 pt-4">
            <UButton label="Cancel" color="neutral" variant="subtle" @click="isCreateModalOpen = false" />
            <UButton label="Register Client" color="primary" :loading="saving" @click="handleCreateClient" />
          </div>
        </div>
      </template>
    </UModal>

    <!-- Edit Client Modal -->
    <UModal v-model:open="isModalOpen">
      <template #content>
        <div class="p-6 space-y-6">
          <div class="flex justify-between items-center border-b border-gray-800 pb-4">
            <h3 class="text-lg font-semibold">Edit Client</h3>
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" @click="isModalOpen = false" />
          </div>

          <div v-if="editingClient" class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Client Name</label>
              <UInput v-model="editingClient.name" class="w-full" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Webhook URL</label>
              <UInput v-model="editingClient.webhookUrl" class="w-full" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Status</label>
              <USelect v-model="editingClient.isActive" :items="[
                { label: 'Active', value: true },
                { label: 'Inactive', value: false }
              ]" value-attribute="value" class="w-full" />
            </div>
          </div>

          <div class="flex justify-end gap-3 border-t border-gray-800 pt-4">
            <UButton label="Cancel" color="neutral" variant="subtle" @click="isModalOpen = false" />
            <UButton label="Save Changes" color="primary" :loading="saving" @click="handleSaveClient" />
          </div>
        </div>
      </template>
    </UModal>

    <!-- View Client Details Modal -->
    <UModal v-model:open="isViewModalOpen">
      <template #content>
        <div class="p-6 space-y-6">
          <div class="flex justify-between items-center border-b border-gray-800 pb-4">
            <h3 class="text-lg font-semibold">Client Details</h3>
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" @click="isViewModalOpen = false" />
          </div>

          <div v-if="loadingDetails" class="flex justify-center py-8">
            <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
          </div>

          <div v-else-if="viewingClient" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Client ID</label>
                <p class="text-sm font-mono">#{{ viewingClient.id }}</p>
              </div>
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Status</label>
                <UBadge :color="viewingClient.isActive ? 'success' : 'error'" variant="subtle" size="sm">
                  {{ viewingClient.isActive ? 'Active' : 'Inactive' }}
                </UBadge>
              </div>
            </div>

            <div>
              <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Name</label>
              <p class="text-sm text-white">{{ viewingClient.name }}</p>
            </div>

            <div>
              <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">API Key</label>
              <div class="flex items-center gap-2 bg-gray-900 p-2 rounded border border-gray-800 mt-1">
                <code class="text-xs flex-1 truncate text-primary">{{ viewingClient.apiKey }}</code>
                <UButton icon="i-lucide-copy" variant="ghost" color="neutral" size="xs"
                  @click="copyToClipboard(viewingClient.apiKey)" />
              </div>
            </div>

            <div>
              <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Webhook URL</label>
              <p class="text-sm text-gray-300">{{ viewingClient.webhookUrl || 'Not configured' }}</p>
            </div>

            <div class="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Created At</label>
                <p class="text-[11px] text-gray-400">{{ new Date(viewingClient.createdAt).toLocaleString() }}</p>
              </div>
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Updated At</label>
                <p class="text-[11px] text-gray-400">{{ new Date(viewingClient.updatedAt).toLocaleString() }}</p>
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
              <h3 class="text-lg font-semibold">Delete Client</h3>
              <p class="text-sm text-gray-400">Are you sure you want to delete <span class="text-white font-medium">{{
                deletingClient?.name }}</span>? This action cannot be undone.</p>
            </div>
          </div>

          <div class="flex justify-end gap-3 border-t border-gray-800 pt-4">
            <UButton label="Cancel" color="neutral" variant="subtle" @click="isDeleteModalOpen = false" />
            <UButton label="Delete Client" color="error" :loading="saving" @click="handleConfirmDelete" />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>