<script setup>
import { ref, onMounted } from "vue";
import Sidebar from "../components/Sidebar.vue";
import Topbar from "../components/Topbar.vue";

const collapsed = ref(false);
const mobileOpen = ref(false);
const notifications = ref([]);
const theme = ref("light"); // default langsung light

function toggleTheme() {
  theme.value = theme.value === "light" ? "dark" : "light";
}

// fetch notifikasi produk
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function fetchStockNotifications() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/products?select=name,stock&stock=eq.0`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
    const data = await res.json();
    notifications.value = data.map((p) => ({
      id: p.name,
      message: `${p.name} stok habis!`,
    }));
  } catch (err) {
    console.error("❌ Gagal fetch notifikasi:", err);
  }
}

onMounted(fetchStockNotifications);
</script>
