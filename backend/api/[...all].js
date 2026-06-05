const serverless = require("serverless-http");
const { app, ensureMongoConnected } = require("../createApp");

const expressHandler = serverless(app, {
  binary: ["image/*", "application/octet-stream"],
});

function isHealthOrRoot(url) {
  const path = (url || "").split("?")[0];
  return path === "/api/water-intake/health" || path === "/";
}

module.exports = async (req, res) => {
  if (!isHealthOrRoot(req.url)) {
    try {
      await ensureMongoConnected();
    } catch (err) {
      console.error("MongoDB bağlantı hatası:", err?.message || err);
      return res.status(500).json({
        message: "Veritabanı bağlantı hatası",
        error: err?.message || String(err),
      });
    }
  }

  return expressHandler(req, res);
};
