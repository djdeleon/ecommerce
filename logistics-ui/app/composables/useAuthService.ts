export const useAuthService = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.logisticsApi || 'http://localhost:8001'

  const registerUser = async (payload: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => {
    return await $fetch(`${apiBase}/users/register`, {
      method: 'POST',
      body: payload
    })
  }

  const loginUser = async (payload: {
    email: string;
    password: string;
  }) => {
    return await $fetch(`${apiBase}/users/login`, {
      method: 'POST',
      body: payload
    })
  }

  return { registerUser, loginUser }
}