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

let cachedHandler = null;

async function getHandler() {
  if (!cachedHandler) {
    const { getServerlessHandler } = require("./createApp");
    cachedHandler = getServerlessHandler();
  }
  return cachedHandler;
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

    const expressHandler = await getHandler();
    return await expressHandler(req, res);
  } catch (error) {
    console.error("INDEX_HANDLER_ERROR", error?.message || error);
    return sendJson(res, 500, {
      message: "Sunucu hatası",
      error: error?.message || String(error),
    });
  }
};
