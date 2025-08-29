<template>
  <div class="bg-white border rounded shadow p-3 flex flex-col justify-between h-full">
    <div>
      <h5 class="font-semibold text-lg truncate">{{ product.name }}</h5>
      <p class="fw-bold truncate">{{ product.category || '-' }}</p>
      <p class="text-blue-600 font-bold mt-1">Rp {{ formatCurrency(product.price) }}</p>
      <p class="text-sm mt-1">Stock: <span :class="product.stock <= 0 ? 'text-red-500' : ''">{{ product.stock }}</span></p>
    </div>
  </div>
</template>

<script setup>
defineProps({ product: Object })

const formatCurrency = (num) => new Intl.NumberFormat('id-ID').format(num)
</script>
