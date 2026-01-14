import { fabric } from "fabric";
import { saveState } from "./canvas-history.js";
import {
  updateContextualToolbar,
  hideContextualToolbar,
} from "../toolbar/contextual-toolbar.js";
import { fitToScreen } from "./canvas-transform.js";

/**
 * Initializes the Fabric canvas.
 * @param {Object} app - The application instance.
 */
export function initCanvas(app) {
  const initialWidth = app.ui.canvasWidth.value;
  const initialHeight = app.ui.canvasHeight.value;

  app.canvas = new fabric.Canvas(app.$("#certificate-canvas"), {
    width: parseInt(initialWidth),
    height: parseInt(initialHeight),
    backgroundColor: "#ffffff",
    preserveObjectStacking: true,
  });

  app.canvas.textboxContainer = app.ui.canvasContainer;

  fabric.Object.prototype.transparentCorners = false;
  fabric.Object.prototype.cornerColor = "#4f46e5";
  fabric.Object.prototype.cornerStyle = "circle";
  fabric.Object.prototype.borderColor = "#4f46e5";
  fabric.Object.prototype.borderScaleFactor = 1.5;
  fabric.Object.prototype.cornerSize = 15;

  fabric.Object.prototype.objectCaching = true;
  fabric.Object.prototype.noScaleCache = false;

  app.canvas.on("object:modified", () => saveState(app));
  app.canvas.on("object:added", () => saveState(app));
  app.canvas.on("object:removed", () => saveState(app));

  app.canvas.on({
    "selection:created": (e) =>
      e.selected &&
      e.selected.length > 0 &&
      updateContextualToolbar(app, e.selected[0]),
    "selection:updated": (e) =>
      e.selected &&
      e.selected.length > 0 &&
      updateContextualToolbar(app, e.selected[0]),
    "selection:cleared": () => hideContextualToolbar(app),
  });
  saveState(app);
}

/**
 * Sets the canvas size.
 * @param {Object} app - The application instance.
 * @param {number|null} width - The new width (or null to keep current).
 * @param {number|null} height - The new height (or null to keep current).
 */
export function setCanvasSize(app, width, height) {
  const newWidth = parseInt(width) || app.canvas.getWidth();
  const newHeight = parseInt(height) || app.canvas.getHeight();

  app.canvas.setZoom(1);
  app.canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

  app.canvas.setWidth(newWidth);
  app.canvas.setHeight(newHeight);

  fitToScreen(app);
  app.canvas.renderAll();
}
