
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const pages = [
  "index",
  "login-sign",
  "dashboard",
  "portfolio",
  "portfolio-editor",
  "view-portfolio",
  "simple",
  "modern",
  "creative",
  "reset-password",
];

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      input: Object.fromEntries(
        pages.map((page) => [
          page,
          resolve(__dirname, `${page}.html`),
        ])
      ),
    },
  },
});
