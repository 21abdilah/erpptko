<template>
  <div class="p-2">
    <h2 class="fw-bold mb-3 text-center" style="font-size:1rem">💰 PENJUALAN</h2>

    <div class="d-flex gap-2 flex-wrap flex-md-nowrap">
      <!-- KIRI: Produk + Jasa -->
      <div class="flex-grow-1 min-w-200">
        <!-- Filter/Search -->
        <div class="sticky-top bg-white pb-1 z-10">
          <div class="mb-2">
            <input
              v-model="search"
              type="text"
              class="form-control form-control-sm"
              placeholder="🔍 Cari produk..."
            />
          </div>

          <!-- Tambah Jasa -->
          <div class="d-flex gap-1 mb-2 flex-wrap">
            <input
              v-model="customName"
              type="text"
              placeholder="Nama Jasa"
              class="form-control form-control-sm w-50"
            />
            <input
              v-model.number="customPrice"
              type="number"
              placeholder="Harga"
              class="form-control form-control-sm w-25"
            />
            <button class="btn btn-success btn-sm p-1" @click="addCustom">
              Tambah
            </button>
          </div>
        </div>

        <!-- Produk Grid -->
        <div class="scroll-container">
          <div class="row g-1 mb-2">
            <div
              v-for="p in filteredProducts"
              :key="p.id"
              class="col-6 col-sm-4 col-md-3 col-lg-2"
            >
              <div
                class="card p-1 cursor-pointer shadow-sm hover-shadow animate-fade product-card"
                :class="{ 'opacity-50 cursor-not-allowed': p.stock <= 0 }"
                @click="p.stock > 0 && addProduct(p)"
              >
                <h6 class="text-truncate" style="font-size:0.75rem">{{ p.name }}</h6>
                <p class="text-muted text-truncate" style="font-size:0.65rem">{{ p.category }}</p>
                <p class="fw-bold mb-0" style="font-size:0.7rem">Rp {{ formatCurrency(p.price) }}</p>
                <small style="font-size:0.6rem">Stock: {{ p.stock }}</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- KANAN: Keranjang -->
      <div class="cart-container">
        <div class="card shadow-sm p-1 h-100 d-flex flex-column">
          <h5 class="fw-bold mb-2" style="font-size:0.9rem">🛒 Keranjang</h5>

          <div class="cart-scroll flex-grow-1 mb-1">
            <div
              v-for="(item, i) in cart"
              :key="i"
              class="d-flex justify-content-between align-items-center border-bottom py-1 animate-fade cart-item"
            >
              <div>
                <p class="m-0 fw-bold" style="font-size:0.75rem">{{ item.item_name }}</p>
                <small style="font-size:0.65rem">Rp {{ formatCurrency(item.price) }} x</small>
                <input
                  v-model.number="item.quantity"
                  type="number"
                  min="1"
                  class="form-control d-inline w-25 quantity-input"
                />
              </div>
              <div>
                <span class="fw-bold" style="font-size:0.7rem">
                  Rp {{ formatCurrency(item.price * item.quantity) }}
                </span>
                <button
                  class="btn btn-sm btn-danger ms-1 p-1"
                  @click="removeItem(i)"
                >
                  ❌
                </button>
              </div>
            </div>
          </div>

          <!-- Ringkasan Keranjang -->
          <div class="border-top pt-1 cart-summary">
            <div class="mb-1">
              <input
                v-model="customerName"
                type="text"
                placeholder="Customer"
                class="form-control form-control-sm"
                style="font-size:0.7rem; padding:0.25rem"
              />
            </div>

            <div class="mb-1">
              <input
                v-model.number="discount"
                type="number"
                class="form-control form-control-sm"
                placeholder="Diskon"
                style="font-size:0.7rem; padding:0.25rem"
              />
            </div>

            <div class="mb-1">
              <input
                v-model.number="partialPayment"
                type="number"
                class="form-control form-control-sm"
                placeholder="Uang Diterima"
                style="font-size:0.7rem; padding:0.25rem"
              />
            </div>

            <!-- Ringkasan pembayaran -->
            <div class="mb-1">
              <p class="m-0">Total Bayar: <strong>Rp {{ formatCurrency(totalAfterDiscount) }}</strong></p>
              <p class="m-0">Uang Diterima: <strong>Rp {{ formatCurrency(partialPayment) }}</strong></p>
              <p class="m-0" v-if="kembalian > 0">Kembalian: <strong>Rp {{ formatCurrency(kembalian) }}</strong></p>
              <p class="m-0">Status: <strong>{{ autoStatus.toUpperCase() }}</strong></p>
            </div>

            <button class="btn btn-primary w-100 btn-sm p-1 mt-1" @click="checkout">
              Checkout
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <div v-if="showToast" class="toast-notification">
      {{ toastMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const route = useRoute();

const products = ref([]);
const cart = ref([]);
const customName = ref("");
const customPrice = ref(0);
const discount = ref(0);
const partialPayment = ref(0);
const search = ref("");
const selectedCategory = ref("");
const customerName = ref("");

// Toast
const toastMessage = ref("");
const showToast = ref(false);
function triggerToast(msg, duration = 2000) {
  toastMessage.value = msg;
  showToast.value = true;
  setTimeout(() => (showToast.value = false), duration);
}

// Format rupiah
const formatCurrency = (num) =>
  new Intl.NumberFormat("id-ID").format(num);

// Fetch products
async function fetchProducts() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  products.value = await res.json();
}

// Auto-add produk dari query param
onMounted(async () => {
  await fetchProducts(); // pastikan products sudah terisi

  const productId = route.query.product;
  const qty = Number(route.query.quantity) || 1;

  if (productId) {
    const product = products.value.find(p => p.id == productId);
    if (product) {
      const exist = cart.value.find(i => i.product_id === product.id);
      if (exist) {
        exist.quantity += qty;
        if (exist.quantity > product.stock) exist.quantity = product.stock;
      } else {
        cart.value.push({
          product_id: product.id,
          item_name: product.name,
          price: product.price,
          quantity: qty,
          stock: product.stock
        });
      }
    }
  }
});

// Daftar kategori unik
const categories = computed(() => {
  const cats = products.value.map(p => p.category).filter(Boolean);
  return [...new Set(cats)];
});

// Filter produk
const filteredProducts = computed(() =>
  products.value.filter(p => {
    const matchKeyword =
      !search.value ||
      p.name.toLowerCase().includes(search.value.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(search.value.toLowerCase()));
    const matchCategory = !selectedCategory.value || p.category === selectedCategory.value;
    return matchKeyword && matchCategory;
  })
);

// Tambah produk ke keranjang
function addProduct(p) {
  if (p.stock <= 0) return;

  const exist = cart.value.find((i) => i.product_id === p.id);
  if (exist) {
    if (exist.quantity < p.stock) exist.quantity++;
    else triggerToast("Stock produk tidak mencukupi!");
  } else {
    cart.value.push({
      product_id: p.id,
      item_name: p.name,
      price: p.price,
      quantity: 1,
      stock: p.stock,
    });
  }
}

// Tambah jasa manual
function addCustom() {
  if (!customName.value || !customPrice.value) return;
  cart.value.push({
    product_id: null,
    item_name: customName.value,
    price: customPrice.value,
    quantity: 1,
  });
  customName.value = "";
  customPrice.value = 0;
}

// Hapus item dari keranjang
function removeItem(i) {
  cart.value.splice(i, 1);
}

// Total & setelah diskon
const total = computed(() => cart.value.reduce((sum, i) => sum + i.price * i.quantity, 0));
const totalAfterDiscount = computed(() => total.value - (Number(discount.value) || 0));

// Kembalian & status otomatis
const kembalian = computed(() => Math.max(Number(partialPayment.value) - totalAfterDiscount.value, 0));
const autoStatus = computed(() => (partialPayment.value >= totalAfterDiscount.value && totalAfterDiscount.value > 0 ? "lunas" : "belum lunas"));

// Checkout (panggil Supabase saat benar-benar transaksi)
async function checkout() {
  if (cart.value.length === 0) return triggerToast("Keranjang kosong!");
  
  const payload = [{
    customer_name: customerName.value || "Umum",
    total: totalAfterDiscount.value,
    discount: Number(discount.value) || 0,
    partial_payment: Number(partialPayment.value) || 0,
    status: autoStatus.value,
  }];

  const saleRes = await fetch(`${SUPABASE_URL}/rest/v1/sales`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });

  const saleData = await saleRes.json();
  if (!saleData[0]) return triggerToast("Gagal simpan transaksi");
  const sale_id = saleData[0].id;

  for (let item of cart.value) {
    const plainItem = {
      sale_id,
      product_id: item.product_id,
      item_name: item.item_name,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.price * item.quantity,
    };

    await fetch(`${SUPABASE_URL}/rest/v1/sales_items`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([plainItem]),
    });

    if (item.product_id) {
      const newStock = item.stock - item.quantity;
      await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${item.product_id}`, {
        method: "PATCH",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({ stock: newStock }),
      });
    }
  }

  triggerToast("Transaksi berhasil disimpan!");
  cart.value = [];
  discount.value = 0;
  partialPayment.value = 0;
  customerName.value = "";
  fetchProducts();
}
</script>


<style scoped>
.scroll-container { max-height: 380px; overflow-y:auto; padding-right:2px; }
.cart-container { width:280px; position:sticky; top:10px; }
.cart-scroll { max-height:250px; overflow-y:auto; padding-right:2px; }
.cart-item { padding:0.15rem 0; }
.quantity-input { font-size:0.7rem; height:24px; }
.hover-shadow:hover { box-shadow:0 3px 8px rgba(0,0,0,0.15); transition:0.2s; }
.animate-fade { animation: fadeIn 0.2s ease; }
@keyframes fadeIn { from {opacity:0; transform:translateY(3px);} to {opacity:1; transform:translateY(0);} }
.toast-notification { position:fixed; bottom:10px; right:10px; background:#333; color:#fff; padding:6px 10px; border-radius:6px; font-size:0.7rem; z-index:2000; opacity:0.95; }
@media (max-width: 991px) { .cart-container { width:100%; position:static; margin-top:5px; } .scroll-container { max-height:300px; } .cart-scroll { max-height:180px; } }
</style>
