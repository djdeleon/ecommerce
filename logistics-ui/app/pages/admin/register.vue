<script setup lang="ts">
import { ref } from 'vue'

definePageMeta({
  layout: 'auth'
})

const { registerUser } = useAuthService()

const errorMessage = ref('')
const successMessage = ref('')
const loading = ref(false)
const router = useRouter()

const toast = useToast()

const state = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: ''
})

const handleAdminRegister = async () => {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await registerUser({
      firstName: state.firstName,
      lastName: state.lastName,
      email: state.email,
      password: state.password,
    })
    console.log(response)

    toast.add({
      title: 'Success',
      description: 'Admin registered successfully. Redirecting to login...',
    })

    successMessage.value = 'Admin registered successfully! Redirecting to login...'
    setTimeout(() => {
      router.push('/admin/login')
    }, 1500)

  } catch (error: any) {
    toast.add({
      title: 'Registration Failed',
      description: error.data?.message || 'Please check your inputs and try again.',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4">
    <UCard class="w-full max-w-md bg-gray-900 border-gray-800">
      <div class="space-y-6">
        <!-- Header -->
        <div class="text-center space-y-1">
          <UIcon name="i-lucide-user-plus" class="w-8 h-8 text-emerald-400 mx-auto" />
          <h2 class="text-xl font-bold text-gray-100">Create Admin Account</h2>
          <p class="text-sm text-gray-400">Register a new administrator to the logistics system.</p>
        </div>

        <!-- Form -->
        <UForm :state="state" @submit.prevent="handleAdminRegister" class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="First Name" name="firstName" required>
              <UInput v-model="state.firstName" placeholder="John" class="w-full" />
            </UFormField>

            <UFormField label="Last Name" name="lastName" required>
              <UInput v-model="state.lastName" placeholder="Doe" class="w-full" />
            </UFormField>
          </div>

          <UFormField label="Email" name="email" required>
            <UInput v-model="state.email" type="email" placeholder="admin@example.com" class="w-full" />
          </UFormField>

          <UFormField label="Password" name="password" required>
            <UInput v-model="state.password" type="password" placeholder="••••••••" class="w-full" />
          </UFormField>

          <UButton type="submit" block :loading="loading" label="Register Admin" />
        </UForm>

        <div class="text-center text-sm text-gray-400">
          Already have an account?
          <NuxtLink to="/admin/login" class="text-emerald-400 font-medium hover:underline">
            Login here
          </NuxtLink>
        </div>
      </div>
    </UCard>
  </div>
</template>