import { _rgbToHex } from "../utils/color.js";
import { updateDataMappingUI } from "../data/data-mapping.js";
import {
  enterCropMode,
  applyCrop,
  exitCropMode,
} from "../canvas/canvas-crop.js";
import { handleMenuAction } from "../menu/context-menu.js";

/**
 * Updates the contextual toolbar based on the selected object.
 * @param {Object} app - The application instance.
 * @param {Object} obj - The selected Fabric object.
 */
export function updateContextualToolbar(app, obj) {
  if (!obj) {
    hideContextualToolbar(app);
    return;
  }

  const toolbar = app.ui.contextualToolbar;
  toolbar.classList.remove("hidden");
  toolbar.classList.add("flex");

  const isText = obj.type === "i-text" || obj.type === "textbox";
  const isImage = obj.type === "image";

  app.ui.textOptions.classList.toggle("hidden", !isText);
  app.ui.textOptions.classList.toggle("flex", isText);
  app.ui.imageOptions.classList.toggle("hidden", !isImage && !app.isCropping);
  app.ui.imageOptions.classList.toggle("flex", isImage || app.isCropping);
  app.ui.generalOptions.classList.toggle("hidden", app.isCropping);
  app.ui.generalOptions.classList.toggle("flex", !app.isCropping);

  app.ui.cropImageBtn.classList.toggle("hidden", app.isCropping);
  app.ui.cropImageBtn.classList.toggle("flex", !app.isCropping);
  app.ui.applyCropBtn.classList.toggle("hidden", !app.isCropping);
  app.ui.applyCropBtn.classList.toggle("flex", app.isCropping);
  app.ui.cancelCropBtn.classList.toggle("hidden", !app.isCropping);
  app.ui.cancelCropBtn.classList.toggle("flex", app.isCropping);

  if (isText) {
    app.ui.fontFamilySelect.value = obj.fontFamily;
    app.ui.fontSizeInput.value = obj.fontSize;
    app.ui.fontColorPicker.value = _rgbToHex(obj.fill);
    app.ui.fillColorPicker.classList.add("hidden");
    updateDataMappingUI(app, obj);

    const activeLightClass = "bg-slate-200";
    const activeDarkClass = "dark:bg-slate-600";
    const currentAlign = obj.textAlign || "left";

    app.ui.textAlignLeftBtn.classList.toggle(
      activeLightClass,
      currentAlign === "left"
    );
    app.ui.textAlignLeftBtn.classList.toggle(
      activeDarkClass,
      currentAlign === "left"
    );
    app.ui.textAlignCenterBtn.classList.toggle(
      activeLightClass,
      currentAlign === "center"
    );
    app.ui.textAlignCenterBtn.classList.toggle(
      activeDarkClass,
      currentAlign === "center"
    );
    app.ui.textAlignRightBtn.classList.toggle(
      activeLightClass,
      currentAlign === "right"
    );
    app.ui.textAlignRightBtn.classList.toggle(
      activeDarkClass,
      currentAlign === "right"
    );
    app.ui.textAlignJustifyBtn.classList.toggle(
      activeLightClass,
      currentAlign === "justify"
    );
    app.ui.textAlignJustifyBtn.classList.toggle(
      activeDarkClass,
      currentAlign === "justify"
    );
  } else if (isImage) {
    app.ui.fillColorPicker.classList.add("hidden");
    updateDataMappingUI(app, null);
  } else {
    app.ui.fillColorPicker.classList.remove("hidden");
    app.ui.fillColorPicker.value = _rgbToHex(obj.fill);
    updateDataMappingUI(app, null);
  }

  if (app.ui.pasteButton) {
    app.ui.pasteButton.disabled = !app._clipboard;
  }
}

/**
 * Hides the contextual toolbar.
 * @param {Object} app - The application instance.
 */
export function hideContextualToolbar(app) {
  app.ui.contextualToolbar.classList.add("hidden");
  updateDataMappingUI(app, null);
}

/**
 * Sets up listeners for the toolbar.
 * @param {Object} app - The application instance.
 */
export function setupToolbarListeners(app) {
  const applyToActive = (callback) => {
    const activeObject = app.canvas.getActiveObject();
    if (activeObject) {
      callback(activeObject);
      app.canvas.renderAll();
      // We need to import saveState, but avoiding circular dependencies if possible.
      // Since this function is called from event listeners, we can rely on saveState being available via import or passed if needed.
      // But here we are inside a function.
      // Let's assume we import it or better yet, since 'saveState' is core, maybe we should import it.
      // However, this module is imported by canvas-init.
      // Let's try importing saveState from history.
      import("../canvas/canvas-history.js").then(({ saveState }) =>
        saveState(app)
      );
    }
  };

  app.ui.contextualToolbar.addEventListener("click", (e) => {
    const button = e.target.closest("button");
    if (!button) return;

    const action = button.dataset.action;
    const id = button.id;

    if (action) {
      e.stopPropagation();
      handleMenuAction(app, action);
      app
        .$$("[data-submenu-container] > div")
        .forEach((sub) => sub.classList.add("hidden"));
    } else if (id === "crop-image-btn") {
      enterCropMode(app);
    } else if (id === "apply-crop-btn") {
      applyCrop(app);
    } else if (id === "cancel-crop-btn") {
      exitCropMode(app, true);
    }
  });

  app.ui.fontFamilySelect.addEventListener("change", (e) =>
    applyToActive((obj) => obj.set("fontFamily", e.target.value))
  );
  app.ui.fontSizeInput.addEventListener("input", (e) =>
    applyToActive((obj) => obj.set("fontSize", parseInt(e.target.value, 10)))
  );
  app.ui.fontColorPicker.addEventListener("input", (e) => {
    const colorValue = e.target.value;
    clearTimeout(app._fontColorTimeout);
    app._fontColorTimeout = setTimeout(() => {
      applyToActive((obj) => {
        obj.set("fill", colorValue);
      });
    }, 100);
  });
  app.ui.fontBoldBtn.addEventListener("click", () =>
    applyToActive((obj) =>
      obj.set("fontWeight", obj.fontWeight === "bold" ? "normal" : "bold")
    )
  );
  app.ui.fontItalicBtn.addEventListener("click", () =>
    applyToActive((obj) =>
      obj.set("fontStyle", obj.fontStyle === "italic" ? "normal" : "italic")
    )
  );
  app.ui.fillColorPicker.addEventListener("input", (e) => {
    const colorValue = e.target.value;
    clearTimeout(app._fillColorTimeout);
    app._fillColorTimeout = setTimeout(() => {
      applyToActive((obj) => {
        if (obj && typeof obj.set === "function") {
          obj.set("fill", colorValue);
        }
      });
    }, 100);
  });

  app.$$("[data-submenu-container]").forEach((container) => {
    const submenu = container.querySelector("div");
    container.addEventListener("mouseenter", () => {
      submenu.classList.remove("hidden");
      submenu.classList.add("flex");
    });
    container.addEventListener("mouseleave", () => {
      submenu.classList.add("hidden");
      submenu.classList.remove("flex");
    });
  });
}
