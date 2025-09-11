<template>
  <div class="container-fluid py-4">

    <!-- ================= DASHBOARD KPI ================= -->
    <div class="row g-4 mb-4">
      <div class="col-6 col-md-3" v-for="card in kpis" :key="card.title">
        <div class="card shadow-sm h-100 border-0">
          <div class="card-body d-flex align-items-center">
            <div class="rounded-circle bg-light p-3 me-3 flex-shrink-0">
              <i :class="card.icon + ' fs-4 text-primary'"></i>
            </div>
            <div class="flex-grow-1 text-wrap">
              <h6 class="text-muted mb-1 text-truncate">{{ card.title }}</h6>
              <h5 class="fw-bold mb-0">{{ card.value }}</h5>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ================= CHART & TOP PRODUCTS ================= -->
    <div class="row g-4">
      <div class="col-12 col-lg-8">
        <div class="card shadow-sm border-0 h-100">
          <div class="card-header bg-white fw-semibold">Sales Overview</div>
          <div class="card-body p-3">
            <canvas id="salesChart" style="width:100%;height:300px"></canvas>
          </div>
        </div>
      </div>
      <div class="col-12 col-lg-4">
        <div class="card shadow-sm border-0 h-100">
          <div class="card-header bg-white fw-semibold">Top Products</div>
          <ul class="list-group list-group-flush">
            <li v-for="p in topProducts" :key="p.item_name" class="list-group-item d-flex justify-content-between">
              <span class="text-truncate">{{ p.item_name }}</span>
              <span class="fw-semibold">{{ p.total_quantity }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Chart from 'chart.js/auto'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const kpis = ref([
  { title: "Total Sales", value: 0, icon: "bi bi-cart-check" },
  { title: "Revenue", value: 0, icon: "bi bi-cash-stack" },
  { title: "Inventory", value: 0, icon: "bi bi-box-seam" },
  { title: "Employees", value: 0, icon: "bi bi-people" },
])
const topProducts = ref([])

let chartInstance = null // ⬅️ mencegah chart double

function formatCurrency(num){
  return new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR'}).format(num||0)
}

async function fetchDashboard() {
  try{
    // --- SALES ---
    const resSales = await fetch(`${supabaseUrl}/rest/v1/sales?select=subtotal,quantity,item_name,sale_date&order=sale_date.asc`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
    })
    if(!resSales.ok) throw new Error(`Gagal fetch sales: ${resSales.status}`)
    const salesData = await resSales.json()

    kpis.value[0].value = salesData.length
    kpis.value[1].value = formatCurrency(
      salesData.reduce((sum,s)=>sum+Number(s.subtotal||0),0)
    )

    // CHART BULANAN
    const months = Array.from({length:12},(_,i)=>i+1)
    const monthlySales = months.map(m =>
      salesData.filter(s=>new Date(s.sale_date).getMonth()+1===m)
               .reduce((sum,s)=>sum+Number(s.subtotal||0),0)
    )

    const ctx = document.getElementById("salesChart").getContext("2d")
    if(chartInstance) chartInstance.destroy()
    chartInstance = new Chart(ctx,{
      type:"line",
      data:{
        labels: months.map(m=>`Bulan ${m}`),
        datasets:[{
          label:"Sales",
          data: monthlySales,
          borderColor:"#0d6efd",
          backgroundColor:"rgba(13,110,253,0.2)",
          fill:true,
          tension:0.3
        }]
      },
      options:{responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true}}}
    })

    // INVENTORY
    const resInv = await fetch(`${supabaseUrl}/rest/v1/inventory?select=id`, {
      headers:{apikey:supabaseKey, Authorization:`Bearer ${supabaseKey}`}
    })
    kpis.value[2].value = (await resInv.json()).length || 0

    // EMPLOYEES
    const resEmp = await fetch(`${supabaseUrl}/rest/v1/employees?select=id`, {
      headers:{apikey:supabaseKey, Authorization:`Bearer ${supabaseKey}`}
    })
    kpis.value[3].value = (await resEmp.json()).length || 0

    // TOP PRODUCTS
    const topMap = {}
    salesData.forEach(s=>{ topMap[s.item_name] = (topMap[s.item_name]||0)+Number(s.quantity||0) })
    topProducts.value = Object.entries(topMap)
      .map(([item_name,total_quantity])=>({item_name,total_quantity}))
      .sort((a,b)=>b.total_quantity - a.total_quantity)
      .slice(0,5)

  }catch(err){
    console.error("Error dashboard:", err)
    alert("Gagal memuat dashboard. Cek console.")
  }
}

onMounted(fetchDashboard)
</script>
