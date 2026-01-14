/**
 * Converts an RGB string to a Hex color string.
 * @param {string} rgb - The RGB color string (e.g., "rgb(255, 0, 0)").
 * @returns {string} The Hex color string (e.g., "#ff0000").
 */
export function _rgbToHex(rgb) {
  if (!rgb || typeof rgb !== "string") return "#000000"; // Default jika input tidak valid

  const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (!match) {
    return rgb; // Kembalikan nilai asli (mungkin sudah hex)
  }
  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  const toHex = (c) => ("0" + c.toString(16)).slice(-2);

  return "#" + toHex(r) + toHex(g) + toHex(b);
}
