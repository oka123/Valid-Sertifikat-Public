import axios from "axios";
import QRCodeStyling from "qr-code-styling";
// import { fabric } from "fabric";
import { showAlert, showLoading, hideLoading } from "../ui/loading.js";
import { replaceVariables } from "../autocomplete/autocomplete.js";
import { applyDataRowToCanvas } from "../data/data-mapping.js";
import { encryptData } from "../utils/encryption.js";

/**
 * Handles batch email sending.
 * @param {Object} app - The application instance.
 */
export async function handleBatchEmail(app) {
  const smtpUser = app.$("#smtp-user").value.trim();
  const smtpPass = app.$("#smtp-pass").value.trim();
  const subjectTpl = app.$("#email-subject").value;
  const bodyTpl = app.$("#email-body").value;

  if (!smtpUser || !smtpPass) {
    showAlert(app, "Harap isi email dan password pengirim.", "warning");
    return;
  }

  if (app.uploadedData.length === 0) {
    showAlert(app, "Data peserta kosong. Harap upload Excel/CSV.", "warning");
    return;
  }

  const emailKey = app.dataHeaders.find((h) =>
    h.toLowerCase().includes("email")
  );
  if (!emailKey) {
    showAlert(app, "Kolom 'Email' tidak ditemukan di data Anda.", "error");
    return;
  }

  if (
    !confirm(
      `Aplikasi akan mengirim ${app.uploadedData.length} email. Lanjutkan?`
    )
  )
    return;

  app.$("#email-modal").classList.add("invisible");
  app.$("#email-modal").classList.remove("visible");
  app.$("#email-modal").classList.add("opacity-0");
  app.$("#email-modal").classList.remove("opacity-100");
  showLoading(app, "Menyiapkan pengiriman massal...");

  const allObjects = app.canvas.getObjects();
  const qrObject = allObjects.find((obj) => obj.isQrCode);
  const uploadedDataLength = app.uploadedData.length;

  const originalViewport = app.canvas.viewportTransform.slice();
  const originalZoom = app.canvas.getZoom();

  app.canvas.setZoom(1);
  app.canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

  app._qrCache = app._qrCache || {};
  let encryptedCodes = [];

  if (qrObject && uploadedDataLength > 0) {
    showLoading(app, `Mengenkripsi ${uploadedDataLength} data QR...`);
    const jsonDataArray = app.uploadedData.map((row) => {
      const identity = {};
      app.qrCodeConfig.columns.forEach(
        (col) => (identity[col] = row[col] || "")
      );
      return JSON.stringify(identity);
    });

    try {
      encryptedCodes = await encryptData(jsonDataArray);
    } catch (error) {
      console.error("Gagal enkripsi:", error);
      app.canvas.setZoom(originalZoom);
      app.canvas.setViewportTransform(originalViewport);
      hideLoading(app);
      return showAlert(
        app,
        "Gagal mengenkripsi data QR. Proses dibatalkan.",
        "error"
      );
    }
  }

  const qrSavedProps = qrObject
    ? {
        left: qrObject.left,
        top: qrObject.top,
        scaleX: qrObject.scaleX,
        scaleY: qrObject.scaleY,
        angle: qrObject.angle,
        originX: qrObject.originX,
        originY: qrObject.originY,
        selectable: qrObject.selectable,
        evented: qrObject.evented,
      }
    : null;

  for (let i = 0; i < uploadedDataLength; i++) {
    const row = app.uploadedData[i];
    const targetEmail = row[emailKey];

    showLoading(
      app,
      `Mengirim email ${i + 1}/${uploadedDataLength} (${targetEmail})`
    );

    applyDataRowToCanvas(app, row);

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
          console.error("Gagal update source QR:", e);
        }
      }
    }

    app.canvas.renderAll();

    const imageData = app.canvas.toDataURL({
      format: "jpeg",
      quality: 0.8,
      multiplier: 2,
    });

    const finalSubject = replaceVariables(subjectTpl, row);
    const finalBody = replaceVariables(bodyTpl, row);

    try {
      await axios.post("https://aesapi-node.vercel.app/send-email", {
        auth: { user: smtpUser, pass: smtpPass },
        to: targetEmail,
        subject: finalSubject,
        message: finalBody,
        image: imageData,
      });
    } catch (err) {
      console.error(
        `Gagal mengirim ke ${targetEmail}:`,
        err.response?.data || err.message
      );
    }

    if (i % 50 === 0) await new Promise((r) => setTimeout(r));
  }

  app.canvas.setZoom(originalZoom);
  app.canvas.setViewportTransform(originalViewport);
  app.canvas.renderAll();

  hideLoading(app);
  showAlert(
    app,
    `Berhasil mengirim ${uploadedDataLength} pengiriman email!`,
    "success"
  );

  app._qrCache = {};
}
