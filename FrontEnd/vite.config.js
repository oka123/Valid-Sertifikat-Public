// vite.config.js
import { defineConfig } from "vite";
import { resolve } from "path";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  server: {
    port: 5174, // Ganti port jika port 5173 bermasalah
    hmr: {
      port: 5174, // Sesuaikan dengan port baru
    },
  },
  plugins: [
    // Hapus viteSingleFile() dan ganti dengan ini
    viteSingleFile(),
  ],
  build: {
    outDir: "Generate/dist", // Sesuaikan Direktori output build
    minify: "terser", // <-- Gunakan 'terser' untuk minifikasi maksimal

    // Konfigurasi terserOptions Anda sudah bagus dan sekarang akan digunakan
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 2,
        pure_getters: true,
        unsafe: true,
        unsafe_math: true,
        unsafe_proto: true,
        unsafe_regexp: true,
        unused: true,
        dead_code: true,
      },
      format: {
        comments: false,
      },
      mangle: {
        toplevel: true,
      },
    },

    // TAMBAHAN: Matikan sourcemap secara eksplisit untuk rilis
    sourcemap: false,

    lib: {
      // eslint-disable-next-line no-undef
      entry: resolve(__dirname, "Generate/src/main.js"), // Sesuaikan jalur entri sesuai kebutuhan
      name: "validsertifikat-generate", // Nama library global
      formats: ["umd"],
      // fileName: (format) => `validsertifikat-generate.js`,
      fileName: () => `validsertifikat-generate.js`, // Nama file sesuaikan
    },

    rollupOptions: {
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
      },
      // Opsi ini memastikan semua chunk JS digabung jadi satu
      output: {
        inlineDynamicImports: true,
      },
    },

    cssCodeSplit: false, // Menonaktifkan pemisahan CSS untuk file kecil
  },
});
