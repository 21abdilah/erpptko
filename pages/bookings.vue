<template>
  <div class="p-4">
    <h2 class="mb-3 text-center fw-bold">📋Catatan Pesanan</h2>

    <!-- Tambah Booking -->
    <div class="card mb-3 p-3">
      <div class="row g-2">
        <div class="col-md-3">
          <input v-model="newBooking.customer_name" class="form-control" placeholder="Nama Pelanggan"/>
        </div>
        <div class="col-md-3">
          <input v-model="newBooking.product_name" class="form-control" placeholder="Produk / Jasa"/>
        </div>
        <div class="col-md-2">
          <input type="number" v-model.number="newBooking.quantity" class="form-control" placeholder="Qty"/>
        </div>
        <div class="col-md-2">
          <input type="number" v-model.number="newBooking.total" class="form-control" placeholder="Total"/>
        </div>
        <div class="col-md-2 d-flex gap-2">
          <button class="btn btn-success w-100" @click="addBooking">Tambah</button>
          <button class="btn btn-secondary w-100" @click="resetForm">Reset</button>
        </div>
      </div>
    </div>

    <!-- Filter / Search -->
    <div class="d-flex gap-2 mb-3">
      <input v-model="search" class="form-control w-50" placeholder="Cari nama / produk"/>
      <select v-model="statusFilter" class="form-select w-25">
        <option value="">Semua Status</option>
        <option value="Belum jadi">Belum jadi</option>
        <option value="Sedang diproses">Sedang diproses</option>
        <option value="Selesai">Selesai</option>
      </select>
    </div>

    <!-- Daftar Booking -->
    <div v-if="filteredBookings.length" class="list-group">
      <div v-for="b in filteredBookings" :key="b.id" class="list-group-item d-flex justify-content-between align-items-center">
        <div>
          <h6>{{ b.customer_name }} - {{ b.product_name }}</h6>
          <small>Qty: {{ b.quantity }} | Total: {{ formatCurrency(b.total) }} | Paid: {{ formatCurrency(b.paid_amount) }} | Status: 
            <span :class="statusBadge(b.status)">{{ b.status }}</span>
          </small>
          <p class="mb-0">{{ b.note }}</p>
        </div>
        <div class="d-flex gap-2">
          <button v-if="b.status==='Belum jadi'" class="btn btn-sm btn-primary" @click="payPartial(b)">Bayar</button>
          <button class="btn btn-sm btn-danger" @click="deleteBooking(b.id)">Hapus</button>
        </div>
      </div>
    </div>
    <p v-else class="text-muted text-center">Belum ada booking</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const bookings = ref([])
const newBooking = ref({ customer_name:'', product_name:'', quantity:1, total:0, paid_amount:0, note:'', status:'Belum jadi', due_date:'' })
const search = ref('')
const statusFilter = ref('')

// Fetch
async function fetchBookings(){
  const res = await fetch(`${SUPABASE_URL}/rest/v1/bookings?select=*`, {
    headers:{ apikey: SUPABASE_ANON_KEY, Authorization:`Bearer ${SUPABASE_ANON_KEY}` }
  })
  bookings.value = await res.json()
}

// Add
async function addBooking(){
  if(!newBooking.value.customer_name || !newBooking.value.product_name || !newBooking.value.total) return alert('Isi nama, produk & total!')
  const res = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
    method:'POST',
    headers:{ apikey: SUPABASE_ANON_KEY, Authorization:`Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type':'application/json', Prefer:'return=representation' },
    body: JSON.stringify([newBooking.value])
  })
  const data = await res.json()
  bookings.value.push(data[0])
  resetForm()
}

// Reset
function resetForm(){ newBooking.value = { customer_name:'', product_name:'', quantity:1, total:0, paid_amount:0, note:'', status:'Belum jadi', due_date:'' }}

// Delete
async function deleteBooking(id){
  await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${id}`, { method:'DELETE', headers:{ apikey: SUPABASE_ANON_KEY, Authorization:`Bearer ${SUPABASE_ANON_KEY}` } })
  bookings.value = bookings.value.filter(b=>b.id!==id)
}

// Bayar Parsial
async function payPartial(b){
  const amount = parseFloat(prompt(`Masukkan jumlah bayar (maks ${b.total - b.paid_amount})`, b.total - b.paid_amount))
  if(isNaN(amount) || amount<=0) return
  b.paid_amount += amount
  if(b.paid_amount >= b.total) b.status='Selesai'
  await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${b.id}`, {
    method:'PATCH',
    headers:{ apikey: SUPABASE_ANON_KEY, Authorization:`Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type':'application/json' },
    body: JSON.stringify({ paid_amount:b.paid_amount, status:b.status })
  })
}

// Filter
const filteredBookings = computed(()=>bookings.value.filter(b=>
  (!search.value || b.customer_name.toLowerCase().includes(search.value.toLowerCase()) || b.product_name.toLowerCase().includes(search.value.toLowerCase())) &&
  (!statusFilter.value || b.status===statusFilter.value)
))

function statusBadge(status){
  if(status==='Belum jadi') return 'badge bg-warning text-dark'
  if(status==='Sedang diproses') return 'badge bg-primary'
  if(status==='Selesai') return 'badge bg-success'
  return ''
}

onMounted(fetchBookings)
function formatCurrency(num){ return new Intl.NumberFormat('id-ID', { style:'currency', currency:'IDR' }).format(num || 0) }
</script>
