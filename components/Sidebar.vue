<template>
  <aside
    :class="[
      'd-flex flex-column bg-dark text-white vh-100 shadow transition-all position-fixed top-0 start-0 z-20',
      collapsed ? 'sidebar-collapsed' : 'sidebar-expanded',
      mobileOpen ? 'd-block' : 'd-none d-md-flex'
    ]"
  >
    <!-- Header -->
    <div class="p-3 fw-bold fs-5 border-bottom border-secondary d-flex align-items-center justify-content-between">
      <span v-if="!collapsed" class="d-flex align-items-center">
        <i class="bi bi-grid-fill me-2 text-warning"></i> ERP System
      </span>
      <i
        class="bi"
        :class="collapsed ? 'bi-chevron-double-right' : 'bi-chevron-double-left'"
        role="button"
        @click="$emit('toggle')"
      ></i>
    </div>

    <!-- Menu -->
    <nav class="flex-grow-1 p-2">
      <NuxtLink
        v-for="item in menu"
        :key="item.path"
        :to="item.path"
        class="d-flex align-items-center p-2 rounded mb-2 text-white text-decoration-none sidebar-link position-relative"
        active-class="active"
        :title="collapsed ? item.label : ''"
      >
        <i :class="item.icon"></i>
        <span v-if="!collapsed" class="ms-2">{{ item.label }}</span>
      </NuxtLink>
    </nav>

    <!-- Footer -->
    <div
      class="p-3 border-top border-secondary small text-muted d-flex flex-column"
      :title="collapsed ? 'ERP v1.0 - System Online' : ''"
    >
      <!-- Info versi aplikasi -->
      <div class="d-flex align-items-center mb-1">
        <i class="bi bi-info-circle flex-shrink-0"></i>
        <span v-if="!collapsed" class="ms-1 text-truncate">
          ERP v1.0 - © 2025
        </span>
      </div>

      <!-- Status sistem -->
      <div class="d-flex align-items-center">
        <i class="bi bi-check-circle text-success flex-shrink-0"></i>
        <span v-if="!collapsed" class="ms-1 text-truncate">
          System Online
        </span>
      </div>
    </div>
  </aside>
</template>

<script setup>
const props = defineProps({
  collapsed: Boolean,
  mobileOpen: Boolean, // untuk toggle di mobile
});

const menu = [
  { label: "Dashboard", path: "/", icon: "bi bi-speedometer2" },
  { label: "PRODUK", path: "/products", icon: "bi bi-box-seam" },
  { label: "KASIR", path: "/sales", icon: "bi bi-cart-check" },
  { label: "KETERSEDIAN", path: "/inventory", icon: "bi bi-archive" },
  { label: "KEUANGAN", path: "/finance", icon: "bi bi-cash-stack" },
  { label: "LAPORAN", path: "/reports", icon: "bi bi-bar-chart-line" },
  { label: "RIWAYAT", path: "/history", icon: "bi bi-clock-history" },
  { label: "PESANAN", path: "/bookings", icon: "bi bi-calendar" },
];
</script>

<style scoped>
/* Sidebar lebar */
.sidebar-expanded {
  width: 250px;
}

.sidebar-collapsed {
  width: 80px;
}

.sidebar-link {
  transition: background 0.2s, padding-left 0.2s;
}

.sidebar-link:hover {
  background: rgba(255, 255, 255, 0.15);
  padding-left: 1.5rem;
}

.active {
  background: #495057 !important;
  font-weight: 600;
}

.transition-all {
  transition: width 0.3s ease;
}

/* Responsive: di bawah 768px */
@media (max-width: 768px) {
  .sidebar-expanded,
  .sidebar-collapsed {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    z-index: 30;
  }
}
</style>
