const path = require("path");
const fs = require("fs");

function shouldUseTmpUploads() {
  if (process.env.VERCEL) return true;
  if (process.env.VERCEL_ENV) return true;
  try {
    if (typeof __dirname === "string" && __dirname.includes("/var/task")) {
      return true;
    }
  } catch (_) {}
  try {
    if (String(process.cwd()).includes("/var/task")) return true;
  } catch (_) {}
  return false;
}

function getBackendUploadsDir() {
  if (shouldUseTmpUploads()) {
    return path.join("/tmp", "uploads");
  }
  return path.join(__dirname, "..", "uploads");
}

function ensureUploadsDirExists(dir) {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (_) {}
}

module.exports = {
  shouldUseTmpUploads,
  getBackendUploadsDir,
  ensureUploadsDirExists,
};
