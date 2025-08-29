<template>
  <div class="bg-white p-2 rounded shadow mb-2 flex flex-wrap gap-2 items-center">
    <input v-model="expenseName" type="text" placeholder="Nama Pengeluaran" class="border p-1 rounded flex-1"/>
    <input v-model.number="expenseAmount" type="number" placeholder="Jumlah" class="border p-1 rounded w-24"/>
    <input v-model="expenseDate" type="date" class="border p-1 rounded w-36"/>
    <button class="btn btn-secondary text-white px-2 py-1 rounded" @click="addExpense">Tambah</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const emit = defineEmits(['add'])

const expenseName = ref('')
const expenseAmount = ref(0)
const expenseDate = ref(new Date().toISOString().substr(0,10))

function addExpense() {
  if(!expenseName.value || !expenseAmount.value) return
  emit('add',{ name:expenseName.value, amount:expenseAmount.value, date:expenseDate.value })
  expenseName.value = ''
  expenseAmount.value = 0
}
</script>
