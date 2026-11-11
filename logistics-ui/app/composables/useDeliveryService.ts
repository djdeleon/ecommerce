export const useDeliveryService = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.logisticsApi || 'http://localhost:8001'
  const { userToken, loadUser } = useAuthService()

  loadUser()

  const getDeliveries = async () => {
    return await $fetch(`${apiBase}/deliveries`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${userToken.value}`
      }
    })
  }

  const createDelivery = async (payload: any) => {
    return await $fetch(`${apiBase}/deliveries`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userToken.value}`
      },
      body: payload
    })
  }

  const dispatchDelivery = async (deliveryCode: string) => {
    return await $fetch(`${apiBase}/deliveries/${deliveryCode}/dispatch`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${userToken.value}`
      }
    })
  }

  const completedDelivery = async (deliveryCode: string) => {
    return await $fetch(`${apiBase}/deliveries/${deliveryCode}/completed`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${userToken.value}`
      }
    })
  }

  const arrivedDelivery = async (deliveryCode: string) => {
    return await $fetch(`${apiBase}/deliveries/${deliveryCode}/arrived`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${userToken.value}`
      }
    })
  }

  return { getDeliveries, createDelivery, dispatchDelivery, completedDelivery, arrivedDelivery }
}