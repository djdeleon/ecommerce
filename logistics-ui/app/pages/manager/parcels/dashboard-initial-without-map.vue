<script setup>
const { user } = useAuthService()
const { getManifests } = useManifestService()

const { data: dashboardResponse, refresh, pending } = await useAsyncData('manifests', async () => {
  return await getManifests()
})

// Aligning to the backend structure: { data: { facility, availableVehicles, queue } }
const dashboard = computed(() => dashboardResponse.value?.data || {})
const facility = computed(() => dashboard.value.facility || {})
const queue = computed(() => dashboard.value.queue || [])
const vehicles = computed(() => dashboard.value.availableVehicles || [])

// UI State for Vehicle selection per sector
const selectedVehicles = ref({})

async function handleCreateManifest(sector) {
  const vehicleId = selectedVehicles.value[sector.originSectorId] || sector.selectedVehicle?.id
  
  if (!vehicleId) return alert('Please select a vehicle!')

  await $fetch('http://localhost:8001/manifests', {
    method: 'POST',
    body: {
      sectorId: sector.originSectorId,
      vehicleId: vehicleId,
      scheduledTime: new Date().toISOString(),
      parcelIds: sector.parcelIds,
      currentWeightGrams: sector.totalWeightGrams,
      currentVolumeCbm: sector.totalCbm
    }
  })

  await refresh()
}
</script>

<template>
  <div v-if="pending" class="p-12 text-center text-gray-500 italic">
    Loading Manifest Dashboard...
  </div>

  <div v-else class="space-y-6 p-6">
    <!-- 1. Facility Header -->
    <div class="flex justify-between items-end border-b border-gray-800 pb-4">
      <div>
        <h1 class="text-2xl font-bold text-white">{{ facility.name }}</h1>
        <p class="text-gray-400 text-sm">{{ facility.address }}</p>
      </div>
      <UBadge color="emerald" variant="subtle">{{ facility.type }}</UBadge>
    </div>

    <!-- 2. Accumulation Queue -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <UCard v-for="sector in queue" :key="sector.originSectorId" class="ring-1 ring-gray-800">
        <template #header>
          <div class="flex justify-between items-center">
            <span class="font-bold text-indigo-400">Sector ID: {{ sector.originSectorId }}</span>
            <UBadge color="amber" variant="outline">Pending Pickup</UBadge>
          </div>
        </template>

        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="bg-gray-900/50 p-3 rounded-lg text-center">
            <p class="text-[10px] uppercase text-gray-500 mb-1">Parcels</p>
            <p class="text-xl font-bold text-white">{{ sector.totalCount }}</p>
          </div>
          <div class="bg-gray-900/50 p-3 rounded-lg text-center">
            <p class="text-[10px] uppercase text-gray-500 mb-1">Weight</p>
            <p class="text-xl font-bold text-white">{{ (sector.totalWeightGrams / 1000).toFixed(1) }}kg</p>
          </div>
        </div>

        <div class="space-y-4">
          <!-- 🚀 FIXED: UFormGroup -> UFormField for Nuxt UI v3 -->
          <UFormField label="Assign Vehicle">
            <USelectMenu 
              v-model="selectedVehicles[sector.originSectorId]" 
              :items="vehicles"
              value-attribute="id"
              label-key="plateNumber"
              placeholder="Change assigned vehicle..." 
            />
          </UFormField>

          <div v-if="sector.selectedVehicle" class="flex items-center gap-3 p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
            <UIcon name="i-lucide-truck" class="text-indigo-400 w-5 h-5" />
            <div class="text-xs">
              <p class="font-bold text-indigo-300">System Suggested</p>
              <p class="text-white">
                {{ sector.selectedVehicle.vehicleProfile.modelName }} ({{ sector.selectedVehicle.plateNumber }})
              </p>
            </div>
          </div>
        </div>

        <template #footer>
          <UButton 
            block 
            color="primary" 
            icon="i-lucide-clipboard-check" 
            @click="handleCreateManifest(sector)"
          >
            Create Pickup Manifest
          </UButton>
        </template>
      </UCard>
    </div>

    <!-- 3. Empty State -->
    <div v-if="!queue.length" class="flex flex-col items-center justify-center py-20 bg-gray-900/30 rounded-xl border-2 border-dashed border-gray-800 text-gray-500">
      <UIcon name="i-lucide-package-search" class="w-12 h-12 mb-2 opacity-20" />
      <p>No parcels currently ready for pickup in your sectors.</p>
    </div>
  </div>
</template>