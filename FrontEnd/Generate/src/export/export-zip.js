import JSZip from "jszip";
import { jsPDF } from "jspdf";
import QRCodeStyling from "qr-code-styling";
import { fabric } from "fabric";
import { showAlert, showLoading, hideLoading } from "../ui/loading.js";
import { encryptData } from "../utils/encryption.js";

/**
 * Generates and downloads the certificates as a ZIP file.
 * @param {Object} app - The application instance.
 * @param {string} paramFormat - The format to download ('jpeg', 'png', 'pdf').
 */
export async function generateAndDownloadZip(app, paramFormat) {
  const format = paramFormat;
  if (!format) {
    console.error("Format unduhan tidak ditentukan.");
    return;
  }

  const isPdf = format === "pdf";
  const dataToProcess = app.uploadedData.length > 0 ? app.uploadedData : [{}];
  const qualityMultiplier = 2;
  const jpegQuality = 0.8;
  const dataToProcessLength = dataToProcess.length;
  const uploadedDataLength = app.uploadedData.length;

  if (dataToProcessLength === 1 && uploadedDataLength === 0) {
    showLoading(app, "Membuat sertifikat...");

    const originalViewport = app.canvas.viewportTransform.slice();
    const originalZoom = app.canvas.getZoom();
    app.canvas.setZoom(1);
    app.canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

    const dataUrl = app.canvas.toDataURL({
      format: isPdf ? "jpeg" : format,
      quality: jpegQuality,
      multiplier: qualityMultiplier,
    });

    if (isPdf) {
      const orientation = app.canvas.width > app.canvas.height ? "l" : "p";
      const pdfDoc = new jsPDF({
        orientation: orientation,
        unit: "px",
        format: [app.canvas.width, app.canvas.height],
      });
      pdfDoc.addImage(
        dataUrl,
        "JPEG",
        0,
        0,
        app.canvas.width,
        app.canvas.height
      );
      pdfDoc.save("sertifikat.pdf");
    } else {
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `sertifikat.${format}`;
      link.click();
    }

    app.canvas.setZoom(originalZoom);
    app.canvas.setViewportTransform(originalViewport);
    app.canvas.renderAll();

    hideLoading(app);
    showAlert(app, "Sertifikat berhasil dibuat!", "success");
    return;
  }

  showLoading(app, "Memulai proses...");
  const zip = new JSZip();

  const originalViewport = app.canvas.viewportTransform.slice();
  const originalZoom = app.canvas.getZoom();
  app.canvas.setZoom(1);
  app.canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

  const allObjects = app.canvas.getObjects();
  const textObjects = allObjects.filter(
    (obj) => obj.dataLink && (obj.type === "i-text" || obj.type === "textbox")
  );
  const qrObject = allObjects.find((obj) => obj.isQrCode);

  const originalCanvasState = app.canvas.toJSON(["dataLink", "isQrCode"]);

  app._qrCache = app._qrCache || {};

  let encryptedCodes = [];
  if (qrObject && uploadedDataLength > 0) {
    showLoading(app, `Mengenkripsi ${uploadedDataLength} data...`);
    const jsonDataArray = app.uploadedData.map((row) => {
      const identity = {};
      app.qrCodeConfig.columns.forEach(
        (col) => (identity[col] = row[col] || "")
      );
      return JSON.stringify(identity);
    });
    try {
      encryptedCodes = await encryptData(jsonDataArray);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      app.canvas.setZoom(originalZoom);
      app.canvas.setViewportTransform(originalViewport);
      hideLoading(app);
      return showAlert(
        app,
        "Gagal saat enkripsi data. Proses dibatalkan.",
        "error"
      );
    }
  }

  const filenameColumn = app.dataHeaders[0];

  let qrSavedProps = null;
  if (qrObject) {
    qrSavedProps = {
      left: qrObject.left,
      top: qrObject.top,
      scaleX: qrObject.scaleX,
      scaleY: qrObject.scaleY,
      angle: qrObject.angle,
      originX: qrObject.originX,
      originY: qrObject.originY,
      selectable: qrObject.selectable,
      evented: qrObject.evented,
    };
  }

  for (let i = 0; i < dataToProcessLength; i++) {
    const row = dataToProcess[i];
    showLoading(app, `Membuat sertifikat ${i + 1}/${dataToProcessLength}...`);

    if (uploadedDataLength > 0) {
      textObjects.forEach((obj) => {
        const cellValue = row[obj.dataLink] || "";
        obj.set("text", String(cellValue));
      });
    }

    if (qrObject && encryptedCodes[i]) {
      const encrypted = encryptedCodes[i];
      const finalQRData = `${app.qrCodeConfig.validationUrl}${encrypted}`;

      if (!app._qrCache[encrypted]) {
        const qr = new QRCodeStyling({
          ...app.qrCodeConfig.styling,
          data: finalQRData,
        });
        app._qrCache[encrypted] = await qr.getRawData("jpeg");
      }

      const blob = app._qrCache[encrypted];
      if (blob) {
        const qrUrl = URL.createObjectURL(blob);

        try {
          await new Promise((resolve) => {
            qrObject.setSrc(
              qrUrl,
              () => {
                qrObject.set(qrSavedProps);
                qrObject.set("isQrCode", true);
                qrObject.setCoords();
                URL.revokeObjectURL(qrUrl);
                resolve();
              },
              { crossOrigin: "anonymous" }
            );
          });
        } catch (e) {
          console.error("Error:", e);
          await new Promise((res) => {
            fabric.Image.fromURL(qrUrl, (newImg) => {
              Object.assign(newImg, qrSavedProps);
              newImg.set("isQrCode", true);
              app.canvas.remove(qrObject);
              app.canvas.add(newImg);
              app.canvas.renderAll();
              URL.revokeObjectURL(qrUrl);
              res();
            });
          });
        }
      }
    }

    app.canvas.renderAll();

    const filename =
      uploadedDataLength > 0 && filenameColumn
        ? `${row[filenameColumn] || `sertifikat-${i + 1}`}`
        : `sertifikat-${i + 1}`;

    if (format === "jpeg") {
      const jpegData = app.canvas.toDataURL({
        format,
        quality: jpegQuality,
        multiplier: qualityMultiplier,
      });
      zip.file(`${filename}-${i + 1}.${format}`, jpegData.split(",")[1], {
        base64: true,
      });
    } else if (isPdf) {
      const jpegData = app.canvas.toDataURL({
        format: "jpeg",
        quality: jpegQuality,
        multiplier: qualityMultiplier,
      });
      const orientation = app.canvas.width > app.canvas.height ? "l" : "p";
      const pdfDoc = new jsPDF({
        orientation,
        unit: "px",
        format: [app.canvas.width, app.canvas.height],
      });
      pdfDoc.addImage(
        jpegData,
        "JPEG",
        0,
        0,
        app.canvas.width,
        app.canvas.height
      );
      const pdfBlob = pdfDoc.output("blob");
      zip.file(`${filename}-${i + 1}.pdf`, pdfBlob);
    } else if (format === "png") {
      const dataUrl = app.canvas.toDataURL({
        format: "png",
        multiplier: qualityMultiplier,
      });
      zip.file(`${filename}-${i + 1}.png`, dataUrl.split(",")[1], {
        base64: true,
      });
    }
    if (i % 50 === 0) await new Promise((r) => setTimeout(r));
  }

  showLoading(app, "Mengompres file ZIP...");

  app.canvas.loadFromJSON(originalCanvasState, () => {
    app.canvas.setZoom(originalZoom);
    app.canvas.setViewportTransform(originalViewport);
    app.canvas.renderAll();

    zip.generateAsync({ type: "blob" }).then((content) => {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `Sertifikat-${format.toUpperCase()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      hideLoading(app);
      showAlert(app, "File ZIP berhasil dibuat!", "success");

      app._qrCache = {};
    });
  });
}
