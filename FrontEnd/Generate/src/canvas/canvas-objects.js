import { saveState } from "./canvas-history.js";

/**
 * Copies the active object to the clipboard variable.
 * @param {Object} app - The application instance.
 */
export function copyObject(app) {
  const activeObject = app.canvas.getActiveObject();
  if (!activeObject) return;
  activeObject.clone((cloned) => {
    app._clipboard = cloned;
  });
  if (app.ui.pasteButton) {
    app.ui.pasteButton.disabled = !app._clipboard;
  }
}

/**
 * Pastes the object from the clipboard.
 * @param {Object} app - The application instance.
 */
export function pasteObject(app) {
  if (!app._clipboard) return;
  app._clipboard.clone((clonedObj) => {
    app.canvas.discardActiveObject();
    clonedObj.set({
      left: (app._clipboard.left || 0) + 10,
      top: (app._clipboard.top || 0) + 10,
      evented: true,
    });

    if (clonedObj.type === "activeSelection") {
      clonedObj.canvas = app.canvas;
      clonedObj.forEachObject((obj) => app.canvas.add(obj));
      clonedObj.setCoords();
    } else {
      app.canvas.add(clonedObj);
    }
    app._clipboard.top += 10;
    app._clipboard.left += 10;
    app.canvas.setActiveObject(clonedObj);
    app.canvas.requestRenderAll();
    saveState(app);
  });
}

/**
 * Duplicates the active object.
 * @param {Object} app - The application instance.
 */
export function duplicateObject(app) {
  const activeObject = app.canvas.getActiveObject();
  if (!activeObject) return;
  activeObject.clone((cloned) => {
    app.canvas.discardActiveObject();
    cloned.set({
      left: cloned.left + 10,
      top: cloned.top + 10,
    });
    app.canvas.add(cloned);
    app.canvas.setActiveObject(cloned);
    app.canvas.requestRenderAll();
    saveState(app);
  });
}

/**
 * Deletes the active object(s).
 * @param {Object} app - The application instance.
 */
export function deleteObject(app) {
  const activeObjects = app.canvas.getActiveObjects();
  if (!activeObjects.length) return;
  activeObjects.forEach((obj) => app.canvas.remove(obj));
  app.canvas.discardActiveObject();
  app.canvas.requestRenderAll();
  saveState(app);
}
