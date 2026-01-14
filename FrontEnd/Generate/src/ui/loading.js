/**
 * Shows the loading modal with a message.
 * @param {Object} app - The application instance.
 * @param {string} text - The text to display.
 */
export function showLoading(app, text = "Memproses...") {
  app.ui.loadingText.textContent = text;
  app.ui.loadingModal.classList.remove("hidden");
  app.ui.loadingModal.classList.add("flex");
}

/**
 * Hides the loading modal.
 * @param {Object} app - The application instance.
 */
export function hideLoading(app) {
  app.ui.loadingModal.classList.add("hidden");
  app.ui.loadingModal.classList.remove("flex");
}

/**
 * Shows an alert message (toast).
 * @param {Object} app - The application instance.
 * @param {string} message - The message to display.
 * @param {string} type - The type of alert ('success', 'warning', 'error').
 */
export function showAlert(app, message, type = "success") {
  console.log(`ALERT (${type}):`, message);

  // Dapatkan container notifikasi
  const container = app.$("#notification-container");
  if (!container) return;

  // 1. Buat elemen notifikasi baru
  const toast = document.createElement("div");

  // 2. Tambahkan kelas dasar dan kelas tipe (success, warning, error)
  toast.className = `notification-toast ${type}`;

  // 3. Isi pesannya
  toast.textContent = message;

  // 4. Tambahkan notifikasi ke container
  container.appendChild(toast);

  // 5. Atur agar notifikasi hilang setelah 4 detik
  setTimeout(() => {
    toast.remove();
  }, 4000);
}
