function requestPath(req) {
  const raw = req.url || req.path || "/";
  const p = String(raw).split("?")[0];
  return p || "/";
}

function sendJson(res, status, body) {
  if (typeof res.status === "function" && typeof res.json === "function") {
    return res.status(status).json(body);
  }
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function sendNoContent(res) {
  if (typeof res.status === "function") {
    return res.status(204).end();
  }
  res.statusCode = 204;
  res.end();
}

let cachedApp = null;

function getExpressApp() {
  if (!cachedApp) {
    const { createApplication } = require("./createApp");
    cachedApp = createApplication();
  }
  return cachedApp;
}

function dispatchExpress(app, req, res) {
  return new Promise((resolve, reject) => {
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    res.on("finish", finish);
    res.on("close", finish);

    try {
      app(req, res, (err) => {
        if (err && !settled) {
          settled = true;
          reject(err);
        }
      });
    } catch (err) {
      if (!settled) {
        settled = true;
        reject(err);
      }
    }
  });
}

module.exports = async function handler(req, res) {
  const path = requestPath(req);
  console.log("INDEX_HANDLER_HIT", req.method, path);

  try {
    if (path === "/") {
      return sendJson(res, 200, {
        ok: true,
        service: "DiyetTakvim API",
      });
    }

    if (
      path === "/favicon.ico" ||
      /\/favicon\.(ico|png)$/i.test(path) ||
      path.endsWith(".ico")
    ) {
      return sendNoContent(res);
    }

    const app = getExpressApp();
    await dispatchExpress(app, req, res);
  } catch (error) {
    console.error("INDEX_HANDLER_ERROR", error?.message || error);
    if (!res.headersSent && !res.writableEnded) {
      return sendJson(res, 500, {
        message: "Sunucu hatası",
        error: error?.message || String(error),
      });
    }
  }
};
