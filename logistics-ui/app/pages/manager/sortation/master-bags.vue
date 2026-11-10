<script setup lang="ts">
const { user, userToken, loadUser } = useAuthService()
const { getMasterBags, sealMasterBag, unbagMasterBag, getLabelUrl } = useMasterBagService()
const toast = useToast()

loadUser()

const router = useRouter()

if (!userToken.value) {
  router.push('/admin/login')
}

const { data: response, pending, refresh } = await useAsyncData('master-bags-list', async () => {
  return await getMasterBags()
}, {
  watch: [userToken]
})

const masterBags = computed(() => {
  const res: any = response.value
  return res?.data || res || []
})

async function handleSealBag(bagCode: string) {
  try {
    await sealMasterBag(bagCode)
    toast.add({
      title: 'Master Bag Sealed! 🔒',
      description: `Bag ${bagCode} has been successfully sealed and locked for dispatch.`,
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
    await refresh()
  } catch (err: any) {
    toast.add({
      title: 'Sealing Failed',
      description: err?.data?.message || 'Could not seal master bag.',
      color: 'error',
      icon: 'i-lucide-x-circle'
    })
  }
}

async function handleUnbag(bagCode: string) {
  try {
    await unbagMasterBag(bagCode)
    toast.add({
      title: 'Master Bag Unbagged! 📦',
      description: `Bag ${bagCode} unpacked. Parcels are now loose in hub inventory.`,
      color: 'success',
      icon: 'i-lucide-box-open'
    })
    await refresh()
  } catch (err: any) {
    toast.add({
      title: 'Unbag Failed',
      description: err?.data?.message || 'Could not unbag master bag.',
      color: 'error',
      icon: 'i-lucide-x-circle'
    })
  }
}

function printLabel(bagCode: string) {
  const url = getLabelUrl(bagCode)
  window.open(url, '_blank')
}
</script>

<template>
  <div class="p-6 sm:p-10 max-w-6xl mx-auto space-y-8">
    <header class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-primary">Master Bag Operations</h1>
        <p class="text-gray-400 font-medium">Inspect, seal, and print barcode labels for consolidated cargo bags.</p>
      </div>
      <UButton color="neutral" variant="subtle" icon="i-lucide-refresh-cw" @click="refresh()">
        Refresh Bags
      </UButton>
    </header>

    <!-- Master Bags Table Card -->
    <UCard class="p-6 space-y-4">
      <div class="flex justify-between items-center">
        <h2 class="text-xl font-bold text-white">Consolidated Cargo Bags</h2>
        <UBadge color="neutral" variant="subtle">{{ masterBags.length }} total bags</UBadge>
      </div>

      <div v-if="pending" class="text-center py-12 text-gray-400">
        <UIcon name="i-lucide-loader" class="w-6 h-6 animate-spin mx-auto mb-2" />
        <p>Loading master bags...</p>
      </div>

      <div v-else-if="masterBags.length === 0"
        class="text-center py-12 text-gray-500 border border-dashed border-gray-800 rounded-xl">
        <UIcon name="i-lucide-package-open" class="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p>No master bags created yet. Run the Sortation conveyor first!</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm text-gray-300">
          <thead class="bg-gray-800 text-gray-400 uppercase text-xs">
            <tr>
              <th class="p-3">Master Bag Code</th>
              <th class="p-3">Destination Facility</th>
              <th class="p-3">Total Parcels</th>
              <th class="p-3">Weight (g) / CBM</th>
              <th class="p-3">Status</th>
              <th class="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-800">
            <tr v-for="bag in masterBags" :key="bag.id" class="hover:bg-gray-800/50">
              <td class="p-3 font-mono text-indigo-400 font-bold">{{ bag.code }}</td>
              <td class="p-3">{{ bag.nextFacility?.name || 'Hub' }}</td>
              <td class="p-3 font-semibold">{{ bag.totalParcels }} parcels</td>
              <td class="p-3">{{ bag.totalWeight }}g / {{ bag.totalCbm }}m³</td>
              <td class="p-3">
                <UBadge :color="bag.status === 'Unbagged' ? 'neutral' : bag.status === 'Sealed' ? 'success' : 'info'"
                  variant="subtle">
                  {{ bag.status }}
                </UBadge>
              </td>
              <td class="p-3 text-right space-x-2">
                <UButton size="xs" color="neutral" variant="subtle" icon="i-lucide-printer"
                  @click="printLabel(bag.code)">
                  Print Label
                </UButton>
                <UButton v-if="bag.status === 'Open'" size="xs" color="primary" variant="solid" icon="i-lucide-lock"
                  @click="handleSealBag(bag.code)">
                  Seal Bag
                </UButton>
                <UButton v-if="bag.status === 'Delivered'" size="xs" color="secondary" variant="solid"
                  icon="i-lucide-box-open" @click="handleUnbag(bag.code)">
                  Unbag
                </UButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>
  </div>
</template>