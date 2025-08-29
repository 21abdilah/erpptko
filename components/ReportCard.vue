<template>
  <div class="card shadow-sm text-center mb-3">
    <div class="card-body">
      <h5 class="card-title">{{ title }}</h5>
      <p class="card-subtitle text-muted mb-2">{{ subtitle }}</p>
      <p class="fw-bold fs-5">{{ value }}</p>
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
