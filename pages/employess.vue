<template>
  <div class="container py-4">
    <h2 class="text-center mb-4 fw-bold">👥 Employees & 💰 Attendance</h2>

    <!-- Tab Switch -->
    <div class="mb-3 d-flex gap-2 justify-content-center">
      <button
        class="btn"
        :class="activeTab==='employees'?'btn-primary':'btn-outline-primary'"
        @click="activeTab='employees'">Daftar Karyawan</button>
      <button
        class="btn"
        :class="activeTab==='attendance'?'btn-primary':'btn-outline-primary'"
        @click="activeTab='attendance'">Kehadiran & Gaji</button>
    </div>

    <!-- Employees Tab -->
    <div v-if="activeTab==='employees'">
      <table class="table table-striped table-hover">
        <thead>
          <tr>
            <th>Nama</th>
            <th>Gaji / Hari</th>
            <th class="text-end">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="emp in employees" :key="emp.id">
            <td>{{ emp.name }}</td>
            <td>Rp {{ emp.daily_salary.toLocaleString() }}</td>
            <td class="text-end">
              <button class="btn btn-sm btn-outline-primary me-2" @click="openEmployeeModal(emp)">✏️ Edit</button>
              <button class="btn btn-sm btn-outline-danger" @click="deleteEmployee(emp.id)">🗑 Hapus</button>
            </td>
          </tr>
        </tbody>
      </table>
      <button class="btn btn-primary w-100 mt-3" @click="openEmployeeModal()">➕ Tambah Karyawan</button>
    </div>

    <!-- Attendance Tab -->
    <div v-else-if="activeTab==='attendance'">
      <table class="table table-striped table-hover">
        <thead>
          <tr>
            <th>Nama</th>
            <th class="text-end">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="emp in employees" :key="emp.id">
            <td>{{ emp.name }}</td>
            <td class="text-end">
              <button class="btn btn-sm btn-outline-primary" @click="openAttendanceModal(emp)">🗓 Input Kehadiran</button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Filter & Salary Report -->
      <div class="mt-4">
        <div class="d-flex gap-2 mb-2">
          <input type="month" v-model="filterMonth" class="form-control w-auto" @change="fetchSalaries" />
          <button class="btn btn-primary" @click="fetchSalaries">Refresh</button>
        </div>
        <div class="table-responsive">
          <table class="table table-striped table-hover">
            <thead>
              <tr>
                <th>Nama</th>
                <th class="text-center">Hari Hadir</th>
                <th class="text-end">Total Gaji</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading"><td colspan="3" class="text-center text-muted">Loading...</td></tr>
              <tr v-else-if="salaries.length===0"><td colspan="3" class="text-center text-muted">Tidak ada data</td></tr>
              <tr v-else v-for="s in salaries" :key="s.id">
                <td>{{ s.employee_id.name }}</td>
                <td class="text-center">{{ s.total_days }}</td>
                <td class="text-end">{{ formatCurrency(s.total_salary) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Employee -->
    <div class="modal fade" tabindex="-1" ref="employeeModalRef">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ selectedEmployee.id ? "Edit Karyawan" : "Tambah Karyawan" }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Nama</label>
              <input v-model="selectedEmployee.name" class="form-control" placeholder="Nama karyawan" />
            </div>
            <div class="mb-3">
              <label class="form-label">Gaji / Hari</label>
              <input v-model.number="selectedEmployee.daily_salary" type="number" class="form-control" placeholder="Gaji per hari" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
            <button class="btn btn-primary" @click="saveEmployee">Simpan</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Attendance -->
    <div class="modal fade" tabindex="-1" ref="attendanceModalRef">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Kehadiran - {{ selectedEmployee.name }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3 d-flex gap-2">
              <button class="btn btn-success btn-sm" @click="toggleAll(true)">✅ Centang Semua</button>
              <button class="btn btn-warning btn-sm" @click="toggleAll(false)">❌ Kosongkan Semua</button>
            </div>
            <div class="table-responsive">
              <table class="table table-bordered text-center">
                <thead>
                  <tr><th v-for="day in days" :key="day">{{ day }}</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td v-for="day in days" :key="day">
                      <input type="checkbox" v-model="attendance[day]" class="form-check-input" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
            <button class="btn btn-primary" @click="saveAttendance">Simpan & Hitung Gaji</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from "vue";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// --- STATE ---
const activeTab = ref("employees");
const employees = ref([]);
const selectedEmployee = ref({ id: null, name: "", daily_salary: 0 });
const days = Array.from({ length: 30 }, (_, i) => i+1);
const attendance = ref({});
const salaries = ref([]);
const filterMonth = ref(new Date().toISOString().slice(0,7));
const loading = ref(false);

const employeeModalRef = ref(null);
const attendanceModalRef = ref(null);
let bootstrapEmployeeModal, bootstrapAttendanceModal;

// --- FETCH EMPLOYEES ---
async function fetchEmployees() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/employees?select=*`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization:`Bearer ${SUPABASE_ANON_KEY}` }
  });
  employees.value = await res.json();
}

// --- CRUD EMPLOYEE ---
function openEmployeeModal(emp=null){
  selectedEmployee.value = emp ? {...emp} : {id:null,name:"",daily_salary:0};
  nextTick(()=>bootstrapEmployeeModal.show());
}
async function saveEmployee(){
  if(!selectedEmployee.value.name || !selectedEmployee.value.daily_salary) return alert("Lengkapi data!");
  const isEdit = !!selectedEmployee.value.id;
  const url = isEdit ? `${SUPABASE_URL}/rest/v1/employees?id=eq.${selectedEmployee.value.id}` : `${SUPABASE_URL}/rest/v1/employees`;
  const payload = isEdit
    ? { name:selectedEmployee.value.name, daily_salary:selectedEmployee.value.daily_salary }
    : [{ name:selectedEmployee.value.name, daily_salary:selectedEmployee.value.daily_salary }];
  await fetch(url,{ method: isEdit ? "PATCH":"POST", headers:{ apikey:SUPABASE_ANON_KEY, Authorization:`Bearer ${SUPABASE_ANON_KEY}`, "Content-Type":"application/json", Prefer:"return=representation" }, body: JSON.stringify(payload) });
  bootstrapEmployeeModal.hide();
  fetchEmployees();
}
async function deleteEmployee(id){
  if(!confirm("Yakin hapus karyawan?")) return;
  await fetch(`${SUPABASE_URL}/rest/v1/employees?id=eq.${id}`,{ method:"DELETE", headers:{ apikey:SUPABASE_ANON_KEY, Authorization:`Bearer ${SUPABASE_ANON_KEY}` }});
  fetchEmployees();
}

// --- ATTENDANCE ---
function openAttendanceModal(emp){
  selectedEmployee.value = emp;
  attendance.value = {};
  days.forEach(d=>attendance.value[d]=true);
  nextTick(()=>bootstrapAttendanceModal.show());
}
function toggleAll(val){ days.forEach(d=>attendance.value[d]=val); }
async function saveAttendance(){
  const hadirCount = days.filter(d=>attendance.value[d]).length;
  const totalGaji = hadirCount * selectedEmployee.value.daily_salary;
  const dataAttendance = days.map(d=>({ employee_id:selectedEmployee.value.id, day:d, present:attendance.value[d] }));
  await fetch(`${SUPABASE_URL}/rest/v1/attendance`,{ method:"POST", headers:{apikey:SUPABASE_ANON_KEY, Authorization:`Bearer ${SUPABASE_ANON_KEY}`, "Content-Type":"application/json", Prefer:"return=representation"}, body: JSON.stringify(dataAttendance) });
  await fetch(`${SUPABASE_URL}/rest/v1/salaries`,{ method:"POST", headers:{apikey:SUPABASE_ANON_KEY, Authorization:`Bearer ${SUPABASE_ANON_KEY}`, "Content-Type":"application/json", Prefer:"return=representation"}, body: JSON.stringify({ employee_id:selectedEmployee.value.id, total_days:hadirCount, total_salary:totalGaji }) });
  bootstrapAttendanceModal.hide();
  fetchSalaries();
}

// --- FETCH SALARIES ---
async function fetchSalaries(){
  loading.value=true;
  try{
    const res = await fetch(`${SUPABASE_URL}/rest/v1/salaries?select=*,employee_id(*)&order=created_at.desc`, { headers:{apikey:SUPABASE_ANON_KEY, Authorization:`Bearer ${SUPABASE_ANON_KEY}`}});
    const data = await res.json();
    salaries.value = data.filter(s=>s.created_at?.startsWith(filterMonth.value));
  }catch(e){ console.error(e); }
  finally{ loading.value=false; }
}

function formatCurrency(num){ return new Intl.NumberFormat("id-ID",{style:"currency", currency:"IDR"}).format(num||0); }

// --- MOUNT ---
onMounted(async ()=>{
  const bs = await import('bootstrap/dist/js/bootstrap.esm.js');
  bootstrapEmployeeModal = new bs.Modal(employeeModalRef.value);
  bootstrapAttendanceModal = new bs.Modal(attendanceModalRef.value);
  fetchEmployees();
  fetchSalaries();
});
</script>

<style scoped>
.table td,.table th{ vertical-align:middle; }
.table-bordered th,.table-bordered td{ padding:0.3rem; }
</style>
