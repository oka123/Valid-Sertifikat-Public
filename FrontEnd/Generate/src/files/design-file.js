// import { fabric } from "fabric";
import { showAlert, showLoading, hideLoading } from "../ui/loading.js";
import { saveState } from "../canvas/canvas-history.js";

/**
 * Creates a new design (clears the canvas).
 * @param {Object} app - The application instance.
 */
export function createNewDesign(app) {
  if (
    confirm(
      "Apakah Anda yakin ingin membuat desain sertifikat baru? Semua perubahan yang belum disimpan akan hilang."
    )
  ) {
    app.canvas.clear();
    app.canvas.setBackgroundColor(
      "#ffffff",
      app.canvas.renderAll.bind(app.canvas)
    );
    app.history = [];
    app.historyIndex = -1;
    saveState(app);
    showAlert(
      app,
      "Kanvas telah dibersihkan. Anda dapat mendesain sertifikat baru!"
    );
  }
}

/**
 * Saves the current design to a JSON file.
 * @param {Object} app - The application instance.
 */
export async function saveDesignToFile(app) {
  showLoading(app, "Menyiapkan file desain...");

  const allObjects = app.canvas.getObjects();

  for (const obj of allObjects) {
    if (obj.type === "image" && obj.getSrc().startsWith("blob:")) {
      try {
        const response = await fetch(obj.getSrc());
        const blob = await response.blob();
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });

        await new Promise((resolve) => {
          obj.setSrc(base64, () => resolve(), { crossOrigin: "anonymous" });
        });
      } catch (e) {
        console.error("Gagal mengonversi objek blob ke base64:", e);
      }
    }
  }

  const bgImage = app.canvas.backgroundImage;
  if (bgImage && bgImage.getSrc().startsWith("blob:")) {
    try {
      const response = await fetch(bgImage.getSrc());
      const blob = await response.blob();
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
      bgImage.setSrc(base64, () => app.canvas.renderAll());
    } catch (e) {
      console.error("Gagal mengonversi background blob ke base64:", e);
    }
  }

  const exportData = {
    version: "1.1",
    canvas: app.canvas.toJSON(["dataLink", "isQrCode"]),
    qrCodeConfig: app.qrCodeConfig,
    canvasSize: {
      width: app.canvas.width,
      height: app.canvas.height,
    },
  };

  const json = JSON.stringify(exportData);
  const blobFile = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blobFile);

  const a = document.createElement("a");
  a.href = url;
  a.download = `desain-sertifikat-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
  hideLoading(app);
  showAlert(app, "File desain berhasil disimpan secara permanen.", "success");
}

/**
 * Opens a design from a JSON file.
 * @param {Object} app - The application instance.
 * @param {Event} e - The file input change event.
 */
export function openDesignFromFile(app, e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      showLoading(app, "Membuka desain...");

      const canvasData = data.canvas ? data.canvas : data;

      if (data.qrCodeConfig) {
        app.qrCodeConfig = data.qrCodeConfig;
      }

      if (data.canvasSize) {
        app.canvas.setDimensions({
          width: data.canvasSize.width,
          height: data.canvasSize.height,
        });
        const wInput = app.$("#canvas-width");
        const hInput = app.$("#canvas-height");
        if (wInput) wInput.value = data.canvasSize.width;
        if (hInput) hInput.value = data.canvasSize.height;
      }

      app.canvas.loadFromJSON(canvasData, () => {
        app.canvas.renderAll();

        app.canvas.getObjects().forEach((obj) => {
          obj.setCoords();
        });

        saveState(app);
        hideLoading(app);
        showAlert(
          app,
          "Desain berhasil dimuat, selanjutnya silahkan upload data peserta."
        );
      });
    } catch (err) {
      console.error("Error Load JSON:", err);
      showAlert(
        app,
        "Gagal membuka file desain. Format tidak dikenal.",
        "error"
      );
      hideLoading(app);
    }
  };
  reader.readAsText(file);
  e.target.value = "";
}
