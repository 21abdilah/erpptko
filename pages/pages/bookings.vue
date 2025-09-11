<template>
  <div class="p-4">
    <h2 class="mb-3 text-center fw-bold">📋 Catatan Pesanan</h2>

    <!-- Tombol Tambah Booking -->
    <div class="d-flex justify-content-end mb-3">
      <button class="btn btn-success d-flex align-items-center gap-2" data-bs-toggle="modal" data-bs-target="#bookingModal">
        ➕ Tambah Pesanan
      </button>
    </div>

    <!-- Filter / Search -->
    <div class="d-flex flex-wrap gap-2 mb-3">
      <input v-model="search" class="form-control flex-grow-1" placeholder="Cari nama / produk" />
      <select v-model="statusFilter" class="form-select w-auto">
        <option value="">Semua Status</option>
        <option value="Belum jadi">Belum jadi</option>
        <option value="Sedang diproses">Sedang diproses</option>
        <option value="Selesai">Selesai</option>
      </select>
    </div>

    <!-- Daftar Booking -->
    <div v-if="filteredBookings.length" class="list-group shadow-sm rounded">
      <div
        v-for="b in filteredBookings"
        :key="b.id"
        class="list-group-item d-flex justify-content-between align-items-start flex-wrap"
      >
        <div class="flex-grow-1">
          <h6 class="fw-bold">{{ b.customer_name }} - {{ b.product_name }}</h6>
          <small>
            Qty: {{ b.quantity }} |
            Total: {{ formatCurrency(b.total) }} |
            Paid: {{ formatCurrency(b.paid_amount) }} |
            Status: <span :class="statusBadge(b.status)">{{ b.status }}</span>
            <template v-if="b.due_date"> | Jatuh tempo: {{ formatDate(b.due_date) }}</template>
          </small>
          <p v-if="b.note" class="mb-0 text-muted">{{ b.note }}</p>
        </div>
        <div class="d-flex gap-2 mt-2 mt-md-0">
          <button v-if="b.status !== 'Selesai'" class="btn btn-sm btn-primary" @click="payPartial(b)">Bayar</button>
          <button class="btn btn-sm btn-danger" @click="deleteBooking(b.id)">Hapus</button>
        </div>
      </div>
    </div>
    <p v-else class="text-muted text-center">Belum ada booking</p>

    <!-- Modal Tambah Booking -->
    <div class="modal fade" id="bookingModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content rounded-4 shadow">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">Tambah Booking</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="mb-2">
              <input v-model="newBooking.customer_name" class="form-control" placeholder="Nama Pelanggan" />
            </div>
            <div class="mb-2">
              <input v-model="newBooking.product_name" class="form-control" placeholder="Produk / Jasa" />
            </div>
            <div class="row g-2 mb-2">
              <div class="col-6">
                <input type="number" v-model.number="newBooking.quantity" class="form-control" placeholder="Qty" />
              </div>
              <div class="col-6">
                <input type="number" v-model.number="newBooking.total" class="form-control" placeholder="Total" />
              </div>
            </div>
            <div class="mb-2">
              <select v-model="newBooking.status" class="form-select">
                <option value="Belum jadi">Belum jadi</option>
                <option value="Sedang diproses">Sedang diproses</option>
                <option value="Selesai">Selesai</option>
              </select>
            </div>
            <div class="mb-2">
              <input type="date" v-model="newBooking.due_date" class="form-control" />
            </div>
            <textarea v-model="newBooking.note" class="form-control" placeholder="Catatan (opsional)"></textarea>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
            <button class="btn btn-success" @click="addBooking">Simpan</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const bookings = ref([])
const newBooking = ref({
  customer_name: '',
  product_name: '',
  quantity: 1,
  total: 0,
  paid_amount: 0,
  note: '',
  status: 'Belum jadi',
  due_date: ''
})
const search = ref('')
const statusFilter = ref('')

async function fetchBookings() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/bookings?select=*`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
  })
  bookings.value = await res.json()
}

async function addBooking() {
  if (!newBooking.value.customer_name || !newBooking.value.product_name || !newBooking.value.total)
    return alert('Isi nama, produk & total!')

  const res = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify([newBooking.value])
  })

  const data = await res.json()
  bookings.value.push(data[0])
  resetForm()

  const modal = bootstrap.Modal.getInstance(document.getElementById('bookingModal'))
  modal.hide()
}

function resetForm() {
  newBooking.value = {
    customer_name: '',
    product_name: '',
    quantity: 1,
    total: 0,
    paid_amount: 0,
    note: '',
    status: 'Belum jadi',
    due_date: ''
  }
}

async function deleteBooking(id) {
  await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${id}`, {
    method: 'DELETE',
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
  })
  bookings.value = bookings.value.filter(b => b.id !== id)
}

async function payPartial(b) {
  const amount = parseFloat(prompt(`Masukkan jumlah bayar (maks ${b.total - b.paid_amount})`, b.total - b.paid_amount))
  if (isNaN(amount) || amount <= 0) return
  b.paid_amount += amount
  if (b.paid_amount >= b.total) b.status = 'Selesai'

  await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${b.id}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ paid_amount: b.paid_amount, status: b.status })
  })
}

const filteredBookings = computed(() =>
  bookings.value.filter(
    b =>
      (!search.value ||
        b.customer_name.toLowerCase().includes(search.value.toLowerCase()) ||
        b.product_name.toLowerCase().includes(search.value.toLowerCase())) &&
      (!statusFilter.value || b.status === statusFilter.value)
  )
)

function statusBadge(status) {
  if (status === 'Belum jadi') return 'badge bg-warning text-dark'
  if (status === 'Sedang diproses') return 'badge bg-primary'
  if (status === 'Selesai') return 'badge bg-success'
  return ''
}

function formatCurrency(num) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num || 0)
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

onMounted(fetchBookings)
</script>

<style scoped>
@media (max-width: 768px) {
  h2 {
    font-size: 1.2rem;
  }
  .list-group-item h6 {
    font-size: 1rem;
  }
}
</style>
