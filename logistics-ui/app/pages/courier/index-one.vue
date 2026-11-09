<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()

// 🚀 Aligned with your image example
const items = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Dashboard',
    icon: 'i-lucide-layout-dashboard',
    to: '/courier',
    active: route.path === '/courier'
  },
  {
    label: 'My Tasks',
    icon: 'i-lucide-clipboard-list',
    to: '/courier/tasks'
  },
  {
    label: 'History',
    icon: 'i-lucide-history',
    to: '/courier/history'
  }
])
</script>

<template>
  <!-- 🚀 Wrapper to ensure the page has a background and structure -->
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
    
    <UHeader sticky :ui="{ container: 'max-w-none px-4' }">
      <template #left>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-truck" class="w-6 h-6 text-primary" />
          <span class="font-bold text-lg tracking-tight">Courier<span class="text-primary">Flow</span></span>
        </div>
      </template>

      <!-- 🚀 Center Slot for the Navigation Menu -->
      <UNavigationMenu :items="items" variant="link" />

      <template #right>
        <UColorModeButton />
        
        <div class="h-6 w-px bg-gray-200 dark:bg-gray-800 mx-2" />

        <UDropdownMenu :items="[[{ label: 'Profile', icon: 'i-lucide-user' }, { label: 'Logout', icon: 'i-lucide-log-out' }]]">
          <UAvatar src="https://github.com/benjamincanac.png" size="sm" class="cursor-pointer" />
        </UDropdownMenu>
      </template>
    </UHeader>

    <!-- 🚀 Main Content Area -->
    <main class="p-6 max-w-7xl mx-auto">
      <div class="grid gap-6">
        <header>
          <h1 class="text-2xl font-bold">Good morning, Courier!</h1>
          <p class="text-gray-500 dark:text-gray-400">Here are your assignments for today.</p>
        </header>

        <!-- Placeholder for your actual task cards -->
        <UCard class="border-2 border-dashed border-gray-200 dark:border-gray-800 bg-transparent flex items-center justify-center py-20 text-gray-400">
          No active pickup manifests assigned to you yet.
        </UCard>
      </div>
    </main>

  </div>
</template>