export const useCourierScheduleService = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.logisticsApi || 'http://localhost:8001'
  const { userToken, loadUser } = useAuthService()

  loadUser()

  const getCourierSchedules = async () => {
    return await $fetch(`${apiBase}/courier-schedules`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${userToken.value}`
      }
    })
  }

  const createCourierSchedule = async (payload: any) => {
    return await $fetch(`${apiBase}/courier-schedules`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userToken.value}`
      },
      body: payload
    })
  }

  const updateCourierSchedule = async (courierScheduleId: number, payload: any) => {
    console.log({ courierScheduleId, payload })
    return await $fetch(`${apiBase}/courier-schedules/${courierScheduleId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${userToken.value}`
      },
      body: payload
    })
  }

  const departSchedule = async (courierScheduleId: number) => {
    return await $fetch(`${apiBase}/courier-schedules/${courierScheduleId}/depart`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userToken.value}`
      }
    })
  }

  const storeTelemetry = async (courierScheduleId: number, longitude: any, latitude: any) => {
    await $fetch(`${apiBase}/courier-schedules/${courierScheduleId}/telemetry`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken.value}` },
      body: {
        longitude,
        latitude,
        speed: 40,
        heading: 90
      }
    })
  }

  return { getCourierSchedules, createCourierSchedule, updateCourierSchedule, departSchedule, storeTelemetry }
}