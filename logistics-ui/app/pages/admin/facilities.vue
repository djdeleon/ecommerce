<script setup>
import { ref, onMounted } from 'vue'

const router = useRouter()

onMounted(() => {
  if (!localStorage.getItem('token')) router.push('/admin/login')
})

definePageMeta({
  title: 'Facility Management'
})

const { getFacilities } = useFacilityService()

const { data, pending, error } = await useAsyncData('facilities', async () => {
  const response = await getFacilities()
  console.log(response)

  return response.data.facilities || response
})
</script>

<template>
  <div class="space-y-6">
    <div v-if="pending" class="text-gray-400 text-center py-8">
      Retrieving Clients...
    </div>

    <div v-else-if="error" class="text-red-400 text-center py-8">
      Failed to load facilities: {{ error.message }}
    </div>

    <UTable v-else sticky :data="data || []" class="flex-1 max-h-8xl" />
  </div>
</template>