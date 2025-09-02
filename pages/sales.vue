<template>
  <div class="p-2 d-flex flex-wrap gap-2">
    <!-- Produk Grid -->
    <div class="flex-grow-1 min-w-200">
      <div class="sticky-top bg-white pb-1 z-10 mb-2">
        <!-- Filter/Search -->
        <input v-model="search" type="text" class="form-control form-control-sm mb-2" placeholder="🔍 Cari produk..."/>

        <!-- Tambah Jasa -->
        <div class="d-flex gap-1 flex-wrap mb-2">
          <input v-model="customName" type="text" placeholder="Nama Jasa" class="form-control form-control-sm w-50"/>
          <input v-model.number="customPrice" type="number" placeholder="Harga" class="form-control form-control-sm w-25"/>
          <button class="btn btn-success btn-sm p-1" @click="addCustom">Tambah</button>
        </div>
      </div>

      <div class="scroll-container">
        <div class="row g-2">
          <div v-for="p in filteredProducts" :key="p.id" class="col-6 col-sm-4 col-md-3 col-lg-2">
            <div
              class="card p-1 cursor-pointer shadow-sm hover-shadow animate-fade product-card"
              :class="{ 'opacity-50 cursor-not-allowed': p.stock<=0, 'low-stock': p.stock>0 && p.stock<=3 }"
              @click="p.stock>0 && addProduct(p)"
            >
              <h6 class="text-truncate" style="font-size:0.75rem">{{p.name}}</h6>
              <p class="text-muted text-truncate" style="font-size:0.65rem">{{p.category}}</p>
              <p class="fw-bold mb-0" style="font-size:0.7rem">Rp {{ formatCurrency(p.price) }}</p>
              <small :class="{ 'text-danger': p.stock>0 && p.stock<=3 }" style="font-size:0.6rem">Stock: {{p.stock}}</small>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Keranjang -->
    <div class="cart-container">
      <div class="card shadow-sm p-1 h-100 d-flex flex-column">
        <h5 class="fw-bold mb-2" style="font-size:0.9rem">🛒 Keranjang</h5>
        <div class="cart-scroll flex-grow-1 mb-1">
          <div v-for="(item,i) in cart" :key="i" class="d-flex justify-content-between align-items-center border-bottom py-1 animate-fade">
            <div>
              <p class="m-0 fw-bold" style="font-size:0.75rem">{{item.item_name}}</p>
              <small style="font-size:0.65rem">Rp {{ formatCurrency(item.price) }} x</small>
              <input v-model.number="item.quantity" type="number" min="1" class="form-control d-inline w-25 quantity-input" @change="updateCart()"/>
            </div>
            <div>
              <span class="fw-bold" style="font-size:0.7rem">Rp {{ formatCurrency(item.price*item.quantity) }}</span>
              <button class="btn btn-sm btn-danger ms-1 p-1" @click="removeItem(i)">❌</button>
            </div>
          </div>
        </div>

        <div class="border-top pt-1 cart-summary">
          <input v-model="customerName" type="text" class="form-control form-control-sm mb-1" placeholder="Customer" style="font-size:0.7rem; padding:0.25rem"/>
          <input v-model.number="discount" type="number" class="form-control form-control-sm mb-1" placeholder="Diskon" style="font-size:0.7rem; padding:0.25rem"/>
          <input v-model.number="partialPayment" type="number" class="form-control form-control-sm mb-1" placeholder="Uang Diterima" style="font-size:0.7rem; padding:0.25rem"/>
          <p class="m-0">Total: <strong>Rp {{ formatCurrency(totalAfterDiscount) }}</strong></p>
          <p class="m-0">Uang Diterima: <strong>Rp {{ formatCurrency(partialPayment) }}</strong></p>
          <p class="m-0" v-if="kembalian>0">Kembalian: <strong>Rp {{ formatCurrency(kembalian) }}</strong></p>
          <p class="m-0">Status: <strong>{{ autoStatus.toUpperCase() }}</strong></p>
          <button class="btn btn-primary w-100 btn-sm mt-1" @click="checkout">Checkout</button>
        </div>
      </div>
    </div>

    <div v-if="showToast" class="toast-notification-center">{{toastMessage}}</div>
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
const search = ref('');
const discount = ref(0);
const partialPayment = ref(0);
const customerName = ref('');
const customName = ref('');
const customPrice = ref(0);

const showToast = ref(false);
const toastMessage = ref("");
function triggerToast(msg,duration=1500){ toastMessage.value=msg; showToast.value=true; setTimeout(()=>showToast.value=false,duration); }

function formatCurrency(num){ return new Intl.NumberFormat('id-ID').format(num); }

async function fetchProducts(){
  const res = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*`,{
    headers:{apikey:SUPABASE_ANON_KEY,Authorization:`Bearer ${SUPABASE_ANON_KEY}`}
  });
  products.value = await res.json();
}

// Load cart dari localStorage
onMounted(async()=>{
  await fetchProducts();
  const saved = localStorage.getItem("cartProducts");
  if(saved) cart.value = JSON.parse(saved);
});

// Filter produk
const filteredProducts = computed(()=>{
  return products.value.filter(p=> !search.value || p.name.toLowerCase().includes(search.value.toLowerCase()));
});

// Add product
function addProduct(p){
  if(p.stock<=0) return triggerToast("Stock habis!");
  const exist = cart.value.find(i=>i.product_id===p.id);
  if(exist){
    exist.quantity++;
    if(exist.quantity>p.stock) exist.quantity=p.stock;
  } else {
    cart.value.push({ product_id:p.id, item_name:p.name, price:p.price, quantity:1, stock:p.stock });
  }
  localStorage.setItem("cartProducts", JSON.stringify(cart.value));
}

// Tambah jasa manual
function addCustom(){
  if(!customName.value || !customPrice.value) return;
  cart.value.push({ product_id:null, item_name:customName.value, price:customPrice.value, quantity:1 });
  customName.value=""; customPrice.value=0;
  localStorage.setItem("cartProducts", JSON.stringify(cart.value));
}

// Hapus item
function removeItem(i){ cart.value.splice(i,1); localStorage.setItem("cartProducts", JSON.stringify(cart.value)); }
function updateCart(){ localStorage.setItem("cartProducts", JSON.stringify(cart.value)); }

// Total & kembalian
const total = computed(()=> cart.value.reduce((sum,i)=>sum+i.price*i.quantity,0));
const totalAfterDiscount = computed(()=> total.value-(Number(discount.value)||0));
const kembalian = computed(()=> Math.max(Number(partialPayment.value)-totalAfterDiscount.value,0));
const autoStatus = computed(()=> partialPayment.value>=totalAfterDiscount.value && totalAfterDiscount.value>0 ? "lunas":"belum lunas");

// Checkout (Supabase)
async function checkout(){
  if(cart.value.length===0) return triggerToast("Keranjang kosong!");
  const payload=[{ customer_name: customerName.value||"Umum", total:totalAfterDiscount.value, discount:Number(discount.value)||0, partial_payment:Number(partialPayment.value)||0, status:autoStatus.value }];
  const saleRes = await fetch(`${SUPABASE_URL}/rest/v1/sales`,{
    method:"POST", headers:{apikey:SUPABASE_ANON_KEY,Authorization:`Bearer ${SUPABASE_ANON_KEY}`,"Content-Type":"application/json",Prefer:"return=representation"}, body:JSON.stringify(payload)
  });
  const saleData = await saleRes.json();
  if(!saleData[0]) return triggerToast("Gagal simpan transaksi");
  const sale_id = saleData[0].id;

  for(let item of cart.value){
    const plainItem={ sale_id, product_id:item.product_id, item_name:item.item_name, quantity:item.quantity, price:item.price, subtotal:item.price*item.quantity };
    await fetch(`${SUPABASE_URL}/rest/v1/sales_items`,{ method:"POST", headers:{apikey:SUPABASE_ANON_KEY,Authorization:`Bearer ${SUPABASE_ANON_KEY}`,"Content-Type":"application/json"}, body:JSON.stringify([plainItem]) });

    if(item.product_id){
      const newStock=item.stock-item.quantity;
      await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${item.product_id}`,{ method:"PATCH", headers:{apikey:SUPABASE_ANON_KEY,Authorization:`Bearer ${SUPABASE_ANON_KEY}`,"Content-Type":"application/json",Prefer:"return=representation"}, body:JSON.stringify({stock:newStock}) });
    }
  }

  triggerToast("Transaksi berhasil disimpan!");
  cart.value=[]; discount.value=0; partialPayment.value=0; customerName.value="";
  localStorage.removeItem("cartProducts");
  fetchProducts();
}
</script>

<style scoped>
.scroll-container{ max-height:380px; overflow-y:auto; padding-right:2px; }
.cart-container{ width:280px; position:sticky; top:10px; }
.cart-scroll{ max-height:250px; overflow-y:auto; padding-right:2px; }
.quantity-input{ font-size:0.7rem; height:24px; }
.hover-shadow:hover{ box-shadow:0 3px 8px rgba(0,0,0,0.15); transition:0.2s; }
.animate-fade{ animation:fadeIn 0.2s ease; }
@keyframes fadeIn{ from{opacity:0; transform:translateY(3px);} to{opacity:1; transform:translateY(0);} }
.toast-notification-center{ position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:#333; color:#fff; padding:8px 14px; border-radius:6px; font-size:0.8rem; z-index:9999; opacity:0.95; }

/* Produk UI tambahan */
.product-card:hover:not(.cursor-not-allowed){ background:#f1faff; transition:0.2s; }
.low-stock{ border:1px solid #ff6b6b; }

@media(max-width:991px){ 
  .cart-container{ width:100%; position:static; margin-top:5px; } 
  .scroll-container{ max-height:300px; } 
  .cart-scroll{ max-height:180px; } 
}
</style>
