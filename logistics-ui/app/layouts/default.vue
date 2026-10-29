<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from '@nuxt/ui'

const open = ref(true)

const colorMode = useColorMode()

const headerActions = useState('headerActions', () => null)
const route = useRoute()
const pageTitle = computed(() => (route.meta.title as string) || 'Dashboard')

const teams = ref([
  {
    label: 'Nuxt',
    avatar: {
      src: 'https://github.com/nuxt.png',
      alt: 'Nuxt'
    }
  },
  {
    label: 'Vue',
    avatar: {
      src: 'https://github.com/vuejs.png',
      alt: 'Vue'
    }
  },
  {
    label: 'UnJS',
    avatar: {
      src: 'https://github.com/unjs.png',
      alt: 'UnJS'
    }
  }
])
const selectedTeam = ref(teams.value[0])

const teamsItems = computed<DropdownMenuItem[][]>(() => {
  return [
    teams.value.map((team, index) => ({
      ...team,
      kbds: ['meta', String(index + 1)],
      onSelect() {
        selectedTeam.value = team
      }
    })),
    [
      {
        label: 'Create team',
        icon: 'i-lucide-circle-plus'
      }
    ]
  ]
})

function getItems(state: 'collapsed' | 'expanded') {
  return [
    {
      label: 'Dashboard',
      icon: 'i-lucide-home',
      to: '/admin/dashboard',
    },
    {
      label: 'Clients',
      icon: 'i-lucide-shield-user',
      to: '/admin/clients',
    },
    {
      label: 'Facilities',
      icon: 'i-lucide-warehouse',
      to: '/admin/facilities',
    },
    {
      label: 'Parcels',
      icon: 'i-lucide-package',
      to: '/admin/parcels'
    },
    {
      label: 'Vehicles',
      icon: 'i-lucide-truck',
      to: '/admin/vehicles'
    },
    {
      label: 'Settings',
      icon: 'i-lucide-settings',
      defaultOpen: true,
      children:
        state === 'expanded'
          ? [
            {
              label: 'General',
              icon: 'i-lucide-house'
            },
            {
              label: 'Team',
              icon: 'i-lucide-users'
            },
            {
              label: 'Billing',
              icon: 'i-lucide-credit-card'
            }
          ]
          : []
    }
  ] satisfies NavigationMenuItem[]
}

const user = ref({
  name: 'Benjamin Canac',
  avatar: {
    src: 'https://github.com/benjamincanac.png',
    alt: 'Benjamin Canac'
  }
})

const userItems = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: 'Profile',
      icon: 'i-lucide-user'
    },
    {
      label: 'Billing',
      icon: 'i-lucide-credit-card'
    },
    {
      label: 'Settings',
      icon: 'i-lucide-settings',
      to: '/settings'
    }
  ],
  [
    {
      label: 'Appearance',
      icon: 'i-lucide-sun-moon',
      children: [
        {
          label: 'Light',
          icon: 'i-lucide-sun',
          type: 'checkbox',
          checked: colorMode.value === 'light',
          onUpdateChecked(checked: boolean) {
            if (checked) {
              colorMode.preference = 'light'
            }
          },
          onSelect(e: Event) {
            e.preventDefault()
          }
        },
        {
          label: 'Dark',
          icon: 'i-lucide-moon',
          type: 'checkbox',
          checked: colorMode.value === 'dark',
          onUpdateChecked(checked: boolean) {
            if (checked) {
              colorMode.preference = 'dark'
            }
          },
          onSelect(e: Event) {
            e.preventDefault()
          }
        }
      ]
    }
  ],
  [
    {
      label: 'GitHub',
      icon: 'i-simple-icons-github',
      to: 'https://github.com/nuxt/ui',
      target: '_blank'
    },
    {
      label: 'Log out',
      icon: 'i-lucide-log-out'
    }
  ]
])

defineShortcuts(extractShortcuts(teamsItems.value))
</script>

<template>
  <div class="flex min-h-screen w-full bg-gray-900 text-gray-100">
    <USidebar v-model:open="open" collapsible="icon" rail :ui="{
      container: 'h-full',
      inner: 'bg-elevated/25 divide-transparent',
      body: 'py-0'
    }">
      <template #header>
        <UDropdownMenu :items="teamsItems" :content="{ align: 'start', collisionPadding: 12 }"
          :ui="{ content: 'w-(--reka-dropdown-menu-trigger-width) min-w-48' }">
          <UButton v-bind="selectedTeam" trailing-icon="i-lucide-chevrons-up-down" color="neutral" variant="ghost"
            square class="w-full data-[state=open]:bg-elevated overflow-hidden" :ui="{
              trailingIcon: 'text-dimmed ms-auto'
            }" />
        </UDropdownMenu>
      </template>

      <template #default="{ state }">
        <UNavigationMenu :key="state" :items="getItems(state)" orientation="vertical"
          :ui="{ link: 'p-1.5 overflow-hidden' }" />
      </template>

      <template #footer>
        <UDropdownMenu :items="userItems" :content="{ align: 'center', collisionPadding: 12 }"
          :ui="{ content: 'w-(--reka-dropdown-menu-trigger-width) min-w-48' }">
          <UButton v-bind="user" :label="user?.name" trailing-icon="i-lucide-chevrons-up-down" color="neutral"
            variant="ghost" square class="w-full data-[state=open]:bg-elevated overflow-hidden" :ui="{
              trailingIcon: 'text-dimmed ms-auto'
            }" />
        </UDropdownMenu>
      </template>
    </USidebar>

    <div class="flex-1 flex flex-col min-w-0">
      <UHeader :ui="{
        container: 'max-w-none',
      }">
        <template #left>
          <div class="flex items-center">
            <UButton :icon="open ? 'i-lucide-panel-left-close' : 'i-lucide-panel-right-close'" color="neutral"
              variant="ghost" aria-label="Toggle sidebar" @click="open = !open" :ui="{
                leadingIcon: 'scale-115'
              }" />
            <h1 class="text-base sm:text-lg font-semibold text-gray-100 truncate">{{ pageTitle }}</h1>
          </div>
        </template>

        <template #right>
          <component :is="headerActions" v-if="headerActions" />
        </template>

      </UHeader>

      <div class="flex-1 p-4">
        <main class="flex-1 overflow-y-auto p-6">
          <NuxtPage />
        </main>
      </div>
    </div>
  </div>
</template>