export const useTrackingNumberService = () => {
  const { userToken } = useAuthService()
  const config = useRuntimeConfig()
  const baseUrl = config.public.logisticsApi ?? 'http://localhost:8001'
  const apiBase = `${baseUrl}/api/v1`

  const getHeaders = (apiKey?: string) => {
    const headers: Record<string, string> = {}
    if (userToken.value) {
      headers['Authorization'] = `Bearer ${userToken.value}`
    }
    if (apiKey) {
      headers['x-api-key'] = apiKey
    }
    return headers
  }

  const getTrackingNumbers = async () => {
    return await $fetch(`${apiBase}/tracking-numbers`, {
      method: 'GET',
      headers: getHeaders(),
    })
  }

  const getTrackingNumberByNumber = async (number: string) => {
    return await $fetch(`${apiBase}/tracking-numbers/${number}`, {
      method: 'GET',
      headers: getHeaders(),
    })
  }

  const generateTrackingNumbers = async (payload: { size: number }, apiKey?: string) => {
    return await $fetch(`${apiBase}/tracking-numbers`, {
      method: 'POST',
      body: payload,
      headers: getHeaders(apiKey),
    })
  }

  return {
    getTrackingNumbers,
    getTrackingNumberByNumber,
    generateTrackingNumbers,
  }
}