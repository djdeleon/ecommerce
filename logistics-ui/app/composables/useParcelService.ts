export const useParcelService = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.logisticsApi || 'http://localhost:8001'

  const markAsPickedUp = async (trackingNumber: string) => {
    return await $fetch(`${apiBase}/parcels/${trackingNumber}/picked-up`, {
      method: 'PATCH',
    })
  }

  return { markAsPickedUp }
}