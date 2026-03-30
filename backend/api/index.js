const { app, ensureMongoConnected } = require("../app");

module.exports = async (req, res) => {
  try {
    await ensureMongoConnected();
  } catch (err) {
    // DB yoksa bile bazı endpoint'ler yanıt döndürebilir; yine de hata görünür olsun.
    console.error("Mongo bağlantı hatası:", err?.message || err);
  }
  return app(req, res);
};

