const notificationRoutes = require("./routes/notificationRoutes");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const path = require("path");
const { getBackendUploadsDir, ensureUploadsDirExists } = require("./utils/uploadsDir");

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
const swaggerUi = require("swagger-ui-express");
const openapiDocument = require("./docs/openapi.json");

const app = express();

function getAllowedOrigins() {
  const env = process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "";
  return String(env)
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

const corsOptions = {
  origin: (origin, cb) => {
    const allowedOrigins = getAllowedOrigins();
    const normalizedOrigin = origin ? origin.trim().replace(/\/$/, "") : "";

    console.log("CORS kontrol:", {
      origin,
      normalizedOrigin,
      envOrigins: process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "",
      allowedOrigins,
    });

    if (!normalizedOrigin) return cb(null, true);
    if (allowedOrigins.length === 0) return cb(null, true);
    if (allowedOrigins.includes(normalizedOrigin)) return cb(null, true);

    console.error("CORS engellendi:", {
      origin: normalizedOrigin,
      allowedOrigins,
    });

    return cb(new Error("CORS engellendi"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(express.json({ limit: "6mb" }));
app.use(cookieParser());

const uploadsDir = getBackendUploadsDir();
ensureUploadsDirExists(uploadsDir);

app.use("/uploads", express.static(uploadsDir));

let mongoPromise = null;

async function ensureMongoConnected() {
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    return;
  }

  if (mongoPromise) {
    return mongoPromise;
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI tanımlı değil");
  }

  mongoPromise = mongoose
    .connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4,
      maxPoolSize: 5,
    })
    .finally(() => {
      mongoPromise = null;
    });

  return mongoPromise;
}

app.use(async (req, res, next) => {
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  try {
    await ensureMongoConnected();
    next();
  } catch (error) {
    console.error("MongoDB bağlantı hatası:", error);
    res.status(500).json({
      message: "Veritabanı bağlantı hatası",
      error: error.message,
    });
  }
});

app.get("/api/water-intake/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "diyettakvim-api" });
});

app.get("/openapi.json", (_req, res) => {
  res.json(openapiDocument);
});

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(openapiDocument, {
    customSiteTitle: "DiyetTakvim API",
    customCss: ".swagger-ui .topbar { display: none }",
  })
);

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

app.get("/", (_req, res) => {
  res.status(200).send("API çalışıyor");
});

module.exports = app;