export const useSectorService = () => {
  const config = useRuntimeConfig()
  const baseUrl = config.public.logisticsApi ?? 'http://localhost:8001'
  const apiBase = `${baseUrl}/api/v1`
  const { userToken } = useAuthService()

  const getHeaders = () => ({
    ...(userToken?.value ? { Authorization: `Bearer ${userToken.value}` } : {})
  })

  const getSectors = async (params?: { localBranchId?: string | number }) => {
    return await $fetch(`${apiBase}/sectors`, {
      method: 'GET',
      params,
      headers: getHeaders()
    })
  }

  const getSectorById = async (id: number) => {
    return await $fetch(`${apiBase}/sectors/${id}`, {
      method: 'GET',
      headers: getHeaders()
    })
  }

  const createSector = async (payload: {
    code: string
    localBranchId: number
    zone: {
      type: "Polygon"
      coordinates: number[][][]
    }
    barangayIds?: string[]
  }) => {
    return await $fetch(`${apiBase}/sectors`, {
      method: 'POST',
      body: payload,
      headers: getHeaders()
    })
  }

  const updateSector = async (id: number, payload: {
    code?: string
    localBranchId?: number
    zone?: {
      type: "Polygon"
      coordinates: number[][][]
    }
    barangayIds?: string[]
  }) => {
    return await $fetch(`${apiBase}/sectors/${id}`, {
      method: 'PUT',
      body: payload,
      headers: getHeaders()
    })
  }

  const deleteSector = async (id: number) => {
    return await $fetch(`${apiBase}/sectors/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    })
  }

  return {
    getSectors,
    getSectorById,
    createSector,
    updateSector,
    deleteSector
  }
}