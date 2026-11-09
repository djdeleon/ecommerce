export const useManifestService = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.logisticsApi || 'http://localhost:8001'
  const { userToken, loadUser } = useAuthService()

  loadUser()

  const getManifests = async () => {
    return await $fetch(`${apiBase}/manifests`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${userToken.value}`
      }
    })
  }

  const createManifest = async (payload: any) => {
    return await $fetch(`${apiBase}/manifests`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userToken.value}`
      },
      body: payload
    })
  }

  const dispatchManifest = async (manifestCode: string) => {
    return await $fetch(`${apiBase}/manifests/${manifestCode}/dispatch`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${userToken.value}`
      }
    })
  }

  const completeManifest = async (manifestCode: string) => {
    return await $fetch(`${apiBase}/manifests/${manifestCode}/complete`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${userToken.value}`
      }
    })
  }

  const arriveManifest = async (manifestCode: string) => {
    return await $fetch(`${apiBase}/manifests/${manifestCode}/arrive`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${userToken.value}`
      }
    })
  }

  return { getManifests, createManifest, dispatchManifest, completeManifest, arriveManifest }
}