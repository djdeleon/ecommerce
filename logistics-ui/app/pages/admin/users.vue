<script setup lang="ts">
import { ref, onMounted } from 'vue'

const router = useRouter()
const users = ref([])

onMounted(() => {
  if (!localStorage.getItem('token')) router.push('/admin/login')
  // Fetch users list from backend here
})
</script>

<template>
  <div class="space-y-6 text-white">
    <div class="flex justify-between items-center bg-gray-800 p-6 rounded-xl border border-gray-700">
      <div>
        <h1 class="text-2xl font-bold">User Management</h1>
        <p class="text-sm text-gray-400">Manage admins, managers, and system personnel.</p>
      </div>
      <button class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-semibold transition">
        + Register New User
      </button>
    </div>

    <div class="bg-gray-800 p-6 rounded-xl border border-gray-700">
      <p class="text-gray-400">User table or list will be displayed here...</p>
    </div>
  </div>
</template>