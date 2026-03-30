const notificationRoutes = require("./routes/notificationRoutes");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const path = require("path");
const fs = require("fs");

// Vercel'de env değişkenleri panelden gelir; local'de .env okumak faydalı.
try {
  require("dotenv").config({ path: path.join(__dirname, ".env") });
} catch (_) {}

const authRoutes = require("./routes/authRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const calorieRecordRoutes = require("./routes/calorieRecordRoutes");
const dietitianRoutes = require("./routes/dietitianRoutes");
const inviteCodeRoutes = require("./routes/inviteCodeRoutes");
const connectionsRoutes = require("./routes/connectionsRoutes");
const waterIntakeRoutes = require("./routes/waterIntakeRoutes");
const testimonialRoutes = require("./routes/testimonialRoutes");
const authMiddleware = require("./middleware/authMiddleware");
const roleMiddleware = require("./middleware/roleMiddleware");

const app = express();

function getAllowedOrigins() {
  const env = process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "";
  const parts = String(env)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length ? parts : null;
}

const corsOptions =
  process.env.NODE_ENV === "production"
    ? {
        origin: (origin, cb) => {
          const allow = getAllowedOrigins();
          if (!allow) return cb(null, true);
          if (!origin) return cb(null, true);
          return cb(null, allow.includes(origin));
        },
        credentials: true,
      }
    : {
        origin: true,
        credentials: true,
      };

app.use(cors(corsOptions));
app.use(express.json({ limit: "6mb" }));
app.use(cookieParser());

// Vercel'de disk kalıcı değil; /tmp yazılabilir. Local'de backend/uploads kullan.
const uploadsDir = process.env.VERCEL
  ? path.join("/tmp", "uploads")
  : path.join(__dirname, "uploads");
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (_) {}

// Local geliştirmede upload URL'leri işe yarar; Vercel'de kalıcılık yok (S3/Blob önerilir).
app.use("/uploads", express.static(uploadsDir));

app.get("/api/water-intake/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "diyettakvim-api" });
});

/* Su ekleme: üst seviye kayıt — bazı ortamlarda yalnızca router mount 404 verebiliyor */
if (typeof waterIntakeRoutes.handleAddWater === "function") {
  app.post(
    "/api/water-intake/add",
    authMiddleware,
    roleMiddleware("client"),
    waterIntakeRoutes.handleAddWater
  );
  app.post(
    "/api/water-intake",
    authMiddleware,
    roleMiddleware("client"),
    waterIntakeRoutes.handleAddWater
  );
}

app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);

app.use("/api/appointments", appointmentRoutes);
app.use("/appointments", appointmentRoutes);

app.use("/api/calorie-records", calorieRecordRoutes);
app.use("/calorie-records", calorieRecordRoutes);

app.use("/api/notifications", notificationRoutes);
app.use("/notifications", notificationRoutes);

app.use("/api/dietitians", dietitianRoutes);
app.use("/dietitians", dietitianRoutes);

app.use("/api/invite-code", inviteCodeRoutes);
app.use("/invite-code", inviteCodeRoutes);

app.use("/api/connections", connectionsRoutes);
app.use("/connections", connectionsRoutes);

app.use("/api/water-intake", waterIntakeRoutes);
app.use("/water-intake", waterIntakeRoutes);

app.use("/api/testimonials", testimonialRoutes);
app.use("/testimonials", testimonialRoutes);

app.get("/", (req, res) => {
  res.send("API çalışıyor");
});

let mongoPromise = null;
async function ensureMongoConnected() {
  if (mongoose.connection?.readyState === 1) return;
  if (mongoPromise) return mongoPromise;
  mongoPromise = mongoose
    .connect(process.env.MONGO_URI)
    .finally(() => (mongoPromise = null));
  return mongoPromise;
}

module.exports = { app, ensureMongoConnected, uploadsDir };

