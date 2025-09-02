export default defineNuxtConfig({
  css: [
    "bootstrap/dist/css/bootstrap.min.css",
    "bootstrap-icons/font/bootstrap-icons.css"
  ],
  plugins: ["~/plugins/bootstrap.client.ts", "~/plugins/sw.client.ts"],
  pwa: {
    workbox: true,
    manifest: true
  },
  build: { transpile: [] }
});
