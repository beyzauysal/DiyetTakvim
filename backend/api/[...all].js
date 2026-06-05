const { app, ensureMongoConnected } = require("../app");

module.exports = async (req, res) => {
  const path = req.url || "";
  if (path === "/api/water-intake/health" || path === "/") {
    return app(req, res);
  }

  try {
    await ensureMongoConnected();
  } catch (err) {
    console.error("MongoDB bağlantı hatası:", err?.message || err);
    return res.status(500).json({
      message: "Veritabanı bağlantı hatası",
      error: err?.message || String(err),
    });
  }
  return app(req, res);
};