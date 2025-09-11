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
import { v4 as uuidv4 } from "uuid"

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// ... kode lain tetap sama

async function payPartial(b) {
  const maxPay = b.total - b.paid_amount
  if (maxPay <= 0) return alert("Pembayaran sudah lunas!")

  const amount = parseFloat(prompt(`Masukkan jumlah bayar (maks ${maxPay})`, maxPay))
  if (isNaN(amount) || amount <= 0) return

  // Update nilai di UI
  b.paid_amount += amount
  if (b.paid_amount >= b.total) b.status = 'Selesai'

  // 1️⃣ Update booking di Supabase
  await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${b.id}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ paid_amount: b.paid_amount, status: b.status })
  })

  // 2️⃣ Simpan ke sales & sales_items
  try {
    const saleId = uuidv4()
    const salePayload = [{
      id: saleId,
      created_at: new Date().toISOString(),
      customer_name: b.customer_name,
      total: b.total,
      discount: 0,
      partial_payment: amount,
      paid_amount: amount,
      remaining_amount: Math.max(b.total - b.paid_amount, 0),
      status: b.status === "Selesai" ? "lunas" : "belum lunas"
    }]

    const saleRes = await fetch(`${SUPABASE_URL}/rest/v1/sales`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation"
      },
      body: JSON.stringify(salePayload)
    })

    const saleData = await saleRes.json()
    if (!saleRes.ok) {
      console.error("❌ Gagal insert sales:", saleData)
      alert("Gagal menyimpan ke laporan sales!")
      return
    }

    // 3️⃣ Simpan item ke sales_items
    const itemPayload = [{
      id: uuidv4(),
      sale_id: saleId,
      product_id: null, // booking tidak terhubung produk stok
      item_name: b.product_name,
      price: b.total / (b.quantity || 1),
      quantity: b.quantity,
      subtotal: b.total
    }]

    await fetch(`${SUPABASE_URL}/rest/v1/sales_items`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(itemPayload)
    })

    console.log("✅ Pembayaran + laporan berhasil disimpan")
  } catch (err) {
    console.error("❌ Error simpan laporan:", err)
    alert("Gagal simpan ke laporan")
  }
}
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
