/**
 * Yerel geliştirme ve Docker.
 * Vercel entry: index.js (server.js deploy bundle'da yok).
 */
const mongoose = require("mongoose");
const { loadEnv } = require("./config/loadEnv");
const { createApplication } = require("./createApp");
const { initRedis } = require("./config/redis");
const { initRabbitMq } = require("./config/rabbitmq");

loadEnv();

const app = createApplication();
const PORT = process.env.PORT || 5050;

async function startServer() {
  if (process.env.MONGO_URI) {
    try {
      console.log("MongoDB bağlantısı başlatılıyor...");
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 5,
      });
      console.log("MongoDB bağlandı");
    } catch (error) {
      console.log("MongoDB bağlantı hatası:", error.message);
      console.log(
        "Uyarı: Sunucu dinleniyor; DB olmadan bazı istekler hata verebilir."
      );
    }
  } else {
    console.warn(
      "[mongo] MONGO_URI tanımlı değil — yerel sunucu DB olmadan başlıyor."
    );
  }

  try {
    await initRedis();
  } catch (e) {
    console.error("[redis] initRedis:", e?.message || e);
  }

  try {
    await initRabbitMq();
  } catch (e) {
    console.error("[rabbitmq] initRabbitMq:", e?.message || e);
  }

  app.listen(PORT, () => {
    console.log(`Server ${PORT} portunda çalışıyor`);
    console.log("Su ekleme: POST /api/water-intake veya /api/water-intake/add");
  });
}

startServer();
