<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()

// Aligned with the "Components/Docs" style from your image
const items = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Dashboard',
    icon: 'i-lucide-layout-dashboard',
    to: '/courier',
  },
  {
    label: 'Active Tasks',
    icon: 'i-lucide-clipboard-list',
    to: '/courier/tasks',
  },
  {
    label: 'History',
    icon: 'i-lucide-history',
    to: '/courier/history',
  }
])

definePageMeta({
  layout: false 
})
</script>

<template>
  <!-- 🚀 Added a full-screen wrapper with height and background -->
  <div class="min-h-screen flex flex-col bg-white dark:bg-gray-950">
    
    <UHeader sticky :ui="{ container: 'max-w-none px-6 border-b border-gray-200 dark:border-gray-800' }">
      <template #left>
        <div class="flex items-center gap-2">
          <!-- Using a simple Icon + Text as a Logo for now -->
          <UIcon name="i-lucide-truck" class="w-6 h-6 text-primary" />
          <span class="font-bold text-xl tracking-tight text-gray-900 dark:text-white">
            Courier<span class="text-primary">App</span>
          </span>
        </div>
      </template>

      <!-- 🚀 Default slot for center navigation -->
      <UNavigationMenu :items="items" variant="link" />

      <template #right>
        <div class="flex items-center gap-3">
          <UColorModeButton />
          
          <div class="h-5 w-px bg-gray-200 dark:bg-gray-800 mx-1" />

          <UButton
            icon="i-lucide-log-out"
            color="neutral"
            variant="ghost"
            label="Sign Out"
            size="sm"
          />
        </div>
      </template>
    </UHeader>

    <!-- 🚀 Main Content Area so the page isn't "empty" -->
    <main class="flex-1 p-8">
      <div class="max-w-5xl mx-auto space-y-8">
        <div class="flex flex-col gap-1">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Courier Dashboard</h1>
          <p class="text-gray-500 dark:text-gray-400 font-medium">Welcome back! You have 3 pending pickups for today.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <UCard class="ring-1 ring-gray-200 dark:ring-gray-800 shadow-none">
            <template #header>Current Mission</template>
            <p class="text-sm text-gray-500 italic">No manifest started.</p>
          </UCard>
        </div>
      </div>
    </main>
  </div>
</template>