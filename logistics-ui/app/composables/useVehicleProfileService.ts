export interface GetVehicleProfilesParams {
  search?: string
  q?: string
  status?: string
}

export interface VehicleProfilePayload {
  brand: string
  modelName: string
  variant?: string
  maxWeightCapacityG: number
  maxUsableVolumeCbm: number
  allocationVolumeTarget?: number
  lengthMm?: number
  widthMm?: number
  heightMm?: number
  type?: string
}

export const useVehicleProfileService = () => {
  const config = useRuntimeConfig()
  const baseUrl = config.public.logisticsApi ?? 'http://localhost:8001'
  const apiBase = `${baseUrl}/api/v1`

  const { userToken } = useAuthService()

  const getHeaders = () => ({
    ...(userToken?.value ? { Authorization: `Bearer ${userToken.value}` } : {})
  })

  const getVehicleProfiles = async (params?: GetVehicleProfilesParams) => {
    return await $fetch(`${apiBase}/vehicle-profiles`, {
      method: 'GET',
      params,
      headers: getHeaders(),
    })
  }

  const getVehicleProfileById = async (id: number | string) => {
    return await $fetch(`${apiBase}/vehicle-profiles/${id}`, {
      method: 'GET',
      headers: getHeaders(),
    })
  }

  const createVehicleProfile = async (payload: VehicleProfilePayload) => {
    return await $fetch(`${apiBase}/vehicle-profiles`, {
      method: 'POST',
      body: payload,
      headers: getHeaders(),
    })
  }

  const updateVehicleProfile = async (id: number | string, payload: Partial<VehicleProfilePayload>) => {
    return await $fetch(`${apiBase}/vehicle-profiles/${id}`, {
      method: 'PUT',
      body: payload,
      headers: getHeaders(),
    })
  }

  const deleteVehicleProfile = async (id: number | string) => {
    return await $fetch(`${apiBase}/vehicle-profiles/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    })
  }

  return {
    getVehicleProfiles,
    getVehicleProfileById,
    createVehicleProfile,
    updateVehicleProfile,
    deleteVehicleProfile,
  }
}