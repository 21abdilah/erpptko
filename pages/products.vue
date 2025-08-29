<template>
  <div class="container py-3">
    <h1 class="mb-1 text-center fw-bold">📦 Produk</h1>
    <!-- Jumlah produk -->
    <p class="text-center text-muted small mb-3">
      Total Produk: {{ filteredProducts.length }}
    </p>

    <!-- Search -->
    <div class="mb-3">
      <input
        v-model="keyword"
        type="text"
        class="form-control form-control-sm"
        placeholder="Cari produk..."
      />
    </div>

    <!-- Grid Produk -->
    <div class="row g-2">
      <div
        v-for="p in filteredProducts"
        :key="p.id"
        class="col-6 col-sm-4 col-md-3 col-lg-2"
      >
        <div class="card h-100 shadow-sm hover-card position-relative">
          <!-- Stok habis badge -->
          <span 
            v-if="p.stock <= 0" 
            class="badge bg-danger position-absolute top-0 start-50 translate-middle-x m-1">
            Stok Habis
          </span>

          <img 
            :src="p.image || 'https://via.placeholder.com/150'" 
            class="card-img-top" 
            alt="produk"
          />
          <div class="card-body p-2 d-flex flex-column">
            <h6 class="card-title mb-1">{{ p.name }}</h6>
            <p class="mb-1 text-success fw-semibold">{{ formatCurrency(p.price) }}</p>
            <p class="mb-2 text-muted small">Kategori: {{ p.category }}</p>
            <p class="mb-2 text-muted small">Stok: {{ p.stock }}</p>
            <button
              class="btn btn-sm btn-outline-secondary"
              @click="goToSales(p)"
            >
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

// Chat / sales pindah halaman
function goToSales(product) {
  router.push({ name: 'sales', query: { product: product.id } })
}
</script>

<style scoped>
.hover-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(0,0,0,0.15);
  transition: 0.2s;
}

.card-img-top {
  height: 120px;
  object-fit: cover;
}

.card-title {
  font-size: 0.9rem;
}

.btn {
  font-size: 0.8rem;
  padding: 0.25rem 0.4rem;
}

/* Tablet responsive */
@media (max-width: 1024px) {
  .card-img-top {
    height: 100px;
  }
  .card-title {
    font-size: 0.85rem;
  }
  .btn {
    font-size: 0.75rem;
    padding: 0.2rem 0.35rem;
  }
  .row.g-2 {
    gap: 0.5rem;
  }
}
</style>
