<script setup lang="ts">
import { ref, onMounted } from 'vue'

const router = useRouter()

const { logout } = useAuthService()

onMounted(() => {
  const token = localStorage.getItem('token')
  if (!token) {
    router.push('/admin/login')
  }
})

definePageMeta({
  title: 'Dashboard'
})
</script>

<template>
  <div class="space-y-6">
    <!-- Top Header Bar -->
    <div class="flex justify-between items-center bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-md">
      <div>
        <h1 class="text-2xl font-bold text-white">Admin Control Center</h1>
        <p class="text-sm text-gray-400 mt-1">Manage system operations, facilities, and personnel.</p>
      </div>
      <button @click="logout"
        class="rounded bg-red-600 px-4 py-2 text-sm text-white font-semibold hover:bg-red-700 transition">
        Logout
      </button>
    </div>

    <!-- Dashboard Cards / Content Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="rounded-xl bg-gray-800 p-6 border border-gray-700 shadow-md">
        <h2 class="text-xl font-semibold text-white mb-2">Welcome Back, Admin! 👋</h2>
        <p class="text-gray-300 text-sm">
          You are successfully logged into the secure admin portal. Use the navigation sidebar or future management
          tools below to control your logistics network.
        </p>
      </div>

      <div class="rounded-xl bg-gray-800 p-6 border border-gray-700 shadow-md">
        <h2 class="text-xl font-semibold text-white mb-2">Quick Actions</h2>
        <div class="flex gap-3 mt-4">
          <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition">
            Register Manager
          </button>
          <UButton label="Click Me" icon="i-lucide-rocket" color="primary" size="md" />
          <button class="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm font-medium transition">
            View Facilities
          </button>
        </div>
      </div>
    </div>
  </div>
</template>