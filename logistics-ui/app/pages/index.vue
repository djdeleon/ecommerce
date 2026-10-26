<!-- app/pages/index.vue -->
<template>
  <div class="card">
    <h2>Welcome to Logistics-UI</h2>
    <p>API Endpoint: <code>{{ config.public.logisticsApi }}</code></p>
    <button @click="fetchData" class="btn">Test API Connection</button>
    <div v-if="apiResponse" class="response-box">
      {{ apiResponse }}
    </div>
  </div>
</template>

<script setup>
const config = useRuntimeConfig()
const apiResponse = ref(null)

async function fetchData() {
  try {
    apiResponse.value = "Fetching from microservice..."
    
    let targetApi = config.public.logisticsApi
    
    if (import.meta.client) {
      targetApi = 'http://localhost:8001'
    }

    console.log("Browser routing outbound API request to:", targetApi)

    const data = await $fetch(`${targetApi}/`)
    apiResponse.value = data
  } catch (err) {
    console.log(err)
    apiResponse.value = `Connection Error: ${err.message}`
  }
}
</script>

<style scoped>
.card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}
.btn {
  background-color: #2563eb;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}
.response-box {
  margin-top: 1rem;
  padding: 1rem;
  background: #f1f5f9;
  border-left: 4px solid #2563eb;
}
</style>
