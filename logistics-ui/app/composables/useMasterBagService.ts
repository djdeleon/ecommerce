export interface MasterBag {
  id: number
  code: string
  sortingBatchId: number
  courierScheduleId?: number
  currentFacilityId: number
  nextFacilityId: number
  totalWeight: number
  totalCbm: number
  totalParcels: number
  status: 'Open' | 'Full' | 'Sealed' | 'Dispatched' | 'Delivered' | 'Unbagged'
  sealedAt?: string
  currentFacility?: any
  nextFacility?: any
  sortingBatch?: any
  parcels?: any[]
  logs?: any[]
  createdAt: string
  updatedAt: string
}

export const useMasterBagService = () => {
  const config = useRuntimeConfig()
  const baseUrl = config.public.logisticsApi ?? 'http://localhost:8001'
  const apiBase = `${baseUrl}/api/v1`
  const { userToken } = useAuthService()

  const getHeaders = () => ({
    ...(userToken?.value ? { Authorization: `Bearer ${userToken.value}` } : {})
  })

  const getMasterBags = async () => {
    return await $fetch<{ message: string; data: MasterBag[] }>(`${apiBase}/master-bags`, {
      method: 'GET',
      headers: getHeaders()
    })
  }

  const createMasterBag = async (payload: Partial<MasterBag>) => {
    return await $fetch<{ message: string; data: MasterBag }>(`${apiBase}/master-bags`, {
      method: 'POST',
      body: payload,
      headers: getHeaders()
    })
  }

  const getMasterBagById = async (id: number | string) => {
    return await $fetch<{ message: string; data: MasterBag }>(`${apiBase}/master-bags/${id}`, {
      method: 'GET',
      headers: getHeaders()
    })
  }

  const updateMasterBag = async (id: number | string, payload: Partial<MasterBag>) => {
    return await $fetch<{ message: string; data: MasterBag }>(`${apiBase}/master-bags/${id}`, {
      method: 'PUT',
      body: payload,
      headers: getHeaders()
    })
  }

  const deleteMasterBag = async (id: number | string) => {
    return await $fetch<{ message: string }>(`${apiBase}/master-bags/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    })
  }

  const sealMasterBag = async (code: string) => {
    return await $fetch<{ message: string; data: MasterBag }>(`${apiBase}/master-bags/${code}/seal`, {
      method: 'PATCH',
      headers: getHeaders()
    })
  }


  const dispatchMasterBag = async (code: string) => {
    return await $fetch<{ message: string; data: MasterBag }>(`${apiBase}/master-bags/${code}/dispatched`, {
      method: 'PATCH',
      headers: getHeaders()
    })
  }

  const deliverMasterBag = async (code: string) => {
    return await $fetch<{ message: string; data: MasterBag }>(`${apiBase}/master-bags/${code}/delivered`, {
      method: 'PATCH',
      headers: getHeaders()
    })
  }

  const unbagMasterBag = async (code: string) => {
    return await $fetch<{ message: string; data: MasterBag }>(`${apiBase}/master-bags/${code}/unbag`, {
      method: 'PATCH',
      headers: getHeaders()
    })
  }

  const getLabelUrl = (code: string) => {
    return `${apiBase}/master-bags/${code}/label`
  }

  return {
    getMasterBags,
    createMasterBag,
    getMasterBagById,
    updateMasterBag,
    deleteMasterBag,
    sealMasterBag,
    dispatchMasterBag,
    deliverMasterBag,
    unbagMasterBag,
    getLabelUrl,
  }
}