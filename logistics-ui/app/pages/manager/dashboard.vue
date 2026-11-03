<script setup>
import * as maplibregl from 'maplibre-gl'
const { getFacility } = useFacilityService()
const { user } = useAuthService()

onMounted(async () => {
  const { data, pending, error } = await useAsyncData('facility', async () => {
    const assignedFacilityId = user.value.assignedFacilityId

    const response = await getFacility(assignedFacilityId)
    console.log({ response })
    return response
  })

  console.log(data.value)


  const networkData = data.value?.data || data.value
  const currentFacility = networkData || {}
  const currentSectors = currentFacility.sectors || []

  // Combine Parent (if any) and Children into a single "Connected Facilities" list!
  const parentFacility = currentFacility.parent ? [currentFacility.parent] : []
  const childrenFacilities = currentFacility.children || []
  const connectedFacilities = [...parentFacility, ...childrenFacilities]
  const centerCoords = currentFacility.location?.coordinates || [121.08, 14.60]

  const map = new maplibregl.Map({
    container: 'map-container',
    style: 'https://tiles.openfreemap.org/styles/bright',
    center: centerCoords,
    zoom: 10.5
  })

  map.on('load', () => {
    // ==========================================
    // MAIN FACILITY (EMERALD THEME 🟢)
    // ==========================================
    const currentSectorFeatures = currentSectors.map((sector) => ({
      type: 'Feature',
      geometry: sector.zone,
      properties: { name: sector.code }
    }))

    if (currentSectorFeatures.length > 0) {
      map.addSource('current-sectors-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: currentSectorFeatures }
      })
      map.addLayer({
        id: 'current-sector-fills',
        type: 'fill',
        source: 'current-sectors-source',
        paint: { 'fill-color': '#10b981', 'fill-opacity': 0.25 } // Emerald fill
      })
      map.addLayer({
        id: 'current-sector-borders',
        type: 'line',
        source: 'current-sectors-source',
        paint: { 'line-color': '#059669', 'line-width': 2 } // Emerald border
      })
    }

    if (currentFacility.location) {
      map.addSource('current-facility-source', {
        type: 'geojson',
        data: {
          type: 'Feature', geometry: currentFacility.location, properties: {
            name: currentFacility.name,
            type: currentFacility.type
          }
        }
      })
      map.addLayer({
        id: 'current-facility-point',
        type: 'circle',
        source: 'current-facility-source',
        paint: {
          'circle-radius': [
            'match',
            ['get', 'type'],
            'mega_gateway', 12,
            'distribution_center', 9,
            6 // default size for local_branch
          ],
          'circle-color': '#059669',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      })
    }

    // ==========================================
    // CONNECTED FACILITIES (AMBER/ORANGE THEME 🟠)
    // (Includes both Parents and Children)
    // ==========================================
    const connectedSectorFeatures = connectedFacilities.flatMap(facility =>
      (facility.sectors || []).map(sector => ({ type: 'Feature', geometry: sector.zone, properties: { name: sector.code } }))
    )

    if (connectedSectorFeatures.length > 0) {
      map.addSource('connected-sectors-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: connectedSectorFeatures }
      })
      map.addLayer({
        id: 'connected-sector-fills',
        type: 'fill',
        source: 'connected-sectors-source',
        paint: { 'fill-color': '#f59e0b', 'fill-opacity': 0.2 } // Amber fill
      })
      map.addLayer({
        id: 'connected-sector-borders',
        type: 'line',
        source: 'connected-sectors-source',
        paint: { 'line-color': '#d97706', 'line-width': 2 } // Amber border
      })
    }

    const connectedPointFeatures = connectedFacilities
      .filter(facility => facility.location && facility.location.coordinates)
      .map(facility => ({
        type: 'Feature',
        geometry: facility.location,
        properties: {
          name: facility.name,
          type: facility.type
        }
      }))

    if (connectedPointFeatures.length > 0) {
      map.addSource('connected-facilities-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: connectedPointFeatures }
      })
      map.addLayer({
        id: 'connected-facilities-points',
        type: 'circle',
        source: 'connected-facilities-source',
        paint: {
          'circle-radius': [
            'match',
            ['get', 'type'],
            'mega_gateway', 12,
            'distribution_center', 9,
            6 // default size for local_branch
          ],
          'circle-color': '#f59e0b',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      })
    }

    // ==========================================
    // PARCELS (INDIGO THEME 🔮)
    // ==========================================
    const parcels = currentFacility.parcels || []

    const parcelFeatures = parcels.map((parcel) => {
      // Determine physical coordinates based on state
      let coords = null
      if (parcel.contextualStatus === 'Pending Pickup' && parcel.store?.location) {
        coords = parcel.store.location.coordinates
      } else if (parcel.contextualStatus === 'At Hub') {
        // Offset slightly from the hub center so we can see both
        const base = currentFacility.location.coordinates
        coords = [base[0] + 0.0005, base[1] + 0.0005]
      }

      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: coords },
        properties: {
          trackingNumber: parcel.trackingNumber,
          status: parcel.status,
          contextualStatus: parcel.contextualStatus,
          storeName: parcel.store?.name
        }
      }
    }).filter(f => f.geometry.coordinates !== null)

    if (parcelFeatures.length > 0) {
      map.addSource('parcels-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: parcelFeatures }
      })

      // Add a layer for the Parcel Icon (Indigo Circle for now)
      map.addLayer({
        id: 'parcel-points',
        type: 'circle',
        source: 'parcels-source',
        paint: {
          'circle-radius': 7,
          'circle-color': '#6366f1', // Indigo 500
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      })

      // Add dynamic labels for Tracking Numbers
      map.addLayer({
        id: 'parcel-labels',
        type: 'symbol',
        source: 'parcels-source',
        layout: {
          'text-field': ['get', 'contextualStatus'],
          'text-font': ['Open Sans Semibold'],
          'text-offset': [0, 1.5],
          'text-anchor': 'top',
          'text-size': 10
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#1e293b',
          'text-halo-width': 1
        }
      })
    }

    // INTERACTIVITY: Click parcel to see details
    map.on('click', 'parcel-points', (e) => {
      const props = e.features[0].properties
      new maplibregl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(`
          <div class="p-2 text-gray-900">
            <p class="font-bold border-b mb-1">${props.trackingNumber}</p>
            <p class="text-xs"><b>Status:</b> ${props.status}</p>
            <p class="text-xs"><b>Context:</b> ${props.contextualStatus}</p>
            <p class="text-xs"><b>Store:</b> ${props.storeName}</p>
          </div>
        `)
        .addTo(map)
    })

    // Change cursor on hover
    map.on('mouseenter', 'parcel-points', () => map.getCanvas().style.cursor = 'pointer')
    map.on('mouseleave', 'parcel-points', () => map.getCanvas().style.cursor = '')
  })
})
</script>

<template>
  <div class="h-[700px] w-full rounded-xl overflow-hidden border border-gray-800">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold">Interactive Facility Map</h2>
          <!-- <UButton icon="i-heroicons-map" color="primary" variant="solid">Map Actions</UButton> -->
        </div>
      </template>

      <div class="h-[700px]">
        <div id="map-container" class="h-full w-full" />
      </div>
    </UCard>
  </div>

</template>