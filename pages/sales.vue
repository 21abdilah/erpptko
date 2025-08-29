<template>
  <div class="p-4">
    <h2 class="text-2xl fw-bold mb-4">💰 PENJUALAN</h2>

    <div class="d-flex gap-3 flex-wrap flex-md-nowrap">
      <!-- KIRI: Produk + Jasa -->
      <div class="flex-grow-1 min-w-300">
        <!-- Filter + Tambah Jasa tetap di atas -->
        <div class="sticky-top bg-white pb-2 z-10">
          <!-- Filter/Search -->
          <div class="mb-3">
            <input v-model="search" type="text" class="form-control" placeholder="🔍 Cari produk..." />
          </div>

          <!-- Tambah Jasa -->
          <div class="d-flex gap-2 mb-3 flex-wrap">
            <input v-model="customName" type="text" placeholder="Nama Jasa" class="form-control w-50"/>
            <input v-model.number="customPrice" type="number" placeholder="Harga" class="form-control w-25"/>
            <button class="btn btn-success" @click="addCustom">Tambah Jasa</button>
          </div>
        </div>

        <!-- Produk Grid scrollable -->
        <div class="scroll-container">
          <div class="row g-3 mb-3">
            <div
              class="col-6 col-md-3"
              v-for="p in filteredProducts"
              :key="p.id"
            >
              <div
                class="card p-2 cursor-pointer shadow-sm hover-shadow animate-fade"
                :class="{ 'opacity-50 cursor-not-allowed': p.stock <= 0 }"
                @click="p.stock > 0 && addProduct(p)"
              >
                <h5 class="text-truncate">{{ p.name }}</h5>
                <p class="text-muted text-truncate">{{ p.category }}</p>
                <p class="fw-bold mb-0">Rp {{ formatCurrency(p.price) }}</p>
                <small>Stock: {{ p.stock }}</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- KANAN: Cart -->
      <div class="cart-container">
        <div class="card shadow-sm p-3 h-100 d-flex flex-column">
          <h5 class="fw-bold mb-3">🛒 Keranjang</h5>

          <div class="cart-scroll flex-grow-1 mb-3">
            <div
              v-for="(item, i) in cart"
              :key="i"
              class="d-flex justify-content-between align-items-center border-bottom py-2 animate-fade"
            >
              <div>
                <p class="m-0 fw-bold">{{ item.item_name }}</p>
                <small>Rp {{ formatCurrency(item.price) }} x </small>
                <input
                  type="number"
                  v-model.number="item.quantity"
                  min="1"
                  class="form-control d-inline w-25"
                />
              </div>
              <div>
                <span class="fw-bold">Rp {{ formatCurrency(item.price * item.quantity) }}</span>
                <button class="btn btn-sm btn-danger ms-2" @click="removeItem(i)">❌</button>
              </div>
            </div>
          </div>

          <!-- Ringkasan -->
          <div class="border-top pt-3">
            <div class="mb-2">
              <label>Customer:</label>
              <input v-model="customerName" type="text" placeholder="Nama Customer" class="form-control" />
            </div>
            <div class="mb-2">
              <label>Potongan:</label>
              <input v-model.number="discount" type="number" class="form-control" />
            </div>
            <div class="mb-2">
              <label>Status:</label>
              <select v-model="status" class="form-select">
                <option value="belum lunas">Belum Lunas</option>
                <option value="lunas">Lunas</option>
              </select>
            </div>
            <h5>Total: Rp {{ formatCurrency(totalAfterDiscount) }}</h5>
            <button class="btn btn-primary w-100 mt-2" @click="checkout">Checkout</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scroll-container {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  padding-right: 5px;
}

.cart-container {
  width: 380px;
  position: sticky;
  top: 20px;
}

.cart-scroll {
  max-height: 300px;
  overflow-y: auto;
  padding-right: 5px;
}

.hover-shadow:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transition: box-shadow 0.2s ease;
}

.min-w-300 { min-width: 300px; }

.animate-fade {
  animation: fadeIn 0.3s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 991px) {
  .cart-container {
    width: 100%;
    position: static;
    margin-top: 20px;
  }
  .scroll-container {
    max-height: calc(100vh - 250px);
  }
}
</style>

<script setup>
import { ref, computed, onMounted } from 'vue'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const products = ref([])
const cart = ref([])
const customName = ref('')
const customPrice = ref(0)
const discount = ref(0)
const status = ref('belum lunas')
const search = ref('')
const customerName = ref('') // 🔥 input manual customer

// Format Rupiah
const formatCurrency = (num)=> new Intl.NumberFormat('id-ID').format(num)

// Fetch products
async function fetchProducts() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
  })
  products.value = await res.json()
}
onMounted(fetchProducts)

// Filter produk
const filteredProducts = computed(() => {
  return products.value.filter(p =>
    p.name.toLowerCase().includes(search.value.toLowerCase())
  )
})

function addProduct(p){
  if(p.stock <= 0) return

  const exist = cart.value.find(i => i.product_id === p.id)
  if(exist){
    if(exist.quantity < p.stock){
      exist.quantity += 1
    } else {
      alert('Stock produk tidak mencukupi!')
    }
  } else {
    cart.value.push({ product_id: p.id, item_name: p.name, price: p.price, quantity:1, stock:p.stock })
  }
}

// Add custom service
function addCustom(){
  if(!customName.value || !customPrice.value) return
  cart.value.push({ product_id:null, item_name: customName.value, price: customPrice.value, quantity:1 })
  customName.value=''; customPrice.value=0
}

// Remove item
function removeItem(i){ cart.value.splice(i,1) }

// Total
const total = computed(()=>cart.value.reduce((sum,i)=> sum+i.price*i.quantity,0))
const totalAfterDiscount = computed(()=>total.value - discount.value)

// Checkout
async function checkout(){
  if(cart.value.length===0) return alert('Keranjang kosong!')

  const saleRes = await fetch(`${SUPABASE_URL}/rest/v1/sales`,{
    method:'POST',
    headers:{
      apikey:SUPABASE_ANON_KEY,
      Authorization:`Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type':'application/json',
      Prefer:'return=representation'
    },
    body: JSON.stringify([{
      customer_name: customerName.value || 'Umum', // 🔥 input customer manual
      total: totalAfterDiscount.value,
      discount: discount.value,
      status: status.value
    }])
  })
  const saleData = await saleRes.json()
  if(!saleData[0]) return alert('Gagal simpan transaksi')
  const sale_id = saleData[0].id

  for(let item of cart.value){
    const plainItem = {
      sale_id,
      product_id: item.product_id,
      item_name: item.item_name,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.price*item.quantity
    }

    await fetch(`${SUPABASE_URL}/rest/v1/sales_items`,{
      method:'POST',
      headers:{
        apikey:SUPABASE_ANON_KEY,
        Authorization:`Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type':'application/json'
      },
      body: JSON.stringify([plainItem])
    })

    if(item.product_id){
      const newStock = item.stock - item.quantity
      await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${item.product_id}`,{
        method:'PATCH',
        headers:{
          apikey:SUPABASE_ANON_KEY,
          Authorization:`Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type':'application/json',
          Prefer:'return=representation'
        },
        body: JSON.stringify({ stock: newStock })
      })
    }
  }

  alert('Transaksi berhasil disimpan!')
  cart.value=[]; discount.value=0; status.value='belum lunas'; customerName.value=''
  fetchProducts()
}
</script>
