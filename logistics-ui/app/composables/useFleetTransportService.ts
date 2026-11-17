export const useFleetTransportService = () => {
  const config = useRuntimeConfig()
  const baseUrl = config.public.logisticsApi ?? 'http://localhost:8001'
  const apiBase = `${baseUrl}/api/v1`
  
  const { userToken } = useAuthService()

  const getHeaders = () => ({
    ...(userToken.value ? { Authorization: `Bearer ${userToken.value}` } : {})
  })

  const getFleetTransports = async () => {
    return await $fetch(`${apiBase}/fleet-transports`, {
      method: 'GET',
      headers: getHeaders()
    })
  }

  const getFleetTransportById = async (id: number) => {
    return await $fetch(`${apiBase}/fleet-transports/${id}`, {
      method: 'GET',
      headers: getHeaders()
    })
  }

  const getCourierTasks = async () => {
    return await $fetch(`${apiBase}/fleet-transports/tasks`, {
      method: 'GET',
      headers: getHeaders()
    })
  }

  const getFacilitySchedules = async () => {
    return await $fetch(`${apiBase}/fleet-transports/schedules`, {
      method: 'GET',
      headers: getHeaders()
    })
  }

  const getCreateData = async (query: string = '') => {
    return await $fetch(`${apiBase}/fleet-transports/create${query}`, {
      method: 'GET',
      headers: getHeaders()
    })
  }

  const createFleetTransport = async (payload: any) => {
    return await $fetch(`${apiBase}/fleet-transports`, {
      method: 'POST',
      body: payload,
      headers: getHeaders()
    })
  }

  const updateFleetTransport = async (id: number, payload: any) => {
    return await $fetch(`${apiBase}/fleet-transports/${id}`, {
      method: 'PUT',
      body: payload,
      headers: getHeaders()
    })
  }

  const deleteFleetTransport = async (id: number) => {
    return await $fetch(`${apiBase}/fleet-transports/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    })
  }

  const departSchedule = async (id: number) => {
    return await $fetch(`${apiBase}/fleet-transports/${id}/depart`, {
      method: 'POST',
      headers: getHeaders()
    })
  }

  const dispatchSchedule = async (id: number) => {
    return await $fetch(`${apiBase}/fleet-transports/${id}/dispatch`, {
      method: 'PATCH',
      headers: getHeaders()
    })
  }

  const arriveSchedule = async (id: number) => {
    return await $fetch(`${apiBase}/fleet-transports/${id}/arrive`, {
      method: 'PATCH',
      headers: getHeaders()
    })
  }

  const storeTelemetry = async (id: number, longitude: number, latitude: number) => {
    return await $fetch(`${apiBase}/fleet-transports/${id}/telemetry`, {
      method: 'POST',
      body: {
        longitude,
        latitude,
        speed: 40,
        heading: 90
      },
      headers: getHeaders()
    })
  }

  return { 
    getFleetTransports, 
    getFleetTransportById,
    getCourierTasks, 
    getFacilitySchedules, 
    getCreateData, 
    createFleetTransport, 
    updateFleetTransport, 
    deleteFleetTransport,
    departSchedule, 
    dispatchSchedule,
    arriveSchedule,
    storeTelemetry 
  }
}