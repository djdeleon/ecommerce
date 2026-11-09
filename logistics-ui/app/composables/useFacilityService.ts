export const useFacilityService = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.logisticsApi || 'http://localhost:8001'
  const { userToken, loadUser } = useAuthService()

  loadUser()

  const getFacilities = async () => {
    return await $fetch(`${apiBase}/facilities`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${userToken.value}`
      }
    })
  }

  const getFacility = async (facilityId: string | number) => {
    return await $fetch(`${apiBase}/facilities/${facilityId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${userToken.value}`
      }
    })
  }

  return { getFacilities, getFacility }
}