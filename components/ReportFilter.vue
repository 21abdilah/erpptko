<template>
  <div class="d-flex gap-2 mb-3 flex-wrap">
    <input type="date" v-model="from" class="form-control w-auto" />
    <input type="date" v-model="to" class="form-control w-auto" />
    <button class="btn btn-primary" @click="applyFilter">Filter</button>
  </div>
</template>

<script setup>
const emit = defineEmits(['filter'])
const from = ref(new Date().toISOString().substr(0,10))
const to = ref(new Date().toISOString().substr(0,10))

function applyFilter() {
  emit('filter', { from: from.value, to: to.value })
}
</script>
