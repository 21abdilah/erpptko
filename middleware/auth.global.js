export default defineNuxtRouteMiddleware((to, from) => {
  if (process.client) {
    const user = localStorage.getItem("user");

    // kalau belum login dan bukan di /login → redirect ke /login
    if (!user && to.path !== "/login") {
      return navigateTo("/login");
    }

    // kalau sudah login tapi masih buka /login → redirect ke dashboard (/)
    if (user && to.path === "/login") {
      return navigateTo("/");
    }
  }
});
