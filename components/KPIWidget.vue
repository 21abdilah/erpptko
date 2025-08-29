<template>
  <div class="p-4 bg-white shadow rounded-3 text-center">
    <h6 class="text-secondary">{{ title }}</h6>
    <p class="fs-3 fw-bold mt-2">{{ formattedValue }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

defineProps({
  title: String,
  value: { type: [Number, String], default: 0 }
})

const formattedValue = computed(() => {
  if (typeof props.value === 'number') return new Intl.NumberFormat('id-ID').format(props.value)
  return props.value
})
</script>
