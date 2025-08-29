<template>
  <div class="overflow-x-auto">
    <table class="table-auto w-full border border-gray-300 text-xs">
      <thead class="bg-gray-100">
        <tr>
          <th class="px-3 py-2 border font-semibold text-left">Tanggal</th>
          <th class="px-3 py-2 border font-semibold text-left">Keterangan</th>
          <th class="px-3 py-2 border font-semibold text-right">Jumlah</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, i) in data" :key="i" class="hover:bg-gray-50">
          <td class="px-3 py-2 border">{{ item.date }}</td>
          <td class="px-3 py-2 border">{{ item.name }}</td>
          <td class="px-3 py-2 border text-right">Rp {{ formatCurrency(item.amount) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
defineProps({ data: Array })

const formatCurrency = (num) => {
  return new Intl.NumberFormat('id-ID').format(num)
}
</script>

<style scoped>
.hover\:bg-gray-50:hover {
  background-color: #f9fafb;
}
</style>
