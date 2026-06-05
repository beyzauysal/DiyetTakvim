const { createClient } = require("redis");

const CONNECT_TIMEOUT_MS = 5000;

let client = null;
let connectPromise = null;
let explicitlyDisabled = false;

function getRedisUrl() {
  const u = process.env.REDIS_URL;
  return typeof u === "string" ? u.trim() : "";
}

function getRedisClient() {
  return client;
}

function isRedisReady() {
  return Boolean(client && client.isReady);
}

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error(`${label} zaman aşımı (${ms}ms)`)),
        ms
      );
    }),
  ]);
}

async function initRedis() {
  const url = getRedisUrl();
  if (!url) {
    explicitlyDisabled = true;
    console.warn("[redis] REDIS_URL tanımlı değil — önbellek devre dışı.");
    return;
  }

  if (client?.isOpen) {
    return;
  }

  if (connectPromise) {
    return connectPromise;
  }

  connectPromise = (async () => {
    try {
      const next = createClient({
        url,
        socket: {
          connectTimeout: CONNECT_TIMEOUT_MS,
          reconnectStrategy(retries) {
            if (retries > 3) return false;
            return Math.min(retries * 200, 2000);
          },
        },
      });

      next.on("error", (err) => {
        console.error("[redis] client error:", err?.message || err);
      });

      await withTimeout(next.connect(), CONNECT_TIMEOUT_MS, "Redis bağlantısı");
      client = next;
      console.log("[redis] bağlantı hazır.");
    } catch (err) {
      console.error("[redis] bağlantı başarısız:", err?.message || err);
      if (client) {
        try {
          await client.quit();
        } catch (_) {}
      }
      client = null;
    } finally {
      connectPromise = null;
    }
  })();

  return connectPromise;
}

module.exports = {
  initRedis,
  getRedisClient,
  isRedisReady,
  getRedisUrl,
  isRedisExplicitlyDisabled: () => explicitlyDisabled,
};
