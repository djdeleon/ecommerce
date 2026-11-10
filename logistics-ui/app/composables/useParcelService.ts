export const useParcelService = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.logisticsApi || 'http://localhost:8001'
  const { userToken, loadUser } = useAuthService()

  loadUser()

  const getLooseParcels = async () => {
    return await $fetch(`${apiBase}/parcels/loose`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${userToken.value}`
      }
    })
  }

  const markAsPickedUp = async (trackingNumber: string) => {
    return await $fetch(`${apiBase}/parcels/${trackingNumber}/picked-up`, {
      method: 'PATCH',
    })
  }

  return { getLooseParcels, markAsPickedUp }
}