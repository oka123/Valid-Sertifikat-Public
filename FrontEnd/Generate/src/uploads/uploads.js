import { fabric } from "fabric";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { showAlert, showLoading, hideLoading } from "../ui/loading.js";
import { saveState } from "../canvas/canvas-history.js";
import { setCanvasSize } from "../canvas/canvas-init.js";
import { fitToScreen } from "../canvas/canvas-transform.js";
import { updateDataMappingUI } from "../data/data-mapping.js";

/**
 * Handles the background image upload.
 * @param {Object} app - The application instance.
 * @param {Event} e - The upload event.
 */
export function handleBackgroundUpload(app, e) {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    showAlert(app, "Harap unggah file gambar yang valid.", "error");
    return;
  }
  const reader = new FileReader();
  reader.onload = (f) => {
    fabric.Image.fromURL(f.target.result, (img) => {
      let canvasWidth = app.canvas.width;
      let canvasHeight = app.canvas.height;
      if (img.width > canvasWidth || img.height > canvasHeight) {
        setCanvasSize(app, img.width, img.height);
        canvasWidth = app.canvas.width;
        canvasHeight = app.canvas.height;
        app.ui.canvasWidth.value = canvasWidth;
        app.ui.canvasHeight.value = canvasHeight;
      }
      const scale = Math.min(
        canvasWidth / img.width,
        canvasHeight / img.height
      );

      app.canvas.setBackgroundImage(
        img,
        () => {
          app.canvas.renderAll();
          fitToScreen(app);
        },
        {
          scaleX: scale,
          scaleY: scale,
          originX: "center",
          originY: "center",
          left: canvasWidth / 2,
          top: canvasHeight / 2,
        }
      );
      saveState(app);
    });
  };
  reader.readAsDataURL(file);
  e.target.value = null;
}

/**
 * Handles normal image upload.
 * @param {Object} app - The application instance.
 * @param {Event} e - The upload event.
 */
export function handleImageUpload(app, e) {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    showAlert(app, "Harap unggah file gambar yang valid.", "error");
    return;
  }
  const reader = new FileReader();
  reader.onload = (f) => {
    fabric.Image.fromURL(f.target.result, (img) => {
      img.scaleToHeight(app.ui.canvasHeight.value * 0.5);
      img.set({
        left: parseInt(app.ui.canvasWidth.value) * 0.4,
        top: parseInt(app.ui.canvasHeight.value) * 0.3,
      });
      app.canvas.add(img).setActiveObject(img).renderAll();
    });
  };
  reader.readAsDataURL(file);
  e.target.value = null;
}

/**
 * Handles data file upload (CSV/Excel).
 * @param {Object} app - The application instance.
 * @param {Event} e - The upload event.
 */
export function handleDataUpload(app, e) {
  const file = e.target.files[0];
  if (!file) return;
  showLoading(app, "Membaca file data...");
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = event.target.result;
      if (file.name.endsWith(".csv")) {
        const parsed = Papa.parse(data, {
          header: true,
          skipEmptyLines: true,
        });
        app.uploadedData = parsed.data;
        app.dataHeaders = parsed.meta.fields;
      } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        const workbook = XLSX.read(data, {
          type: "binary",
        });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        app.uploadedData = XLSX.utils.sheet_to_json(worksheet);
        if (app.uploadedData.length > 0) {
          app.dataHeaders = Object.keys(app.uploadedData[0]);
        }
      } else {
        throw new Error("Unsupported file format");
      }
      app.ui.dataMappingContainer.classList.remove("hidden");
      updateDataMappingUI(app, null);
      showAlert(app, `${app.uploadedData.length} baris data berhasil di-load.`);
    } catch (err) {
      showAlert(
        app,
        "Gagal memproses file. Pastikan formatnya benar.",
        "error"
      );
      console.error(err);
    } finally {
      hideLoading(app);
    }
  };
  reader.readAsBinaryString(file);
  e.target.value = null;
}

/**
 * Handles font file upload.
 * @param {Object} app - The application instance.
 * @param {Event} e - The upload event.
 */
export function handleFontUpload(app, e) {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.name.match(/\.(ttf|otf|woff|woff2)$/i)) {
    showAlert(
      app,
      "Harap unggah file font yang valid (ttf, otf, woff, woff2).",
      "error"
    );
    return;
  }
  const reader = new FileReader();
  const fontName = file.name.split(".")[0].replace(/[^a-zA-Z0-9]/g, "");

  reader.onload = (f) => {
    const fontData = f.target.result;
    const newFont = new FontFace(fontName, `url(${fontData})`);
    newFont
      .load()
      .then((loadedFont) => {
        document.fonts.add(loadedFont);
        app.fontCache[fontName] = fontName;

        const select = app.ui.fontFamilySelect;
        const option = document.createElement("option");
        option.value = fontName;
        option.textContent = fontName;
        select.appendChild(option);

        showAlert(app, `Font '${fontName}' berhasil ditambahkan.`);
      })
      .catch((err) => {
        console.error("Font loading failed:", err);
        showAlert(app, "Gagal memuat font.", "error");
      });
  };
  reader.readAsDataURL(file);
  e.target.value = null;
}
