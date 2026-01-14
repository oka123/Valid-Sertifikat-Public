// src/modules/api.js

const API_URL = "https://aesapi-node.vercel.app/";

/**
 * Sends the extracted codes to the API for validation/decryption.
 *
 * @param {Array<string>} codes - Array of cleaned codes/ciphertexts.
 * @returns {Promise<Object>} - The API response.
 */
export async function validateCodes(codes) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "decrypt",
        data: codes,
      }),
    });

    if (!response.ok) throw new Error("Server error");
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}
