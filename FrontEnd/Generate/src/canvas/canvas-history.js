/**
 * Saves the current state of the canvas to the history.
 * @param {Object} app - The application instance.
 */
export function saveState(app) {
  if (app.isRestoring) return;
  clearTimeout(app._saveTimeout);
  app._saveTimeout = setTimeout(() => {
    app.history = app.history.slice(0, app.historyIndex + 1);
    app.history.push(app.canvas.toJSON(["dataLink", "isQrCode"]));
    app.historyIndex = app.history.length - 1;
    updateUndoRedoButtons(app);
  }, 200); // simpan setelah 200ms tanpa aktivitas
}

/**
 * Restores the state of the canvas from the history at the given index.
 * @param {Object} app - The application instance.
 * @param {number} index - The history index to restore.
 */
export function restoreState(app, index) {
  app.isRestoring = true;
  const state = app.history[index];
  app.canvas.loadFromJSON(state, () => {
    app.canvas.renderAll();
    app.isRestoring = false;
    updateUndoRedoButtons(app);
  });
}

/**
 * Performs the undo operation.
 * @param {Object} app - The application instance.
 */
export function undo(app) {
  if (app.historyIndex > 0) {
    app.historyIndex--;
    restoreState(app, app.historyIndex);
  }
}

/**
 * Performs the redo operation.
 * @param {Object} app - The application instance.
 */
export function redo(app) {
  if (app.historyIndex < app.history.length - 1) {
    app.historyIndex++;
    restoreState(app, app.historyIndex);
  }
}

/**
 * Updates the state of the undo and redo buttons.
 * @param {Object} app - The application instance.
 */
export function updateUndoRedoButtons(app) {
  app.ui.undoBtn.disabled = app.historyIndex <= 0;
  app.ui.redoBtn.disabled = app.historyIndex >= app.history.length - 1;
}
