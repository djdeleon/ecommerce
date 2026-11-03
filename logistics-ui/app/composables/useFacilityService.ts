export const useFacilityService = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.logisticsApi || 'http://localhost:8001'
  const { userToken, loadUser } = useAuthService()

  loadUser()

  const getFacilities = async () => {
    const token = import.meta.client ? localStorage.getItem('token') : null

    return await $fetch(`${apiBase}/facilities`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  }

  const getFacility = async (facilityId: string | number) => {
    return await $fetch(`${apiBase}/facilities/${facilityId}`, {
      method: 'GET',
      headers: {
        ...(userToken.value ? { Authorization: `Bearer ${userToken.value}` } : {})
      }
    })
  }

  return { getFacilities, getFacility }
}