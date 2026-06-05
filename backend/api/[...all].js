const serverless = require("serverless-http");
const { app, ensureMongoConnected } = require("../createApp");

const expressHandler = serverless(app, {
  binary: ["image/*", "application/octet-stream"],
});

const NO_MONGO_PATHS = new Set(["/", "/api/water-intake/health", "/openapi.json"]);

function pathWithoutQuery(url) {
  return (url || "").split("?")[0];
}

function shouldSkipMongo(url) {
  const p = pathWithoutQuery(url);
  if (NO_MONGO_PATHS.has(p)) return true;
  if (/favicon\.(ico|png)$/i.test(p)) return true;
  if (p.endsWith(".ico") || p.endsWith(".png")) return true;
  return false;
}

module.exports = async (req, res) => {
  if (!shouldSkipMongo(req.url)) {
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
