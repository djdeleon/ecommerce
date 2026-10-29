export const useFacilityService = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.logisticsApi || 'http://localhost:8001'

  const getFacilities = async () => {
    const token = import.meta.client ? localStorage.getItem('admin_token') : null

    return await $fetch(`${apiBase}/facilities`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  }

  return { getFacilities }
}