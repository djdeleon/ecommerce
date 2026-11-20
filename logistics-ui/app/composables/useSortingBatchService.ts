export interface SortationBatch {
  id: number
  code: string
  startTime?: string
  endTime?: string
  cutOffTime: string
  facilityId: number
  status: 'Scheduled' | 'Active' | 'Completed' | 'Cancelled'
  completedAt?: string
  facility?: any
  _count?: { masterBags: number; looseParcels: number }
  createdAt: string
  updatedAt: string
}

export const useSortingBatchService = () => {
  const config = useRuntimeConfig()
  const baseUrl = config.public.logisticsApi ?? 'http://localhost:8001'
  const apiBase = `${baseUrl}/api/v1`
  const { userToken } = useAuthService()

  const getHeaders = () => ({
    ...(userToken?.value ? { Authorization: `Bearer ${userToken.value}` } : {})
  })

  const getSortingBatches = async () => {
    return await $fetch<{ message: string; data: SortationBatch[] }>(`${apiBase}/sorting-batches`, {
      method: 'GET',
      headers: getHeaders()
    })
  }

  const getSortingBatchById = async (id: number | string) => {
    return await $fetch<{ message: string; data: SortationBatch }>(`${apiBase}/sorting-batches/${id}`, {
      method: 'GET',
      headers: getHeaders()
    })
  }

  const createSortingBatch = async (payload: Partial<SortationBatch>) => {
    return await $fetch<{ message: string; data: SortationBatch }>(`${apiBase}/sorting-batches`, {
      method: 'POST',
      headers: getHeaders(),
      body: payload,
    })
  }

  const updateSortingBatch = async (id: number | string, payload: Partial<SortationBatch>) => {
    return await $fetch<{ message: string; data: SortationBatch }>(`${apiBase}/sorting-batches/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: payload,
    })
  }

  const deleteSortingBatch = async (id: number | string) => {
    return await $fetch<{ message: string }>(`${apiBase}/sorting-batches/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    })
  }

  const tunnelScan = async (trackingNumber: string) => {
    return await $fetch(`${apiBase}/sorting-batches/${trackingNumber}/tunnel-scan`, {
      method: 'POST',
      headers: getHeaders()
    })
  }

    const completeSortingBatch = async (sortingBatchId: number | string) => {
    return await $fetch(`${apiBase}/sortation-batches/${sortingBatchId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: {
        status: 'Completed',
        completedAt: new Date().toISOString()
      },
    })
  }

  return {
    getSortingBatches,
    getSortingBatchById,
    createSortingBatch,
    updateSortingBatch,
    deleteSortingBatch,
    tunnelScan,
    completeSortingBatch,
  }
}