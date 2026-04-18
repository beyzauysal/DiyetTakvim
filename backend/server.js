const mongoose = require("mongoose");
const { app } = require("./app");
const { initRedis } = require("./config/redis");

const PORT = process.env.PORT || 5050;

async function startServer() {
  try {
    console.log("MongoDB bağlantısı başlatılıyor...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB bağlandı");
  } catch (error) {
    console.log("MongoDB bağlantı hatası:", error.message);
    console.log(
      "Uyarı: Sunucu yine de dinleniyor; veritabanı olmadan kayıt istekleri hata verebilir."
    );
  }

  try {
    await initRedis();
  } catch (e) {
    console.error("[redis] initRedis beklenmeyen hata:", e?.message || e);
  }

  app.listen(PORT, () => {
    console.log(`Server ${PORT} portunda çalışıyor`);
    console.log("Su ekleme: POST /api/water-intake veya /api/water-intake/add");
    const gh = process.env.SMTP_HOST?.trim().toLowerCase() || "";
    const gmailSvc =
      process.env.SMTP_SERVICE?.trim().toLowerCase() === "gmail" ||
      gh === "smtp.gmail.com";
    if (gmailSvc && process.env.SMTP_USER) {
      console.log("E-posta: Gmail (nodemailer service + uygulama şifresi)");
    } else if (process.env.SMTP_HOST) {
      console.log("E-posta: SMTP", process.env.SMTP_HOST);
    } else {
      console.log("E-posta: SMTP yok — kodlar [mail:dev] ile konsolda");
    }
  });
}

startServer();