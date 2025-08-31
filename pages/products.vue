<template>
  <div class="container py-2">
    <!-- Judul & Total Produk -->
    <div class="d-flex justify-content-between align-items-center mb-1">
      <h1 class="fw-bold text-xl mb-0">📦 Produk</h1>
      <span class="badge bg-primary">Total: {{ filteredProducts.length }}</span>
    </div>

    <!-- Filter Kategori + Search -->
    <div class="d-flex gap-2 mb-2">
      <input
        v-model="selectedCategory"
        list="category-list"
        class="form-control form-control-sm w-auto"
        placeholder="Filter kategori..."
      />
      <datalist id="category-list">
        <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
      </datalist>

      <input
        v-model="keyword"
        type="text"
        class="form-control form-control-sm"
        placeholder="Cari produk..."
      />
    </div>

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
            <p class="small text-muted mb-1">{{ p.category }}</p>
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="text-success fw-semibold small">{{ formatCurrency(p.price) }}</span>
              <span class="text-muted small">📦{{ p.stock }}</span>
            </div>

            <button 
              class="btn btn-sm btn-outline-primary w-100 mt-auto" 
              @click="goToSales(p)"
              :disabled="p.stock <= 0"
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
const selectedCategory = ref('')

// Ambil data produk
onMounted(async () => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
  })
  products.value = await res.json()
})

// Buat daftar kategori unik
const categories = computed(() => {
  const cats = products.value.map(p => p.category).filter(Boolean)
  return [...new Set(cats)]
})

// Filter berdasarkan keyword & kategori
const filteredProducts = computed(() => {
  return products.value.filter(p => {
    const matchKeyword = !keyword.value || 
      p.name.toLowerCase().includes(keyword.value.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(keyword.value.toLowerCase()))
    const matchCategory = !selectedCategory.value || p.category === selectedCategory.value
    return matchKeyword && matchCategory
  })
})

function formatCurrency(num) {
  return new Intl.NumberFormat('id-ID', { style:'currency', currency:'IDR' }).format(num || 0)
}

// Navigasi ke sales.vue + kirim product id lewat query
function goToSales(product) {
  router.push({ name: 'sales', query: { product: product.id, quantity: 1 } })
}
</script>

<style scoped>
.hover-card { transition: 0.2s ease; }
.hover-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }

.card-img-top { height: 90px; object-fit: cover; border-radius: 0.5rem 0.5rem 0 0; }
.card-title { font-size: clamp(0.75rem, 2vw, 0.85rem); }
.btn { font-size: 0.75rem; padding: 0.3rem 0.4rem; }
@media (max-width: 768px) { .card-img-top { height: 80px; } }
</style>
