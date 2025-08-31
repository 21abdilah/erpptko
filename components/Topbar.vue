<template>
  <header
    class="navbar navbar-expand bg-white shadow-sm px-3 sticky-top d-flex align-items-center justify-content-between"
    style="height:64px; z-index:50;"
  >
    <!-- Toggle Mobile -->
    <button
      class="btn btn-light d-md-none me-2"
      @click="$emit('toggle-mobile')"
    >
      <i class="bi bi-list fs-5"></i>
    </button>

    <!-- Brand -->
    <div class="d-flex align-items-center fw-bold fs-5">
      <i class="bi bi-speedometer2 text-primary me-2"></i>
      ERP Dashboard
    </div>

    <!-- Actions -->
    <div class="d-flex align-items-center gap-3">
      <!-- Notifikasi -->
      <div class="dropdown">
        <button
          class="btn btn-sm btn-light position-relative"
          data-bs-toggle="dropdown"
        >
          <i class="bi bi-bell fs-5"></i>
          <span
            v-if="notifications.length"
            class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
          >
            {{ notifications.length }}
          </span>
        </button>
        <ul class="dropdown-menu dropdown-menu-end">
          <li
            v-if="notifications.length === 0"
            class="dropdown-item text-muted"
          >
            Tidak ada notifikasi
          </li>
          <li
            v-for="n in notifications"
            :key="n.id"
            class="dropdown-item text-danger small"
            @click="goToInventory"
            style="cursor:pointer;"
          >
            <i class="bi bi-exclamation-triangle-fill me-1"></i>
            {{ n.message }}
          </li>
        </ul>
      </div>

      <!-- User / Login -->
      <div v-if="user" class="dropdown">
        <button
          class="btn btn-light d-flex align-items-center"
          data-bs-toggle="dropdown"
        >
          <i class="bi bi-person-circle fs-4 text-primary me-1"></i>
          <span class="d-none d-md-inline small text-muted">
            {{ user.username }}
          </span>
        </button>

        <ul class="dropdown-menu dropdown-menu-end">
          <li>
            <a class="dropdown-item" href="#">
              Profil
            </a>
          </li>
          <li>
            <button
              class="dropdown-item text-danger"
              @click="logout"
            >
              <i class="bi bi-box-arrow-right me-1"></i>
              Logout
            </button>
          </li>
        </ul>
      </div>

      <!-- Kalau belum login -->
      <div v-else>
        <NuxtLink
          to="/login"
          class="btn btn-primary btn-sm rounded-pill"
        >
          <i class="bi bi-box-arrow-in-right me-1"></i>
          Login
        </NuxtLink>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// State
const user = ref(null);
const notifications = ref([]);
let intervalId = null;

onMounted(() => {
  const saved = localStorage.getItem("user");
  if (saved) user.value = JSON.parse(saved);

  fetchNotifications();
  intervalId = setInterval(fetchNotifications, 60000); // refresh tiap 60 detik
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
});

// Ambil stok habis langsung dari REST API Supabase
async function fetchNotifications() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/products?select=id,name,stock&stock=lte.0`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    if (!res.ok) throw new Error(`Fetch gagal: ${res.status}`);

    const data = await res.json();
    notifications.value = data.map((item) => ({
      id: item.id,
      message: `Stok produk "${item.name}" habis!`,
    }));
  } catch (err) {
    console.error("Gagal ambil notifikasi:", err.message);
  }
}

// Klik notifikasi → redirect ke halaman Inventory
function goToInventory() {
  router.push("/inventory");
}

function logout() {
  localStorage.removeItem("user");
  user.value = null;
  window.location.href = "/login";
}
</script>

<style scoped>
.navbar .badge {
  font-size: 0.65rem;
}
.dropdown-item.text-danger {
  font-weight: 500;
}
</style>
