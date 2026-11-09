<script setup lang="ts">
const { logout } = useAuthService()

import type { NavigationMenuItem } from '@nuxt/ui'

const items = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Dashboard',
    icon: 'i-lucide-layout-dashboard',
    to: '/courier',
  },
  {
    label: 'My Tasks',
    icon: 'i-lucide-clipboard-list',
    to: '/courier/tasks',
  },
  {
    label: 'History',
    icon: 'i-lucide-history',
    to: '/courier/history',
  }
])

const userDropdownItems = [
  [
    {
      label: 'Sign out',
      icon: 'i-lucide-log-out',
      onSelect: () => {
        logout()
      }
    }
  ]
]
</script>

<template>
  <div class="min-h-screen flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
    <UHeader mode="drawer" sticky :ui="{ container: 'max-w-none px-4 border-b border-gray-200 dark:border-gray-800' }">
      <template #left>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-truck" class="w-6 h-6 text-primary" />
          <span class="font-bold text-lg tracking-tight text-secondary">FSTFY<span class="text-primary">Logistics</span></span>
        </div>
      </template>

      <UNavigationMenu :items="items" variant="link" />

      <template #right>
        <UColorModeButton />
        <UDropdownMenu :items="userDropdownItems">
          <UAvatar src="https://github.com/benjamincanac.png" size="sm" class="cursor-pointer" />
        </UDropdownMenu>
      </template>

      <template #body>
        <UNavigationMenu :items="items" orientation="vertical" class="-mx-2.5" />
      </template>
    </UHeader>


    <main class="flex-1">
      <NuxtPage />
    </main>
  </div>
</template>