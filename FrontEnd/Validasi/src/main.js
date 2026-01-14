import minifiedHtml from "./assets/minified.html?raw";
import minifiedCss from "./assets/minified.css?raw";
import { ValidasiSertifikatApp } from "./app.js";

class ValidasiSertifikat extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.appInstance = null;
  }

  connectedCallback() {
    // Only render if not already rendered
    if (!this.shadowRoot.innerHTML.trim()) {
      this.render();
      this.initializeApp();
    }
  }

  disconnectedCallback() {
    if (
      this.appInstance &&
      typeof this.appInstance.disconnectedCallback === "function"
    ) {
      this.appInstance.disconnectedCallback();
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>${minifiedCss}</style>
      ${minifiedHtml}
    `;
  }

  initializeApp() {
    this.appInstance = new ValidasiSertifikatApp(this.shadowRoot, this);
  }
}

if (!window.customElements.get("validsertifikat-validasi")) {
  window.customElements.define("validsertifikat-validasi", ValidasiSertifikat);
}

export default ValidasiSertifikat;
