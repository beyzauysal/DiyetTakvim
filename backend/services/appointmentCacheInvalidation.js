const {
  cacheKeyDaily,
  cacheKeyMonthly,
  cacheKeySlots,
  cacheKeyClients,
  deleteCache,
  deleteByPattern,
  PREFIX,
} = require("./cacheService");

/**
 * Randevu tarihinin yerel takvim günü (GET /appointments/daily?date=YYYY-MM-DD ile uyumlu).
 */
function localCalendarDateKey(dateLike) {
  if (typeof dateLike === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateLike.trim())) {
    return dateLike.trim();
  }
  const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function yearMonthFromDateLike(dateLike) {
  const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

/**
 * Tek bir gün için slots + daily + ilgili ayın monthly özetini siler.
 */
async function invalidateAppointmentCachesForDietitianOnDate(dietitianId, appointmentDateLike) {
  const id = String(dietitianId);
  const dateKey = localCalendarDateKey(appointmentDateLike);
  if (!dateKey) {
    return;
  }
  const ym = yearMonthFromDateLike(appointmentDateLike);
  const keys = [
    cacheKeySlots(id, dateKey),
    cacheKeyDaily(id, dateKey),
    ym ? cacheKeyMonthly(id, ym.year, ym.month) : null,
  ].filter(Boolean);
  for (const k of keys) {
    await deleteCache(k);
  }
}

/**
 * Randevu tarihi değiştiyse hem eski hem yeni gün/ay kümeleri temizlenir.
 */
async function invalidateAppointmentCachesForDietitianOnDateMove(
  dietitianId,
  previousAppointmentDateLike,
  nextAppointmentDateLike
) {
  if (previousAppointmentDateLike != null) {
    await invalidateAppointmentCachesForDietitianOnDate(
      dietitianId,
      previousAppointmentDateLike
    );
  }
  if (nextAppointmentDateLike != null) {
    await invalidateAppointmentCachesForDietitianOnDate(
      dietitianId,
      nextAppointmentDateLike
    );
  }
}

/**
 * Çalışma saatleri değişince tüm günler için slot/daily/monthly önbelleği geçersiz sayılır.
 */
async function invalidateAllAppointmentCachesForDietitian(dietitianId) {
  const id = String(dietitianId);
  await deleteByPattern(`${PREFIX}slots:${id}:*`);
  await deleteByPattern(`${PREFIX}daily:${id}:*`);
  await deleteByPattern(`${PREFIX}monthly:${id}:*`);
}

async function invalidateClientsCacheForDietitian(dietitianId) {
  await deleteCache(cacheKeyClients(String(dietitianId)));
}

module.exports = {
  localCalendarDateKey,
  invalidateAppointmentCachesForDietitianOnDate,
  invalidateAppointmentCachesForDietitianOnDateMove,
  invalidateAllAppointmentCachesForDietitian,
  invalidateClientsCacheForDietitian,
};
