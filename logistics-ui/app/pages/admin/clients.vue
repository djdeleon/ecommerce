<script setup>
const headerActions = useState('headerActions')

headerActions.value = h(UButton, {
  icon: 'i-heroicons-plus',
  label: 'New client',
  onClick: () => {
    alert('Open New Client Modal!')
  }
})

definePageMeta({
  title: 'Clients Management'
})

onUnmounted(() => {
  headerActions.value = null
})

const { getClients } = useClientService()

const { data, pending, error } = await useAsyncData('clients', async () => {
  const response = await getClients()

  return response.data || response
})
</script>

<template>
  <div class="space-y-6">
    <div v-if="pending" class="text-gray-400 text-center py-8">
      Retrieving Clients...
    </div>

    <div v-else-if="error" class="text-red-400 text-center py-8">
      Failed to load clients: {{ error.message }}
    </div>

    <UTable v-else sticky :data="data || []" class="flex-1 max-h-8xl" />
  </div>
</template>