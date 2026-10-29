export const useClientService = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.logisticsApi || 'http://localhost:8001'

  const getClients = async () => {
    return await $fetch(`${apiBase}/clients`, {
      method: 'GET'
    })
  }

  return { getClients }
}