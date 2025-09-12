<template>
  <div class="container py-4">
    <h2 class="text-center mb-3 fw-bold">📅 BOOKINGS</h2>

    <!-- Tombol Tambah Booking -->
    <div class="text-end mb-3">
      <button class="btn btn-primary" @click="openModal()">Tambah Booking</button>
    </div>

    <!-- Table Bookings -->
    <div class="table-responsive shadow-sm rounded" style="max-height: 450px; overflow-y: auto;">
      <table class="table table-hover table-striped mb-0">
        <thead class="table-light sticky-top">
          <tr>
            <th>Nama</th>
            <th>Tanggal</th>
            <th>Total</th>
            <th>Status</th>
            <th class="text-center">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="b in bookings" :key="b.id">
            <td>{{ b.customer_name }}</td>
            <td>{{ formatDate(b.booking_date) }}</td>
            <td>{{ formatCurrency(b.total) }}</td>
            <td>
              <span :class="statusClass(b.status)">{{ b.status }}</span>
            </td>
            <td class="text-center">
              <button class="btn btn-sm btn-warning me-1" @click="editBooking(b)">Edit</button>
              <button class="btn btn-sm btn-danger" @click="deleteBooking(b.id)">Hapus</button>
            </td>
          </tr>
          <tr v-if="bookings.length === 0">
            <td colspan="5" class="text-center text-muted">Tidak ada booking</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Booking -->
    <div class="modal fade" tabindex="-1" ref="modalRef">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editMode ? 'Edit Booking' : 'Tambah Booking' }}</h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-2">
              <label class="form-label">Nama Customer</label>
              <input v-model="form.customer_name" type="text" class="form-control" />
            </div>
            <div class="mb-2">
              <label class="form-label">Tanggal</label>
              <input v-model="form.booking_date" type="date" class="form-control" />
            </div>
            <div class="mb-2">
              <label class="form-label">Total</label>
              <input v-model.number="form.total" type="number" class="form-control" />
            </div>
            <div class="mb-2">
              <label class="form-label">Status</label>
              <select v-model="form.status" class="form-select">
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeModal">Batal</button>
            <button class="btn btn-primary" @click="saveBooking">{{ editMode ? 'Update' : 'Simpan' }}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div class="position-fixed top-0 end-0 p-3" style="z-index: 1055">
      <div ref="toastRef" class="toast align-items-center text-white bg-success border-0" role="alert">
        <div class="d-flex">
          <div class="toast-body">{{ toastMessage }}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" @click="hideToast"></button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const table = "bookings";

const bookings = ref([]);
const modalRef = ref(null);
const toastRef = ref(null);
const toastMessage = ref("");
const editMode = ref(false);
const currentId = ref(null);

const form = ref({ customer_name: "", booking_date: "", total: 0, status: "pending" });

let bootstrapModal, bootstrapToast;

async function fetchBookings() {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*`, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
  });
  bookings.value = await res.json();
}

async function saveBooking() {
  if (!form.value.customer_name || !form.value.booking_date) return showToast("Lengkapi data!", "danger");

  try {
    if (editMode.value) {
      await fetch(`${supabaseUrl}/rest/v1/${table}?id=eq.${currentId.value}`, {
        method: "PATCH",
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(form.value)
      });
      showToast("Booking berhasil diupdate", "success");
    } else {
      await fetch(`${supabaseUrl}/rest/v1/${table}`, {
        method: "POST",
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
        body: JSON.stringify([form.value])
      });
      showToast("Booking berhasil ditambahkan", "success");
    }
    closeModal();
    fetchBookings();
  } catch (err) {
    console.error(err);
    showToast("Gagal menyimpan booking", "danger");
  }
}

function editBooking(b) {
  editMode.value = true;
  currentId.value = b.id;
  form.value = { ...b };
  openModal();
}

async function deleteBooking(id) {
  if (!confirm("Yakin hapus booking?")) return;
  await fetch(`${supabaseUrl}/rest/v1/${table}?id=eq.${id}`, {
    method: "DELETE",
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
  });
  fetchBookings();
  showToast("Booking berhasil dihapus", "success");
}

function openModal() { nextTick(() => bootstrapModal.show()); }
function closeModal() { 
  bootstrapModal.hide(); 
  editMode.value = false; 
  currentId.value = null;
  form.value = { customer_name:"", booking_date:"", total:0, status:"pending" };
}

function showToast(msg, type = "success") {
  toastMessage.value = msg;
  toastRef.value.className = `toast align-items-center text-white bg-${type} border-0`;
  const t = new bootstrapToast(toastRef.value);
  t.show();
}
function hideToast() {
  const t = bootstrapToast.getInstance(toastRef.value);
  t?.hide();
}

function formatDate(d) { return new Date(d).toLocaleDateString("id-ID"); }
function formatCurrency(num) { return new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR'}).format(num||0); }
function statusClass(status) {
  return status === "paid" ? "badge bg-success" :
         status === "cancelled" ? "badge bg-danger" :
         "badge bg-warning text-dark";
}

onMounted(async () => {
  const bs = await import('bootstrap/dist/js/bootstrap.esm.js');
  bootstrapModal = new bs.Modal(modalRef.value);
  bootstrapToast = bs.Toast;
  fetchBookings();
});
</script>

<style scoped>
.table-hover tbody tr:hover { background-color: #ffe5b4; transition:0.2s; }
</style>
