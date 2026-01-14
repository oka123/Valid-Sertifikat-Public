import { setZoom, fitToScreen } from "../canvas/canvas-transform.js";
import {
  createNewDesign,
  saveDesignToFile,
  openDesignFromFile,
} from "../files/design-file.js";
import { setCanvasSize } from "../canvas/canvas-init.js";
import {
  handleBackgroundUpload,
  handleImageUpload,
  handleDataUpload,
  handleFontUpload,
} from "../uploads/uploads.js";
import { undo, redo } from "../canvas/canvas-history.js";
import { handleMenuAction } from "../menu/context-menu.js";
import { setupToolbarListeners } from "../toolbar/contextual-toolbar.js";
import {
  openQrCodeModal,
  addQrCodeColumnSelector,
  saveAndAddQrCode,
} from "../qr/qr-tools.js";
import { generateAndDownloadZip } from "../export/export-zip.js";
import { handleBatchEmail } from "../export/email-batch.js";
import { addText, addRect } from "../text/text-tools.js";

/**
 * Initializes all event listeners for the application.
 * @param {Object} app - The application instance.
 */
export function initEventListeners(app) {
  app.ui.zoomInBtn.addEventListener("click", () => setZoom(app, 1.2));
  app.ui.zoomOutBtn.addEventListener("click", () => setZoom(app, 0.8));
  app.ui.fitToScreenBtn.addEventListener("click", () => fitToScreen(app));

  app.ui.btnNew.addEventListener("click", () => createNewDesign(app));
  app.ui.btnSave.addEventListener("click", () => saveDesignToFile(app));
  app.ui.inputOpen.addEventListener("change", (e) =>
    openDesignFromFile(app, e)
  );

  app.ui.canvasWidth.addEventListener("change", (e) =>
    setCanvasSize(app, e.target.value, null)
  );
  app.ui.canvasHeight.addEventListener("change", (e) =>
    setCanvasSize(app, null, e.target.value)
  );

  app
    .$("#bg-uploader")
    .addEventListener("change", (e) => handleBackgroundUpload(app, e));
  app.$("#add-text").addEventListener("click", () => addText(app));
  app.$("#add-rect").addEventListener("click", () => addRect(app));
  app
    .$("#image-uploader")
    .addEventListener("change", (e) => handleImageUpload(app, e));
  app.$("#add-qrcode").addEventListener("click", () => openQrCodeModal(app));
  app
    .$("#data-uploader")
    .addEventListener("change", (e) => handleDataUpload(app, e));
  app
    .$("#font-uploader")
    .addEventListener("change", (e) => handleFontUpload(app, e));

  app.ui.undoBtn.addEventListener("click", () => undo(app));
  app.ui.redoBtn.addEventListener("click", () => redo(app));

  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
      if (app.root.contains(e.target)) {
        /* empty */
      } else {
        return;
      }
    }

    if (e.ctrlKey || e.metaKey) {
      if (e.key.toLowerCase() === "z") {
        undo(app);
      }
      if (e.key.toLowerCase() === "y") {
        redo(app);
      }
    }

    const isInputFocused =
      e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA";
    if (e.key === "Delete") {
      handleMenuAction(app, "delete");
    }

    if (!isInputFocused) {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "c":
            handleMenuAction(app, "copy");
            break;
          case "v":
            handleMenuAction(app, "paste");
            break;
          case "d":
            e.preventDefault();
            handleMenuAction(app, "duplicate");
            break;
          case "[":
            e.preventDefault();
            if (e.altKey) {
              handleMenuAction(app, "send-to-back");
            } else {
              handleMenuAction(app, "send-backward");
            }
            break;
          case "]":
            e.preventDefault();
            if (e.altKey) {
              handleMenuAction(app, "bring-to-front");
            } else {
              handleMenuAction(app, "bring-forward");
            }
            break;
        }
      }
    }
  });

  setupToolbarListeners(app);

  app
    .$("#close-qrcode-modal")
    .addEventListener("click", () =>
      app.ui.qrCodeModal.classList.add("hidden")
    );
  app
    .$("#add-qrcode-column")
    .addEventListener("click", () => addQrCodeColumnSelector(app));
  app
    .$("#save-qrcode-btn")
    .addEventListener("click", () => saveAndAddQrCode(app));

  const logoUploader = app.$("#logoUploader");
  const logoPreview = app.ui.logoPreview;
  const removeLogoBtn = app.ui.removeLogoBtn;

  app.$$('input[name="dots-color-type"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      const isGradient =
        app.$('input[name="dots-color-type"]:checked').value === "gradient";
      app.$(".dots-gradient-fields").classList.toggle("hidden", !isGradient);
      app.$(".dots-single-color-fields").classList.toggle("hidden", isGradient);
    });
  });

  logoUploader.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      app.uploadedLogoDataUrl = e.target.result;
      logoPreview.src = app.uploadedLogoDataUrl;
      logoPreview.classList.remove("hidden");
      removeLogoBtn.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  });

  removeLogoBtn.addEventListener("click", () => {
    app.uploadedLogoDataUrl = null;
    logoUploader.value = "";
    logoPreview.src = "";
    logoPreview.classList.add("hidden");
    removeLogoBtn.classList.add("hidden");
  });

  app.$("#download-format").addEventListener("change", (e) => {
    const format = e.currentTarget.value;
    generateAndDownloadZip(app, format);
    app.$("#download-format").value = "";
  });

  app.root.addEventListener("click", (event) => {
    const canvasWrapper = app.canvas.wrapperEl;
    if (
      canvasWrapper &&
      !canvasWrapper.contains(event.target) &&
      !event.target.closest("#contextual-toolbar") &&
      !event.target.closest("#sidebar") &&
      !event.target.closest("header")
    ) {
      if (app.canvas.getActiveObject()) {
        app.canvas.discardActiveObject();
        app.canvas.requestRenderAll();
      }
    }
  });

  const appContainer = app.ui.appContainer;
  const themeToggleBtn = app.ui.themeToggle;
  const darkIcon = app.ui.themeDarkIcon;
  const lightIcon = app.ui.themeLightIcon;

  if (!localStorage.getItem("color-theme")) {
    localStorage.setItem("color-theme", "dark");
  }

  const toggleTheme = () => {
    appContainer.classList.toggle("dark");
    const isDark = appContainer.classList.contains("dark");
    localStorage.setItem("color-theme", isDark ? "dark" : "light");
    lightIcon.classList.toggle("hidden", !isDark);
    darkIcon.classList.toggle("hidden", isDark);

    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.prepend(meta);
    }
    meta.setAttribute("content", isDark ? "#000000" : "#ffffff");
  };
  themeToggleBtn.addEventListener("click", toggleTheme);

  if (
    localStorage.getItem("color-theme") === "dark" ||
    (!("color-theme" in localStorage) &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
  ) {
    appContainer.classList.add("dark");
    lightIcon.classList.remove("hidden");
    darkIcon.classList.add("hidden");
  } else {
    appContainer.classList.remove("dark");
    lightIcon.classList.add("hidden");
    darkIcon.classList.remove("hidden");
  }

  if (window.innerWidth < 768) {
    app.ui.sidebar.classList.add("-ml-68");
    app.$("#sidebar-closed-icon").classList.toggle("hidden");
    app.$("#sidebar-opened-icon").classList.toggle("hidden");
  }
  app.ui.sidebarToggle.addEventListener("click", () => {
    app.ui.sidebar.classList.toggle("-ml-68");
    app.$("#sidebar-closed-icon").classList.toggle("hidden");
    app.$("#sidebar-opened-icon").classList.toggle("hidden");
  });

  const exportButton = app.ui.exportBtn;
  const exportMenu = app.ui.exportMenu;

  exportButton.addEventListener("click", (e) => {
    e.stopPropagation();
    const isExpanded = exportButton.getAttribute("aria-expanded") === "true";
    exportButton.setAttribute("aria-expanded", !isExpanded);
    exportMenu.classList.toggle("visible", !isExpanded);
    exportMenu.classList.toggle("invisible", isExpanded);
    exportMenu.classList.toggle("opacity-100", !isExpanded);
    exportMenu.classList.toggle("opacity-0", isExpanded);
  });

  app.$("#btn-open-email").addEventListener("click", () => {
    app.$("#export-menu").classList.add("invisible");
    app.$("#export-menu").classList.remove("visible");
    app.$("#export-menu").classList.add("opacity-0");
    app.$("#export-menu").classList.remove("opacity-100");
    exportButton.setAttribute("aria-expanded", "false");

    app.$("#email-modal").classList.remove("invisible");
    app.$("#email-modal").classList.add("visible");
    app.$("#email-modal").classList.remove("opacity-0");
    app.$("#email-modal").classList.add("opacity-100");
  });

  app.$("#btn-close-email").addEventListener("click", () => {
    app.$("#email-modal").classList.add("invisible");
    app.$("#email-modal").classList.remove("visible");
    app.$("#email-modal").classList.add("opacity-0");
    app.$("#email-modal").classList.remove("opacity-100");
  });

  app
    .$("#btn-start-send")
    .addEventListener("click", () => handleBatchEmail(app));

  document.addEventListener("click", (event) => {
    if (
      !event.composedPath().includes(exportButton) &&
      !event.composedPath().includes(exportMenu)
    ) {
      exportMenu.classList.add("invisible");
      exportMenu.classList.remove("visible");
      exportMenu.classList.add("opacity-0");
      exportMenu.classList.remove("opacity-100");
      exportButton.setAttribute("aria-expanded", "false");
    }
  });

  const slider = app.$("#qr-dots-gradient-rotation");
  const output = app.$("#rotation-value");

  slider.addEventListener("input", function () {
    output.textContent = slider.value;
  });

  // PWA Install Prompt Logic
  let installPromptEvent = null;
  let isPWANotifAlreadyShowed = false;
  let isPWAInstallDocListenerAdded = false;

  const PWA_FLAG_KEY = "pwaNotifFlag";
  const PWA_FLAG_TIME_KEY = "pwaNotifTimestamp";
  const PWA_EXPIRATION_MS = 60 * 60 * 1000;

  (function initPWANotifFlag() {
    const savedFlag = localStorage.getItem(PWA_FLAG_KEY);
    const savedTime = localStorage.getItem(PWA_FLAG_TIME_KEY);

    if (savedFlag === "true" && savedTime) {
      const elapsed = Date.now() - parseInt(savedTime, 10);
      if (elapsed < PWA_EXPIRATION_MS) {
        isPWANotifAlreadyShowed = true;
      } else {
        isPWANotifAlreadyShowed = false;
        localStorage.removeItem(PWA_FLAG_KEY);
        localStorage.removeItem(PWA_FLAG_TIME_KEY);
      }
    }
  })();

  const pwaInstallContainer = app.$("#pwa-install-container");
  const pwaInstallButton = app.$("#pwa-install");

  function savePWANotifFlag() {
    localStorage.setItem(PWA_FLAG_KEY, "true");
    localStorage.setItem(PWA_FLAG_TIME_KEY, Date.now().toString());
  }

  const handleInstallClick = () => {
    isPWANotifAlreadyShowed = true;
    savePWANotifFlag();

    if (!installPromptEvent) return;

    if (isPWAInstallDocListenerAdded) {
      document.removeEventListener("click", handleInstallClick);
      isPWAInstallDocListenerAdded = false;
    }

    requestIdleCallback(() => {
      setTimeout(() => {
        installPromptEvent.prompt();
        installPromptEvent.userChoice.then(() => {
          installPromptEvent = null;
        });
      }, 4500);
    });
  };

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPromptEvent = event;
    pwaInstallContainer.classList.remove("hidden");
    if (isPWANotifAlreadyShowed) return;

    isPWAInstallDocListenerAdded = true;
    document.addEventListener("click", handleInstallClick, { once: true });
  });

  function disableInAppInstallPrompt() {
    installPromptEvent = null;
    pwaInstallContainer.classList.add("hidden");
  }

  pwaInstallButton.addEventListener("click", () => {
    isPWANotifAlreadyShowed = true;
    savePWANotifFlag();

    if (isPWAInstallDocListenerAdded) {
      document.removeEventListener("click", handleInstallClick);
      isPWAInstallDocListenerAdded = false;
    }
    if (!installPromptEvent) return;

    installPromptEvent.prompt();

    installPromptEvent.userChoice.then(() => {
      disableInAppInstallPrompt();
    });
  });

  window.addEventListener("appinstalled", () => {
    disableInAppInstallPrompt();
  });
}
