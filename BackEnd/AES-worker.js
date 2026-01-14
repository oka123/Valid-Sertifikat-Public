const crypto = require("crypto");

const ALGORITHM = "aes-256-cbc";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

const encryptText = (text, key) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encryptedBuffer = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([iv, encryptedBuffer]).toString("base64");
};

const decryptText = (encryptedData, key) => {
  try {
    const combined = Buffer.from(encryptedData, "base64");
    if (combined.length < IV_LENGTH) return "Dekripsi gagal";
    const iv = combined.slice(0, IV_LENGTH);
    const encryptedBuffer = combined.slice(IV_LENGTH);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    return Buffer.concat([
      decipher.update(encryptedBuffer),
      decipher.final(),
    ]).toString("utf8");
  } catch (error) {
    return "Dekripsi gagal";
  }
};

module.exports = (task) => {
  const { action, dataArray, password } = task;

  // Derivasi kunci sekali per batch tugas (Optimal)
  const salt = crypto.scryptSync(password, "salt-tambahan-rahasia", 24);
  const key = crypto.scryptSync(password, salt, KEY_LENGTH);

  return dataArray.map((item) => {
    const strItem = String(item);
    return action === "encrypt"
      ? encryptText(strItem, key)
      : decryptText(strItem, key);
  });
};
