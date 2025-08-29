<template>
  <form @submit.prevent="$emit('save')" class="mb-4">
    <div class="row g-3 align-items-center">
      <div class="col-md-3">
        <input v-model="form.name" type="text" class="form-control" placeholder="Nama Produk" />
      </div>
      <div class="col-md-2">
        <input v-model.number="form.price" type="number" class="form-control" placeholder="Harga" />
      </div>
      <div class="col-md-2">
        <input v-model.number="form.stock" type="number" class="form-control" placeholder="Stok" />
      </div>
      <div class="col-md-3">
        <input v-model="form.category" type="text" class="form-control" placeholder="Kategori" />
      </div>
      <div class="col-md-2 d-flex gap-2">
        <button type="submit" class="btn btn-success flex-fill">
          {{ editMode ? "Update" : "Simpan" }}
        </button>
        <button v-if="editMode" type="button" @click="$emit('cancel')" class="btn btn-secondary flex-fill">
          Batal
        </button>
      </div>
    </div>
  </form>
</template>

<script setup>
defineProps({ form: Object, editMode: Boolean });
</script>
