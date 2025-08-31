<template>
  <div class="card report-card shadow-sm text-center mb-3 h-100">
    <div class="card-body d-flex flex-column justify-content-center">
      <h5 class="card-title mb-1">{{ title }}</h5>
      <p class="card-subtitle text-muted mb-2 fs-7">{{ subtitle }}</p>
      <p class="fw-bold fs-6 mb-0">{{ value }}</p> <!-- font value lebih kecil -->
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  subtitle: String,
  value: String
})
</script>

<style scoped>
.report-card {
  border-radius: 1rem;
  transition: transform 0.2s, box-shadow 0.2s;
  background-color: #fff;
}

.report-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.12);
}

.card-title {
  font-size: 0.95rem;
  color: #333;
}

.card-subtitle {
  font-size: 0.75rem;
}

.fw-bold {
  color: #0d6efd; /* highlight value */
}
</style>
