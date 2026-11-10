export const useSortationService = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.logisticsApi || 'http://localhost:8001'
  const { userToken, loadUser } = useAuthService()

  loadUser()

  const tunnelScanParcel = async (trackingNumber: string) => {
    return await $fetch(`${apiBase}/sortation-batches/${trackingNumber}/tunnel-scan`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userToken.value}`
      }
    })
  }

  const createSortationBatch = async (payload: any) => {
    return await $fetch(`${apiBase}/sortation-batches`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userToken.value}`
      },
      body: payload
    })
  }

  const completeSortationBatch = async (sortingBatchId: number | string) => {
    return await $fetch(`${apiBase}/sortation-batches/${sortingBatchId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${userToken.value}`
      },
      body: {
        status: 'Completed',
        completedAt: new Date().toISOString()
      }
    })
  }

  return { tunnelScanParcel, createSortationBatch, completeSortationBatch }
}