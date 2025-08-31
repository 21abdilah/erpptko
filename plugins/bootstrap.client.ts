// plugins/bootstrap.client.ts
import { defineNuxtPlugin } from "#app";
import "bootstrap/dist/css/bootstrap.min.css";

export default defineNuxtPlugin(() => {
  // Hanya load CSS, tidak ada JS Bootstrap
});
