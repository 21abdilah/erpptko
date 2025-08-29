<template>
  <tr>
    <td>{{ product.name }}</td>
    <td>{{ formatCurrency(product.price) }}</td>
    <td>{{ product.stock }}</td>
    <td>{{ product.category || '-' }}</td>
    <td>
      <button @click="$emit('edit', product)" class="btn btn-warning btn-sm me-1">Edit</button>
      <button @click="$emit('delete', product.id)" class="btn btn-danger btn-sm">Hapus</button>
    </td>
  </tr>
</template>

<script setup>
defineProps({ product: Object });
const emit = defineEmits(["edit", "delete"]);
const formatCurrency = (num) => new Intl.NumberFormat("id-ID").format(num);
</script>
