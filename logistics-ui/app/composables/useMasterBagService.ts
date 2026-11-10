export const useMasterBagService = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.logisticsApi || 'http://localhost:8001'
  const { userToken, loadUser } = useAuthService()

  loadUser()

  const getMasterBags = async () => {
    return await $fetch(`${apiBase}/master-bags`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${userToken.value}`
      }
    })
  }

  const createMasterBag = async (payload: any) => {
    return await $fetch(`${apiBase}/master-bags`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userToken.value}`
      },
      body: payload
    })
  }

  const updateMasterBag = async (masterBagId: number | string, payload: any) => {
    return await $fetch(`${apiBase}/master-bags/${masterBagId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${userToken.value}`
      },
      body: payload
    })
  }

  const deleteMasterBag = async (masterBagId: number | string) => {
    return await $fetch(`${apiBase}/master-bags/${masterBagId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${userToken.value}`
      }
    })
  }

  const sealMasterBag = async (masterBagCode: string) => {
    return await $fetch(`${apiBase}/master-bags/${masterBagCode}/seal`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${userToken.value}`
      }
    })
  }

  const dispatchMasterBag = async (masterBagCode: string) => {
    return await $fetch(`${apiBase}/master-bags/${masterBagCode}/dispatched`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${userToken.value}` }
    })
  }

  const deliverMasterBag = async (masterBagCode: string) => {
    return await $fetch(`${apiBase}/master-bags/${masterBagCode}/delivered`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${userToken.value}` }
    })
  }

  const unbagMasterBag = async (masterBagCode: string) => {
    return await $fetch(`${apiBase}/master-bags/${masterBagCode}/unbag`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${userToken.value}` }
    })
  }

  const getLabelUrl = (masterBagCode: string) => {
    return `${apiBase}/master-bags/${masterBagCode}/label`
  }

  return {
    getMasterBags,
    createMasterBag,
    updateMasterBag,
    deleteMasterBag,
    sealMasterBag,
    dispatchMasterBag,
    deliverMasterBag,
    unbagMasterBag,
    getLabelUrl,
  }
}