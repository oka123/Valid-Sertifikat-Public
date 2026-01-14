/**
 * Initializes the autocomplete functionality for email subject and body.
 * @param {Object} app - The application instance.
 */
export function initAutocomplete(app) {
  const hintBox = app.$("#hint-dropdown");
  const subjectInput = app.$("#email-subject");
  const bodyTextarea = app.$("#email-body");

  const handleInput = (e) => {
    const input = e.target;
    const value = input.value;
    const cursorPos = input.selectionStart;

    // Cari teks sebelum kursor untuk mengecek apakah ada simbol {
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastOpenBrace = textBeforeCursor.lastIndexOf("{");

    // Jika ada simbol { dan belum ditutup oleh } sebelum kursor
    if (
      lastOpenBrace !== -1 &&
      textBeforeCursor.indexOf("}", lastOpenBrace) === -1
    ) {
      const query = textBeforeCursor.substring(lastOpenBrace + 1).toLowerCase();
      const matches = app.dataHeaders.filter((h) =>
        h.toLowerCase().includes(query)
      );

      if (matches.length > 0) {
        renderHintList(app, matches, input, lastOpenBrace);
      } else {
        hintBox.classList.add("hidden");
      }
    } else {
      hintBox.classList.add("hidden");
    }
  };

  subjectInput.addEventListener("input", handleInput);
  bodyTextarea.addEventListener("input", handleInput);

  // Klik di luar untuk menutup
  document.addEventListener("click", (e) => {
    if (!e.composedPath().includes(hintBox)) hintBox.classList.add("hidden");
  });
}

/**
 * Renders the autocomplete hint list.
 * @param {Object} app - The application instance.
 * @param {Array<string>} headers - The list of matching headers.
 * @param {HTMLElement} targetInput - The input element.
 * @param {number} bracePos - The position of the opening brace.
 */
export function renderHintList(app, headers, targetInput, bracePos) {
  const hintBox = app.$("#hint-dropdown");
  hintBox.innerHTML = "";
  hintBox.classList.remove("hidden");

  // Posisikan hintBox di bawah kursor atau input
  const rect = targetInput.getBoundingClientRect();
  // const modalRect = this.$("#email-modal > div").getBoundingClientRect();

  // Perhitungan posisi sederhana relatif terhadap modal
  hintBox.style.left = rect.left + "px";
  hintBox.style.top = rect.bottom + "px";

  headers.forEach((header) => {
    const item = document.createElement("div");
    item.className = "suggestion-item";
    item.textContent = `{${header}}`;
    item.onclick = () => {
      const startText = targetInput.value.substring(0, bracePos);
      const endText = targetInput.value.substring(targetInput.selectionStart);
      targetInput.value = startText + `{${header}}` + endText;
      hintBox.classList.add("hidden");
      targetInput.focus();
    };
    hintBox.appendChild(item);
  });
}

/**
 * Replaces variables in the template string with data from the row.
 * @param {string} template - The template string with variables in curly braces.
 * @param {Object} rowData - The data object containing values.
 * @returns {string} The result string.
 */
export function replaceVariables(template, rowData) {
  if (!template) return "";
  // Regex untuk mencari pola {Nama Kolom}
  // Mendukung karakter alfanumerik dan spasi di dalam kurung kurawal
  return template.replace(/{([^}]+)}/g, (match, key) => {
    const trimmedKey = key.trim();
    // Cari data di baris Excel berdasarkan key tersebut
    return rowData[trimmedKey] !== undefined ? rowData[trimmedKey] : match;
  });
}
