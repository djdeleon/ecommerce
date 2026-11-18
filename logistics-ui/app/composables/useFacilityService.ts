export const useFacilityService = () => {
  const config = useRuntimeConfig()
  const baseUrl = config.public.logisticsApi ?? 'http://localhost:8001'
  const apiBase = `${baseUrl}/api/v1`
  const { userToken } = useAuthService()

  const getHeaders = () => ({
    ...(userToken?.value ? { Authorization: `Bearer ${userToken.value}` } : {})
  })

  const getFacilities = async () => {
    return await $fetch(`${apiBase}/facilities`, {
      method: 'GET',
      headers: getHeaders()
    })
  }

  const getFacilityById = async (id: number) => {
    return await $fetch(`${apiBase}/facilities/${id}`, {
      method: 'GET',
      headers: getHeaders()
    })
  }

  const createFacility = async (payload: {
    name: string;
    type: string;
    address: string;
    longitude: number;
    latitude: number;
    parentId?: number | null;
  }) => {
    return await $fetch(`${apiBase}/facilities`, {
      method: 'POST',
      body: payload,
      headers: getHeaders()
    })
  }

  const updateFacility = async (id: number, payload: {
    name?: string;
    type?: string;
    address?: string;
    longitude?: number;
    latitude?: number;
    parentId?: number | null;
  }) => {
    return await $fetch(`${apiBase}/facilities/${id}`, {
      method: 'PUT',
      body: payload,
      headers: getHeaders()
    })
  }

  const deleteFacility = async (id: number) => {
    return await $fetch(`${apiBase}/facilities/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    })
  }

  const assignCourier = async (facilityId: number, userId: number) => {
    return await $fetch(`${apiBase}/facilities/${facilityId}/assign-courier`, {
      method: 'PATCH',
      body: { userId },
      headers: getHeaders()
    })
  }

  const getFacilityCouriers = async () => {
    return await $fetch(`${apiBase}/facilities/couriers`, {
      method: 'GET',
      headers: getHeaders()
    })
  }

  return {
    getFacilities,
    getFacilityById,
    createFacility,
    updateFacility,
    deleteFacility,
    assignCourier,
    getFacilityCouriers
  }
}