<template>
  <div class="flex flex-col gap-4 h-full">
    <UCard>
      <div class="flex items-center gap-4">
        <div class="w-80">
          <USelectMenu v-model="selectedParcel" :items="parcels" label-key="trackingNumber"
            placeholder="Select a Parcel..." searchable>
            <template #default>
              <span v-if="selectedParcel" class="truncate">
                {{ selectedParcel.trackingNumber }}
              </span>
              <span v-else class="text-gray-400">Select a Parcel...</span>
            </template>
          </USelectMenu>
        </div>

        <div v-if="journeyData" class="flex gap-4 text-sm font-medium">
          <span class="text-gray-400">Tracking: <span class="text-white">{{ journeyData.trackingNumber }}</span></span>
          <UBadge color="primary" variant="subtle">{{ journeyData.status }}</UBadge>
        </div>
      </div>
    </UCard>

    <div class="flex-1 flex gap-4 min-h-[600px]">
      <!-- Map Area -->
      <div class="flex-1 bg-gray-800 rounded-xl overflow-hidden border border-gray-700 h-[600px] relative">
        <div id="journey-map" class="w-full h-full" />
      </div>

      <!-- Timeline Sidebar -->
      <div class="w-80 flex flex-col gap-4">
        <UCard v-if="journeyData" class="flex-1 overflow-y-auto">
          <template #header>
            <h3 class="font-bold text-gray-100">Routing Pipeline</h3>
          </template>
          <div class="space-y-6 relative">
            <div v-for="(cp, index) in journeyData.checkpoints" :key="index" class="flex gap-3 relative">
              <!-- Timeline vertical line -->
              <div v-if="index < journeyData.checkpoints.length - 1"
                class="absolute left-[11px] top-6 w-[2px] h-10 bg-gray-700" />

              <div class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold z-10" :class="{
                'bg-rose-500': cp.type === 'STORE',
                'bg-slate-500': cp.type === 'HUB',
                'bg-emerald-500': cp.type === 'CUSTOMER'
              }">
                {{ index + 1 }}
              </div>
              <div>
                <p class="text-sm font-bold text-gray-100">{{ cp.name }}</p>
                <p class="text-xs text-gray-400">{{ cp.type }} • {{ cp.status }}</p>
              </div>
            </div>
          </div>
        </UCard>
        <UCard v-else class="flex-1 flex items-center justify-center text-gray-500 italic text-center">
          Select a parcel to view its routing pipeline record.
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup>
import * as maplibregl from 'maplibre-gl'

definePageMeta({
  title: 'Parcel Journey & Map'
})

const { user } = useAuthService()
const { getFacility } = useFacilityService()

const parcels = ref([])
const selectedParcel = ref(null)
const map = ref(null)
const journeyData = ref(null)

const activeMarkers = []
let activeParcelMarker = null

onMounted(async () => {
  try {
    const response = await getFacility(user.value.assignedFacilityId)
    parcels.value = response.data?.parcels || []

    console.log('Parcels loaded into dropdown:', parcels.value)

    map.value = new maplibregl.Map({
      container: 'journey-map',
      style: 'https://tiles.openfreemap.org/styles/bright',
      center: [121.04, 14.50],
      zoom: 10
    })

    map.value.on('load', () => {
      map.value.resize()
    })
  } catch (err) {
    console.error('Initialization error:', err)
  }
})

watch(selectedParcel, async (newParcel) => {
  if (!newParcel || !newParcel.trackingNumber) return

  try {
    const response = await $fetch(`http://localhost:8001/parcels/${newParcel.trackingNumber}/journey`)
    const rawData = response.data || response

    // Assign to journeyData for sidebar timeline UI
    journeyData.value = rawData

    renderJourneyOnMap(rawData)
  } catch (err) {
    console.error('Failed to fetch journey:', err)
  }
})

function renderJourneyOnMap(rawData) {
  const checkpoints = rawData.checkpoints
  if (!map.value || !Array.isArray(checkpoints)) return

  // 1. CLEANUP: Wipe old markers and the parcel icon
  activeMarkers.forEach(m => m.remove())
  activeMarkers.length = 0
  if (activeParcelMarker) {
    activeParcelMarker.remove()
    activeParcelMarker = null
  }

  const validCheckpoints = checkpoints.filter(
    cp => Array.isArray(cp.coordinates) && cp.coordinates.length === 2
  )
  const coords = validCheckpoints.map(cp => [Number(cp.coordinates[0]), Number(cp.coordinates[1])])
  if (coords.length === 0) return

  // Wipe old map layers/sources
  if (map.value.getLayer('checkpoint-points')) map.value.removeLayer('checkpoint-points')
  if (map.value.getLayer('route-line')) map.value.removeLayer('route-line')
  if (map.value.getSource('journey-source')) map.value.removeSource('journey-source')

  map.value.addSource('journey-source', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: coords }
    }
  })

  map.value.addLayer({
    id: 'route-line',
    type: 'line',
    source: 'journey-source',
    paint: { 'line-color': '#6366f1', 'line-width': 3, 'line-dasharray': [2, 2] }
  })

  // Render Facility/Store Numbered Badges
  validCheckpoints.forEach((cp, index) => {
    const el = document.createElement('div')
    el.className = 'w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow border border-white'
    
    if (cp.type === 'STORE') el.classList.add('bg-rose-500')
    else if (cp.type === 'HUB') el.classList.add('bg-slate-500')
    else if (cp.type === 'CUSTOMER') el.classList.add('bg-emerald-500')

    el.innerText = index + 1

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([Number(cp.coordinates[0]), Number(cp.coordinates[1])])
      .addTo(map.value)

    activeMarkers.push(marker)
  })

  let currentCoords = null
  if (rawData.status === "ReadyForPickup") {
    currentCoords = validCheckpoints.find(cp => cp.type === 'STORE')?.coordinates
    console.log({currentCoords})
  } else {
    // If not at store, default to the first hub or current location logic
    currentCoords = validCheckpoints[1]?.coordinates 
  }

  if (currentCoords) {
    const parcelEl = document.createElement('div')
    parcelEl.className = 'w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-2xl border-2 border-white animate-pulse cursor-pointer'
    parcelEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16.5 9.4 7.55 4.24M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`

    activeParcelMarker = new maplibregl.Marker({ element: parcelEl })
      .setLngLat([Number(currentCoords[0]), Number(currentCoords[1])])
      .addTo(map.value)
  }

  // Fit bounds
  const bounds = new maplibregl.LngLatBounds()
  coords.forEach(c => bounds.extend(c))
  map.value.fitBounds(bounds, { padding: 80, maxZoom: 14 })
}
</script>
