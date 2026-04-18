const { getRedisClient, isRedisReady } = require("../config/redis");

const PREFIX = "diyettakvim:";

const TTL = {
  DAILY_SECONDS: 60,
  SLOTS_SECONDS: 60,
  CLIENTS_SECONDS: 120,
  MONTHLY_SECONDS: 300,
};

function cacheKeyDaily(dietitianId, dateStr) {
  return `${PREFIX}daily:${String(dietitianId)}:${String(dateStr)}`;
}

function cacheKeyMonthly(dietitianId, year, month) {
  return `${PREFIX}monthly:${String(dietitianId)}:${String(year)}:${String(month)}`;
}

function cacheKeySlots(dietitianId, dateStr) {
  return `${PREFIX}slots:${String(dietitianId)}:${String(dateStr)}`;
}

function cacheKeyClients(dietitianId) {
  return `${PREFIX}clients:${String(dietitianId)}`;
}

function cloneJsonSafe(value) {
  return JSON.parse(JSON.stringify(value));
}

async function getCache(key) {
  const redis = getRedisClient();
  if (!redis || !isRedisReady()) {
    return null;
  }
  try {
    const raw = await redis.get(key);
    if (raw == null) {
      console.log(`[redis] miss: ${key}`);
      return null;
    }
    console.log(`[redis] hit: ${key}`);
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[redis] get hata (${key}):`, err?.message || err);
    return null;
  }
}

async function setCache(key, value, ttlSeconds) {
  const redis = getRedisClient();
  if (!redis || !isRedisReady()) {
    return false;
  }
  try {
    const payload = JSON.stringify(cloneJsonSafe(value));
    if (ttlSeconds > 0) {
      await redis.set(key, payload, { EX: ttlSeconds });
    } else {
      await redis.set(key, payload);
    }
    return true;
  } catch (err) {
    console.error(`[redis] set hata (${key}):`, err?.message || err);
    return false;
  }
}

async function deleteCache(key) {
  const redis = getRedisClient();
  if (!redis || !isRedisReady()) {
    return 0;
  }
  try {
    const n = await redis.del(key);
    if (n > 0) {
      console.log(`[redis] invalidated: key=${key}`);
    }
    return n;
  } catch (err) {
    console.error(`[redis] del hata (${key}):`, err?.message || err);
    return 0;
  }
}

async function deleteByPattern(pattern) {
  const redis = getRedisClient();
  if (!redis || !isRedisReady()) {
    return 0;
  }
  let removed = 0;
  try {
    for await (const key of redis.scanIterator({
      MATCH: pattern,
      COUNT: 128,
    })) {
      const n = await redis.del(key);
      removed += n;
    }
    if (removed > 0) {
      console.log(`[redis] invalidated: pattern=${pattern} count=${removed}`);
    }
    return removed;
  } catch (err) {
    console.error(`[redis] scan/del hata (${pattern}):`, err?.message || err);
    return removed;
  }
}

module.exports = {
  PREFIX,
  TTL,
  cacheKeyDaily,
  cacheKeyMonthly,
  cacheKeySlots,
  cacheKeyClients,
  getCache,
  setCache,
  deleteCache,
  deleteByPattern,
};
