<script setup lang="ts">
import * as maplibregl from 'maplibre-gl'

const { user, userToken, loadUser } = useAuthService()
const { getCourierSchedules, departSchedule, storeTelemetry } = useCourierScheduleService()
const { markAsPickedUp, markAsDelivered } = useParcelService()
const { dispatchManifest, completeManifest, arriveManifest } = useManifestService()
const { dispatchDelivery, completedDelivery, arrivedDelivery } = useDeliveryService()
const { dispatchMasterBag, deliverMasterBag } = useMasterBagService()
const toast = useToast()

const router = useRouter()
const departingId = ref<number | null>(null)
const activeRoutes = ref<Record<number, any>>({})
const activeStatuses = ref<Record<number, string>>({})
const activeScheduleType = ref<string>('Accumulation')
const maps = ref<Record<number, any>>({})
const markers = ref<Record<number, any>>({})
const simulatingId = ref<number | null>(null)
const simulatingLineHaulId = ref<number | null>(null)

const isModalOpen = ref(false)
const activeScheduleId = ref<number | null>(null)
const activeParcel = ref<any | null>(null)
const activeStoreName = ref('')
const activeSegmentIndex = ref(0)
const activeProgress = ref(0)
const activeCoords = ref<[number, number][]>([])

onMounted(async () => {
  loadUser()

  if (!userToken.value) {
    router.push('/admin/login')
    return
  }

  await nextTick()

  console.log({ activeRoutes: activeRoutes.value })
  console.log(schedules)
  schedules.value.forEach((schedule: any) => {
    if (schedule.manifestStatus === 'Accumulating' && schedule.route) {
      initMap(schedule, schedule.route)
    }
  })
})

definePageMeta({
  layout: 'courier'
})

// Haversine formula to calculate distance in meters between two [lng, lat] points
function getDistanceFromLatLonInMeters(coord1: [number, number], coord2: [number, number]) {
  const R = 6371000 // Radius of the earth in meters
  const dLat = deg2rad(coord2[1] - coord1[1])
  const dLon = deg2rad(coord2[0] - coord1[0])
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(coord1[1])) * Math.cos(deg2rad(coord2[1])) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180)
}

// Use useAsyncData for clean reactive fetching and loading state management
const { data: response, pending, error, refresh } = await useAsyncData('courier-dashboard-tasks', async () => {
  const res = await getCourierSchedules()
  return res
}, {
  watch: [userToken]
})

const schedules = computed(() => (response.value as any)?.data || response.value || [])
console.log({ schedules: schedules.value })

async function handleStartDeparture(scheduleId: number) {
  departingId.value = scheduleId
  try {
    const res: any = await departSchedule(scheduleId)

    const currentSchedule = schedules.value.find((s: any) => s.id === scheduleId)
    console.log({ currentSchedule })

    const manifestCode = currentSchedule?.manifestCodes || currentSchedule?.manifestCode
    if (manifestCode) {
      await dispatchManifest(manifestCode)
    }

    const deliveryCode = currentSchedule?.deliveryCode || currentSchedule?.deliveryCodes
    if (deliveryCode) {
      await dispatchDelivery(deliveryCode)
    }

    if (currentSchedule?.scheduledFor === 'LineHaul' && currentSchedule?.masterBags) {
      for (const bag of currentSchedule.masterBags) {
        await dispatchMasterBag(bag.code).catch(() => { })
      }
    }

    toast.add({
      title: 'Departure Confirmed',
      description: res.message || 'Route calculated and transit loaded successfully!',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })

    if (res.data?.route) {
      activeRoutes.value[scheduleId] = res.data.route
    }

    if (currentSchedule?.scheduledFor === 'Delivery') {
      activeStatuses.value[scheduleId] = 'Loading'
    } else {
      activeStatuses.value[scheduleId] = 'Accumulating'
    }

    await refresh()
    await nextTick()
    setTimeout(() => {
      const targetSchedule = schedules.value.find((s: any) => s.id === scheduleId)
      const routeGeo = res.data?.route || activeRoutes.value[scheduleId] || targetSchedule?.route
      if (targetSchedule && routeGeo) {
        initMap(targetSchedule, routeGeo)
      }
    }, 200)
  } catch (e: any) {
    delete activeStatuses.value[scheduleId]

    toast.add({
      title: 'Departure Failed',
      description: e?.data?.message || 'Could not initiate departure. Please try again.',
      color: 'error',
      icon: 'i-lucide-x-circle'
    })
  } finally {
    departingId.value = null
  }
}

const formatDateTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function initMap(schedule: any, routeGeoJson: any) {
  const scheduleId = schedule.id
  const containerId = `map-${scheduleId}`
  console.log({ containerId })
  if (document.getElementById(containerId) && !maps.value[scheduleId]) {
    const map = new maplibregl.Map({
      container: containerId,
      style: 'https://tiles.openfreemap.org/styles/bright',
      center: [120.99, 14.50], // Default center around Parañaque
      zoom: 13
    })

    map.on('load', () => {
      if (routeGeoJson) {
        map.addSource(`route-${scheduleId}`, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: routeGeoJson
          }
        })

        map.addLayer({
          id: `route-line-${scheduleId}`,
          type: 'line',
          source: `route-${scheduleId}`,
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#10b981',
            'line-width': 5
          }
        })

        // Fit bounds to route
        const coordinates = routeGeoJson.coordinates
        if (coordinates && coordinates.length > 0) {
          const bounds = new maplibregl.LngLatBounds()
          coordinates.forEach((coord: [number, number]) => bounds.extend(coord))
          map.fitBounds(bounds, { padding: 50 })

          console.log({ schedule })

          if (schedule?.parcels) {
            schedule.parcels.forEach((parcel: any, index: number) => {
              const locationCoord = schedule.scheduledFor === 'Delivery' ? parcel.customerLocation?.coordinates : parcel.store?.location?.coordinates
              const titleName = schedule.scheduledFor === 'Delivery' ? (parcel.customerName || 'Customer') : (parcel.store?.name || 'Seller')

              if (locationCoord) {
                const el = document.createElement('div')
                el.className = 'w-7 h-7 bg-amber-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold'
                el.innerHTML = `<span>${schedule.scheduledFor === 'Delivery' ? 'D' : 'S'}${index + 1}</span>`

                new maplibregl.Marker({ element: el })
                  .setLngLat(locationCoord)
                  .setPopup(new maplibregl.Popup().setHTML(`<div class="p-1 text-gray-900 font-bold text-xs">${schedule.scheduledFor === 'Delivery' ? 'Destination' : 'Warehouse'}: ${titleName}</div>`))
                  .addTo(map)
              }
            })
          }

          const el = document.createElement('div')
          el.className = 'w-8 h-8 bg-indigo-600 rounded-full border-2 border-white shadow-2xl flex items-center justify-center text-white'
          el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10 17h4V5H10v12z"/><path d="M4 17h2v-3H4v3z"/><path d="M18 17h2v-3h-2v3z"/><path d="M2 17h2v-3H2v3z"/><path d="M20 17h2v-3h-2v3z"/></svg>`

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat(coordinates[0])
            .setPopup(new maplibregl.Popup().setHTML('<div class="p-1 text-gray-900 font-bold text-xs">Assigned Vehicle Ready</div>'))
            .addTo(map)

          markers.value[scheduleId] = marker
        }
      }
    })

    maps.value[scheduleId] = map
  }
}

// Linear Interpolation helper between point A and point B
function interpolatePosition(p1: [number, number], p2: [number, number], t: number): [number, number] {
  const lng = p1[0] + (p2[0] - p1[0]) * t
  const lat = p1[1] + (p2[1] - p1[1]) * t
  return [lng, lat]
}

async function simulateManifestation(schedule: any) {
  const scheduleId = schedule.id
  activeScheduleType.value = schedule.scheduledFor || 'Accumulation'
  const map = maps.value[scheduleId]
  const marker = markers.value[scheduleId]
  const routeGeoJson = activeRoutes.value[scheduleId] || schedule.route

  if (!map || !marker || !routeGeoJson?.coordinates) {
    toast.add({ title: 'Simulation Error', description: 'Route not loaded on map.', color: 'error' })
    return
  }

  simulatingId.value = scheduleId

  toast.add({ title: 'Simulation Started', description: 'Vehicle gliding smoothly along OSRM route...', color: 'info' })


  const coords = routeGeoJson.coordinates
  console.log({ routeGeoJson, coords })
  let segmentIndex = activeScheduleId.value === scheduleId ? activeSegmentIndex.value : 0
  let progress = activeScheduleId.value === scheduleId ? activeProgress.value : 0
  const speedFactor = 2 // Adjust for smoother or faster movement
  let frameCount = 0

  const unpickedParcels = (schedule.parcels || []).filter((p: any) => p.status !== 'PickedUp')

  const interval = setInterval(async () => {
    if (segmentIndex < coords.length - 1) {
      const p1 = coords[segmentIndex]
      const p2 = coords[segmentIndex + 1]

      // Interpolate position between p1 and p2 based on progress (0 to 1)
      const currentPos = interpolatePosition(p1, p2, progress)

      marker.setLngLat(currentPos)
      map.panTo(currentPos)

      // Only check proximity after vehicle has moved past the initial start points (segmentIndex > 2)
      if (segmentIndex > 2) {
        // Check proximity to any unpicked store warehouses (~40 meters threshold)
        for (const parcel of unpickedParcels) {
          if (parcel.store?.location?.coordinates) {
            const storeCoord = parcel.store.location.coordinates // [lng, lat]
            const distance = getDistanceFromLatLonInMeters(currentPos, storeCoord)

            if (distance < 50) { // Within 50 meters of seller warehouse!
              clearInterval(interval)

              // Set modal state using clean refs
              activeScheduleId.value = scheduleId
              activeParcel.value = parcel
              activeStoreName.value = parcel.store.name || 'Seller Warehouse'
              activeSegmentIndex.value = segmentIndex
              activeProgress.value = progress
              activeCoords.value = coords
              isModalOpen.value = true

              toast.add({
                title: 'Arrived at Warehouse! 📦',
                description: `Vehicle arrived at ${parcel.store.name}. Awaiting parcel scan confirmation.`,
                color: 'warning',
                icon: 'i-lucide-map-pin'
              })
              return
            }
          }
        }
      }

      frameCount++
      if (frameCount % 10 === 0) {
        try {
          const response = await storeTelemetry(scheduleId, currentPos[0], currentPos[1])
          console.log({ response })
        } catch (err) {
          console.warn('Telemetry ping failed:', err)
        }
      }

      progress += speedFactor
      if (progress >= 1) {
        progress = 0
        segmentIndex++
      }

      console.log({ segmentIndex, progress })
    } else {
      clearInterval(interval)
      simulatingId.value = null

      try {
        const manifestCode = schedule.manifestCodes || schedule.manifestCode
        if (manifestCode) {
          // Mark manifest as Arrived when vehicle gets back to the facility
          await arriveManifest(manifestCode)
        }

        activeStatuses.value[scheduleId] = 'Arrived'
        schedule.manifestStatus = 'Arrived'

        toast.add({
          title: 'First-Mile Mission Completed! 🎉',
          description: 'Vehicle returned to hub. Manifest Completed & parcels marked ArrivedAtOriginHub!',
          color: 'success',
          icon: 'i-lucide-check-circle'
        })

        await refresh()
      } catch (err) {
        toast.add({ title: 'Completion Failed', description: 'Could not finalize manifest completion.', color: 'error' })
      }

      toast.add({
        title: 'Pickup Completed! 🎉',
        description: 'Vehicle successfully arrived at destination.',
        color: 'success',
        icon: 'i-lucide-check-circle'
      })
    }
  }, 30) // 30ms for buttery-smooth 60fps-like animation // I think I have to adjust this as well when the speedFactor is adjusted
}

async function confirmParcelPickup() {
  const parcel = activeParcel.value
  const scheduleId = activeScheduleId.value
  if (!parcel || !scheduleId) return

  try {
    await markAsPickedUp(parcel.trackingNumber)

    toast.add({
      title: 'Parcel Picked Up! ✅',
      description: `Tracking ${parcel.trackingNumber} status updated to PickedUp.`,
      color: 'success',
      icon: 'i-lucide-check-check'
    })

    const schedule = schedules.value.find((s: any) => s.id === scheduleId)
    if (schedule && schedule.parcels) {
      const found = schedule.parcels.find((p: any) => p.id === parcel.id)
      if (found) {
        found.status = 'PickedUp'
      }
    }

    isModalOpen.value = false

    const remainingUnpicked = (schedule?.parcels || []).filter((p: any) => p.status !== 'PickedUp')
    if (remainingUnpicked.length === 0) {
      try {
        const manifestCode = schedule.manifestCodes || schedule.manifestCode
        if (manifestCode) {
          await completeManifest(manifestCode)
          toast.add({
            title: 'Manifest Completed! 🏁',
            description: 'All parcels collected. Manifest marked as Completed!',
            color: 'success',
            icon: 'i-lucide-flag'
          })
        }
      } catch (err: any) {
        console.warn('Manifest completion trigger failed:', err)
      }
    }

    if (schedule) {
      simulateManifestation(schedule)
    }
  } catch (err) {
    toast.add({ title: 'Update Failed', description: 'Could not update parcel status.', color: 'error' })
  }
}

async function simulateLineHaul(schedule: any) {
  const scheduleId = schedule.id
  const map = maps.value[scheduleId]
  const marker = markers.value[scheduleId]
  const routeGeoJson = activeRoutes.value[scheduleId] || schedule.route

  if (!map || !marker || !routeGeoJson?.coordinates) {
    toast.add({ title: 'Simulation Error', description: 'Route not loaded on map.', color: 'error' })
    return
  }

  simulatingLineHaulId.value = scheduleId
  toast.add({ title: 'Line-Haul Transit Started 🚚', description: 'Vehicle gliding along overland highway route...', color: 'info' })

  const coords = routeGeoJson.coordinates
  let segmentIndex = 0
  let progress = 0
  const speedFactor = 1.5
  let frameCount = 0

  const interval = setInterval(async () => {
    if (segmentIndex < coords.length - 1) {
      const p1 = coords[segmentIndex]
      const p2 = coords[segmentIndex + 1]

      const currentPos = interpolatePosition(p1, p2, progress)

      marker.setLngLat(currentPos)
      map.panTo(currentPos)

      frameCount++
      if (frameCount % 10 === 0) {
        try {
          await storeTelemetry(scheduleId, currentPos[0], currentPos[1])
        } catch (err) {
          console.warn('Line-Haul telemetry ping failed:', err)
        }
      }

      progress += speedFactor
      if (progress >= 1) {
        progress = 0
        segmentIndex++
      }
    } else {
      clearInterval(interval)
      simulatingLineHaulId.value = null

      try {
        const bagIds = (schedule.masterBags || []).map((b: any) => b.code)

        // Call dedicated delivered endpoint for each master bag (cascades parcels to ArrivedAtHub)
        for (const bagCode of bagIds) {
          await deliverMasterBag(bagCode).catch(() => { })
        }

        activeStatuses.value[scheduleId] = 'Arrived'

        toast.add({
          title: 'Line-Haul Arrived at Destination! 🎉',
          description: 'Vehicle successfully reached destination hub. Master bags marked as Delivered & parcels updated!',
          color: 'success',
          icon: 'i-lucide-check-circle'
        })

        await refresh()
      } catch (err) {
        toast.add({ title: 'Arrival Update Failed', description: 'Could not update master bags destination status.', color: 'error' })
      }
    }
  }, 30)
}

const pendingSchedules = computed(() => {
  return schedules.value.filter((s: any) => {
    const status = s.manifestStatus || s.status
    return status !== 'Arrived' && status !== 'Completed'
  })
})

async function simulateDelivery(schedule: any) {
  const scheduleId = schedule.id
  activeScheduleType.value = schedule.scheduledFor || 'Delivery'
  const routeGeoJson = activeRoutes.value[scheduleId] || schedule.route
  let map = maps.value[scheduleId]
  let marker = markers.value[scheduleId]

  if (!map && routeGeoJson) {
    initMap(schedule, routeGeoJson)
    await nextTick()
    map = maps.value[scheduleId]
    marker = markers.value[scheduleId]
  }

  if (!map || !marker || !routeGeoJson?.coordinates) {
    toast.add({ title: 'Simulation Error', description: 'Route not loaded on map.', color: 'error' })
    return
  }

  simulatingId.value = scheduleId
  toast.add({ title: 'Delivery Started 🚚', description: 'Vehicle navigating delivery route...', color: 'info' })

  const coords = routeGeoJson.coordinates
  let segmentIndex = activeScheduleId.value === scheduleId ? activeSegmentIndex.value : 0
  let progress = activeScheduleId.value === scheduleId ? activeProgress.value : 0
  const speedFactor = 1
  let frameCount = 0

  const undeliveredParcels = (schedule.parcels || []).filter((p: any) => p.status !== 'Delivered')

  const interval = setInterval(async () => {
    if (segmentIndex < coords.length - 1) {
      const p1 = coords[segmentIndex]
      const p2 = coords[segmentIndex + 1]

      const currentPos = interpolatePosition(p1, p2, progress)

      marker.setLngLat(currentPos)
      map.panTo(currentPos)

      if (segmentIndex > 2 && undeliveredParcels.length > 0) {
        for (const parcel of undeliveredParcels) {
          if (parcel.customerLocation?.coordinates) {
            const customerCoord = parcel.customerLocation.coordinates
            const distance = getDistanceFromLatLonInMeters(currentPos, customerCoord)

            if (distance < 50) {
              clearInterval(interval)

              activeScheduleId.value = scheduleId
              activeParcel.value = parcel
              activeStoreName.value = parcel.customerName || 'Customer Drop'
              activeSegmentIndex.value = segmentIndex
              activeProgress.value = progress
              activeCoords.value = coords
              isModalOpen.value = true

              toast.add({
                title: 'Arrived at Customer Location! 📦',
                description: `Vehicle arrived at ${parcel.customerName}'s address. Confirming drop-off.`,
                color: 'warning',
                icon: 'i-lucide-map-pin'
              })
              return
            }
          }
        }
      }

      frameCount++
      if (frameCount % 10 === 0) {
        try {
          await storeTelemetry(scheduleId, currentPos[0], currentPos[1])
        } catch (err) {
          console.warn('Delivery telemetry ping failed:', err)
        }
      }

      progress += speedFactor
      if (progress >= 1) {
        progress = 0
        segmentIndex++
      }
    } else {
      // Vehicle has arrived back at the facility (end of route)
      clearInterval(interval)
      simulatingId.value = null

      try {
        const deliveryCode = schedule.deliveryCode
        if (deliveryCode) {
          await arrivedDelivery(deliveryCode)
        }

        activeStatuses.value[scheduleId] = 'Arrived'
        schedule.deliveryStatus = 'Arrived'

        toast.add({
          title: 'Vehicle Arrived Back at Facility! 🎉',
          description: 'Delivery run fully completed and vehicle checked in.',
          color: 'success',
          icon: 'i-lucide-check-circle'
        })

        await refresh()
      } catch (err: any) {
        toast.add({ 
          title: 'Arrival Failed', 
          description: err?.data?.message || 'Could not finalize vehicle arrival.', 
          color: 'error' 
        })
      }
    }
  }, 30)
}

async function confirmParcelDelivery() {
  const parcel = activeParcel.value
  const scheduleId = activeScheduleId.value
  if (!parcel || !scheduleId) return

  try {
    await markAsDelivered(parcel.trackingNumber)

    toast.add({
      title: 'Parcel Delivered! ✅',
      description: `Tracking ${parcel.trackingNumber} status updated to Delivered.`,
      color: 'success',
      icon: 'i-lucide-check-check'
    })

    const schedule = schedules.value.find((s: any) => s.id === scheduleId)
    if (schedule && schedule.parcels) {
      const found = schedule.parcels.find((p: any) => p.id === parcel.id)
      if (found) {
        found.status = 'Delivered'
      }
    }

    isModalOpen.value = false

    // Check if this was the last undelivered parcel
    const remainingUndelivered = (schedule?.parcels || []).filter((p: any) => p.status !== 'Delivered')
    if (remainingUndelivered.length === 0) {
      try {
        const deliveryCode = schedule.deliveryCode || schedule.deliveryCodes
        if (deliveryCode) {
          await completedDelivery(deliveryCode)
          schedule.deliveryStatus = 'Completed'
          
          toast.add({
            title: 'Delivery Run Completed! 🏁',
            description: 'All parcels delivered. Delivery marked as Completed! Vehicle returning to hub.',
            color: 'success',
            icon: 'i-lucide-flag'
          })
        }
      } catch (err: any) {
        console.warn('Delivery completion trigger failed:', err)
      }
    }

    if (schedule) {
      simulateDelivery(schedule)
    }
  } catch (err) {
    toast.add({ title: 'Update Failed', description: 'Could not update parcel status.', color: 'error' })
  }
}
</script>

<template>
  <div class="p-6 sm:p-10 max-w-5xl mx-auto space-y-8">
    <!-- Arrival Modal Confirmation -->
    <!-- <UModal v-model:open="isModalOpen">
      <template #content>
        <UCard class="p-6 space-y-4 bg-gray-900 border border-gray-700">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
              <UIcon name="i-lucide-warehouse" class="w-6 h-6" />
            </div>
            <div>
              <h3 class="text-lg font-bold text-white">Driver Arrived at Warehouse</h3>
              <p class="text-sm text-gray-400">{{ activeStoreName }}</p>
            </div>
          </div>

          <div class="bg-gray-800 p-4 rounded-xl space-y-2 border border-gray-700">
            <p class="text-xs text-gray-400 font-medium">ASSIGNED PARCEL:</p>
            <p class="text-indigo-400 font-mono font-bold">{{ activeParcel?.trackingNumber }}</p>
            <p class="text-sm text-gray-300">Customer: <span class="text-white font-semibold">{{
              activeParcel?.customerName }}</span></p>
          </div>

          <div class="flex gap-3 pt-2">
            <UButton block color="primary" icon="i-lucide-scan-line" @click="confirmParcelPickup">
              Scan & Confirm Pickup
            </UButton>
          </div>
        </UCard>
      </template>
    </UModal> -->

    <UModal v-model:open="isModalOpen">
      <template #content>
        <UCard class="p-6 space-y-4 bg-gray-900 border border-gray-700">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
              <UIcon :name="activeScheduleType === 'Delivery' ? 'i-lucide-map-pin' : 'i-lucide-warehouse'" class="w-6 h-6" />
            </div>
            <div>
              <h3 class="text-lg font-bold text-white">
                {{ activeScheduleType === 'Delivery' ? 'Driver Arrived at Customer Location' : 'Driver Arrived at Warehouse' }}
              </h3>
              <p class="text-sm text-gray-400">{{ activeStoreName }}</p>
            </div>
          </div>

          <div class="bg-gray-800 p-4 rounded-xl space-y-2 border border-gray-700">
            <p class="text-xs text-gray-400 font-medium">ASSIGNED PARCEL:</p>
            <p class="text-indigo-400 font-mono font-bold">{{ activeParcel?.trackingNumber }}</p>
            <p class="text-sm text-gray-300">Customer: <span class="text-white font-semibold">{{
              activeParcel?.customerName }}</span></p>
          </div>

          <div class="flex gap-3 pt-2">
            <UButton v-if="activeScheduleType === 'Delivery'" block color="primary" icon="i-lucide-check-circle" @click="confirmParcelDelivery">
              Confirm Customer Drop-Off
            </UButton>
            <UButton v-else block color="primary" icon="i-lucide-scan-line" @click="confirmParcelPickup">
              Scan & Confirm Pickup
            </UButton>
          </div>
        </UCard>
      </template>
    </UModal>

    <header>
      <h1 class="text-3xl font-bold text-primary">Good morning, {{ user?.firstName || 'Courier' }}!</h1>
      <p class="text-gray-500 dark:text-gray-400 font-medium">Welcome back! You have {{ pendingSchedules.length }}
        pending
        task(s) today.</p>
    </header>

    <div class="grid gap-6">
      <div v-if="pending" class="text-center py-20 text-gray-400">
        <UIcon name="i-lucide-loader" class="w-8 h-8 animate-spin mx-auto mb-2" />
        <p>Loading your manifests...</p>
      </div>

      <div v-else-if="error" class="text-red-400 text-center py-8">
        Failed to load tasks: {{ error.message }}
      </div>

      <template v-else-if="schedules.length > 0">
        <UCard v-for="schedule in schedules" :key="schedule.id" class="p-6 space-y-4">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-building-2" class="w-5 h-5 text-primary" />
              <span class="font-bold text-lg text-white">{{ schedule.facilityName }}</span>
            </div>

            <div class="flex items-center gap-2">
              <!-- Mission Type Badge -->
              <UBadge color="primary" variant="subtle">
                {{ schedule.scheduledFor || schedule.type }}
              </UBadge>

              <!-- Dynamic Status Badge: Manifest Status for First-Mile, Master Bag Status for Line-Haul -->
              <UBadge
                :color="(activeStatuses[schedule.id] || schedule.manifestStatus || schedule.deliveryStatus) === 'Accumulating' || (activeStatuses[schedule.id] || schedule.manifestStatus || schedule.deliveryStatus) === 'Loading' ? 'warning' : 'info'"
                variant="outline">
                {{
                  schedule.scheduledFor === 'LineHaul'
                    ? (activeStatuses[schedule.id] === 'Arrived' ? 'Delivered' : (schedule.masterBags?.[0]?.status ||
                      'Scheduled'))
                    : schedule.scheduledFor === 'Delivery'
                      ? (activeStatuses[schedule.id] || schedule.deliveryStatus || 'Scheduled')
                      : (activeStatuses[schedule.id] || schedule.manifestStatus || 'Scheduled')
                }}
              </UBadge>
            </div>
          </div>

          <div class="text-sm text-gray-400 space-y-2 border-t border-gray-800 pt-3">
            <p><strong>Vehicle:</strong> {{ schedule.vehicleDetail }}</p>
            <p><strong>Scheduled Time:</strong> {{ formatDateTime(schedule.scheduledTime) }}</p>

            <p v-if="schedule.manifestCode || schedule.manifestCodes">
              <strong>Manifest Code:</strong>
              <span class="text-white font-mono ml-1">{{ schedule.manifestCode || schedule.manifestCodes }}</span>
            </p>
            <p v-else-if="schedule.deliveryCode || schedule.deliveryCodes">
              <strong>Delivery Code:</strong>
              <span class="text-white font-mono ml-1">{{ schedule.deliveryCode || schedule.deliveryCodes }}</span>
            </p>
            <p v-else-if="schedule.masterBags && schedule.masterBags.length > 0">
              <strong>Assigned Master Bags:</strong>
              <span class="text-secondary font-mono ml-1">
                {{schedule.masterBags.map((b: any) => b.code).join(', ')}}
              </span>
            </p>

            <!-- Parcels list preview -->
            <div v-if="schedule.parcels && schedule.parcels.length > 0" class="pt-2">
              <p class="font-bold text-gray-300 mb-1">Assigned Parcels ({{ schedule.parcels.length }}):</p>
              <div class="space-y-1 max-h-32 overflow-y-auto">
                <div v-for="parcel in schedule.parcels" :key="parcel.id"
                  class="flex justify-between bg-gray-900/60 p-2 rounded text-xs">
                  <span class="text-indigo-400 font-mono">{{ parcel.trackingNumber }}</span>
                  <span class="text-gray-400">{{ parcel.customerName }}</span>
                </div>
              </div>
            </div>

            <!-- Map container for First-Mile Accumulation OR Line-Haul Transit -->
            <div
              v-if="['Accumulating', 'Loading'].includes(activeStatuses[schedule.id] || schedule.manifestStatus || schedule.deliveryStatus) && (activeRoutes[schedule.id] || schedule.route)"
              class="rounded-xl overflow-hidden border border-gray-700 h-[600px] relative mt-4">
              <div :id="`map-${schedule.id}`" class="w-full h-full" />
            </div>

            <!-- First-Mile Simulation Button -->
            <UButton
              v-if="((activeStatuses[schedule.id] || schedule.manifestStatus) === 'Accumulating') && schedule.scheduledFor === 'Accumulation'"
              block color="secondary" variant="subtle" icon="i-lucide-play-circle"
              :loading="simulatingId === schedule.id" @click="simulateManifestation(schedule)">
              Simulate Manifestation (Run Vehicle Pickup)
            </UButton>

            <!-- Delivery Simulation Button -->
            <UButton
              v-else-if="((activeStatuses[schedule.id] || schedule.deliveryStatus) === 'Loading' || (activeStatuses[schedule.id] || schedule.deliveryStatus) === 'Accumulating') && schedule.scheduledFor === 'Delivery'"
              block color="secondary" variant="subtle" icon="i-lucide-truck" :loading="simulatingId === schedule.id"
              @click="simulateDelivery(schedule)">
              Simulate Delivery Run (Run Customer Drops)
            </UButton>

            <!-- Line-Haul Transit Simulation Button -->
            <UButton
              v-else-if="((activeStatuses[schedule.id] || schedule.manifestStatus) === 'Accumulating') && schedule.scheduledFor === 'LineHaul' && (activeRoutes[schedule.id] || schedule.route)"
              block color="secondary" variant="subtle" icon="i-lucide-truck"
              :loading="simulatingLineHaulId === schedule.id" @click="simulateLineHaul(schedule)">
              Simulate Line-Haul Transit (Facility A → B)
            </UButton>

            <!-- First-Mile Success Banner -->
            <div
              v-if="schedule.scheduledFor !== 'LineHaul' && (activeStatuses[schedule.id] || schedule.manifestStatus) === 'Arrived'"
              class="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-xl flex items-center gap-3 text-emerald-400 mt-4">
              <UIcon name="i-lucide-check-circle-2" class="w-6 h-6 shrink-0" />
              <div>
                <p class="font-bold">Accumulation Completed Successfully!</p>
                <p class="text-xs text-emerald-300/80">Vehicle arrived back at the hub. All parcels processed and marked
                  as ArrivedAtOriginHub.</p>
              </div>
            </div>

            <!-- Line-Haul Success Banner (Triggers when Line-Haul transit finishes and status is Arrived) -->
            <div
              v-else-if="schedule.scheduledFor === 'LineHaul' && (activeStatuses[schedule.id] === 'Arrived' || schedule.masterBags?.[0]?.status === 'Delivered')"
              class="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-xl flex items-center gap-3 text-emerald-400 mt-4">
              <UIcon name="i-lucide-check-circle-2" class="w-6 h-6 shrink-0" />
              <div>
                <p class="font-bold">Line-Haul Transit Completed Successfully!</p>
                <p class="text-xs text-emerald-300/80">Vehicle arrived at destination hub. Master bags marked as
                  Delivered.</p>
              </div>
            </div>

            <!-- Simple Virtual Gate Departure Trigger -->
            <div
              v-if="!activeStatuses[schedule.id] && (!schedule.manifestStatus || schedule.manifestStatus === 'Scheduled') && !schedule.route && !activeRoutes[schedule.id]"
              class="pt-4 border-t border-gray-800">
              <UButton block color="primary" icon="i-lucide-door-open" @click="handleStartDeparture(schedule.id)">
                {{
                  schedule.scheduledFor === 'LineHaul'
                    ? 'Start Line-Haul Departure & Load Route'
                    : schedule.scheduledFor === 'Delivery'
                      ? 'Start Delivery Departure & Calculate Route'
                      : 'Start Departure & Calculate Route'
                }}
              </UButton>
            </div>
          </div>
        </UCard>
      </template>

      <UCard v-else
        class="border-2 border-dashed border-gray-200 dark:border-gray-800 bg-transparent flex flex-col items-center justify-center py-20 text-gray-400 text-center">
        <UIcon name="i-lucide-package-search" class="w-12 h-12 mb-2 opacity-20" />
        <p>No active manifests assigned yet.</p>
      </UCard>
    </div>
  </div>
</template>