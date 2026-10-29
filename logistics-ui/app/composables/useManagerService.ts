export const useManagerService = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.logisticsApi || 'http://localhost:8001'

  const getManagers = async () => {
    return await $fetch(`${apiBase}/managers`, {
      method: 'GET'
    })
  }

  return { getManagers }
}