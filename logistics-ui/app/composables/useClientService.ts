export const useClientService = () => {
  const config = useRuntimeConfig()
  const baseUrl = config.public.logisticsApi ?? 'http://localhost:8001'
  const apiBase = `${baseUrl}/api/v1`
  const { userToken } = useAuthService()

  const getHeaders = () => ({
    ...(userToken?.value ? { Authorization: `Bearer ${userToken.value}` } : {})
  })

  const getClients = async (params?: { search?: string; isActive?: boolean }) => {
    return await $fetch(`${apiBase}/clients`, {
      method: 'GET',
      params,
      headers: getHeaders()
    })
  }

  const getClientById = async (id: number) => {
    return await $fetch(`${apiBase}/clients/${id}`, {
      method: 'GET',
      headers: getHeaders()
    })
  }

  const createClient = async (payload: { name: string }) => {
    return await $fetch(`${apiBase}/clients`, {
      method: 'POST',
      body: payload,
      headers: getHeaders()
    })
  }

  const updateClient = async (id: number, payload: { name?: string; webhookUrl?: string; isActive?: boolean }) => {
    return await $fetch(`${apiBase}/clients/${id}`, {
      method: 'PUT',
      body: payload,
      headers: getHeaders()
    })
  }

  const deleteClient = async (id: number) => {
    return await $fetch(`${apiBase}/clients/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    })
  }

  return {
    getClients,
    getClientById,
    createClient,
    updateClient,
    deleteClient
  }
}