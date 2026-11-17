import { describe, test, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import UsersPage from '../../../app/pages/admin/users.vue'

// Mock the userService composable so the page mounts without hitting network
const { mockFetchUsers, mockCreateUser, mockUpdateUser, mockDeleteUser } = vi.hoisted(() => ({
  mockFetchUsers: vi.fn(),
  mockCreateUser: vi.fn(),
  mockUpdateUser: vi.fn(),
  mockDeleteUser: vi.fn(),
}))

mockNuxtImport('useUserService', () => () => ({
  fetchUsers: mockFetchUsers,
  createUser: mockCreateUser,
  updateUser: mockUpdateUser,
  deleteUser: mockDeleteUser,
}))

// Mock auth service
mockNuxtImport('useAuthService', () => () => ({
  userToken: ref('mock-token'),
  registerUser: mockCreateUser,
}))

describe('Users Management Page (UI Component)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchUsers.mockResolvedValue({
      data: [
        { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@example.com', role: 'Courier' }
      ]
    })
  })

  test('renders user management page with search input and table data', async () => {
    const component = await mountSuspended(UsersPage)

    const searchInput = component.find('input[placeholder="Search name or email..."]')
    expect(searchInput.exists()).toBe(true)
    expect(mockFetchUsers).toHaveBeenCalled()

    expect(component.text()).toContain('John')
    expect(component.text()).toContain('john@example.com')
  })

  test('opens create user modal when New User button is clicked', async () => {
    const component = await mountSuspended(UsersPage)
    const vm = component.vm as any

    vm.openCreateModal()
    await component.vm.$nextTick()

    const firstNameInput = document.querySelector('input[placeholder="John"]')
    expect(firstNameInput).not.toBeNull()
  })

  test('handles user update/edit submission successfully', async () => {
    mockUpdateUser.mockResolvedValueOnce({ message: 'Updated successfully' })
    const component = await mountSuspended(UsersPage)
    const vm = component.vm as any
    await component.vm.$nextTick()

    const testUser = { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@example.com', role: 'Courier' }

    vm.openEditModal(testUser)
    await component.vm.$nextTick()

    expect(vm.isModalOpen).toBe(true)
    expect(vm.editingUser.firstName).toBe('John')

    vm.editingUser.firstName = 'Jonathan'
    await vm.handleSaveUser()

    expect(mockUpdateUser).toHaveBeenCalledWith(1, expect.objectContaining({
      firstName: 'Jonathan',
      email: 'john@example.com'
    }))
    expect(vm.isModalOpen).toBe(false)
    expect(mockFetchUsers).toHaveBeenCalledTimes(2)
  })

  test('filters users and allows clearing filters', async () => {
    const component = await mountSuspended(UsersPage)
    const vm = component.vm as any

    vm.handleSearchInput('John')
    await component.vm.$nextTick()

    expect(vm.searchQuery).toBe('John')
    expect(mockFetchUsers).toHaveBeenCalledWith(expect.objectContaining({ search: 'John' }))

    // Clear filters
    vm.clearAllFilters()
    await component.vm.$nextTick()

    expect(vm.searchQuery).toBe('')
    expect(vm.selectedRole).toBeUndefined()
  })

  test('handles user creation submission successfully', async () => {
    mockCreateUser.mockResolvedValueOnce({ success: true })
    const component = await mountSuspended(UsersPage)
    const vm = component.vm as any

    vm.openCreateModal()
    await component.vm.$nextTick()

    vm.newUser.firstName = 'Alice'
    vm.newUser.lastName = 'Smith'
    vm.newUser.email = 'alice@example.com'

    await vm.handleCreateUser()

    expect(mockCreateUser).toHaveBeenCalledWith(expect.objectContaining({
      email: 'alice@example.com'
    }))
    expect(mockFetchUsers).toHaveBeenCalledTimes(2)
  })

  test('triggers delete confirmation modal and calls delete service', async () => {
    const component = await mountSuspended(UsersPage)
    const vm = component.vm as any
    await component.vm.$nextTick()

    const testUser = { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@example.com', role: 'Courier' }

    vm.openDeleteModal(testUser)
    await component.vm.$nextTick()

    expect(vm.isDeleteModalOpen).toBe(true)
    expect(vm.deletingUser.id).toBe(1)

    mockDeleteUser.mockResolvedValueOnce({ success: true })
    await vm.handleConfirmDelete()

    expect(mockDeleteUser).toHaveBeenCalledWith(1)
    expect(vm.isDeleteModalOpen).toBe(false)
  })
})