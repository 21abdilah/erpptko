<template>
  <div class="container py-4">
    <h2 class="text-center mb-3 fw-bold">📦 KELOLA BARANG</h2>

    <!-- Tambah Produk & Fitur Cepat -->
    <div class="mb-3 text-end d-flex gap-2">
      <button class="btn btn-primary" @click="openModal()">Tambah Produk</button>
      <button class="btn btn-warning" @click="openPasteModal">Paste dari Excel / WA</button>
    </div>

    <!-- Filter Kategori -->
    <div class="mb-2">
      <input 
        v-model="selectedCategory" 
        list="categoryList" 
        class="form-control form-control-sm"
        placeholder="Ketik atau pilih kategori"
        @input="changePage(1)"
      />
      <datalist id="categoryList">
        <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
      </datalist>
      <span class="badge bg-primary">Total: {{ filteredProducts.length }}</span>
    </div>

    <!-- Table Produk dengan Drag & Drop -->
    <div class="table-responsive shadow-sm rounded" style="max-height: 450px; overflow-y: auto;">
      <table class="table table-hover table-striped mb-0">
        <thead class="table-light sticky-top">
          <tr>
            <th>Nama</th>
            <th>Harga</th>
            <th>Stok</th>
            <th>Kategori</th>
            <th class="text-center">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="(p,index) in paginatedProducts" 
            :key="p.id" 
            :class="{ 'table-danger': p.stock === 0 }"
            draggable="true"
            @dragstart="dragStart($event, index)"
            @dragover.prevent
            @drop="drop($event, index)"
          >
            <td>{{ p.name }}</td>
            <td>{{ formatCurrency(p.price) }}</td>
            <td>
              <span v-if="p.stock === 0">⚠️ {{ p.stock }}</span>
              <span v-else>{{ p.stock }}</span>
            </td>
            <td>{{ p.category }}</td>
            <td class="text-center">
              <button class="btn btn-sm btn-warning me-1" @click="editProduct(p)">Edit</button>
              <button class="btn btn-sm btn-danger" @click="deleteProduct(p.id)">Hapus</button>
            </td>
          </tr>
          <tr v-if="paginatedProducts.length === 0">
            <td colspan="5" class="text-center text-muted">Tidak ada data</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <nav class="mt-3">
      <ul class="pagination justify-content-center flex-wrap">
        <li class="page-item" :class="{ disabled: currentPage === 1 }">
          <button class="page-link" @click="changePage(currentPage - 1)">← Prev</button>
        </li>
        <li
          v-for="page in totalPages"
          :key="page"
          class="page-item mx-1 my-1"
          :class="{ active: currentPage === page }"
        >
          <button class="page-link" @click="changePage(page)">{{ page }}</button>
        </li>
        <li class="page-item" :class="{ disabled: currentPage === totalPages }">
          <button class="page-link" @click="changePage(currentPage + 1)">Next →</button>
        </li>
      </ul>
    </nav>

    <!-- Modal Produk -->
    <div class="modal fade" tabindex="-1" ref="modalRef">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editMode ? 'Edit Produk' : 'Tambah Produk' }}</h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-2">
              <label class="form-label">Nama</label>
              <input v-model="form.name" type="text" class="form-control" />
            </div>
            <div class="mb-2">
              <label class="form-label">Harga</label>
              <input v-model.number="form.price" type="number" class="form-control" />
            </div>
            <div class="mb-2">
              <label class="form-label">Stok</label>
              <input v-model.number="form.stock" type="number" class="form-control" />
            </div>
            <div class="mb-2">
              <label class="form-label">Kategori</label>
              <input v-model="form.category" type="text" class="form-control" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeModal">Batal</button>
            <button class="btn btn-primary" @click="saveProduct">{{ editMode ? 'Update' : 'Simpan' }}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Paste Produk -->
    <div class="modal fade" tabindex="-1" ref="pasteModalRef">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Paste Produk dari Excel / WA</h5>
            <button type="button" class="btn-close" @click="closePasteModal"></button>
          </div>
          <div class="modal-body">
            <p>Format: <strong>Nama | Harga | Stok | Kategori (opsional)</strong> per baris</p>
            <textarea 
              ref="pasteTextarea"
              v-model="pasteData" 
              class="form-control" 
              rows="8" 
              placeholder="Contoh: Produk A 10000 5 Baju"
              :style="{ backgroundColor: errorLines.size ? '#fff3f3' : '#fff' }">
            </textarea>
            <small v-if="errorLines.size" class="text-danger">
              Baris yang gagal parse: {{ Array.from(errorLines).join(', ') }}
            </small>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closePasteModal">Batal</button>
            <button class="btn btn-primary" @click="importPasteData">Import</button>
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
import { ref, computed, nextTick, onMounted } from "vue";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const table = "products";

const products = ref([]);
const categories = ref([]);
const currentPage = ref(1);
const perPage = 10;
const selectedCategory = ref("");

const form = ref({ name: "", price: 0, stock: 0, category: "", position: 0 });
const editMode = ref(false);
const currentId = ref(null);

const modalRef = ref(null);
const pasteModalRef = ref(null);
const pasteTextarea = ref(null);
const toastRef = ref(null);
const toastMessage = ref("");
const pasteData = ref("");
const errorLines = ref(new Set());

let bootstrapModal, bootstrapToast, bootstrapPasteModal;
let dragStartIndex = null;

async function fetchProducts() {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    });
    const data = await res.json();
    products.value = data;
    categories.value = [...new Set(data.map(p => p.category).filter(Boolean))];
  } catch (err) {
    console.error(err);
    showToast("Gagal mengambil data", "danger");
  }
}

const filteredProducts = computed(() => {
  let arr = products.value;
  if (selectedCategory.value) arr = arr.filter(p => p.category === selectedCategory.value);
  return [...arr].sort((a, b) => {
    if (a.stock === 0 && b.stock !== 0) return -1;
    if (a.stock !== 0 && b.stock === 0) return 1;
    return (a.position || 0) - (b.position || 0);
  });
});

const totalPages = computed(() => Math.ceil(filteredProducts.value.length / perPage));
const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * perPage;
  return filteredProducts.value.slice(start, start + perPage);
});

function changePage(page) {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
}

async function saveProduct() {
  if (!form.value.name || !form.value.price) return showToast("Lengkapi data!", "danger");

  const payload = {
    name: form.value.name,
    price: form.value.price,
    stock: form.value.stock || 0,
    category: form.value.category || "",
    position: form.value.position || products.value.length
  };

  try {
    if (editMode.value) {
      await fetch(`${supabaseUrl}/rest/v1/${table}?id=eq.${currentId.value}`, {
        method: "PATCH",
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify(payload)
      });
      showToast("Produk berhasil diupdate", "success");
    } else {
      await fetch(`${supabaseUrl}/rest/v1/${table}`, {
        method: "POST",
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify([payload])
      });
      showToast("Produk berhasil ditambahkan", "success");
    }
    closeModal();
    fetchProducts();
  } catch (err) {
    console.error(err);
    showToast("Gagal menyimpan produk", "danger");
  }
}

function editProduct(p) {
  editMode.value = true;
  currentId.value = p.id;
  form.value = { ...p };
  openModal();
}

async function deleteProduct(id) {
  if (!confirm("Yakin hapus produk?")) return;
  try {
    await fetch(`${supabaseUrl}/rest/v1/${table}?id=eq.${id}`, {
      method: "DELETE",
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
    });
    showToast("Produk berhasil dihapus", "success");
    fetchProducts();
  } catch (err) {
    console.error(err);
    showToast("Gagal menghapus produk", "danger");
  }
}

function openModal() { nextTick(() => bootstrapModal.show()); }
function closeModal() { 
  bootstrapModal.hide(); 
  editMode.value = false; 
  currentId.value = null; 
  form.value = { name:"", price:0, stock:0, category:"", position:0 }; 
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

function dragStart(e, index) { dragStartIndex = index; }
async function drop(e, index) {
  const list = paginatedProducts.value;
  const draggedItem = list[dragStartIndex];
  list.splice(dragStartIndex, 1);
  list.splice(index, 0, draggedItem);
  list.forEach((item, pos) => item.position = pos);
  for (const item of list) {
    await fetch(`${supabaseUrl}/rest/v1/${table}?id=eq.${item.id}`, {
      method: "PATCH",
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({ position: item.position })
    });
  }
  fetchProducts();
}

function formatCurrency(num) { return new Intl.NumberFormat('id-ID',{style:'currency', currency:'IDR'}).format(num||0); }

function openPasteModal() { 
  nextTick(() => {
    bootstrapPasteModal.show();
  });
}
function closePasteModal() { 
  bootstrapPasteModal.hide(); 
  pasteData.value = ""; 
  errorLines.value.clear();
}

async function importPasteData() {
  const rows = pasteData.value.split("\n");
  let successCount = 0;
  let failCount = 0;
  const productsToAdd = [];
  errorLines.value.clear();

  rows.forEach((r, idx) => {
    if (!r.trim()) return;
    const cols = r.trim().split(/\s+/); 
    const name = cols[0] || "";
    const price = Number(cols[1]) || 0;
    const stock = Number(cols[2]) || 0;
    const category = cols[3] || "";

    if (!name) {
      failCount++;
      errorLines.value.add(idx + 1);
      return;
    }

    productsToAdd.push({
      name,
      price,
      stock,
      category,
      position: products.value.length + successCount
    });

    if (category && !categories.value.includes(category)) {
      categories.value.push(category);
    }

    successCount++;
  });

  if (!productsToAdd.length) return showToast("Tidak ada data valid untuk ditambahkan", "danger");

  try {
    await fetch(`${supabaseUrl}/rest/v1/${table}`, {
      method: "POST",
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(productsToAdd)
    });

    let msg = `${successCount} produk berhasil ditambahkan`;
    if (failCount > 0) msg += `, ${failCount} baris gagal`;
    showToast(msg, "success");

    closePasteModal();
    fetchProducts();
  } catch (err) {
    console.error(err);
    showToast("Gagal import data", "danger");
  }
}

onMounted(async () => {
  const bs = await import('bootstrap/dist/js/bootstrap.esm.js');
  bootstrapModal = new bs.Modal(modalRef.value);
  bootstrapToast = bs.Toast;
  bootstrapPasteModal = new bs.Modal(pasteModalRef.value);

  // Fokus otomatis textarea saat modal Paste muncul
  pasteModalRef.value.addEventListener('shown.bs.modal', () => {
    pasteTextarea.value?.focus();
  });

  fetchProducts();
});
</script>

<style scoped>
.table-hover tbody tr:hover { background-color: #ffe5b4; transition:0.2s; }
.table-danger { background-color: #f87171 !important; color: #fff; cursor: grab; }
</style>
