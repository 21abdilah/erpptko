<template>
  <div class="app-layout d-flex">
    <!-- Backdrop Mobile -->
    <div v-if="mobileOpen" class="sidebar-backdrop" @click="mobileOpen = false"></div>

    <!-- Sidebar -->
    <Sidebar
      :collapsed="collapsed"
      :mobile-open="mobileOpen"
      @toggle="collapsed = !collapsed"
    />

    <!-- Main Content -->
    <div 
      class="main-content flex-fill d-flex flex-column"
      :class="collapsed ? 'collapsed' : 'expanded'"
    >
      <!-- Topbar -->
      <Topbar
        @toggle-mobile="mobileOpen = !mobileOpen"
        :notifications="notifications"
        :class="collapsed ? 'collapsed' : 'expanded'"
      />

      <!-- Page Content -->
      <main class="flex-fill p-3 p-md-4 bg-light">
        <slot />
      </main>

      <!-- Footer -->
      <footer class="app-footer text-center py-2 small bg-white border-top text-muted">
        © 2025 ERP System - All rights reserved
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import Sidebar from "../components/Sidebar.vue";
import Topbar from "../components/Topbar.vue";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const collapsed = ref(false);
const mobileOpen = ref(false);
const notifications = ref([]);

async function fetchStockNotifications() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/products?select=name,stock&stock=eq.0`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
    const data = await res.json();
    notifications.value = data.map((p) => ({
      id: p.name,
      message: `${p.name} stok habis!`,
    }));
  } catch (err) {
    console.error("❌ Gagal fetch notifikasi:", err);
  }
}

onMounted(fetchStockNotifications);
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}

/* Backdrop Mobile */
.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 99;
  animation: fadeIn 0.3s ease forwards;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Sidebar efek kaca */
.sidebar-glass {
  background: rgba(255, 255, 255, 0.85) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.15);
  border-right: 1px solid rgba(255, 255, 255, 0.2);
}

/* Animasi Slide */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.slide-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}
.slide-enter-to {
  transform: translateX(0);
  opacity: 1;
}
.slide-leave-from {
  transform: translateX(0);
  opacity: 1;
}
.slide-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

/* Transition halus konten */
.main-content,
.main-content > .navbar {
  transition: margin-left 0.3s ease, width 0.3s ease;
}

/* Default */
.main-content {
  flex: 1;
  min-width: 0;
}

/* Expanded sidebar (desktop) */
@media (min-width: 768px) {
  .main-content.expanded {
    margin-left: 250px;
  }
  .main-content.collapsed {
    margin-left: 80px;
  }
}

/* Mobile full width */
@media (max-width: 767px) {
  .main-content {
    margin-left: 0 !important;
  }
}
</style>
