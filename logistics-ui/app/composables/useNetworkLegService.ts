export const useNetworkLegService = () => {
  const config = useRuntimeConfig()
  const baseUrl = config.public.logisticsApi ?? 'http://localhost:8001'
  const apiBase = `${baseUrl}/api/v1`
  const { userToken } = useAuthService()

  const getHeaders = () => ({
    ...(userToken?.value ? { Authorization: `Bearer ${userToken.value}` } : {})
  })

  const getNetworkLegs = async () => {
    return await $fetch(`${apiBase}/network-legs`, {
      method: 'GET',
      headers: getHeaders()
    })
  }

  const getNetworkLegById = async (id: number) => {
    return await $fetch(`${apiBase}/network-legs/${id}`, {
      method: 'GET',
      headers: getHeaders()
    })
  }

  const createNetworkLeg = async (payload: {
    sourceFacilityId: number
    destinationFacilityId: number
    laneCode: string
    route: {
      type: "LineString"
      coordinates: number[][]
    }
    distanceMtr: number
    vehicleProfile: string
    baseTransitDuration: number
    mode: string
    cutOffTime: string
  }) => {
    return await $fetch(`${apiBase}/network-legs`, {
      method: 'POST',
      body: payload,
      headers: getHeaders()
    })
  }

  const updateNetworkLeg = async (id: number, payload: {
    sourceFacilityId?: number
    destinationFacilityId?: number
    laneCode?: string
    route?: {
      type: "LineString"
      coordinates: number[][]
    }
    distanceMtr?: number
    vehicleProfile?: string
    baseTransitDuration?: number
    mode?: string
    cutOffTime?: string
  }) => {
    return await $fetch(`${apiBase}/network-legs/${id}`, {
      method: 'PUT',
      body: payload,
      headers: getHeaders()
    })
  }

  const deleteNetworkLeg = async (id: number) => {
    return await $fetch(`${apiBase}/network-legs/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    })
  }

  return {
    getNetworkLegs,
    getNetworkLegById,
    createNetworkLeg,
    updateNetworkLeg,
    deleteNetworkLeg
  }
}