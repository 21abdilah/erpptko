<template>
  <div class="container py-3">

    <h2 class="mb-3">📜 Riwayat Transaksi</h2>

    <!-- Ringkasan -->
    <div class="row g-2 mb-3">
      <div class="col-12 col-md-4">
        <div class="p-3 rounded shadow-sm bg-blue-50 h-100 hover-shadow d-flex justify-content-between align-items-center">
          <div>
            <h2 class="fs-6 fw-semibold text-primary mb-1">Total Transaksi</h2>
            <p class="fs-5 fw-bold mb-0">{{ formatCurrency(summary.total) }}</p>
          </div>
          <span class="fs-2">💰</span>
        </div>
      </div>
      <div class="col-12 col-md-4">
        <div class="p-3 rounded shadow-sm bg-green-50 h-100 hover-shadow d-flex justify-content-between align-items-center">
          <div>
            <h2 class="fs-6 fw-semibold text-success mb-1">Sudah Dibayar</h2>
            <p class="fs-5 fw-bold mb-0">{{ formatCurrency(summary.paid) }}</p>
          </div>
          <span class="fs-2">✅</span>
        </div>
      </div>
      <div class="col-12 col-md-4">
        <div class="p-3 rounded shadow-sm bg-warning bg-opacity-25 h-100 hover-shadow d-flex justify-content-between align-items-center">
          <div>
            <h2 class="fs-6 fw-semibold text-dark mb-1">Belum Dibayar</h2>
            <p class="fs-5 fw-bold mb-0">{{ formatCurrency(summary.unpaid) }}</p>
          </div>
          <span class="fs-2">⚠️</span>
        </div>
      </div>
    </div>

    <!-- Filter -->
    <div class="d-flex flex-wrap gap-2 mb-3 align-items-end">
      <div class="flex-fill">
        <label class="form-label small mb-1">Dari</label>
        <input type="date" v-model="fromDate" class="form-control form-control-sm"/>
      </div>
      <div class="flex-fill">
        <label class="form-label small mb-1">Sampai</label>
        <input type="date" v-model="toDate" class="form-control form-control-sm"/>
      </div>
<div class="flex-fill">
  <label class="form-label small mb-1">Customer</label>
  <input 
    v-model="filterCustomer" 
    list="customerList" 
    class="form-control form-control-sm" 
    placeholder="Ketik atau pilih customer"/>
  <datalist id="customerList">
    <option v-for="c in customers" :key="c" :value="c">{{ c }}</option>
  </datalist>
</div>
      <button class="btn btn-secondary btn-sm align-self-start" @click="applyFilter">
        <i class="bi bi-filter"></i> Filter
      </button>
    </div>

    <!-- Tabel -->
    <div class="table-responsive shadow-sm rounded mb-3">
      <table class="table table-striped table-bordered table-hover align-middle mb-0">
        <thead class="table-dark sticky">
          <tr>
            <th>Tanggal</th>
            <th>Jam</th>
            <th>Customer</th>
            <th>Item</th>
            <th class="text-end">Qty</th>
            <th class="text-end">Harga</th>
            <th class="text-end">Subtotal</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in paginatedData" :key="s.id">
            <td>{{ formatDate(s.sale_date) }}</td>
            <td>{{ formatTime(s.sale_date) }}</td>
            <td>{{ s.customer_name }}</td>
            <td>{{ s.item_name }}</td>
            <td class="text-end">{{ s.quantity }}</td>
            <td class="text-end">{{ formatCurrency(s.price) }}</td>
            <td class="text-end">{{ formatCurrency(s.subtotal) }}</td>
            <td>
              <span 
                class="badge rounded-pill"
                :class="s.status === 'paid' ? 'bg-success' : 'bg-warning text-dark'">
                {{ s.status === 'paid' ? 'Lunas' : 'Belum Lunas' }}
              </span>
            </td>
            <td>
              <button 
                v-if="s.status !== 'paid'" 
                class="btn btn-sm btn-primary"
                @click="bayar(s)">
                Bayar
              </button>
            </td>
          </tr>
          <tr v-if="paginatedData.length === 0">
            <td colspan="9" class="text-center text-muted">Tidak ada data</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <nav class="d-flex justify-content-between align-items-center flex-wrap gap-2">
      <button 
        class="btn btn-outline-secondary btn-sm" 
        :disabled="page === 1" 
        @click="page--">
        ‹ Prev
      </button>
      <div>Halaman {{ page }} / {{ totalPages }}</div>
      <button 
        class="btn btn-outline-secondary btn-sm" 
        :disabled="page === totalPages" 
        @click="page++">
        Next ›
      </button>
    </nav>

  </div>
</template>

<style scoped>
.hover-shadow:hover {
  box-shadow: 0 3px 10px rgba(0,0,0,0.12);
  transition: box-shadow 0.2s ease;
}
.table-hover tbody tr:hover {
  background-color: #f0f8ff;
  transition: 0.2s;
}
.badge {
  font-size: 0.8rem;
  padding: 0.3em 0.5em;
}
@media (max-width: 992px) {
  .row.g-2 > .col-md-4 {
    flex: 0 0 100%;
    max-width: 100%;
  }
}
</style>
<script setup>
import { ref, computed, onMounted } from "vue"

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const history = ref([])
const customers = ref([])
const summary = ref({ total: 0, paid: 0, unpaid: 0 })
const fromDate = ref(new Date().toISOString().split("T")[0])
const toDate = ref(new Date().toISOString().split("T")[0])
const filterCustomer = ref("")

// Pagination
const page = ref(1)
const perPage = 10

const totalPages = computed(() => Math.ceil(history.value.length / perPage))
const paginatedData = computed(() => {
  const start = (page.value - 1) * perPage
  return history.value.slice(start, start + perPage)
})

function formatDate(str) {
  return new Date(str).toLocaleDateString("id-ID")
}
function formatTime(str) {
  return new Date(str).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
}
function formatCurrency(num) {
  return new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR" }).format(num || 0)
}

async function fetchHistory() {
  let query = `${SUPABASE_URL}/rest/v1/report_sales_detail?sale_date=gte.${fromDate.value}T00:00:00Z&sale_date=lte.${toDate.value}T23:59:59Z`
  if (filterCustomer.value) {
    query += `&customer_name=eq.${encodeURIComponent(filterCustomer.value)}`
  }

  const res = await fetch(query, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`
    }
  })
  const data = await res.json()
  history.value = data || []
  page.value = 1 // reset ke halaman 1 kalau filter ulang

  // isi dropdown customer unik
  customers.value = [...new Set(data.map(d => d.customer_name))]

  // hitung ringkasan
  const total = data.reduce((sum, d) => sum + d.subtotal, 0)
  const paid = data.filter(d => d.status === "paid")
                   .reduce((sum, d) => sum + d.subtotal, 0)
  const unpaid = total - paid
  summary.value = { total, paid, unpaid }
}

function applyFilter() {
  fetchHistory()
}

async function bayar(sale) {
  const amount = prompt("Masukkan jumlah yang dibayar:", sale.subtotal)
  if (!amount) return

  const paid = parseFloat(amount)
  const newStatus = paid >= sale.subtotal ? "paid" : "partial"

  await fetch(`${SUPABASE_URL}/rest/v1/sales?id=eq.${sale.sale_id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({ 
      paid_amount: paid, 
      status: newStatus 
    })
  })

  fetchHistory()
}

onMounted(() => {
  fetchHistory()
})
</script>
