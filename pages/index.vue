<template>
  <div class="container-fluid py-4">
    <!-- KPI Cards -->
    <div class="row g-4 mb-4">
      <div class="col-6 col-md-3" v-for="card in kpis" :key="card.title">
        <div class="card shadow-sm h-100 border-0">
          <div class="card-body d-flex align-items-center">
            <div class="rounded-circle bg-light p-3 me-3 flex-shrink-0">
              <i :class="card.icon + ' fs-4 text-primary'"></i>
            </div>
            <div class="flex-grow-1 text-wrap">
              <h6 class="text-muted mb-1 text-truncate">{{ card.title }}</h6>
              <h5 class="fw-bold mb-0">{{ card.value }}</h5>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts -->
    <div class="row g-4">
      <div class="col-12 col-lg-8">
        <div class="card shadow-sm border-0 h-100">
          <div class="card-header bg-white fw-semibold">Sales Overview</div>
          <div class="card-body p-3">
            <canvas id="salesChart" style="width:100%;height:300px"></canvas>
          </div>
        </div>
      </div>
      <div class="col-12 col-lg-4">
        <div class="card shadow-sm border-0 h-100">
          <div class="card-header bg-white fw-semibold">Top Products</div>
          <ul class="list-group list-group-flush">
            <li v-for="p in products" :key="p.name" class="list-group-item d-flex justify-content-between">
              <span class="text-truncate">{{ p.name }}</span>
              <span class="fw-semibold">{{ p.sales }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

// Dummy data
const kpis = [
  { title: "Total Sales", value: "$12,450", icon: "bi bi-cart-check" },
  { title: "Revenue", value: "$48,320", icon: "bi bi-cash-stack" },
  { title: "Inventory", value: "1,234", icon: "bi bi-box-seam" },
  { title: "Employees", value: "4", icon: "bi bi-people" },
];
const products = [
  { name: "Logo", sales: "320" },
  { name: "Topi", sales: "210" },
  { name: "Seragam", sales: "150" },
];

onMounted(() => {
  const ctx = document.getElementById("salesChart").getContext("2d");
  new Chart(ctx, {
    type: "line",
    data: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      datasets: [{
        label: "Sales ($)",
        data: [1200, 1900, 1500, 2200, 2800, 3200],
        borderColor: "#0d6efd",
        backgroundColor: "rgba(13,110,253,0.2)",
        tension: 0.3,
        fill: true,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } },
    },
  });
});
</script>
