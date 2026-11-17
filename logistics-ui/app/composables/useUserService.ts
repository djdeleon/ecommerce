export type UserRole = 'Admin' | 'Manager' | 'Clerk' | 'Courier'

export interface GetUsersParams {
  role?: UserRole
  assignedFacilityId?: string
  search?: string
}

export interface UpdateUserPayload {
  firstName?: string
  lastName?: string
  email?: string
  assignedFacilityId?: number | null
  role?: UserRole
}

export const useUserService = () => {
  const config = useRuntimeConfig()
  const baseUrl = config.public.logisticsApi ?? 'http://localhost:8001'
  const apiBase = `${baseUrl}/api/v1`

  const { userToken } = useAuthService()

  const getHeaders = () => ({
    ...(userToken?.value ? { Authorization: `Bearer ${userToken.value}` } : {})
  })

  const fetchUsers = async (params?: GetUsersParams) => {
    return await $fetch(`${apiBase}/users`, {
      method: 'GET',
      params,
      headers: getHeaders(),
    })
  }

  const fetchRoles = async () => {
    return await $fetch(`${apiBase}/users/roles`, {
      method: 'GET',
      headers: getHeaders(),
    })
  }

  const fetchUserById = async (id: number | string) => {
    return await $fetch(`${apiBase}/users/${id}`, {
      method: 'GET',
      headers: getHeaders(),
    })
  }

  const updateUser = async (id: number | string, payload: UpdateUserPayload) => {
    return await $fetch(`${apiBase}/users/${id}`, {
      method: 'PUT',
      body: payload,
      headers: getHeaders(),
    })
  }

  const deleteUser = async (id: number | string) => {
    return await $fetch(`${apiBase}/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    })
  }

  return {
    fetchUsers,
    fetchRoles,
    fetchUserById,
    updateUser,
    deleteUser,
  }
}