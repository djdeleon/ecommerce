<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getPaginationRowModel } from '@tanstack/vue-table'

const { fetchUsers, fetchRoles, fetchUserById, updateUser, deleteUser } = useUserService()
const { registerUser } = useAuthService()
const toast = useToast()

const users = ref<any[]>([])
const loading = ref(false)
const searchQuery = ref('')
const selectedRole = ref<string | undefined>(undefined)

// Table ref & pagination state
const table = ref()
const pagination = ref({
  pageIndex: 0,
  pageSize: 10
})

// Modal State
const isModalOpen = ref(false)
const isCreateModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const isViewModalOpen = ref(false)
const viewingUser = ref<any>(null)
const loadingDetails = ref(false)
const editingUser = ref<any>(null)
const deletingUser = ref<any>(null)
const saving = ref(false)

// New User Form State
const newUser = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: 'secretPassword123',
  role: 'Courier',
  assignedFacilityId: null as number | null
})

const roleOptions = ref<string[]>([])

const loadRoles = async () => {
  try {
    const res: any = await fetchRoles()
    roleOptions.value = res.data || res || []
  } catch (error) {
    // fallback if fetching fails
    roleOptions.value = ['Admin', 'Manager', 'Clerk', 'Courier']
  }
}

const loadUsers = async () => {
  loading.value = true
  try {
    const res: any = await fetchUsers({
      search: searchQuery.value || undefined,
      role: selectedRole.value as any,
    })
    users.value = res.data || []
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to fetch users list.',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

const handleSearchInput = (val: string) => {
  searchQuery.value = val
  pagination.value.pageIndex = 0
  loadUsers()
}

const handleRoleFilterChange = (val: any) => {
  selectedRole.value = val || undefined
  pagination.value.pageIndex = 0
  loadUsers()
}

const clearAllFilters = () => {
  searchQuery.value = ''
  selectedRole.value = undefined
  pagination.value.pageIndex = 0
  loadUsers()
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
  { accessorKey: 'firstName', header: 'First Name' },
  { accessorKey: 'lastName', header: 'Last Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'role', header: 'Role' },
  { accessorKey: 'actions', header: 'Actions' }
]

const openCreateModal = () => {
  newUser.firstName = ''
  newUser.lastName = ''
  newUser.email = ''
  newUser.password = 'secretPassword123'
  newUser.role = 'Courier'
  newUser.assignedFacilityId = null
  isCreateModalOpen.value = true
}

const openViewModal = async (id: number) => {
  isViewModalOpen.value = true
  loadingDetails.value = true
  try {
    const res: any = await fetchUserById(id)
    viewingUser.value = res.data || res
  } catch (error) {
    toast.add({ title: 'Error', description: 'Failed to load user details.', color: 'error' })
    isViewModalOpen.value = false
  } finally {
    loadingDetails.value = false
  }
}

const openEditModal = (user: any) => {
  editingUser.value = { ...user }
  isModalOpen.value = true
}

const openDeleteModal = (user: any) => {
  deletingUser.value = user
  isDeleteModalOpen.value = true
}

const handleCreateUser = async () => {
  saving.value = true
  try {
    const res: any = await registerUser(newUser)

    isCreateModalOpen.value = false
    toast.add({ title: 'Created', description: res.message, color: 'success' })

    searchQuery.value = ''
    selectedRole.value = undefined
    pagination.value.pageIndex = 0

    await loadUsers()
  } catch (error: any) {
    toast.add({ title: 'Creation Failed', description: error?.data?.message || 'Failed to create user.', color: 'error' })
  } finally {
    saving.value = false
  }
}

const handleSaveUser = async () => {
  if (!editingUser.value) return
  saving.value = true
  try {
    const res: any = await updateUser(editingUser.value.id, {
      firstName: editingUser.value.firstName,
      lastName: editingUser.value.lastName,
      email: editingUser.value.email,
      role: editingUser.value.role,
      assignedFacilityId: editingUser.value.assignedFacilityId ? Number(editingUser.value.assignedFacilityId) : null,
    })
    isModalOpen.value = false
    toast.add({ title: 'Updated', description: res.message, color: 'success' })
    await loadUsers()
  } catch (error: any) {
    toast.add({ title: 'Update Failed', description: error?.data?.message || 'Failed to update user account.', color: 'error' })
  } finally {
    saving.value = false
  }
}

const handleConfirmDelete = async () => {
  if (!deletingUser.value) return
  saving.value = true
  try {
    const res: any = await deleteUser(deletingUser.value.id)
    isDeleteModalOpen.value = false
    toast.add({ title: 'Deleted', description: res.message, color: 'success' })
    await loadUsers()
  } catch (error: any) {
    toast.add({ title: 'Delete Failed', description: error?.data?.message || 'Failed to delete user.', color: 'error' })
  } finally {
    saving.value = false
    deletingUser.value = null
  }
}

onMounted(() => {
  loadRoles()
  loadUsers()
})

definePageMeta({
  title: 'Users Management'
})

const headerActions = useState('headerActions')

headerActions.value = h(UButton, {
  icon: 'i-lucide-user-plus',
  label: 'New User',
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
      <div class="flex flex-col sm:flex-row gap-3 items-stretch flex-1 w-full max-w-2xl">
        <UInput id="user-search-input"
          :model-value="searchQuery"
          placeholder="Search name or email..." icon="i-lucide-search" class="w-full"
          @update:model-value="handleSearchInput" />

        <div class="flex gap-2 items-center w-full sm:w-auto">
          <USelect :model-value="selectedRole" :items="roleOptions"
            placeholder="Filter by Role" icon="i-lucide-filter" clearable class="w-full sm:w-48"
            @update:model-value="handleRoleFilterChange" />

          <UButton v-if="searchQuery || selectedRole" label="Clear Filter" color="neutral"
            variant="subtle" size="sm" icon="i-lucide-x"
            @click="clearAllFilters" />
        </div>
      </div>
    </div>

    <!-- Users Table -->
    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <div class="overflow-x-auto">
        <UTable ref="table" v-model:pagination="pagination" :data="users" :columns="columns" :loading="loading"
          :pagination-options="{
            getPaginationRowModel: getPaginationRowModel()
          }" class="w-full min-w-[600px]">
          <template #role-cell="{ row }">
            <UBadge
              :color="row.original.role === 'Admin' ? 'error' : row.original.role === 'Manager' ? 'warning' : row.original.role === 'Clerk' ? 'primary' : 'info'"
              variant="subtle">
              {{ row.original.role }}
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

      <!-- Pagination Footer using TanStack tableApi -->
      <div
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

    <!-- Create User Modal -->
    <UModal v-model:open="isCreateModalOpen">
      <template #content>
        <div class="p-6 space-y-6">
          <div class="flex justify-between items-center border-b border-gray-800 pb-4">
            <h3 class="text-lg font-semibold">Create New User</h3>
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" @click="isCreateModalOpen = false" />
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">First Name</label>
              <UInput v-model="newUser.firstName" class="w-full" placeholder="John" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Last Name</label>
              <UInput v-model="newUser.lastName" class="w-full" placeholder="Doe" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Email Address</label>
              <UInput v-model="newUser.email" type="email" class="w-full" placeholder="john.doe@example.com" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Temporary Password</label>
              <UInput v-model="newUser.password" type="password" class="w-full" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">User Role</label>
              <USelect v-model="newUser.role" :items="roleOptions" class="w-full" />
            </div>
          </div>

          <div class="flex justify-end gap-3 border-t border-gray-800 pt-4">
            <UButton label="Cancel" color="neutral" variant="subtle" @click="isCreateModalOpen = false" />
            <UButton label="Create Account" color="primary" :loading="saving" @click="handleCreateUser" />
          </div>
        </div>
      </template>
    </UModal>

    <!-- View User Details Modal -->
    <UModal v-model:open="isViewModalOpen">
      <template #content>
        <div class="p-6 space-y-6">
          <div class="flex justify-between items-center border-b border-gray-800 pb-4">
            <h3 class="text-lg font-semibold">User Details</h3>
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" @click="isViewModalOpen = false" />
          </div>

          <div v-if="loadingDetails" class="flex justify-center py-8">
            <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
          </div>

          <div v-else-if="viewingUser" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">User ID</label>
                <p class="text-sm font-mono">#{{ viewingUser.id }}</p>
              </div>
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Role</label>
                <UBadge
                  :color="viewingUser.role === 'Admin' ? 'error' : viewingUser.role === 'Manager' ? 'warning' : 'info'"
                  variant="subtle" size="sm">
                  {{ viewingUser.role }}
                </UBadge>
              </div>
            </div>

            <div>
              <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Full Name</label>
              <p class="text-sm text-white">{{ viewingUser.firstName }} {{ viewingUser.lastName }}</p>
            </div>

            <div>
              <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Email Address</label>
              <p class="text-sm text-gray-300">{{ viewingUser.email }}</p>
            </div>

            <div>
              <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Assigned
                Facility</label>
              <p class="text-sm text-gray-300">{{ viewingUser.assignedFacility?.name || 'Not Assigned' }}</p>
            </div>

            <div class="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Created At</label>
                <p class="text-[11px] text-gray-400">{{ new Date(viewingUser.createdAt).toLocaleString() }}</p>
              </div>
              <div>
                <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-500">Updated At</label>
                <p class="text-[11px] text-gray-400">{{ new Date(viewingUser.updatedAt).toLocaleString() }}</p>
              </div>
            </div>
          </div>

          <div class="flex justify-end border-t border-gray-800 pt-4">
            <UButton label="Close" color="neutral" variant="subtle" @click="isViewModalOpen = false" />
          </div>
        </div>
      </template>
    </UModal>

    <!-- Edit User Modal -->
    <UModal v-model:open="isModalOpen">
      <template #content>
        <div class="p-6 space-y-6">
          <div class="flex justify-between items-center border-b border-gray-800 pb-4">
            <h3 class="text-lg font-semibold">Edit User Account</h3>
            <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" @click="isModalOpen = false" />
          </div>

          <div v-if="editingUser" class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">First Name</label>
              <UInput v-model="editingUser.firstName" class="w-full" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Last Name</label>
              <UInput v-model="editingUser.lastName" class="w-full" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Email Address</label>
              <UInput v-model="editingUser.email" type="email" class="w-full" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">User Role</label>
              <USelect v-model="editingUser.role" :items="roleOptions" class="w-full" />
            </div>
          </div>

          <div class="flex justify-end gap-3 border-t border-gray-800 pt-4">
            <UButton label="Cancel" color="neutral" variant="subtle" @click="isModalOpen = false" />
            <UButton label="Save Changes" color="primary" :loading="saving" @click="handleSaveUser" />
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
              <h3 class="text-lg font-semibold">Delete User Account</h3>
              <p class="text-sm text-gray-400">Are you sure you want to delete <span class="text-white font-medium">{{
                deletingUser?.firstName }} {{ deletingUser?.lastName }}</span>? This action cannot be undone.</p>
            </div>
          </div>

          <div class="flex justify-end gap-3 border-t border-gray-800 pt-4">
            <UButton label="Cancel" color="neutral" variant="subtle" @click="isDeleteModalOpen = false" />
            <UButton label="Delete User" color="error" :loading="saving" @click="handleConfirmDelete" />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>