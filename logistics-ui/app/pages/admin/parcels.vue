<script setup lang="ts">
import { ref, onMounted } from 'vue'

const router = useRouter()

onMounted(() => {
  if (!localStorage.getItem('admin_token')) router.push('/admin/login')
})

definePageMeta({
  title: 'Parcel Management'
})
</script>

<template>
  <div class="space-y-6 text-white">
    <div class="flex justify-between items-center bg-gray-800 p-6 rounded-xl border border-gray-700">
      <div>
        <h1 class="text-2xl font-bold">Parcel & Waybill Tracking</h1>
        <p class="text-sm text-gray-400">Monitor shipments, sorting batches, and delivery status.</p>
      </div>
      <button class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-semibold transition">
        + Generate Tracking Number
      </button>
    </div>

    <div class="bg-gray-800 p-6 rounded-xl border border-gray-700">
      <p class="text-gray-400">Parcel search and tracking logs will be displayed here...</p>
    </div>
  </div>
</template>