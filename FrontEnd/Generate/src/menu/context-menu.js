import {
  copyObject,
  pasteObject,
  duplicateObject,
  deleteObject,
} from "../canvas/canvas-objects.js";
import { saveState } from "../canvas/canvas-history.js";
import { updateContextualToolbar } from "../toolbar/contextual-toolbar.js";

/**
 * Initializes the context menu.
 * @param {Object} app - The application instance.
 */
export function initContextMenu(app) {
  const main = app.ui.mainCanvas;
  const contextMenu = app.ui.contextMenu;

  main.addEventListener("contextmenu", (e) => {
    const isTouchDevice =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;

    if (isTouchDevice) {
      return;
    }

    e.preventDefault();

    const target = app.canvas.findTarget(e, false);

    if (target) {
      app.canvas.setActiveObject(target);
    } else {
      app.canvas.discardActiveObject();
    }
    app.canvas.renderAll();

    updateContextMenuState(app);
    showContextMenu(app, e.clientX, e.clientY);
  });

  app.root.addEventListener("click", () => hideContextMenu(app));
  document.addEventListener("click", () => hideContextMenu(app));

  contextMenu.addEventListener("click", (e) => {
    const button = e.target.closest("button");
    if (button && button.dataset.action) {
      e.stopPropagation();
      handleMenuAction(app, button.dataset.action);
      hideContextMenu(app);
    }
  });
}

/**
 * Shows the context menu at the specified coordinates.
 * @param {Object} app - The application instance.
 * @param {number} x - The x-coordinate.
 * @param {number} y - The y-coordinate.
 */
export function showContextMenu(app, x, y) {
  const contextMenu = app.ui.contextMenu;
  const mainRect = app.ui.mainCanvas.getBoundingClientRect();
  const hostRect = app.host.getBoundingClientRect();

  contextMenu.classList.remove("hidden");

  contextMenu.style.visibility = "hidden";
  contextMenu.style.display = "block";
  const menuWidth = contextMenu.offsetWidth;
  const menuHeight = contextMenu.offsetHeight;
  contextMenu.style.display = "";
  contextMenu.style.visibility = "";

  let top = y - hostRect.top;
  let left = x - hostRect.left;

  if (x + menuWidth > mainRect.right) {
    left = x - hostRect.left - menuWidth;
  }
  if (x < mainRect.left) {
    left = mainRect.left - hostRect.left;
  }
  if (y + menuHeight > mainRect.bottom) {
    top = y - hostRect.top - menuHeight;
  }
  if (y < mainRect.top) {
    top = mainRect.top - hostRect.top;
  }

  contextMenu.style.top = `${top}px`;
  contextMenu.style.left = `${left}px`;
  contextMenu.classList.remove("hidden");

  contextMenu.querySelectorAll(".submenu-container").forEach((container) => {
    container.classList.remove(
      "submenu-open-left",
      "submenu-open-right",
      "submenu-open-top"
    );
    const sub = container.querySelector(".submenu");
    if (!sub) return;

    const itemRect = container.getBoundingClientRect();
    sub.style.visibility = "hidden";
    sub.style.display = "block";
    const subWidth = sub.offsetWidth;
    const subHeight = sub.offsetHeight;
    sub.style.display = "";
    sub.style.visibility = "";

    if (itemRect.right + subWidth > mainRect.right) {
      container.classList.add("submenu-open-left");
    } else {
      container.classList.add("submenu-open-right");
    }

    if (itemRect.top + subHeight > mainRect.bottom) {
      container.classList.add("submenu-open-top");
    }
  });
}

/**
 * Hides the context menu.
 * @param {Object} app - The application instance.
 */
export function hideContextMenu(app) {
  app.ui.contextMenu.classList.add("hidden");
}

/**
 * Updates the state of the context menu (enabled/disabled buttons).
 * @param {Object} app - The application instance.
 */
export function updateContextMenuState(app) {
  const contextMenu = app.ui.contextMenu;
  const activeObject = app.canvas.getActiveObject();

  contextMenu
    .querySelectorAll("[data-menu-section] button")
    .forEach((btn) => (btn.disabled = true));

  if (activeObject) {
    contextMenu
      .querySelectorAll("[data-menu-section] button")
      .forEach((btn) => (btn.disabled = false));
  }

  if (app._clipboard) {
    contextMenu.querySelector('button[data-action="paste"]').disabled = false;
  }
}

/**
 * Handles the actions triggered by the context menu or toolbar.
 * @param {Object} app - The application instance.
 * @param {string} action - The action identifier.
 */
export function handleMenuAction(app, action) {
  const activeObject = app.canvas.getActiveObject();
  if (!activeObject && !["paste"].includes(action)) return;

  switch (action) {
    case "copy":
      copyObject(app);
      break;
    case "paste":
      pasteObject(app);
      break;
    case "duplicate":
      duplicateObject(app);
      break;
    case "delete":
      deleteObject(app);
      break;
    case "bring-forward":
      activeObject.bringForward();
      break;
    case "bring-to-front":
      activeObject.bringToFront();
      break;
    case "send-backward":
      activeObject.sendBackwards();
      break;
    case "send-to-back":
      activeObject.sendToBack();
      break;
    case "align-left":
      activeObject.set({ left: 0 }).setCoords();
      break;
    case "align-center":
      activeObject.centerH();
      break;
    case "align-right":
      activeObject
        .set({ left: app.canvas.width - activeObject.getScaledWidth() })
        .setCoords();
      break;
    case "align-top":
      activeObject.set({ top: 0 }).setCoords();
      break;
    case "align-middle":
      activeObject.centerV();
      break;
    case "align-bottom":
      activeObject
        .set({ top: app.canvas.height - activeObject.getScaledHeight() })
        .setCoords();
      break;
    case "text-align-left":
    case "text-align-center":
    case "text-align-right":
    case "text-align-justify": {
      const align = action.split("-")[2];
      activeObject.set("textAlign", align);
      updateContextualToolbar(app, activeObject);
      break;
    }
  }
  if (!["copy", "paste", "duplicate", "delete"].includes(action)) {
    app.canvas.renderAll();
    saveState(app);
  }
}
