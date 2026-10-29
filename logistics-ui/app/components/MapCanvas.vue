<script setup>
import { onMounted, shallowRef, onBeforeUnmount } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const mapContainer = shallowRef(null)
const map = shallowRef(null)

onMounted(() => {
  map.value = new maplibregl.Map({
    container: mapContainer.value,
    style: 'https://openfreemap.org',
    center: [-77, 38.75],
    zoom: 5
  })

  map.value.on('load', () => {
    map.value.addSource('points', {
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

    map.value.addLayer({
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

// Clean up references to prevent memory leaks when changing routes
onBeforeUnmount(() => {
  if (map.value) {
    map.value.remove()
  }
})
</script>

<template>
  <div ref="mapContainer" class="w-full h-full min-h-[400px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800" />
</template>
