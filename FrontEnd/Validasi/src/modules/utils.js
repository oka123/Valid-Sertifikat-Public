// src/modules/utils.js

/**
 * Extracts the certificate code from a raw string.
 * It handles URLs (extracting the code parameter or the last segment)
 * or raw ciphertext, and fixes common issues like '+' being replaced by spaces.
 *
 * @param {string} rawText - The text scanned from QR or input.
 * @returns {string} - The cleaned code/ciphertext.
 */
export function extractCode(rawText) {
  if (!rawText) return "";
  let code = rawText.trim();

  try {
    // Check if it's a URL
    if (code.includes("?") || code.startsWith("http")) {
      const urlObj = new URL(code);
      // Strategy 1: Look for query params
      const params = new URLSearchParams(urlObj.search);
      const firstKey = Array.from(params.keys())[0];
      if (firstKey) {
        // Assume the first parameter key or value might be the code
        // The original logic was: params.get(firstKey).
        // But if the URL is like ?code=XYZ, we want XYZ.
        // If the URL is like ?XYZ, we might want XYZ (which is the key).
        // The original code:
        // const firstParamKey = Array.from(urlParams.keys())[0];
        // const codeFromUrl = firstParamKey ? urlParams.get(firstParamKey) : null;
        // Wait, urlParams.get(key) returns the value.
        // If URL is `site.com/?ABC`, key is ABC, value is empty string.
        // If URL is `site.com/?id=ABC`, key is id, value is ABC.

        // Let's stick to the original logic's intent but improve safety.
        const val = params.get(firstKey);
        if (val) {
          code = val;
        } else if (params.toString() && !val) {
          // Case: site.com/?THE_CODE_IS_HERE_AS_KEY
          code = firstKey;
        }
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // Not a valid URL, treat as raw text
  }

  // Fix: URLSearchParams/Browser often replaces '+' with ' ' (space)
  // We must revert it for Base64 ciphertext
  return code.replace(/ /g, "+");
}
