// mailer.js
const nodemailer = require("nodemailer");
const { Readable } = require("stream");

const transporterCache = new Map();

// simple serial queue per transporter (Promise chain)
const queueMap = new Map();

function getQueue(cacheKey) {
  if (!queueMap.has(cacheKey)) queueMap.set(cacheKey, Promise.resolve());
  return queueMap.get(cacheKey);
}

function setQueue(cacheKey, p) {
  queueMap.set(cacheKey, p);
}

function getTransporter(user, pass) {
  const cacheKey = `${user}:${pass}`;

  if (!transporterCache.has(cacheKey)) {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      pool: true,
      maxConnections: 1, // serial over single connection
      maxMessages: 10000, // reuse connection many times
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 30000,
    });

    // Verify silently (tanpa logging)
    transporter.verify().catch(() => {});

    transporterCache.set(cacheKey, transporter);
  }

  return transporterCache.get(cacheKey);
}

function prepareAttachment(image) {
  const attachment = { filename: "Sertifikat.jpg" };

  if (!image) return null;

  if (Buffer.isBuffer(image)) {
    attachment.content = image;
  } else if (typeof image === "string") {
    if (image.startsWith("data:")) {
      const base64 = image.split(",")[1] || "";
      attachment.content = Buffer.from(base64, "base64");
    } else {
      attachment.path = image;
    }
  } else if (image instanceof Readable) {
    attachment.content = image;
  } else if (image.stream && typeof image.stream.pipe === "function") {
    attachment.content = image.stream;
    if (image.filename) attachment.filename = image.filename;
  } else {
    throw new Error("Unsupported image type for attachment");
  }

  return attachment;
}

async function sendCertificateEmail({ auth, to, subject, message, image }) {
  const transporter = getTransporter(auth.user, auth.pass);
  const cacheKey = `${auth.user}:${auth.pass}`;

  const prev = getQueue(cacheKey);

  const sendPromise = prev.then(async () => {
    const attachment = prepareAttachment(image);

    const mailOptions = {
      from: auth.user,
      to,
      subject,
      text: message,
      attachments: attachment ? [attachment] : undefined,
    };

    return transporter.sendMail(mailOptions);
  });

  // prevent rejection from breaking the queue chain
  setQueue(
    cacheKey,
    sendPromise.catch(() => {})
  );

  return sendPromise;
}

function closeTransporters() {
  for (const [key, transporter] of transporterCache.entries()) {
    try {
      transporter.close();
    } catch (_) {}
    transporterCache.delete(key);
    queueMap.delete(key);
  }
}

module.exports = {
  sendCertificateEmail,
  closeTransporters,
};
