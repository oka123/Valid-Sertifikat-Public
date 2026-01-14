import minifiedHtml from "./minified.html?raw";
import minifiedCss from "./minified.css?raw";

// Import modules
import { initCanvas } from "./canvas/canvas-init.js";
import { initPanning, initPanAndZoom } from "./canvas/canvas-transform.js";
import { initContextMenu } from "./menu/context-menu.js";
import { updateFontDropdown } from "./text/text-tools.js";
import { initAutocomplete } from "./autocomplete/autocomplete.js";
import { initEventListeners } from "./ui/event-bindings.js";

class GenerateSertifikat extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({
      mode: "open",
    });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `<style> ${minifiedCss} </style> ${minifiedHtml} `;
    this.initializeApp();
  }

  initializeApp() {
    new GenerateSertifikatApp(this.shadowRoot, this);
  }
}

class GenerateSertifikatApp {
  constructor(shadowRoot, hostElement) {
    this.root = shadowRoot;
    this.host = hostElement;
    this.canvas = null;
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
    this.uploadedData = [];
    this.dataHeaders = [];
    this.activeHintInput = null;
    this.fontCache = {};
    this.qrCodeConfig = {
      columns: [],
      validationUrl: "",
      styling: {},
    };
    this.history = [];
    this.historyIndex = -1;
    this.isRestoring = false;
    this._clipboard = null;
    this.initialPinchDistance = 0;
    this.isCropping = false;
    this.croppingImage = null;
    this.cropRect = null;

    // Cache object for batch processing (QR, etc)
    this._qrCache = {};

    this.$ = (selector) => this.root.querySelector(selector);
    this.$$ = (selector) => this.root.querySelectorAll(selector);
    document.head.appendChild(
      Object.assign(document.createElement("link"), {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Poppins&display=swap",
      })
    );

    window.addEventListener("beforeunload", function (event) {
      event.preventDefault();
      event.returnValue = "";
    });

    document.querySelector("body").style.margin = "0px";
    document.querySelector("body").style.padding = "0px";
    document.querySelector("body").style.overflow = "clip";

    this.ui = {
      appContainer: this.$("#app-container"),
      canvasContainer: this.$("#canvas-container"),
      mainCanvas: this.$("#main-canvas"),

      undoBtn: this.$("#undo-btn"),
      redoBtn: this.$("#redo-btn"),
      themeToggle: this.$("#theme-toggle"),
      themeDarkIcon: this.$("#theme-toggle-dark-icon"),
      themeLightIcon: this.$("#theme-toggle-light-icon"),
      exportBtn: this.$("#export-dropdown-btn"),
      exportMenu: this.$("#export-menu"),
      sidebarToggle: this.$("#sidebar-toggle"),

      sidebar: this.$("#sidebar"),
      btnNew: this.$("#btn-new-design"),
      btnSave: this.$("#btn-save-design"),
      inputOpen: this.$("#input-open-design"),
      canvasWidth: this.$("#canvas-width"),
      canvasHeight: this.$("#canvas-height"),
      dataMappingContainer: this.$("#data-mapping-container"),
      dataMappingUi: this.$("#data-mapping-ui"),

      textOptions: this.$("#text-options"),
      imageOptions: this.$("#image-options"),
      generalOptions: this.$("#general-options"),
      fontFamilySelect: this.$("#font-family-select"),
      fontSizeInput: this.$("#font-size-input"),
      fontColorPicker: this.$("#font-color-picker"),
      fontBoldBtn: this.$("#font-bold-btn"),
      fontItalicBtn: this.$("#font-italic-btn"),
      textAlignLeftBtn: this.$("#text-align-left-btn"),
      textAlignCenterBtn: this.$("#text-align-center-btn"),
      textAlignRightBtn: this.$("#text-align-right-btn"),
      textAlignJustifyBtn: this.$("#text-align-justify-btn"),
      cropImageBtn: this.$("#crop-image-btn"),
      applyCropBtn: this.$("#apply-crop-btn"),
      cancelCropBtn: this.$("#cancel-crop-btn"),
      fillColorPicker: this.$("#fill-color-picker"),
      contextMenu: this.$("#context-menu"),
      contextualToolbar: this.$("#contextual-toolbar"),
      pasteButton: this.$('#general-options button[data-action="paste"]'),

      zoomLevelText: this.$("#zoom-level-text"),
      zoomInBtn: this.$("#zoom-in-btn"),
      zoomOutBtn: this.$("#zoom-out-btn"),
      fitToScreenBtn: this.$("#fit-to-screen-btn"),

      loadingModal: this.$("#loading-modal"),
      loadingText: this.$("#loading-text"),
      qrCodeModal: this.$("#qrcode-modal"),
      qrCodeColumnsContainer: this.$("#qrcode-columns-container"),
      validationUrl: this.$("#validation-url"),
      logoPreview: this.$("#logo-preview"),
      removeLogoBtn: this.$("#remove-logo"),
    };

    this.init();
  }

  init() {
    initCanvas(this);
    initEventListeners(this);
    initContextMenu(this);
    updateFontDropdown(this);
    initPanning(this);
    initPanAndZoom(this);
    initAutocomplete(this);
  }
}

if (!window.customElements.get("validsertifikat-generate")) {
  window.customElements.define("validsertifikat-generate", GenerateSertifikat);
}
