<script setup>
import { CalendarDate, Time, DateFormatter, getLocalTimeZone } from '@internationalized/date'

const toast = useToast()

const df = new DateFormatter('en-US', {
  dateStyle: 'medium'
})

const headerActions = useState('headerActions')

headerActions.value = h(UButton, {
  icon: 'i-heroicons-plus',
  label: 'New schedule',
  onClick: () => {
    alert('Open New Schedule Modal!')
  }
})

definePageMeta({
  title: 'Courier Schedules Management'
})

onUnmounted(() => {
  headerActions.value = null
})

const { user } = useAuthService()
const { getCourierSchedules, updateCourierSchedule } = useCourierScheduleService()
const { getFacility } = useFacilityService()

const { data: pageData, pending, error, refresh } = await useAsyncData('courier-dashboard', async () => {
  const [schedulesRes, facilityRes] = await Promise.all([
    getCourierSchedules(),
    getFacility(user.value.assignedFacilityId)
  ])
  console.log({ schedulesRes, facilityRes })

  return {
    schedules: schedulesRes.data || schedulesRes,
    couriers: facilityRes.data?.users?.filter(u => u.role === 'courier') || []
  }
})
console.log({ pageData })

const schedules = computed(() => pageData.value?.schedules || [])
const availableCouriers = computed(() => pageData.value?.couriers || [])

const assigningId = ref(null) // Track which row is currently saving
const editingScheduleId = ref({})
const updatingTimeId = ref(null)

const editDates = ref({})
const editTimes = ref({})

async function handleCourierAssignment(scheduleId, courier) {
  assigningId.value = scheduleId
  const courierId = courier.courier.id
  console.log({ scheduleId, courierId })
  try {
    await updateCourierSchedule(scheduleId, { courierId })
    toast.add({ title: 'Courier Assigned', color: 'green', icon: 'i-lucide-check' })
    await refresh()
  } catch (e) {
    toast.add({ title: 'Assignment Failed', color: 'red', icon: 'i-lucide-x' })
  } finally {
    assigningId.value = null
  }
}

async function handleScheduleTimeUpdate(scheduleId) {
  updatingTimeId.value = scheduleId
  const calendarDate = editDates.value[scheduleId]
  const timeObj = editTimes.value[scheduleId]

  let chosenDate = new Date()
  if (calendarDate) {
    chosenDate = calendarDate.toDate(getLocalTimeZone())
  }
  if (timeObj) {
    chosenDate.setHours(timeObj.hour || 0)
    chosenDate.setMinutes(timeObj.minute || 0)
    chosenDate.setSeconds(timeObj.second || 0)
  }

  console.log(scheduleId, { scheduledTime: chosenDate.toISOString() })

  try {
    await updateCourierSchedule(scheduleId, { scheduledTime: chosenDate.toISOString() })
    toast.add({ title: 'Schedule Updated', color: 'green', icon: 'i-lucide-check' })
    editingScheduleId.value[scheduleId] = false
    await refresh()
  } catch (e) {
    toast.add({ title: 'Update Failed', color: 'red', icon: 'i-lucide-x' })
  } finally {
    updatingTimeId.value = null
  }
}

const columns = [
  { id: 'id', accessorKey: 'id', header: 'ID' },
  { id: 'courierName', accessorKey: 'courierName', header: 'Courier' },
  { id: 'email', accessorKey: 'email', header: 'Email' },
  { id: 'vehicleDetail', accessorKey: 'vehicleDetail', header: 'Vehicle' },
  { id: 'type', accessorKey: 'type', header: 'Mission' },
  { id: 'scheduledTime', accessorKey: 'scheduledTime', header: 'Start Time' },
  { id: 'manifestCodes', accessorKey: 'manifestCodes', header: 'Manifests' }
]

const formatDateTime = (dateStr) => {
  return new Date(dateStr).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div class="space-y-6">
    <div v-if="pending" class="text-gray-400 text-center py-8">
      Retrieving Courier Schedules...
    </div>

    <div v-else-if="error" class="text-red-400 text-center py-8">
      Failed to load courier schedules: {{ error.message }}
    </div>

    <UTable v-else sticky :data="schedules || []" :columns="columns" class="flex-1 max-h-8xl">
      <!-- Slots now match the new IDs -->
      <template #courierName-cell="{ row }">
        <!-- 🚀 Modern Inline Assign UI -->
        <div class="min-w-[180px]">
          <USelectMenu v-if="row.original.courierName === 'Unassigned'" :items="availableCouriers" label-key="firstName"
            value-attribute="courier.id" placeholder="Assign Courier..." :loading="assigningId === row.original.id"
            @update:model-value="(val) => handleCourierAssignment(row.original.id, val)" :ui="{
              trigger: 'bg-transparent border-dashed border-gray-700 hover:border-indigo-500 transition-colors',
              placeholder: 'text-gray-500 italic text-xs'
            }">
            <template #leading>
              <UIcon name="i-lucide-user-plus" class="w-3 h-3 text-gray-500" />
            </template>
          </USelectMenu>

          <!-- Show this when already assigned -->
          <div v-else class="flex items-center gap-2 group">
            <UAvatar :alt="row.original.courierName" size="xs" />
            <span class="font-medium text-gray-100 text-sm">{{ row.original.courierName }}</span>

            <!-- Optional: "Change" button that appears on hover for easy editing -->
            <UButton icon="i-lucide-pencil" variant="ghost" color="neutral" size="xs"
              class="opacity-0 group-hover:opacity-100 transition-opacity"
              @click="row.original.courierName = 'Unassigned'" />
          </div>
        </div>
      </template>

      <template #email-cell="{ row }">
        <span class="text-white font-mono">{{ row.original.email }}</span>
      </template>

      <template #vehicleDetail-cell="{ row }">
        <span class="text-white font-mono">{{ row.original.vehicleDetail }}</span>
      </template>

      <template #type-cell="{ row }">
        <UBadge :color="row.original.type === 'Accumulation' ? 'primary' : 'secondary'" variant="subtle" size="sm">
          {{ row.original.type }}
        </UBadge>
      </template>

      <template #scheduledTime-cell="{ row }">
        <div class="flex items-center gap-2 group">
          <span class="text-gray-300 text-xs">
            {{ formatDateTime(row.original.scheduledTime) }}
          </span>

          <UPopover v-model:open="editingScheduleId[row.original.id]">
            <UButton icon="i-lucide-pencil" variant="ghost" color="neutral" size="xs"
              class="opacity-0 group-hover:opacity-100 transition-opacity"
              @click="editingScheduleId[row.original.id] = true" />

            <template #content>
              <div class="p-4 space-y-3 w-72">
                <p class="text-xs font-bold text-gray-200">Edit Schedule Time</p>

                <UFormField label="Date">
                  <UCalendar v-model="editDates[row.original.id]" />
                </UFormField>

                <UFormField label="Time">
                  <UInputTime v-model="editTimes[row.original.id]" />
                </UFormField>

                <div class="flex justify-end gap-2 pt-2">
                  <UButton size="xs" variant="ghost" @click="editingScheduleId[row.original.id] = false">Cancel
                  </UButton>
                  <UButton size="xs" color="primary" :loading="updatingTimeId === row.original.id"
                    @click="handleScheduleTimeUpdate(row.original.id)">Save</UButton>
                </div>
              </div>
            </template>
          </UPopover>
        </div>
      </template>

      <template #manifestCodes-cell="{ row }">
        <div class="flex flex-wrap gap-1">
          <UBadge v-for="code in (row.original.manifestCodes || '').split(', ')" :key="code" color="neutral"
            variant="outline" size="sm">
            {{ code }}
          </UBadge>
        </div>
      </template>
    </UTable>
  </div>
</template>