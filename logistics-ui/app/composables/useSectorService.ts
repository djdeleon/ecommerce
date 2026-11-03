export const useSectorService = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.logisticsApi || 'http://localhost:8001'

  const { userToken } = useAuthService()

  const getSectorsByFacility = async (facilityId: string | number) => {
    return await $fetch(`${apiBase}/facilities/${facilityId}/sectors`, {
      method: 'GET',
      headers: {
        ...(userToken ? { Authorization: `Bearer ${userToken}` } : {})
      }
    })
  }

  return { getSectorsByFacility }
}