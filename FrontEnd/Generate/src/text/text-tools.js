import { fabric } from "fabric";

/**
 * Adds a new text object to the canvas.
 * @param {Object} app - The application instance.
 */
export function addText(app) {
  const canvasWidth = parseInt(app.ui.canvasWidth.value, 10);
  const canvasHeight = parseInt(app.ui.canvasHeight.value, 10);
  const text = new fabric.Textbox("Teks Contoh", {
    left: canvasWidth * 0.4,
    top: canvasHeight * 0.4,
    textAlign: "center",
    width: canvasWidth * 0.3,
    fontSize: 26,
    fontFamily: "Poppins, sans-serif",
    fill: "#000000",
    splitByGrapheme: true,
  });
  app.canvas.add(text).setActiveObject(text).renderAll();
}

/**
 * Adds a new rectangle object to the canvas.
 * @param {Object} app - The application instance.
 */
export function addRect(app) {
  const rect = new fabric.Rect({
    left: app.ui.canvasWidth.value * 0.4,
    top: app.ui.canvasHeight.value * 0.4,
    width: app.ui.canvasHeight.value * 0.25,
    height: app.ui.canvasHeight.value * 0.25,
    fill: "#f3f4f6",
  });
  app.canvas.add(rect).setActiveObject(rect).renderAll();
}

/**
 * Updates the font dropdown menu.
 * @param {Object} app - The application instance.
 */
export function updateFontDropdown(app) {
  const select = app.ui.fontFamilySelect;
  const defaultFonts = {
    Poppins: "Poppins, sans-serif",
    Arial: "Arial, sans-serif",
    Verdana: "Verdana, sans-serif",
    Georgia: "Georgia, serif",
    "Times New Roman": "Times New Roman, serif",
    "Courier New": "Courier New, monospace",
  };
  const allFonts = { ...defaultFonts, ...app.fontCache };
  select.innerHTML = Object.keys(allFonts)
    .map((name) => `<option value="${allFonts[name]}">${name}</option>`)
    .join("");
}
