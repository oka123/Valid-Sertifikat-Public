import axios from "axios";

/**
 * Encrypts data for QR code generation using an external API.
 * @param {Array<string>} dataArray - Array of JSON strings to encrypt.
 * @returns {Promise<Array<string>>} - Array of encrypted strings.
 */
export async function encryptData(dataArray) {
  try {
    const response = await axios.post("https://aesapi-node.vercel.app/", {
      action: "encrypt",
      data: dataArray,
    });
    return response.data.result;
  } catch (error) {
    console.error("Encryption error:", error);
    throw error;
  }
}
