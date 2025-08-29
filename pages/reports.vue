<template>
  <div class="container py-3">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="fw">📊 Laporan Transaksi</h2>
      <button class="btn btn-outline-primary" @click="printSelected">
        <i class="bi bi-printer"></i> Print Halaman Aktif
      </button>
    </div>

    <!-- Filter Section -->
    <div class="card shadow-sm border-0 mb-4">
      <div class="card-body">
        <div class="row g-3 align-items-end">
          <div class="col-md-2">
            <label class="form-label fw-semibold">Mode</label>
            <select v-model="mode" class="form-select">
              <option value="day">Harian</option>
              <option value="week">Mingguan</option>
              <option value="month">Bulanan</option>
            </select>
          </div>

          <div class="col-md-3" v-if="mode==='day'">
            <label class="form-label fw-semibold">Tanggal</label>
            <input v-model="filterDay" type="date" class="form-control"/>
          </div>

          <div class="col-md-3" v-if="mode==='week'">
            <label class="form-label fw-semibold">Minggu</label>
            <input v-model="filterWeek" type="week" class="form-control"/>
          </div>

          <div class="col-md-3" v-if="mode==='month'">
            <label class="form-label fw-semibold">Bulan</label>
            <input v-model="filterMonth" type="month" class="form-control"/>
          </div>

          <div class="col-md-4 d-flex gap-2">
            <button class="btn btn-primary flex-fill hover-shadow" @click="applyFilter">
              <i class="bi bi-filter"></i> Terapkan
            </button>
            <button class="btn btn-outline-secondary flex-fill hover-shadow" @click="setToday">
              Hari Ini
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="row g-3 mb-4">
      <div class="col-md-3">
        <ReportCard title="Total Penjualan" :value="formatCurrency(totalSales)" subtitle="Periode Terpilih"/>
      </div>
      <div class="col-md-3">
        <ReportCard title="Total Transaksi" :value="totalTransactions" subtitle="Periode Terpilih"/>
      </div>
      <div class="col-md-3">
        <ReportCard title="Total Diskon" :value="formatCurrency(totalDiscount)" subtitle="Periode Terpilih"/>
      </div>
      <div class="col-md-3">
        <ReportCard title="Pendapatan Bersih" :value="formatCurrency(netIncome)" subtitle="Setelah Diskon"/>
      </div>
    </div>

    <!-- Table -->
    <div class="table-responsive">
      <table class="table table-striped table-bordered">
        <thead class="table-dark">
          <tr>
            <th>Tanggal</th>
            <th>Customer</th>
            <th>Item</th>
            <th>Kategori</th>
            <th class="text-end">Qty</th>
            <th class="text-end">Harga</th>
            <th class="text-end">Subtotal</th>
            <th class="text-end">Diskon</th>
            <th class="text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in paginatedSales" :key="s.sale_id + '-' + s.item_name">
            <td>{{ formatDate(s.sale_date) }}</td>
            <td>{{ s.customer_name }}</td>
            <td>{{ s.item_name }}</td>
            <td>{{ s.product_category }}</td>
            <td class="text-end">{{ s.quantity }}</td>
            <td class="text-end">{{ formatCurrency(s.price) }}</td>
            <td class="text-end">{{ formatCurrency(s.subtotal) }}</td>
            <td class="text-end">{{ formatCurrency(s.discount) }}</td>
            <td class="text-center">
              <span
                class="badge"
                :class="{
                  'bg-success': s.status==='paid',
                  'bg-warning text-dark': s.status==='unpaid',
                  'bg-orange text-dark': s.status==='partial'
                }"
              >
                {{ s.status==='paid' ? 'Lunas' : s.status==='partial' ? 'Belum Lunas Parsial' : 'Belum Lunas' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <nav class="mt-2">
      <ul class="pagination justify-content-center">
        <li class="page-item" :class="{ disabled: currentPage===1 }">
          <button class="page-link" @click="prevPage">Prev</button>
        </li>
        <li class="page-item" v-for="n in totalPages" :key="n" :class="{ active: currentPage===n }">
          <button class="page-link" @click="goPage(n)">{{ n }}</button>
        </li>
        <li class="page-item" :class="{ disabled: currentPage===totalPages }">
          <button class="page-link" @click="nextPage">Next</button>
        </li>
      </ul>
    </nav>

    <!-- Print All -->
    <div class="d-flex gap-2 mt-3">
      <button class="btn btn-primary hover-shadow" @click="printAll">Print Semua Halaman</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import ReportCard from '@/components/ReportCard.vue'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const sales = ref([])
const totalSales = ref(0)
const totalTransactions = ref(0)
const totalDiscount = ref(0)
const netIncome = ref(0)

const mode = ref('day')
const filterDay = ref(new Date().toISOString().substr(0,10))
const filterWeek = ref(new Date().toISOString().substr(0,10))
const filterMonth = ref(new Date().toISOString().substr(0,7))

const currentPage = ref(1)
const itemsPerPage = 15 // cocok untuk HVS A4

const totalPages = computed(() => Math.ceil(sales.value.length / itemsPerPage))
const paginatedSales = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return sales.value.slice(start, start + itemsPerPage)
})

function formatCurrency(num) {
  return new Intl.NumberFormat('id-ID', { style:'currency', currency:'IDR' }).format(num || 0)
}
function formatDate(str) {
  return new Date(str).toLocaleDateString('id-ID')
}

function getWeekRange(weekStr) {
  const [year, week] = weekStr.split('-W').map(Number)
  const d = new Date(year, 0, 1 + (week - 1) * 7)
  const dayOfWeek = d.getDay()
  const monday = new Date(d)
  monday.setDate(d.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { from: monday.toISOString(), to: sunday.toISOString() }
}

async function fetchReports(period) {
  const { from, to } = period
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/report_sales_detail?sale_date=gte.${from}&sale_date=lte.${to}`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
    })
    const data = await res.json()
    sales.value = Array.isArray(data) ? data : []

    totalSales.value = sales.value.reduce((sum, s) => sum + Number(s.subtotal||0), 0)
    totalDiscount.value = sales.value.reduce((sum, s) => sum + Number(s.discount||0), 0)
    totalTransactions.value = new Set(sales.value.map(s => s.sale_id)).size
    netIncome.value = totalSales.value - totalDiscount.value
    currentPage.value = 1
  } catch(err) {
    console.error(err)
    sales.value = []
    totalSales.value = 0
    totalDiscount.value = 0
    totalTransactions.value = 0
    netIncome.value = 0
  }
}

// Pagination methods
function prevPage() { if(currentPage.value>1) currentPage.value-- }
function nextPage() { if(currentPage.value<totalPages.value) currentPage.value++ }
function goPage(n) { currentPage.value = n }

function printSelected() {
  const tableEl = document.querySelector('.table')
  if (!tableEl) return
  const win = window.open('')
  win.document.write('<html><head><title>Print Halaman Aktif</title>')
  win.document.write('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css">')
  win.document.write('</head><body>')
  win.document.write(tableEl.outerHTML)
  win.document.write('</body></html>')
  win.document.close()
  win.print()
}

function printAll() {
  const win = window.open('')
  win.document.write('<html><head><title>Print Semua Laporan</title>')
  win.document.write('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css">')
  win.document.write('<body>')
  // tulis semua halaman
  for(let p=1;p<=totalPages.value;p++){
    const start = (p-1)*itemsPerPage
    const slice = sales.value.slice(start, start+itemsPerPage)
    let table = '<table class="table table-striped table-bordered"><thead class="table-dark"><tr>'
    table += '<th>Tanggal</th><th>Customer</th><th>Item</th><th>Kategori</th><th>Qty</th><th>Harga</th><th>Subtotal</th><th>Diskon</th><th>Status</th></tr></thead><tbody>'
    slice.forEach(s=>{
      table+=`<tr>
        <td>${formatDate(s.sale_date)}</td>
        <td>${s.customer_name}</td>
        <td>${s.item_name}</td>
        <td>${s.product_category}</td>
        <td class="text-end">${s.quantity}</td>
        <td class="text-end">${formatCurrency(s.price)}</td>
        <td class="text-end">${formatCurrency(s.subtotal)}</td>
        <td class="text-end">${formatCurrency(s.discount)}</td>
        <td class="text-center"><span class="${s.status==='paid'?'bg-success badge':s.status==='partial'?'bg-orange badge':'bg-warning text-dark badge'}">${s.status==='paid'?'Lunas':s.status==='partial'?'Belum Lunas Parsial':'Belum Lunas'}</span></td>
      </tr>`
    })
    table+='</tbody></table><div style="page-break-after: always;"></div>'
    win.document.write(table)
  }
  win.document.write('</body></html>')
  win.document.close()
  win.print()
}

function setToday() {
  const today = new Date()
  const from = today.toISOString().split('T')[0] + "T00:00:00.000Z"
  const to   = today.toISOString().split('T')[0] + "T23:59:59.999Z"
  filterDay.value = today.toISOString().split('T')[0]
  mode.value = 'day'
  fetchReports({ from, to })
}

function applyFilter() {
  if (mode.value==='day') fetchReports({ from: filterDay.value+"T00:00:00.000Z", to: filterDay.value+"T23:59:59.999Z" })
  else if (mode.value==='week'){ const {from,to}=getWeekRange(filterWeek.value); fetchReports({from,to}) }
  else if (mode.value==='month'){ const from=filterMonth.value+'-01T00:00:00.000Z'; const to=filterMonth.value+'-31T23:59:59.999Z'; fetchReports({from,to}) }
}

onMounted(()=>setToday())
</script>

<style scoped>
.hover-shadow:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: box-shadow 0.2s ease; }
.bg-orange { background-color: #FFA500 !important; }
.table tbody tr:hover { background-color: rgba(255,165,0,0.1); }
</style>
