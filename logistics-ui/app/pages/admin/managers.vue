<script setup>
definePageMeta({
  title: 'Managers Management'
})

const { getManagers } = useManagerService()

const { data, pending, error } = await useAsyncData('managers', async () => {
  const response = await getManagers()

  return response.data || response
})
</script>

<template>
  <div class="space-y-6">
    <div v-if="pending" class="text-gray-400 text-center py-8">
      Retrieving Managers...
    </div>

    <div v-else-if="error" class="text-red-400 text-center py-8">
      Failed to load managers: {{ error.message }}
    </div>

    <UTable v-else sticky :data="data || []" class="flex-1 max-h-8xl" />
  </div>
</template>