import apiClient from "./apiClient";

/** Diyetisyen: tüm randevular */
export const getDietitianAppointments = async () => {
  const response = await apiClient.get("/api/appointments/dietitian-appointments");
  return response.data;
};

/** Danışan: kendi randevuları */
export const getMyAppointments = async () => {
  const response = await apiClient.get("/api/appointments/my-appointments");
  return response.data;
};

/** Danışan: bağlı diyetisyen için belirli günün boş slotları (date: YYYY-MM-DD) */
export const getAvailableSlots = async (date) => {
  const response = await apiClient.get(
    `/api/appointments/available-slots?date=${encodeURIComponent(date)}`
  );
  return response.data;
};

/** Diyetisyen: aylık günlük randevu sayıları */
export const getMonthlySummary = async (year, month) => {
  const response = await apiClient.get(
    `/api/appointments/monthly-summary?year=${year}&month=${month}`
  );
  return response.data;
};

/**
 * Danışan: randevu oluştur
 * body: { dietitianId, appointmentDate: Date ISO veya Date, note? }
 */
export const createAppointment = async (payload) => {
  const response = await apiClient.post("/api/appointments", payload);
  return response.data;
};

/**
 * Randevu güncelle (tarih/saat veya not)
 * body: { appointmentDate?, note? }
 */
export const updateAppointment = async (id, payload) => {
  const response = await apiClient.patch(`/api/appointments/update/${id}`, payload);
  return response.data;
};

/** Randevu iptal (durum: cancelled) */
export const cancelAppointment = async (id) => {
  const response = await apiClient.patch(`/api/appointments/cancel/${id}`);
  return response.data;
};
