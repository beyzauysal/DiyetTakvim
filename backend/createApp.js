const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const swaggerUi = require("swagger-ui-express");
const openapiDocument = require("./docs/openapi.json");
const { loadEnv } = require("./config/loadEnv");
const { ensureMongoConnected } = require("./config/mongo");
const { getBackendUploadsDir, ensureUploadsDirExists } = require("./utils/uploadsDir");
const authMiddleware = require("./middleware/authMiddleware");
const roleMiddleware = require("./middleware/roleMiddleware");
const authRoutes = require("./routes/authRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const calorieRecordRoutes = require("./routes/calorieRecordRoutes");
const dietitianRoutes = require("./routes/dietitianRoutes");
const inviteCodeRoutes = require("./routes/inviteCodeRoutes");
const connectionsRoutes = require("./routes/connectionsRoutes");
const waterIntakeRoutes = require("./routes/waterIntakeRoutes");
const testimonialRoutes = require("./routes/testimonialRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

loadEnv();

const app = express();
const uploadsDir = getBackendUploadsDir();
ensureUploadsDirExists(uploadsDir);

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

    if (process.env.NODE_ENV !== "production") {
      console.log("CORS kontrol:", {
        origin,
        normalizedOrigin,
        allowedOrigins,
      });
    }

    if (!normalizedOrigin) return cb(null, true);
    if (allowedOrigins.length === 0) return cb(null, true);
    if (allowedOrigins.includes(normalizedOrigin)) return cb(null, true);

    console.error("CORS engellendi:", { origin: normalizedOrigin, allowedOrigins });
    return cb(new Error("CORS engellendi"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use((req, res, next) => {
  const p = req.path || "";
  if (/favicon\.(ico|png)$/i.test(p) || p.endsWith(".ico")) {
    return res.status(204).end();
  }
  next();
});

app.get("/", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "DiyetTakvim API",
  });
});

app.get("/api/water-intake/health", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "DiyetTakvim API",
    mongoConfigured: Boolean(process.env.MONGO_URI),
  });
});

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json({ limit: "6mb" }));
app.use(cookieParser());
app.use("/uploads", express.static(uploadsDir));

function needsDatabase(req) {
  if (req.method === "OPTIONS") return false;

  const p = req.path || "";
  if (p === "/" || p === "/api/water-intake/health" || p === "/openapi.json") {
    return false;
  }
  if (/favicon\.(ico|png)$/i.test(p) || p.endsWith(".ico")) {
    return false;
  }
  if (p.startsWith("/uploads") || p.startsWith("/api-docs")) {
    return false;
  }

  return true;
}

app.use(async (req, res, next) => {
  if (!needsDatabase(req)) {
    return next();
  }

  try {
    await ensureMongoConnected();
    next();
  } catch (error) {
    res.status(500).json({
      message: "Veritabanı bağlantı hatası",
      error: error.message,
    });
  }
});

app.get("/openapi.json", (_req, res) => {
  res.json(openapiDocument);
});

if (!process.env.VERCEL && !process.env.VERCEL_ENV) {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(openapiDocument, {
      customSiteTitle: "DiyetTakvim API",
      customCss: ".swagger-ui .topbar { display: none }",
    })
  );
}

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

app.use((_req, res) => {
  res.status(404).json({ message: "Endpoint bulunamadı." });
});

module.exports = {
  app,
  ensureMongoConnected,
  uploadsDir,
};
