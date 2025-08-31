<template>
  <div class="container py-2">
    <!-- Judul & Search -->
    <h1 class="text-center fw-bold mb-1 text-xl">📦 Produk</h1>
    <input
      v-model="keyword"
      type="text"
      class="form-control form-control-sm mb-2"
      placeholder="Cari produk..."
    />

    <!-- Grid Produk -->
    <div class="row g-5">
      <div
        v-for="p in filteredProducts"
        :key="p.id"
        class="col-6 col-md-4 col-lg-2"
      >
        <div class="card h-100 shadow-sm hover-card">
          <span 
            v-if="p.stock <= 0"
            class="badge bg-danger position-absolute top-0 start-50 translate-middle-x m-1">
            Habis
          </span>

          <img 
            :src="p.image || 'https://via.placeholder.com/150'" 
            class="card-img-top"
            alt="produk"
          />

          <div class="card-body p-2 d-flex flex-column">
            <h6 class="card-title mb-1 text-truncate">{{ p.name }}</h6>

            <!-- Harga & stok dalam 1 baris -->
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="text-success fw-semibold small">{{ formatCurrency(p.price) }}</span>
              <span class="text-muted small">📦{{ p.stock }}</span>
            </div>

            <button class="btn btn-sm btn-outline-primary w-100 mt-auto" @click="goToSales(p)">
              BELI
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { useRouter } from "vue-router"

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const router = useRouter()

const products = ref([])
const keyword = ref('')

onMounted(async () => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
  })
  products.value = await res.json()
})

const filteredProducts = computed(() => {
  if (!keyword.value) return products.value
  return products.value.filter(p =>
    p.name.toLowerCase().includes(keyword.value.toLowerCase())
  )
})

function formatCurrency(num) {
  return new Intl.NumberFormat('id-ID', { style:'currency', currency:'IDR' }).format(num || 0)
}

function goToSales(product) {
  router.push({ name: 'sales', query: { product: product.id } })
}
</script>

<style scoped>
.hover-card { transition: 0.2s ease; }
.hover-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }

.card-img-top {
  height: 90px;
  object-fit: cover;
  border-radius: 0.5rem 0.5rem 0 0;
}

.card-title {
  font-size: clamp(0.75rem, 2vw, 0.85rem);
}

.btn {
  font-size: 0.75rem;
  padding: 0.3rem 0.4rem;
}

@media (max-width: 768px) {
  .card-img-top { height: 80px; }
  .row.g-2 { gap: 0.35rem; }
}
</style>
