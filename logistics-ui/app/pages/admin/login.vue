<script setup>
// import * as z from 'zod'
// import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'

definePageMeta({
  layout: 'auth'
})

const { loginUser, setUser } = useAuthService()

const errorMessage = ref('')
const loading = ref(false)
const router = useRouter()

const toast = useToast()

const fields = [{
  name: 'email',
  type: 'email',
  label: 'Email',
  placeholder: 'Enter your email',
  required: true
}, {
  name: 'password',
  label: 'Password',
  type: 'password',
  placeholder: 'Enter your password',
  required: true
}, {
  name: 'remember',
  label: 'Remember me',
  type: 'checkbox'
}]

const providers = [{
  label: 'Google',
  icon: 'i-simple-icons-google',
  onClick: () => {
    toast.add({ title: 'Google', description: 'Login with Google' })
  }
}, {
  label: 'GitHub',
  icon: 'i-simple-icons-github',
  onClick: () => {
    toast.add({ title: 'GitHub', description: 'Login with GitHub' })
  }
}]

const handleAdminLogin = async (payload) => {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await loginUser({
      email: payload.data.email,
      password: payload.data.password,
    })

    setUser(response.data)

    toast.add({ title: 'Success', description: 'Logged in successfully!' })

    router.push('/admin/dashboard')
  } catch (error) {
    toast.add({
      title: 'Registration Failed',
      description: error.data?.message || 'Login failed. Please check your credentials.',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

// const schema = z.object({
//   email: z.email('Invalid email'),
//   password: z.string('Password is required').min(8, 'Must be at least 8 characters')
// })

// type Schema = z.output<typeof schema>
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4">
    <UPageCard class="w-full max-w-md">
      <div v-if="errorMessage" class="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">
        {{ errorMessage }}
      </div>

      <UAuthForm title="Admin Portal Login" description="Enter your credentials to access your account."
        icon="i-lucide-user" :fields="fields" :providers="providers" :loading="loading" @submit="handleAdminLogin" />

      <div class="text-center text-sm text-gray-400">
        Registered already?
        <NuxtLink to="/admin/register" class="text-emerald-400 font-medium hover:underline">
          Sign in here
        </NuxtLink>
      </div>
    </UPageCard>
  </div>
</template>
