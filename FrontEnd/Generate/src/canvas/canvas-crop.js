import { fabric } from "fabric";
import { updateContextualToolbar } from "../toolbar/contextual-toolbar.js";
import { saveState } from "./canvas-history.js";

/**
 * Enters crop mode for the selected image.
 * @param {Object} app - The application instance.
 */
export function enterCropMode(app) {
  const image = app.canvas.getActiveObject();
  if (!image || image.type !== "image") return;

  app.isCropping = true;
  app.croppingImage = image;

  image.hasControls = false;
  image.lockMovementX = true;
  image.lockMovementY = true;

  app.cropRect = new fabric.Rect({
    left: image.left,
    top: image.top,
    width: image.getScaledWidth(),
    height: image.getScaledHeight(),
    fill: "rgba(0,0,0,0.3)",
    stroke: "white",
    strokeWidth: 2,
    strokeDashArray: [5, 5],
  });

  app.canvas.add(app.cropRect);
  app.canvas.setActiveObject(app.cropRect);
  updateContextualToolbar(app, image);
  app.canvas.renderAll();
}

/**
 * Applies the crop to the image.
 * @param {Object} app - The application instance.
 */
export function applyCrop(app) {
  if (!app.croppingImage || !app.cropRect) return;

  const img = app.croppingImage;
  const crop = app.cropRect;

  const currentCropX = img.cropX || 0;
  const currentCropY = img.cropY || 0;

  const newRelativeCropX = (crop.left - img.left) / img.scaleX;
  const newRelativeCropY = (crop.top - img.top) / img.scaleY;

  const newAbsoluteCropX = currentCropX + newRelativeCropX;
  const newAbsoluteCropY = currentCropY + newRelativeCropY;

  const newCropWidth = crop.getScaledWidth() / img.scaleX;
  const newCropHeight = crop.getScaledHeight() / img.scaleY;

  img.set({
    cropX: newAbsoluteCropX,
    cropY: newAbsoluteCropY,
    width: newCropWidth,
    height: newCropHeight,
    left: crop.left,
    top: crop.top,
  });

  exitCropMode(app);
  saveState(app);
}

/**
 * Exits crop mode.
 * @param {Object} app - The application instance.
 */
export function exitCropMode(app) {
  if (!app.croppingImage) return;

  app.canvas.remove(app.cropRect);

  app.croppingImage.hasControls = true;
  app.croppingImage.lockMovementX = false;
  app.croppingImage.lockMovementY = false;
  app.canvas.setActiveObject(app.croppingImage);

  app.isCropping = false;
  app.croppingImage = null;
  app.cropRect = null;

  updateContextualToolbar(app, app.canvas.getActiveObject());
  app.canvas.renderAll();
}
