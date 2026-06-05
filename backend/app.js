/**
 * Vercel entrypoint — yalnızca Express uygulamasını export eder.
 * createApp burada import EDİLMEZ (cold start kilidi önlenir).
 * app.listen() YOK. Yerel/Docker için server.js kullanın.
 */
const express = require("express");
const app = express();

function requestPath(req) {
  const raw = req.path || req.url || "/";
  const p = String(raw).split("?")[0];
  return p || "/";
}

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

let mounted = false;

app.use((req, res, next) => {
  if (mounted) {
    return next();
  }

  mounted = true;
  const { mountApplication } = require("./createApp");
  mountApplication(app);
  return app.handle(req, res, next);
});

module.exports = app;
