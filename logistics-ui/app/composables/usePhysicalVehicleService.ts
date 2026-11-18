export interface PhysicalVehiclePayload {
  plateNumber: string
  vin?: string
  vehicleProfileId: number
  status: 'Available' | 'In Use' | 'Maintenance' | 'Inactive'
  currentMileage?: number
}

export const usePhysicalVehicleService = () => {
  const config = useRuntimeConfig()
  const baseUrl = config.public.logisticsApi ?? 'http://localhost:8001'
  const apiBase = `${baseUrl}/api/v1`
  const { userToken } = useAuthService()

  const getHeaders = () => ({
    ...(userToken?.value ? { Authorization: `Bearer ${userToken.value}` } : {})
  })

  const getPhysicalVehicles = async () => {
    return await $fetch(`${apiBase}/physical-vehicles`, {
      method: 'GET',
      headers: getHeaders(),
    })
  }

  const getPhysicalVehicleById = async (id: number | string) => {
    return await $fetch(`${apiBase}/physical-vehicles/${id}`, {
      method: 'GET',
      headers: getHeaders(),
    })
  }

  const createPhysicalVehicle = async (payload: PhysicalVehiclePayload) => {
    return await $fetch(`${apiBase}/physical-vehicles`, {
      method: 'POST',
      body: payload,
      headers: getHeaders(),
    })
  }

  const updatePhysicalVehicle = async (id: number | string, payload: Partial<PhysicalVehiclePayload>) => {
    return await $fetch(`${apiBase}/physical-vehicles/${id}`, {
      method: 'PUT',
      body: payload,
      headers: getHeaders(),
    })
  }

  const deletePhysicalVehicle = async (id: number | string) => {
    return await $fetch(`${apiBase}/physical-vehicles/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    })
  }

  const getStatusesPhysicalVehicles = async () => {
    return await $fetch(`${apiBase}/physical-vehicles/statuses`, {
      method: 'GET',
      headers: getHeaders(),
    })
  }

  return {
    getPhysicalVehicles,
    getPhysicalVehicleById,
    createPhysicalVehicle,
    updatePhysicalVehicle,
    deletePhysicalVehicle,
    getStatusesPhysicalVehicles,
  }
}