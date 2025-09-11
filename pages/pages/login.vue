<template>
  <div class="login-page d-flex justify-content-center align-items-center vh-100">
    <div class="login-card shadow-sm p-4 rounded-3">
      <!-- Avatar dan form login tetap sama -->
      <div class="text-center mb-4">
        <div class="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3">
          <i class="bi bi-person-lock fs-2"></i>
        </div>
        <h3 class="fw-bold">Selamat Datang</h3>
        <p class="text-muted">Masuk untuk melanjutkan</p>
      </div>

      <div class="form-floating mb-3">
        <input v-model="username" type="text" id="username" class="form-control" placeholder="Username" />
        <label for="username"><i class="bi bi-person me-2"></i> Username</label>
      </div>

      <div class="form-floating mb-3">
        <input v-model="password" type="password" id="password" class="form-control" placeholder="Password" />
        <label for="password"><i class="bi bi-lock me-2"></i> Password</label>
      </div>

      <button @click="login" class="btn btn-primary w-100 py-2 fw-semibold">
        <i class="bi bi-box-arrow-in-right me-2"></i> Login
      </button>

      <p v-if="error" class="text-danger text-center mt-3">{{ error }}</p>

      <div class="text-center mt-4 small text-muted">
        Belum punya akun? <a href="#" class="fw-semibold text-decoration-none">Daftar</a>
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref } from "vue";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const username = ref("");
const password = ref("");
const error = ref("");

async function login() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/users?username=eq.${username.value}&password=eq.${password.value}`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
    const data = await res.json();

    if (data.length > 0) {
      localStorage.setItem("user", JSON.stringify(data[0]));
      window.location.href = "/";
    } else {
      error.value = "❌ Username atau password salah!";
    }
  } catch (err) {
    error.value = "⚠️ Login gagal!";
    console.error(err);
  }
}
</script>

<style>
/* Background solid color */
.login-page {
  background-color: #f5f6fa;
}

/* Card */
.login-card {
  width: 100%;
  max-width: 380px;
  background: #ffffff;
  border-radius: 12px;
}

/* Avatar */
.avatar {
  width: 60px;
  height: 60px;
  font-size: 28px;
}

/* Button */
.btn-primary {
  transition: all 0.2s ease;
}
.btn-primary:hover {
  transform: scale(1.03);
}

/* Floating input */
.form-floating input {
  border-radius: 8px !important;
}
.form-floating label {
  color: #6c5ce7;
  font-weight: 500;
}
</style>
