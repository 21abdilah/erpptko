<template>
  <div class="d-flex justify-content-center align-items-center vh-100 bg-light">
    <div class="card shadow p-4 text-center" style="max-width: 400px; width: 100%;">
      <i class="bi bi-box-arrow-right text-danger fs-1 mb-3"></i>
      <h4 class="mb-2">Anda berhasil logout</h4>
      <p class="text-muted">Terima kasih sudah menggunakan aplikasi ini 🙌</p>

      <div class="mt-3">
        <NuxtLink to="/login" class="btn btn-primary w-100">
          <i class="bi bi-box-arrow-in-right me-1"></i> Kembali ke Login
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from "vue";

onMounted(() => {
  // Hapus session user
  localStorage.removeItem("user");

  // Opsional → redirect otomatis setelah 2 detik
  setTimeout(() => {
    window.location.href = "/login";
  }, 2000);
});
</script>
