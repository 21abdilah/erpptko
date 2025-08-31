<template>
  <div class="login-page d-flex justify-content-center align-items-center vh-100">
    <div class="login-card glass-card shadow-lg border-0 rounded-4 p-4 animate__animated animate__fadeInDown">
      <!-- Avatar -->
      <div class="text-center mb-4">
        <div class="avatar bg-gradient text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3 shadow-lg">
          <i class="bi bi-person-lock fs-2"></i>
        </div>
        <h3 class="fw-bold">Selamat Datang 👋</h3>
        <p class="text-muted">Masuk ke dashboard untuk melanjutkan</p>
      </div>

      <!-- Username -->
      <div class="form-floating mb-3">
        <input v-model="username" type="text" id="username" class="form-control rounded-3" placeholder="Username" />
        <label for="username"><i class="bi bi-person me-2"></i> Username</label>
      </div>

      <!-- Password -->
      <div class="form-floating mb-3">
        <input v-model="password" type="password" id="password" class="form-control rounded-3" placeholder="Password" />
        <label for="password"><i class="bi bi-lock me-2"></i> Password</label>
      </div>

      <!-- Button -->
      <button @click="login" class="btn btn-gradient w-100 rounded-3 fw-semibold py-2">
        <i class="bi bi-box-arrow-in-right me-2"></i> Login
      </button>

      <!-- Error -->
      <p v-if="error" class="text-danger text-center mt-3">{{ error }}</p>

      <!-- Extra -->
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
/* Background gradient + animasi */
.login-page {
  background: linear-gradient(135deg, #6c5ce7, #00cec9, #0984e3, #a29bfe);
  background-size: 400% 400%;
  animation: gradientMove 12s ease infinite;
}
@keyframes gradientMove {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* Glassmorphism Card */
.glass-card {
  width: 100%;
  max-width: 420px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  transition: all 0.3s ease;
}
.glass-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.2);
}

/* Avatar */
.avatar {
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #6c5ce7, #0984e3);
}

/* Gradient Button */
.btn-gradient {
  background: linear-gradient(90deg, #6c5ce7, #00cec9);
  color: white;
  transition: all 0.3s ease;
}
.btn-gradient:hover {
  background: linear-gradient(90deg, #00cec9, #6c5ce7);
  transform: scale(1.05);
}

/* Floating input */
.form-floating input {
  border-radius: 12px !important;
  border: 1px solid #ccc;
}
.form-floating label {
  color: #6c5ce7;
  font-weight: 500;
}
</style>
