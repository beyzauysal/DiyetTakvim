import apiClient from "./apiClient";

export const getDietitianAppointments = async () => {
  const response = await apiClient.get("/api/appointments/dietitian-appointments");
  return response.data;
};

export const getMyAppointments = async () => {
  const response = await apiClient.get("/api/appointments/my-appointments");
  return response.data;
};

export const getAvailableSlots = async (date) => {
  const response = await apiClient.get(
    `/api/appointments/available-slots?date=${encodeURIComponent(date)}`
  );
  return response.data;
};

export const getMonthlySummary = async (year, month) => {
  const response = await apiClient.get(
    `/api/appointments/monthly-summary?year=${year}&month=${month}`
  );
  return response.data;
};

export const createAppointment = async (payload) => {
  const response = await apiClient.post("/api/appointments", payload);
  return response.data;
};

export const updateAppointment = async (id, payload) => {
  const response = await apiClient.patch(`/api/appointments/update/${id}`, payload);
  return response.data;
};

export const cancelAppointment = async (id) => {
  const response = await apiClient.patch(`/api/appointments/cancel/${id}`);
  return response.data;
};
