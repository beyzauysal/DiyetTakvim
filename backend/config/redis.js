const { createClient } = require("redis");

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

async function initRedis() {
  const url = getRedisUrl();
  if (!url) {
    explicitlyDisabled = true;
    console.log("[redis] REDIS_URL tanımlı değil — önbellek devre dışı (sadece veritabanı).");
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
          reconnectStrategy(retries) {
            const delay = Math.min(retries * 150, 5_000);
            if (retries > 0 && retries % 10 === 0) {
              console.warn(
                `[redis] yeniden bağlanılıyor (deneme ${retries}), ${delay}ms sonra...`
              );
            }
            return delay;
          },
          connectTimeout: 10_000,
        },
      });

      next.on("error", (err) => {
        console.error("[redis] client error:", err?.message || err);
      });

      next.on("reconnecting", () => {
        console.warn("[redis] bağlantı koptu, yeniden bağlanılıyor...");
      });

      next.on("ready", () => {
        console.log("[redis] bağlantı hazır (ready).");
      });

      await next.connect();
      client = next;
      try {
        const u = new URL(url);
        console.log(
          `[redis] sunucuya bağlanıldı: redis://${u.hostname}:${u.port || "6379"}`
        );
      } catch {
        console.log("[redis] sunucuya bağlanıldı.");
      }
    } catch (err) {
      console.error("[redis] ilk bağlantı başarısız:", err?.message || err);
      console.error("[redis] API çalışmaya devam edecek; önbellek kullanılmayacak.");
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
