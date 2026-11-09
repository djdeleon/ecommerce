<script setup>
import * as maplibregl from 'maplibre-gl'

import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date'

const df = new DateFormatter('en-US', {
  dateStyle: 'medium'
})

const { getManifests, createManifest } = useManifestService()
const toast = useToast()

const { data: dashboardResponse, refresh } = await useAsyncData('manifests', async () => {
  return await getManifests()
})

const dashboard = computed(() => dashboardResponse.value?.data || {})
const facility = computed(() => dashboard.value.facility || {})
console.log(facility.value)
const queue = computed(() => dashboard.value.queue || [])
const pendingParcels = computed(() => dashboard.value.pendingParcels || [])
const selectedVehicles = ref({})
const scheduledDates = ref({})
const scheduledTimes = ref({})

const map = ref(null)

onMounted(async () => {
  await nextTick()
  map.value = new maplibregl.Map({
    container: 'accumulation-map',
    style: 'https://tiles.openfreemap.org/styles/bright',
    center: facility.value.location?.coordinates || [121.04, 14.50],
    zoom: 11
  })

  map.value.on('load', renderMapLayers)
})

async function handleCreateManifest(sector) {
  // const courierId = selectedCouriers.value[sector.originSectorId]
  const sectorId = sector.originSectorId
  const vehicleId = selectedVehicles.value[sector.originSectorId] || sector.selectedVehicle?.id

  if (!vehicleId) {
    toast.add({
      title: 'Missing Vehicle',
      description: 'Please select a vehicle before creating the manifest.',
      color: 'yellow',
      icon: 'i-lucide-alert-triangle'
    })
    return
  }

  const calendarDate = scheduledDates.value[sectorId]
  const timeObj = scheduledTimes.value[sectorId]

  let chosenDate = new Date()
  if (calendarDate) {
    chosenDate = calendarDate.toDate(getLocalTimeZone())
  }

  if (timeObj) {
    chosenDate.setHours(timeObj.hour || 0)
    chosenDate.setMinutes(timeObj.minute || 0)
    chosenDate.setSeconds(timeObj.second || 0)
  }

  const payload = {
    sectorId,
    courierId: null,
    vehicleId: vehicleId,
    scheduledTime: chosenDate.toISOString(),
    parcelIds: sector.parcelIds,
    currentWeightGrams: sector.totalWeightGrams,
    currentVolumeCbm: sector.totalCbm
  }
  console.log({ payload })

  try {
    const response = await createManifest(payload)

    toast.add({
      title: 'Manifest Created',
      description: `Manifest ${response.data.code} has been successfully setup.`,
      color: 'green',
      icon: 'i-lucide-check-circle'
    })

    await refresh()

  } catch (err) {
    console.error('Manifest creation failed:', err)

    toast.add({
      title: 'Creation Failed',
      description: 'An error occurred while creating the manifest. Please try again.',
      color: 'red',
      icon: 'i-lucide-x-circle'
    })
  }

  await refresh()
}

function renderMapLayers() {
  if (!map.value) return

  if (facility.value.location?.coordinates) {
    const hubEl = document.createElement('div')
    hubEl.className = 'w-8 h-8 bg-emerald-600 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-white cursor-pointer z-10'
    hubEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M3 21h18M3 7l9-4 9 4v14H3V7z"/><path d="M9 21v-6h6v6"/></svg>`

    new maplibregl.Marker({ element: hubEl })
      .setLngLat(facility.value.location.coordinates)
      .setPopup(new maplibregl.Popup().setHTML(`
        <div class="p-2 text-gray-900">
          <p class="font-bold text-sm">${facility.value.name}</p>
          <p class="text-[10px] text-gray-500">Dispatch Center</p>
        </div>
      `))
      .addTo(map.value)
  }

  // Draw Sector Polygons (Zones)
  const sectorFeatures = (facility.value.sectors || []).map(s => ({
    type: 'Feature',
    geometry: s.zone,
    properties: { id: s.id, code: s.code }
  }))
  console.log({ sectorFeatures })
  console.log({ type: 'geojson', data: { type: 'FeatureCollection', features: sectorFeatures } })

  map.value.addSource('sectors', { type: 'geojson', data: { type: 'FeatureCollection', features: sectorFeatures } })
  map.value.addLayer({
    id: 'sector-fills',
    type: 'fill',
    source: 'sectors',
    paint: { 'fill-color': '#10b981', 'fill-opacity': 0.1 }
  })
  map.value.addLayer({
    id: 'sector-borders',
    type: 'line',
    source: 'sectors',
    paint: { 'line-color': '#10b981', 'line-width': 2 }
  })

  // Draw Pulsing Parcel Markers (Sellers)
  pendingParcels.value.forEach(p => {
    if (!p.location) return
    const el = document.createElement('div')
    el.className = 'w-4 h-4 bg-indigo-500 rounded-full border-2 border-white shadow-lg animate-pulse'

    new maplibregl.Marker({ element: el })
      .setLngLat(p.location)
      .setPopup(new maplibregl.Popup().setHTML(`<p class="text-xs text-gray-900 font-bold">${p.storeName}</p>`))
      .addTo(map.value)
  })
}

// Zoom to sector when card is clicked
function focusSector(sectorId) {
  const sector = facility.value.sectors.find(s => s.id === sectorId)
  if (sector?.zone?.coordinates) {
    const bounds = new maplibregl.LngLatBounds()
    sector.zone.coordinates[0].forEach(c => bounds.extend(c))
    map.value.fitBounds(bounds, { padding: 40 })
  }
}
</script>

<template>
  <div class="flex flex-col gap-4 h-screen">
    <div class="flex-none bg-gray-900 p-4 border-b border-gray-800">
      <h1 class="text-xl font-bold">{{ facility.name }} <span class="text-sm font-normal text-gray-500">Accumulation
          Control</span></h1>
    </div>

    <div class="flex flex-1 overflow-hidden p-4 gap-4">
      <!-- Left: Spatial View -->
      <div class="flex-1 bg-gray-800 rounded-xl overflow-hidden border border-gray-700 h-[600px] relative">
        <div id="accumulation-map" class="w-full h-full" />
      </div>

      <!-- Right: Operational Queue -->
      <div class="w-96 flex flex-col gap-4 overflow-y-auto">
        <UCard v-for="sector in queue" :key="sector.originSectorId"
          class="cursor-pointer transition-transform hover:scale-[1.02]" @click="focusSector(sector.originSectorId)">
          <template #header>
            <div class="flex justify-between items-center">
              <span class="font-bold text-indigo-400">Sector {{ sector.originSectorId }}</span>
              <UBadge color="amber" variant="subtle">{{ sector.totalCount }} Parcels</UBadge>
            </div>
          </template>

          <div class="space-y-4">
            <div class="flex justify-between text-xs">
              <span class="text-gray-500">Aggregate Weight:</span>
              <span class="text-white font-bold">{{ (sector.totalWeightGrams / 1000).toFixed(1) }}kg</span>
            </div>

            <UFormField label="Assign Vehicle">
              <USelectMenu :items="dashboard.availableVehicles" label-key="plateNumber" placeholder="Select Van..." />
            </UFormField>

            <div v-if="sector.selectedVehicle"
              class="flex items-center gap-3 p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
              <UIcon name="i-lucide-truck" class="text-indigo-400 w-5 h-5" />
              <div class="text-xs">
                <p class="font-bold text-indigo-300">System Suggested</p>
                <p class="text-white">
                  {{ sector.selectedVehicle.vehicleProfile.modelName }} ({{ sector.selectedVehicle.plateNumber }})
                </p>
              </div>
            </div>

            <UFormField label="Schedule Date">
              <UPopover>
                <UButton color="neutral" variant="subtle" icon="i-lucide-calendar" block class="justify-start">
                  {{ scheduledDates[sector.originSectorId] ?
                    df.format(scheduledDates[sector.originSectorId].toDate(getLocalTimeZone())) : 'Select date' }}
                </UButton>

                <template #content>
                  <UCalendar v-model="scheduledDates[sector.originSectorId]" class="p-2" />
                </template>
              </UPopover>
            </UFormField>

            <!-- Schedule Time Picker -->
            <UFormField label="Schedule Time" help="Specify the pickup time">
              <UInputTime v-model="scheduledTimes[sector.originSectorId]" />
            </UFormField>

            <UButton block color="primary" @click.stop="handleCreateManifest(sector)">
              Dispatch Pickup
            </UButton>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>