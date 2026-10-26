<template>
  <div class="app-container">
    <header class="dashboard-header">
      <h1>Logistics Dashboard</h1>
      <span class="status-badge">Connected to Docker Mesh</span>
    </header>
    
    <main class="dashboard-content">
      <NuxtPage />
    </main>
  </div>
</template>

<style scoped>
.app-container {
  font-family: system-ui, -apple-system, sans-serif;
  background-color: #f8fafc;
  min-height: 100vh;
  margin: 0;
  color: #1e293b;
}
.dashboard-header {
  background-color: #0f172a;
  color: #ffffff;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.status-badge {
  background-color: #22c55e;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
}
.dashboard-content {
  padding: 2rem;
}
</style>
