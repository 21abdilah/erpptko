<template>
  <div class="container py-4">
    <h1 class="mb-4 text-2xl font-bold text-center">💰 Finance</h1>

    <!-- Filter Periode -->
    <div class="d-flex flex-wrap gap-2 mb-4 align-items-center">
      <select v-model="mode" class="form-select w-auto">
        <option value="day">Harian</option>
        <option value="week">Mingguan</option>
        <option value="month">Bulanan</option>
      </select>

      <input 
        v-if="mode==='day'" 
        v-model="filterDay" 
        type="date" 
        class="form-control w-auto"
      />
      <input 
        v-if="mode==='week'" 
        v-model="filterWeek" 
        type="week" 
        class="form-control w-auto"
      />
      <input 
        v-if="mode==='month'" 
        v-model="filterMonth" 
        type="month" 
        class="form-control w-auto"
      />

      <button class="btn btn-primary px-3 py-1" @click="fetchFinance">Filter</button>
      <button class="btn btn-secondary px-3 py-1" @click="setToday">Hari Ini</button>
    </div>

    <!-- Cards Ringkasan -->
    <div class="row g-3 mb-4">
      <div class="col-12 col-md-4">
        <FinanceCard 
          title="Total Penjualan" 
          :value="formatCurrency(totalIncome)" 
          subtitle="Periode Terpilih" 
          icon="💵"
        />
      </div>
      <div class="col-12 col-md-4">
        <FinanceCard 
          title="Total Pengeluaran" 
          :value="formatCurrency(totalExpense)" 
          subtitle="Periode Terpilih"
          icon="📝"
        />
      </div>
      <div class="col-12 col-md-4">
        <FinanceCard 
          title="Pendapatan Bersih" 
          :value="formatCurrency(netIncome)" 
          subtitle="Periode Terpilih"
          icon="📈"
        />
      </div>
    </div>

    <!-- Form Tambah Pengeluaran -->
    <ExpenseForm @add="addExpense"/>

    <!-- Tabel Pengeluaran -->
    <div class="table-responsive shadow-sm rounded mt-3">
      <table class="table table-striped table-hover mb-0">
        <thead class="table-light sticky-top">
          <tr>
            <th class="px-2 py-1">Tanggal</th>
            <th class="px-2 py-1">Deskripsi</th>
            <th class="px-2 py-1 text-end">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(e,i) in expenses" :key="i">
            <td class="px-2 py-1">{{ e?.created_at ? e.created_at.substr(0,10) : '-' }}</td>
            <td class="px-2 py-1">{{ e?.name || '-' }}</td>
            <td class="px-2 py-1 text-end">{{ formatCurrency(e?.amount || 0) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <button class="mt-3 btn btn-success px-4 py-2" @click="printTable">🖨 Print Tabel</button>
  </div>
</template>

<style scoped>
.table-hover tbody tr:hover {
  background-color: #ffe5b4;
  transition: 0.2s;
}
.table-responsive::-webkit-scrollbar {
  width: 8px;
}
.table-responsive::-webkit-scrollbar-thumb {
  background-color: rgba(0,0,0,0.2);
  border-radius: 4px;
}
.btn {
  cursor: pointer;
}
@media (max-width: 768px) {
  .d-flex.flex-wrap {
    flex-direction: column;
    gap: 0.5rem;
  }
  .form-select, .form-control {
    width: 100% !important;
  }
}
</style>

<script setup>
import { ref, onMounted } from 'vue'
import FinanceCard from '@/components/FinanceCard.vue'
import ExpenseForm from '@/components/ExpenseForm.vue'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const expenses = ref([])
const totalExpense = ref(0)
const totalIncome = ref(0)
const netIncome = ref(0)

const mode = ref('day')
const filterDay = ref('')
const filterWeek = ref('')
const filterMonth = ref('')

// Format Rupiah
function formatCurrency(num){
  return new Intl.NumberFormat('id-ID', { style:'currency', currency:'IDR' }).format(num || 0)
}

// Ambil total penjualan
async function fetchTotalSales(from, to){
  try{
    const res = await fetch(`${SUPABASE_URL}/rest/v1/report_sales_detail?sale_date=gte.${from}&sale_date=lte.${to}`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
    })
    const data = await res.json()
    return Array.isArray(data)? data.reduce((sum, s)=> sum + Number(s.subtotal||0),0) : 0
  } catch(err){
    console.error(err)
    return 0
  }
}

// Ambil pengeluaran
async function fetchExpenses(from, to){
  try{
    const res = await fetch(`${SUPABASE_URL}/rest/v1/expenses?created_at=gte.${from}&created_at=lte.${to}`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization:`Bearer ${SUPABASE_ANON_KEY}` }
    })
    const data = await res.json()
    return Array.isArray(data)? data : []
  } catch(err){
    console.error(err)
    return []
  }
}

// Tombol Hari Ini
function setToday(){
  const today = new Date()
  const from = today.toISOString().split('T')[0] + "T00:00:00.000Z"
  const to   = today.toISOString().split('T')[0] + "T23:59:59.999Z"
  filterDay.value = today.toISOString().split('T')[0]
  mode.value = 'day'
  fetchFinance(from, to)
}

// Fetch data finance
async function fetchFinance(customFrom, customTo){
  try{
    let from, to
    if(customFrom && customTo){
      from = customFrom
      to = customTo
    } else if(mode.value==='day'){
      from = filterDay.value + "T00:00:00.000Z"
      to   = filterDay.value + "T23:59:59.999Z"
    } else if(mode.value==='week'){
      const date = new Date(filterWeek.value)
      const day = date.getDay() || 7
      const start = new Date(date); start.setDate(date.getDate() - day + 1)
      const end = new Date(start); end.setDate(start.getDate()+6)
      from = start.toISOString().split('T')[0] + "T00:00:00.000Z"
      to   = end.toISOString().split('T')[0] + "T23:59:59.999Z"
    } else {
      const start = new Date(filterMonth.value+'-01')
      const end = new Date(start.getFullYear(), start.getMonth()+1,0)
      from = start.toISOString().split('T')[0] + "T00:00:00.000Z"
      to   = end.toISOString().split('T')[0] + "T23:59:59.999Z"
    }

    totalIncome.value = await fetchTotalSales(from, to)
    const expData = await fetchExpenses(from, to)
    expenses.value = expData
    totalExpense.value = expenses.value.reduce((sum,e)=> sum + Number(e.amount||0),0)
    netIncome.value = totalIncome.value - totalExpense.value
  } catch(err){
    console.error(err)
    alert('Gagal fetch finance: '+err.message)
  }
}

// Tambah pengeluaran
async function addExpense(e){
  try{
    // Pastikan data valid
    if(!e.name || !e.amount) return alert('Nama dan jumlah wajib diisi');

    const payload = {
      name: e.name,
      amount: Number(e.amount),
      created_at: new Date().toISOString()  // ISO string format sesuai Supabase
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/expenses`, {
      method:'POST',
      headers:{
        apikey: SUPABASE_ANON_KEY,
        Authorization:`Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type':'application/json',
        Prefer:'return=representation'
      },
      body: JSON.stringify([payload])  // Supabase REST API selalu array
    });

    const saved = await res.json();

    if(saved?.length){
      expenses.value.push(saved[0]);
      totalExpense.value += Number(saved[0].amount||0);
      netIncome.value = totalIncome.value - totalExpense.value;
    } else {
      throw new Error('Gagal menyimpan data');
    }

  } catch(err){
    console.error(err);
    alert('Gagal menambahkan pengeluaran: '+err.message);
  }
}

onMounted(() => {
  setToday()  // default load hari ini
})

function printTable(){
  const table = document.querySelector('table')
  if(!table) return
  const w = window.open('')
  w.document.write('<html><head><title>Print</title>')
  w.document.write('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css">')
  w.document.write('</head><body>')
  w.document.write(table.outerHTML)
  w.document.write('</body></html>')
  w.document.close()
  w.print()
}
</script>
