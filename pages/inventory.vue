<template>
  <div class="container py-4">
    <h2 class="text-center mb-3 fw-bold">📦 KELOLA BARANG</h2>

    <!-- Form Produk Card -->
    <div>
      <div>
        <ProductForm
          :form="form"
          :editMode="editMode"
          @save="saveProduct"
          @cancel="cancelEdit"
        />
      </div>
    </div>

    <!-- Filter dan Info Total -->
    <!-- Filter Kategori -->
<div class="col-12 col-md-6">
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
</div>
<div>
      <div class="col-12 text-md-end">
        <small class="text-muted d-block mt-1 mt-md-0">
          Total Produk: {{ filteredProducts.length }}
        </small>
      </div>
    </div>

    <!-- Daftar Produk Scrollable -->
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
          <ProductCardIn
            v-for="p in paginatedProducts"
            :key="p.id"
            :product="p"
            @edit="editProduct"
            @delete="deleteProduct"
          />
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <nav class="mt-3">
      <ul class="pagination justify-content-center flex-wrap">
        <li class="page-item" :class="{ disabled: currentPage === 1 }">
          <button class="page-link btn-outline-primary" @click="changePage(currentPage - 1)">
            ← Prev
          </button>
        </li>
        <li
          v-for="page in totalPages"
          :key="page"
          class="page-item mx-1 my-1"
          :class="{ active: currentPage === page }"
        >
          <button class="page-link btn btn-sm btn-outline-secondary" @click="changePage(page)">
            {{ page }}
          </button>
        </li>
        <li class="page-item" :class="{ disabled: currentPage === totalPages }">
          <button class="page-link btn-outline-primary" @click="changePage(currentPage + 1)">
            Next →
          </button>
        </li>
      </ul>
    </nav>
  </div>
</template>

<style scoped>
/* Hover efek tabel */
.table-hover tbody tr:hover {
  background-color: #ffe5b4;
  transition: 0.2s;
}

/* Scrollbar custom */
.table-responsive::-webkit-scrollbar {
  width: 8px;
}
.table-responsive::-webkit-scrollbar-thumb {
  background-color: rgba(0,0,0,0.2);
  border-radius: 4px;
}

/* Pagination aktif */
.page-item.active .page-link {
  background-color: #ff9800;
  border-color: #ff9800;
  color: #fff;
}

/* Ukuran tombol dan font untuk tablet */
@media (min-width: 768px) and (max-width: 1024px) {
  .form-select-lg {
    font-size: 1rem;
  }
  .page-link {
    font-size: 0.95rem;
    padding: 0.45rem 0.9rem;
  }
  table th, table td {
    font-size: 0.95rem;
  }
}
</style>


<script setup>
import { ref, onMounted, computed } from "vue";
import ProductForm from "@/components/ProductForm.vue";
import ProductCardIn from "@/components/ProductCardIn.vue";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const table = "products";

const products = ref([]);
const editMode = ref(false);
const currentId = ref(null);
const form = ref({ name: "", price: 0, stock: 0, category: "" });

const selectedCategory = ref("");
const currentPage = ref(1);
const perPage = 10;

const categories = ref([]);

// Fetch all products
async function fetchProducts() {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    });
    const data = await res.json();
    products.value = data;

    // Ambil kategori unik
    categories.value = [...new Set(data.map((p) => p.category).filter(Boolean))];
  } catch (err) {
    console.error(err);
    alert("Gagal mengambil data produk");
  }
}

// Produk yang sudah difilter kategori
const filteredProducts = computed(() => {
  if (!selectedCategory.value) return products.value;
  return products.value.filter((p) => p.category === selectedCategory.value);
});

// Pagination
const totalPages = computed(() =>
  Math.ceil(filteredProducts.value.length / perPage)
);

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * perPage;
  return filteredProducts.value.slice(start, start + perPage);
});

function changePage(page) {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
}

// CRUD
async function saveProduct() {
  if (!form.value.name || !form.value.price) return alert("Lengkapi data!");

  try {
    if (editMode.value) {
      await fetch(`${supabaseUrl}/rest/v1/${table}?id=eq.${currentId.value}`, {
        method: "PATCH",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(form.value),
      });
      alert("Produk berhasil diupdate");
    } else {
      await fetch(`${supabaseUrl}/rest/v1/${table}`, {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify([form.value]),
      });
      alert("Produk berhasil ditambahkan");
    }
    cancelEdit();
    fetchProducts();
  } catch (err) {
    console.error(err);
    alert("Gagal menyimpan produk");
  }
}

function editProduct(p) {
  editMode.value = true;
  currentId.value = p.id;
  form.value = { ...p };
}

function cancelEdit() {
  editMode.value = false;
  currentId.value = null;
  form.value = { name: "", price: 0, stock: 0, category: "" };
}

async function deleteProduct(id) {
  if (!confirm("Yakin hapus produk ini?")) return;
  try {
    await fetch(`${supabaseUrl}/rest/v1/${table}?id=eq.${id}`, {
      method: "DELETE",
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    });
    alert("Produk berhasil dihapus");
    fetchProducts();
  } catch (err) {
    console.error(err);
    alert("Gagal menghapus produk");
  }
}

onMounted(fetchProducts);
</script>
