/**
 * Updates the Data Mapping UI based on the selected object.
 * @param {Object} app - The application instance.
 * @param {Object} selectedObject - The currently selected Fabric object.
 */
export function updateDataMappingUI(
  app,
  selectedObject = app.canvas.getActiveObject()
) {
  const container = app.ui.dataMappingUi;
  if (app.dataHeaders.length === 0) {
    container.innerHTML =
      '<p class="text-xs text-slate-400">Upload file Excel/CSV untuk memulai.</p>';
    return;
  }

  if (!selectedObject) {
    container.innerHTML =
      '<p class="text-xs text-slate-400">Pilih elemen teks di kanvas untuk dihubungkan dengan kolom data.</p>';
    return;
  }

  const currentLink = selectedObject.dataLink || "none";
  const options = [
    '<option value="none">-- Tidak terhubung --</option>',
    ...app.dataHeaders.map(
      (header) =>
        `<option value="${header}" ${
          header === currentLink ? "selected" : ""
        }>${header}</option>`
    ),
  ].join("");

  container.innerHTML = `
        <div class="bg-slate-100 p-2 rounded-md dark:bg-slate-700/50">
            <p class="text-xs font-bold mb-1">Elemen terpilih: <span class="font-normal dark:text-slate-400">${selectedObject.type}</span></p>
            <select id="data-linker" class="w-full h-8 rounded-md borders bg-white dark:bg-slate-700 px-2 text-sm">${options}</select>
        </div>
    `;

  app.$("#data-linker").addEventListener("change", (e) => {
    const value = e.target.value;
    if (value === "none") {
      delete selectedObject.dataLink;
    } else {
      selectedObject.set("dataLink", value);
      if (
        app.uploadedData.length > 0 &&
        (selectedObject.type === "i-text" || selectedObject.type === "textbox")
      ) {
        const cellValue = app.uploadedData[0][value];
        selectedObject.set("text", String(cellValue || ""));
        app.canvas.renderAll();
      }
    }
  });
}

/**
 * Applies data from a specific row to the canvas objects.
 * @param {Object} app - The application instance.
 * @param {Object} row - The data row object.
 */
export function applyDataRowToCanvas(app, row) {
  app.canvas.getObjects().forEach((obj) => {
    if (obj.dataLink && row[obj.dataLink]) {
      obj.set("text", String(row[obj.dataLink]));
    }
  });
}
