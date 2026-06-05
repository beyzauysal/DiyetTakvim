const fs = require("fs");
const path = require("path");

/**
 * Yerelde backend/.env okur. Vercel'de env'ler dashboard'dan gelir; .env aranmaz.
 */
function loadEnv() {
  if (process.env.VERCEL) {
    return;
  }

  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) {
    return;
  }

  try {
    require("dotenv").config({ path: envPath, quiet: true });
  } catch (_) {
    /* ignore */
  }
}

module.exports = { loadEnv };
