const express = require("express");
const serverless = require("serverless-http");
const { loadEnv } = require("./config/loadEnv");
const { ensureMongoConnected } = require("./config/mongo");
const {
  getBackendUploadsDir,
  ensureUploadsDirExists,
} = require("./utils/uploadsDir");

let serverlessHandler = null;

function requestPath(req) {
  const raw = req.path || req.url || "/";
  const p = String(raw).split("?")[0];
  return p || "/";
}

function registerPublicRoutes(app) {
  app.use((req, res, next) => {
    const p = requestPath(req);
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
}

function getAllowedOrigins() {
  const env = process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "";
  return String(env)
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

function needsDatabase(req) {
  if (req.method === "OPTIONS") return false;

  const p = requestPath(req);
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

function mountApplication(app) {
  if (app.__diyetTakvimMounted) {
    return app;
  }
  app.__diyetTakvimMounted = true;

  loadEnv();

  const cors = require("cors");
  const cookieParser = require("cookie-parser");
  const openapiDocument = require("./docs/openapi.json");
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

  const uploadsDir = getBackendUploadsDir();
  ensureUploadsDirExists(uploadsDir);

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
  app.use("/uploads", express.static(uploadsDir));

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
    const swaggerUi = require("swagger-ui-express");
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

  app.use((err, _req, res, next) => {
    if (res.headersSent) {
      return next(err);
    }
    const status =
      err.status || (err.message === "CORS engellendi" ? 403 : 500);
    res.status(status).json({
      message: err.message || "Sunucu hatası",
    });
  });

  return app;
}

function createApplication() {
  const app = express();
  registerPublicRoutes(app);
  mountApplication(app);
  return app;
}

function getServerlessHandler() {
  if (!serverlessHandler) {
    serverlessHandler = serverless(createApplication());
  }
  return serverlessHandler;
}

module.exports = {
  createApplication,
  getServerlessHandler,
  mountApplication,
  registerPublicRoutes,
  ensureMongoConnected,
  get uploadsDir() {
    return getBackendUploadsDir();
  },
};
