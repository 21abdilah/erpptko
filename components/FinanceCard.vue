<template>
  <div class="bg-white shadow rounded p-2 flex items-center text-xs cursor-pointer hover:shadow-md transition">
    <div class="flex-1">
      <h3 class="font-semibold text-xs truncate">{{ title }}</h3>
      <p class="text-gray-500 text-xxs truncate">{{ subtitle }}</p>
    </div>
    <div class="font-bold text-sm text-right ml-2">{{ value }}</div>
  </div>
</template>

<script setup>
defineProps({ title:String, subtitle:String, value:String })
</script>

<style scoped>
.text-xxs { font-size: 0.65rem; }
</style>
