<template>
  <div class="container py-3">
    <h2 class="mb-3">📜 Riwayat & Laporan Transaksi</h2>
<!-- Summary Cards -->
<div class="row g-3 mb-4">
  <div class="col-12 col-sm-6 col-md-4 col-lg-3" v-for="card in summaryCards" :key="card.title">
    <div class="p-3 rounded shadow-sm h-100 d-flex flex-column flex-sm-row justify-content-between align-items-center text-center text-sm-start summary-card"
         :class="card.bg">
      <div class="mb-2 mb-sm-0">
        <h6 class="fw-semibold mb-1">{{ card.title }}</h6>
        <p class="fs-5 fw-bold mb-0">{{ formatCurrency(card.value) }}</p>
      </div>
      <span class="fs-2">{{ card.icon }}</span>
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
        <input v-model="filterCustomer" list="customerList" class="form-control form-control-sm" placeholder="Ketik atau pilih customer"/>
        <datalist id="customerList">
          <option v-for="c in customers" :key="c" :value="c">{{ c }}</option>
        </datalist>
      </div>
      <button class="btn btn-secondary btn-sm align-self-start" @click="applyFilter">
        <i class="bi bi-filter"></i> Filter
      </button>
    </div>

    <!-- Table -->
    <div class="table-responsive shadow-sm rounded mb-3">
      <table class="table table-striped table-bordered table-hover align-middle mb-0">
        <thead class="table-dark sticky">
          <tr>
            <th>Tanggal & Waktu</th>
            <th>Customer</th>
            <th>Item</th>
            <th class="text-end">Qty</th>
            <th class="text-end">Harga</th>
            <th class="text-end">Diskon</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in paginatedData" 
              :key="s.sale_id + '-' + s.item_name"
              :class="{
                'table-warning': getStatusBadge(s) === 'partial',
                'table-danger': getStatusBadge(s) === 'unpaid'
              }"
          >
            <td>{{ formatDateTime(s.sale_date) }}</td>
            <td>{{ s.customer_name }}</td>
            <td>{{ s.item_name }}</td>
            <td class="text-end">{{ s.quantity }}</td>
              <td class="text-end">
              <div>Subtotal: {{ formatCurrency(s.total) }}</div>
              <div v-if="s.paid > 0" class="text-success">Sudah bayar: {{ formatCurrency(s.paid) }}</div>
              <div class="text-danger">Sisa: {{ formatCurrency(s.remaining) }}</div>
            </td>
            <td class="text-end">{{ formatCurrency(s.discount ?? 0) }}</td>
            <td>
              <span class="badge rounded-pill"
                    :class="{
                      'bg-success': getStatusBadge(s)==='paid',
                      'bg-warning text-dark': getStatusBadge(s)==='partial',
                      'bg-danger text-white': getStatusBadge(s)==='unpaid'
                    }">
                {{ getStatusLabel(s) }}
              </span>
            </td>
            <td>
              <button v-if="getStatusBadge(s)!=='paid'" class="btn btn-sm btn-primary" @click="openBayarModal(s)">
                Bayar
              </button>
            </td>
          </tr>
          <tr v-if="paginatedData.length === 0">
            <td colspan="8" class="text-center text-muted">Tidak ada data</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <nav class="d-flex justify-content-between align-items-center flex-wrap gap-2">
      <button class="btn btn-outline-secondary btn-sm" :disabled="page===1" @click="page--">‹ Prev</button>
      <div>Halaman {{ page }} / {{ totalPages }}</div>
      <button class="btn btn-outline-secondary btn-sm" :disabled="page===totalPages" @click="page++">Next ›</button>
    </nav>

    <!-- Modal Bayar -->
    <div class="modal fade" id="bayarModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Bayar Transaksi</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p>Customer: <strong>{{ selectedSale.customer_name }}</strong></p>
            <p>Total: <strong>{{ formatCurrency(selectedSale.total) }}</strong></p>
            <p v-if="selectedSale.paid > 0">
              Sudah bayar: <strong>{{ formatCurrency(selectedSale.paid) }}</strong>
            </p>
            <p>Sisa yang harus dibayar: <strong>{{ formatCurrency(selectedSale.remaining) }}</strong></p>
            <label class="form-label">Bayar Sekarang:</label>
            <input type="number" v-model.number="paymentAmount" class="form-control"/>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
            <button type="button" class="btn btn-primary" @click="bayarConfirm">Bayar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const history = ref([])
const customers = ref([])
const fromDate = ref(new Date().toISOString().split("T")[0])
const toDate = ref(new Date().toISOString().split("T")[0])
const filterCustomer = ref("")

const page = ref(1)
const perPage = 10
const totalPages = computed(()=>Math.ceil(history.value.length/perPage))

const sortedHistory = computed(() => {
  return [...history.value].sort((a,b) => {
    const statusOrder = { 'partial':1, 'unpaid':1, 'paid':2 }
    return statusOrder[getStatusBadge(a)] - statusOrder[getStatusBadge(b)]
  })
})
const paginatedData = computed(()=>sortedHistory.value.slice((page.value-1)*perPage, page.value*perPage))

const summaryCards = computed(() => {
  let totalTransaksi = 0
  let totalPaid = 0
  let totalUnpaid = 0

  history.value.forEach(d => {
    totalTransaksi += d.total
    totalPaid += d.paid
    totalUnpaid += d.remaining
  })

  return [
    { title: 'Total Transaksi', value: totalTransaksi, icon: '💰', bg: 'bg-light' },
    { title: 'Sudah Dibayar', value: totalPaid, icon: '✅', bg: 'bg-success bg-opacity-25' },
    { title: 'Belum Dibayar', value: totalUnpaid, icon: '⚠️', bg: 'bg-warning bg-opacity-25' }
  ]
})

const selectedSale = ref({})
const paymentAmount = ref(0)
let modalInstance = null

function formatDate(str){ return new Date(str).toLocaleDateString("id-ID") }
function formatDateTime(str){
  const d = new Date(str)
  return `${d.toLocaleDateString("id-ID")} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
}
function formatCurrency(num){ return new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR"}).format(num||0) }

function getStatusBadge(s){
  if(s.status==='paid' || s.status==='lunas') return 'paid'
  if(s.status==='partial') return 'partial'
  return 'unpaid'
}

function getStatusLabel(s){
  const status = getStatusBadge(s)
  return status==='paid' ? 'Lunas' : status==='partial' ? 'Belum Lunas Parsial' : 'Belum Lunas'
}

async function fetchHistory(){
  try {
    let url = `${SUPABASE_URL}/rest/v1/report_sales_detail?select=*&sale_date=gte.${fromDate.value}T00:00:00Z&sale_date=lte.${toDate.value}T23:59:59Z`
    if(filterCustomer.value) url += `&customer_name=eq.${encodeURIComponent(filterCustomer.value)}`

    const res = await fetch(url,{
      headers:{ apikey: SUPABASE_ANON_KEY, Authorization:`Bearer ${SUPABASE_ANON_KEY}` }
    })
    const data = await res.json()

    history.value = Array.isArray(data) ? data.map(d => {
      const total = (d.subtotal ?? 0) - (d.discount ?? 0)
      const paid = d.partial_payment ?? 0
      const remaining = Math.max(0, total - paid)
      return { ...d, total, paid, remaining }
    }) : []

    page.value = 1
    customers.value = [...new Set(history.value.map(d=>d.customer_name))]
  } catch(err){
    console.error(err)
    history.value=[]
  }
}

function applyFilter(){ fetchHistory() }

function openBayarModal(s){
  selectedSale.value = s
  paymentAmount.value = s.remaining
  modalInstance.show()
}

async function bayarConfirm(){
  if(paymentAmount.value <= 0) return alert("Nominal bayar tidak valid!")

  const newPaid = selectedSale.value.paid + paymentAmount.value
  const newRemaining = Math.max(0, selectedSale.value.total - newPaid)
  const newStatus = newRemaining === 0 ? 'paid' : 'partial'

  try{
    await fetch(`${SUPABASE_URL}/rest/v1/sales?id=eq.${selectedSale.value.sale_id}`, {
      method:'PATCH',
      headers:{ apikey: SUPABASE_ANON_KEY, Authorization:`Bearer ${SUPABASE_ANON_KEY}`, "Content-Type":"application/json" },
      body: JSON.stringify({ 
        partial_payment: newPaid,
        status: newStatus
      })
    })

    selectedSale.value.paid = newPaid
    selectedSale.value.remaining = newRemaining
    selectedSale.value.status = newStatus
    modalInstance.hide()
  } catch(e){
    console.error(e)
    alert("Gagal melakukan pembayaran")
  }
}

onMounted(async()=>{
  fetchHistory()
  const bootstrap = await import('bootstrap/dist/js/bootstrap.esm.js')
  const modalEl = document.getElementById('bayarModal')
  modalInstance = new bootstrap.Modal(modalEl)
})
</script>

<style scoped>
.hover-shadow:hover{ box-shadow:0 3px 10px rgba(0,0,0,0.12); transition:0.2s }
.table-hover tbody tr:hover{ background-color:#f0f8ff; transition:0.2s }
.badge{ font-size:0.8rem;padding:0.3em 0.5em }
.table-warning{ background-color:#fff3cd !important }
.table-danger{ background-color:#f8d7da !important }
</style>
