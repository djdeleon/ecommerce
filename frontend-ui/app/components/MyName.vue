<script setup>
const config = useRuntimeConfig()

const baseURL = process.server 
  ? 'http://reverse-proxy/api' 
  : config.public.apiBase

const { data: apiResponse, error } = await useFetch('/test-connection', {
  baseURL
})
</script>

<template>
  <div style="padding: 20px;">
    <ClientOnly>
      <div v-if="apiResponse">
        <h3>Connected!</h3>
        <pre>{{ apiResponse.status }}</pre>
        <pre>{{ apiResponse.message }}</pre>
        <pre>{{ apiResponse.timestamp }}</pre>
      </div>
      
      <div v-else-if="error" style="color: red;">
        <h3>Connection Failed</h3>
        <p>{{ error.message }}</p>
      </div>

      <template #fallback>
        <div>
          <p>Loading API data stream...</p>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>
