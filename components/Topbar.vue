<template>
  <header
    class="navbar navbar-expand shadow-sm sticky-top d-flex align-items-center justify-content-between px-3 glass-navbar"
  >
    <!-- Toggle Mobile -->
    <button
      class="btn btn-light d-md-none me-2 shadow-sm"
      @click="$emit('toggle-mobile')"
      aria-label="Toggle menu"
    >
      <i class="bi bi-list fs-5"></i>
    </button>

    <!-- Brand -->
    <div class="d-flex align-items-center fw-bold fs-5 text-primary">
      <i class="bi bi-speedometer2 me-2"></i>
      ERP Dashboard
    </div>

    <!-- Actions -->
    <div class="d-flex align-items-center gap-3">
      <!-- Notifikasi -->
      <div class="dropdown">
        <button
          class="btn btn-light position-relative shadow-sm hover-scale"
          data-bs-toggle="dropdown"
          aria-expanded="false"
        >
          <i class="bi bi-bell fs-5"></i>
          <span
            v-if="notifications.length"
            class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger animate-badge"
          >
            {{ notifications.length }}
          </span>
        </button>
        <ul class="dropdown-menu dropdown-menu-end shadow-sm dropdown-menu-notifications">
          <li v-if="notifications.length === 0" class="dropdown-item text-muted">
            Tidak ada notifikasi
          </li>

          <!-- Transition group untuk animasi staggered -->
          <transition-group
            name="notif"
            tag="div"
            class="notif-wrapper"
          >
            <li
              v-for="(n, index) in notifications"
              :key="n.id"
              class="dropdown-item text-danger small"
              @click="goToInventory"
              :style="{ animationDelay: (index * 0.08) + 's' }"
            >
              <i class="bi bi-exclamation-triangle-fill me-1"></i>
              {{ n.message }}
            </li>
          </transition-group>
        </ul>
      </div>

      <!-- User / Login -->
      <div v-if="user" class="dropdown">
        <button
          class="btn btn-light d-flex align-items-center shadow-sm hover-scale"
          data-bs-toggle="dropdown"
          aria-expanded="false"
        >
          <div class="avatar me-2">
            <i class="bi bi-person-circle fs-4 text-primary"></i>
          </div>
          <span class="d-none d-md-inline small text-muted">
            {{ user.username }}
          </span>
        </button>

        <ul class="dropdown-menu dropdown-menu-end shadow-sm">
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
          class="btn btn-primary btn-sm rounded-pill shadow-sm hover-scale"
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

const user = ref(null);
const notifications = ref([]);
let intervalId = null;

onMounted(() => {
  const saved = localStorage.getItem("user");
  if (saved) user.value = JSON.parse(saved);

  fetchNotifications();
  intervalId = setInterval(fetchNotifications, 60000);
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
});

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
/* Glass navbar */
.glass-navbar {
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.85);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  height: 64px;
  z-index: 1050;
}

/* Hover efek tombol */
.hover-scale {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.hover-scale:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* Badge animation */
.animate-badge {
  animation: pop 0.5s ease;
}
@keyframes pop {
  0% { transform: scale(0); }
  60% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

/* Avatar kecil */
.avatar {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(0,123,255,0.1);
}

/* Dropdown shadow */
.dropdown-menu {
  border-radius: 0.5rem;
  min-width: 220px;
}

/* Dropdown notifikasi dengan scroll */
.dropdown-menu-notifications {
  max-height: 300px;
  overflow-y: auto;
  padding: 0.25rem 0;
  scrollbar-width: thin;
  scrollbar-color: rgba(0,0,0,0.3) transparent;
}

/* Scrollbar untuk Chrome, Edge, Safari */
.dropdown-menu-notifications::-webkit-scrollbar {
  width: 6px;
}

.dropdown-menu-notifications::-webkit-scrollbar-track {
  background: transparent;
}

.dropdown-menu-notifications::-webkit-scrollbar-thumb {
  background-color: rgba(0,0,0,0.25);
  border-radius: 3px;
  transition: background 0.3s;
}

.dropdown-menu-notifications::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0,0,0,0.4);
}

/* Jarak antar notifikasi */
.dropdown-menu-notifications .dropdown-item {
  padding: 0.5rem 1rem;
  border-bottom: 1px solid rgba(0,0,0,0.05);
  transition: background 0.2s;
}

.dropdown-menu-notifications .dropdown-item:hover {
  background: rgba(0,123,255,0.05);
}

/* Animasi fade + slide + staggered */
.notif-wrapper li {
  opacity: 0;
  transform: translateY(-10px);
  animation: notif-fade-slide 0.3s forwards;
}

@keyframes notif-fade-slide {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
