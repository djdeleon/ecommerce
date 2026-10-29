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

  const user = useState<any>('auth_user', () => null)

  const setUser = (data: any) => {
    const token = data?.token
    const loggedInUser = data?.user

    if (!token || !loggedInUser) {
      throw new Error('Invalid response structure from server.')
    }

    if (import.meta.client) {
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(loggedInUser))
    }

    user.value = loggedInUser
  }

  const loadUser = () => {
    if (import.meta.client && !user.value) {
      const stored = localStorage.getItem('user')
      if (stored) {
        user.value = JSON.parse(stored)
      }
    }
  }

  const logout = () => {
    user.value = null
    if (import.meta.client) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    navigateTo('/admin/login')
  }

  return { registerUser, loginUser, user, setUser, loadUser, logout }
}