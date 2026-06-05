let expressHandler = null;

function requestPath(url) {
  return (url || "").split("?")[0];
}

function getExpressHandler() {
  if (!expressHandler) {
    const serverless = require("serverless-http");
    const { app } = require("../createApp");
    expressHandler = serverless(app, {
      binary: ["image/*", "application/octet-stream"],
    });
  }
  return expressHandler;
}

module.exports = async (req, res) => {
  const path = requestPath(req.url);

  if (path === "/api/water-intake/health") {
    return res.status(200).json({
      ok: true,
      service: "diyettakvim-api",
      mongoConfigured: Boolean(process.env.MONGO_URI),
    });
  }

  if (path === "/") {
    return res.status(200).send("API çalışıyor");
  }

  if (/favicon\.(ico|png)$/i.test(path) || path.endsWith(".ico")) {
    return res.status(204).end();
  }

  return getExpressHandler()(req, res);
};
