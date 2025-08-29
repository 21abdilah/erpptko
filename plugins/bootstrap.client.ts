// plugins/bootstrap.client.ts
import { defineNuxtPlugin } from "#app";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

export default defineNuxtPlugin(() => {
  // Tidak perlu return apa-apa, cukup load JS Bootstrap
});
