<template>
  <div>
    <div class="form-check mb-2">
      <input class="form-check-input" type="checkbox" v-model="selectedForPrint" id="printTableCheck"/>
      <label class="form-check-label" for="printTableCheck">Pilih untuk Print</label>
    </div>

    <div class="table-responsive">
      <table class="table table-bordered table-striped table-hover">
        <thead class="table-light">
          <tr>
            <th v-for="col in columns" :key="col.key" :class="col.class">{{ col.label }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in data" :key="row.item_id">
            <td v-for="col in columns" :key="col.key" :class="col.class">
              {{ formatCell(row, col.key) }}
            </td>
          </tr>
          <tr v-if="data.length===0">
            <td :colspan="columns.length" class="text-center text-muted py-3">Tidak ada data</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
defineProps({ data: Array, columns: Array })
const selectedForPrint = ref(true)

function formatCell(row, key) {
  const val = row[key]
  if (key === 'sale_date') return new Date(val).toLocaleDateString()
  if (['price','subtotal','total','discount'].includes(key)) {
    return new Intl.NumberFormat('id-ID', { style:'currency', currency:'IDR' }).format(val)
  }
  return val ?? '-'
}
</script>
