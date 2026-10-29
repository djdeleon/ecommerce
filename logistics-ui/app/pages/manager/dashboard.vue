<script setup>
import * as maplibregl from 'maplibre-gl'

onMounted(() => {
  const map = new maplibregl.Map({
    container: 'map-container',
    style: 'https://tiles.openfreemap.org/styles/bright',
    center: [-77, 38.75],
    zoom: 5
  })

  map.on('load', () => {
    map.addSource('points', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [-77.032389, 38.913188] },
            properties: { title: 'Washington DC', icon: 'monument' }
          },
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [-79.9959, 40.4406] },
            properties: { title: 'Pittsburgh', icon: 'bridges' }
          },
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [-76.2859, 36.8508] },
            properties: { title: 'Norfolk', icon: 'harbor' }
          }
        ]
      }
    })

    map.addLayer({
      id: 'points',
      type: 'symbol',
      source: 'points',
      layout: {
        'icon-image': [
          'coalesce',
          ['image', ['concat', ['get', 'icon'], '_11']],
          ['image', 'marker_11']
        ],
        'text-field': ['get', 'title'],
        'text-font': ['Noto Sans Regular'],
        'text-offset': [0, 0.6],
        'text-anchor': 'top'
      }
    })
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