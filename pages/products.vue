<template>
  <div class="container py-2">
    <h1 class="fw-bold mb-2">📦 Produk</h1>

    <!-- Filter & Search -->
    <div class="d-flex gap-2 mb-2 flex-wrap">
      <input v-model="selectedCategory" list="category-list" class="form-control form-control-sm w-auto" placeholder="Filter kategori..." />
      <datalist id="category-list">
        <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
      </datalist>
      <input v-model="keyword" type="text" class="form-control form-control-sm flex-grow-1" placeholder="Cari produk..." />
    </div>

    <!-- Grid Produk scroll vertical -->
    <div class="product-scroll">
      <div class="product-grid">
        <div 
          v-for="p in filteredProducts" 
          :key="p.id" 
          class="card product-card"
          :class="{ 'border-primary border-2': p.selected, 'opacity-75 cursor-not-allowed': p.stock <= 0 }"
        >
          <span v-if="p.stock <= 0" class="badge bg-danger position-absolute top-0 start-50 translate-middle-x m-1">Habis</span>
          <img :src="p.image || 'https://via.placeholder.com/150'" class="card-img-top mb-1" />

          <h6 class="mb-0 text-truncate">{{ p.name }}</h6>
          <p class="small text-muted mb-1 text-truncate">{{ p.category }}</p>
          <p class="text-success fw-semibold mb-1 small">
            Rp {{ formatCurrency(p.price) }} | Stock: {{ p.stock }}
          </p>

          <div class="d-flex align-items-center gap-1 mb-1 position-relative">
            <input 
              type="number" 
              v-model.number="p.selectedQty" 
              min="1" 
              :max="p.stock" 
              class="form-control form-control-sm"
              :disabled="p.stock <= 0"
              @mouseenter="p.showTooltip = true"
              @mouseleave="p.showTooltip = false"
            />
            <input type="checkbox" v-model="p.selected" :disabled="p.stock <= 0" />
            <div v-if="p.showTooltip" class="tooltip-stock fade">{{ 'Max: ' + p.stock }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Preview Keranjang -->
    <div class="cart-preview mt-2">
      <h6 class="fw-bold mb-1">🛒 Keranjang Preview</h6>
      <div v-if="tempCart.length" class="d-flex flex-wrap gap-2">
        <div v-for="item in tempCart" :key="item.product_id" class="badge bg-primary">
          {{ item.item_name }} x{{ item.quantity }}
        </div>
      </div>
      <p v-else class="text-muted small">Belum ada produk dipilih</p>
    </div>

    <!-- Tombol Tambah & Lanjut -->
    <div class="text-end mt-2">
      <button class="btn btn-primary btn-sm" @click="addSelectedToCart">Tambah ke Keranjang</button>
      <button class="btn btn-success btn-sm ms-2" @click="goToSalesPage">Lanjut ke Penjualan</button>
    </div>

    <!-- Toast di tengah -->
    <div v-if="showToast" class="toast-notification-center fade">{{ toastMessage }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const router = useRouter();

const products = ref([]);
const keyword = ref("");
const selectedCategory = ref("");
const tempCart = ref([]);

// Toast
const toastMessage = ref("");
const showToast = ref(false);
function triggerToast(msg, duration = 2000) {
  toastMessage.value = msg;
  showToast.value = true;
  setTimeout(() => (showToast.value = false), duration);
}

// Fetch products
onMounted(async () => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
  });
  const data = await res.json();
  products.value = data.map(p => ({ ...p, selectedQty: 1, selected: false, showTooltip: false }));
});

// Daftar kategori unik
const categories = computed(() => [...new Set(products.value.map(p => p.category).filter(Boolean))]);

// Filter produk
const filteredProducts = computed(() =>
  products.value.filter(p => {
    const matchKeyword = !keyword.value || p.name.toLowerCase().includes(keyword.value.toLowerCase()) || (p.category && p.category.toLowerCase().includes(keyword.value.toLowerCase()));
    const matchCategory = !selectedCategory.value || p.category === selectedCategory.value;
    return matchKeyword && matchCategory;
  })
);

// Format rupiah
const formatCurrency = num => new Intl.NumberFormat("id-ID").format(num);

// Tambah semua produk yang dipilih ke tempCart
function addSelectedToCart() {
  const selectedProducts = products.value.filter(p => p.selected && p.selectedQty > 0);
  if (!selectedProducts.length) return triggerToast("Pilih produk dulu!");

  selectedProducts.forEach(p => {
    const exist = tempCart.value.find(i => i.product_id === p.id);
    if (exist) {
      exist.quantity += p.selectedQty;
      if (exist.quantity > p.stock) exist.quantity = p.stock;
    } else {
      tempCart.value.push({
        product_id: p.id,
        item_name: p.name,
        price: p.price,
        quantity: p.selectedQty,
        stock: p.stock
      });
    }
    p.selected = false;
    p.selectedQty = 1;
    p.showTooltip = false;
  });

  triggerToast("Produk ditambahkan ke keranjang!");
}

// Kirim semua ke sales.vue dan simpan localStorage supaya keranjang tidak kosong
function goToSalesPage() {
  if (!tempCart.value.length) return triggerToast("Keranjang kosong!");
  localStorage.setItem("cartProducts", JSON.stringify(tempCart.value));
  router.push({ path: '/sales' });
  tempCart.value = [];
}
</script>

<style scoped>
/* Grid scroll vertical */
.product-scroll {
  max-height: 65vh;
  overflow-y: auto;
  padding-right: 4px;
}

/* Grid responsive untuk semua device */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.5rem;
}

.product-card { transition: 0.25s ease, box-shadow 0.25s ease; cursor: pointer; border-radius:0.25rem; position:relative; padding:0.5rem; }
.product-card:hover { transform: translateY(-3px); box-shadow: 0 6px 12px rgba(0,0,0,0.15); }

.cart-preview .badge { font-size:0.65rem; padding:0.3em 0.5em; }

.toast-notification-center {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #333;
  color: #fff;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 0.8rem;
  z-index: 3000;
  opacity: 0.95;
}

/* Tooltip stock dengan fade */
.tooltip-stock {
  position: absolute;
  background: #000;
  color: #fff;
  font-size: 0.65rem;
  padding: 2px 5px;
  border-radius: 4px;
  top: -22px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  z-index: 1000;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
}
.tooltip-stock.fade { opacity: 1; }

.fade { transition: opacity 0.25s ease; }

@media (max-width: 767px) {
  .product-grid { grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); }
}
</style>
