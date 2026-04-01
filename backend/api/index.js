const { app, ensureMongoConnected } = require("../app");

module.exports = async (req, res) => {
  try {
    await ensureMongoConnected();
  } catch (err) {
    console.error("Mongo bağlantı hatası:", err?.message || err);
  }
  return app(req, res);
};

