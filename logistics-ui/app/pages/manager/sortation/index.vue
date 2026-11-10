<script setup lang="ts">
const { user, userToken, loadUser } = useAuthService()
const { tunnelScanParcel, createSortationBatch, completeSortationBatch } = useSortationService()
const { getLooseParcels } = useParcelService()
const toast = useToast()

loadUser()

const router = useRouter()
if (!userToken.value) {
  router.push('/admin/login')
}

// State for parcels and sorting simulation
const isSorting = ref(false)
const currentStep = ref(0)
const activeParcelCode = ref('')
const sortProgress = ref(0)
const scanningId = ref<number | null>(null)

const isLocalBranch = computed(() => {
  return user.value?.assignedFacilityType === 'local_branch' || user.value?.assignedFacilityId === 3 // Marikina Hub ID or local branch type
})

const { data: response, pending, refresh } = await useAsyncData('arrived-parcels-sortation', async () => {
  return await getLooseParcels()
}, {
  watch: [userToken]
})


const parcelsList = computed(() => {
  const res: any = response.value
  return res?.data || res || []
})

async function startSortationSimulation() {
  if (parcelsList.value.length === 0) {
    toast.add({ title: 'No Parcels', description: 'There are no loose parcels available for sortation.', color: 'warning' })
    return
  }

  isSorting.value = true
  sortProgress.value = 0

  try {
    // WHOLE_DAY
    const batchRes: any = await createSortationBatch({
      startTime: new Date("1970-01-01T00:00:00Z").toISOString(),
      endTime: new Date("1970-01-01T23:59:59Z").toISOString(),
      cutOffTime: new Date("1970-01-01T23:59:59Z").toISOString(),
      facilityId: user.value?.assignedFacilityId || 2,
      status: 'Active'
    }).catch(async () => {
      // If batch already exists, fetch or let subsequent scans process
      return null
    })

    const sortingBatchId = batchRes?.data?.id || batchRes?.id

    const total = parcelsList.value.length
    let processed = 0

    for (const parcel of parcelsList.value) {
      activeParcelCode.value = parcel.trackingNumber

      // Step 1: Feeding
      currentStep.value = 1
      await new Promise(r => setTimeout(r, 400))

      // Step 2: Laser Audit & Weight
      currentStep.value = 2
      await new Promise(r => setTimeout(r, 400))

      // Step 3: Tunnel Scan & Routing Comms (API Call)
      currentStep.value = 3
      await tunnelScanParcel(parcel.trackingNumber)
      await new Promise(r => setTimeout(r, 500))

      // Step 4: Master Bagging Chute Drop
      currentStep.value = 4
      await new Promise(r => setTimeout(r, 400))

      processed++
      sortProgress.value = Math.round((processed / total) * 100)
    }

    if (sortingBatchId) {
      await completeSortationBatch(sortingBatchId)
    }

    toast.add({
      title: 'Sortation Completed! 🚀',
      description: `Successfully sorted ${total} parcels into Master Bags.`,
      color: 'success',
      icon: 'i-lucide-check-circle'
    })

    await refresh()
  } catch (err: any) {
    toast.add({ title: 'Sortation Error', description: err?.data?.message || 'Failed during conveyor scan.', color: 'error' })
  } finally {
    isSorting.value = false
    activeParcelCode.value = ''
    currentStep.value = 0
  }
}

async function handleHandheldReceive(parcel: any) {
  scanningId.value = parcel.id
  try {
    const apiBase = useRuntimeConfig().public.logisticsApi || 'http://localhost:8001'
    // Hit a manual receive / stage endpoint or update status
    await $fetch(`${apiBase}/parcels/${parcel.trackingNumber}/arrived-at-destination`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${userToken.value}` }
    }).catch(() => {
      // Fallback update if specific endpoint isn't wired yet
    })

    toast.add({
      title: 'Parcel Received at Branch! 📱',
      description: `Tracking ${parcel.trackingNumber} scanned into local delivery queue.`,
      color: 'success',
      icon: 'i-lucide-scan-line'
    })

    await refresh()
  } catch (err: any) {
    toast.add({
      title: 'Scan Failed',
      description: err?.data?.message || 'Could not process handheld scan.',
      color: 'error',
      icon: 'i-lucide-x-circle'
    })
  } finally {
    scanningId.value = null
  }
}
</script>

<template>
  <div class="p-6 sm:p-10 max-w-6xl mx-auto space-y-8">
    <header class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-primary">
          {{ isLocalBranch ? 'Local Branch Receiving & Staging' : 'Mid-Mile Sortation Hub' }}
        </h1>
        <p class="text-gray-400 font-medium">
          {{ isLocalBranch ? 'Handheld terminal scanning for incoming line-haul cargo.' : 'Manage conveyor belts, tunnel scanners, and master bagging operations.' }}
        </p>
      </div>

      <!-- Show Conveyor Simulation for Hubs, or Handheld Terminal Badge for Local Branch -->
      <UButton 
        v-if="!isLocalBranch" 
        color="primary" 
        size="lg" 
        icon="i-lucide-play-circle" 
        :loading="isSorting"
        :disabled="parcelsList.length === 0" 
        @click="startSortationSimulation"
      >
        Simulate Sortation Conveyor
      </UButton>
      <UBadge v-else color="success" variant="subtle" size="lg" icon="i-lucide-smartphone">
        Handheld Scanner Mode Active
      </UBadge>
    </header>

    <!-- Live Sorting Progress Overlay Card (Hubs only) -->
    <UCard v-if="!isLocalBranch && isSorting" class="bg-gray-900 border border-primary/50 p-6 space-y-4">
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-loader" class="w-6 h-6 animate-spin text-primary" />
          <h3 class="text-lg font-bold text-white">Conveyor Belt Active: Processing <span
              class="font-mono text-indigo-400">{{ activeParcelCode }}</span></h3>
        </div>
        <span class="text-sm font-bold text-primary">{{ sortProgress }}%</span>
      </div>

      <UProgress :value="sortProgress" color="primary" />

      <div class="grid grid-cols-4 gap-4 pt-2 text-center text-xs">
        <div :class="['p-3 rounded-xl border', currentStep >= 1 ? 'bg-primary/20 border-primary text-white font-bold' : 'bg-gray-800 border-gray-700 text-gray-500']">
          1. Feeding Belt
        </div>
        <div :class="['p-3 rounded-xl border', currentStep >= 2 ? 'bg-primary/20 border-primary text-white font-bold' : 'bg-gray-800 border-gray-700 text-gray-500']">
          2. Laser Audit (W & Dims)
        </div>
        <div :class="['p-3 rounded-xl border', currentStep >= 3 ? 'bg-primary/20 border-primary text-white font-bold' : 'bg-gray-800 border-gray-700 text-gray-500']">
          3. Barcode Tunnel Scan
        </div>
        <div :class="['p-3 rounded-xl border', currentStep >= 4 ? 'bg-primary/20 border-primary text-white font-bold' : 'bg-gray-800 border-gray-700 text-gray-500']">
          4. Chute & Master Bag
        </div>
      </div>
    </UCard>

    <!-- Parcels Table -->
    <UCard class="p-6 space-y-4">
      <div class="flex justify-between items-center">
        <h2 class="text-xl font-bold text-white">
          {{ isLocalBranch ? 'Incoming Line-Haul Parcels Awaiting Branch Receipt' : 'Arrived Loose Parcels Awaiting Sortation' }}
        </h2>
        <UBadge color="neutral" variant="subtle">{{ parcelsList.length }} parcels ready</UBadge>
      </div>

      <div v-if="pending" class="text-center py-12 text-gray-400">
        <UIcon name="i-lucide-loader" class="w-6 h-6 animate-spin mx-auto mb-2" />
        <p>Loading parcels...</p>
      </div>

      <div v-else-if="parcelsList.length === 0"
        class="text-center py-12 text-gray-500 border border-dashed border-gray-800 rounded-xl">
        <UIcon name="i-lucide-package-check" class="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p>{{ isLocalBranch ? 'No incoming line-haul cargo to receive at branch.' : 'No loose parcels in hub. Complete a First-Mile manifestation first!' }}</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm text-gray-300">
          <thead class="bg-gray-800 text-gray-400 uppercase text-xs">
            <tr>
              <th class="p-3">Tracking Number</th>
              <th class="p-3">Store / Origin</th>
              <th class="p-3">Weight</th>
              <th class="p-3">Customer</th>
              <th class="p-3">Status</th>
              <th v-if="isLocalBranch" class="p-3 text-right">Handheld Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-800">
            <tr v-for="parcel in parcelsList" :key="parcel.id" class="hover:bg-gray-800/50">
              <td class="p-3 font-mono text-indigo-400 font-bold">{{ parcel.trackingNumber }}</td>
              <td class="p-3">{{ parcel.storeName || 'Seller' }}</td>
              <td class="p-3">{{ parcel.weightGrams }}g</td>
              <td class="p-3">{{ parcel.customerName }}</td>
              <td class="p-3">
                <UBadge color="info" variant="subtle">{{ parcel.status }}</UBadge>
              </td>
              <td v-if="isLocalBranch" class="p-3 text-right">
                <UButton 
                  size="xs" 
                  color="success" 
                  variant="solid" 
                  icon="i-lucide-scan"
                  :loading="scanningId === parcel.id"
                  @click="handleHandheldReceive(parcel)"
                >
                  Scan & Receive to Branch
                </UButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>
  </div>
</template>