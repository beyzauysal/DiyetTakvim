import apiClient from "./apiClient";

export const registerUser = async (userData) => {
  const response = await apiClient.post("/api/auth/register", userData);
  return response.data;
};

export const verifyEmail = async ({ email, code }) => {
  const response = await apiClient.post("/api/auth/verify-email", {
    email,
    code,
  });
  return response.data;
};

export const resendVerification = async (email) => {
  const response = await apiClient.post("/api/auth/resend-verification", {
    email,
  });
  return response.data;
};

export const requestPasswordReset = async (email) => {
  const response = await apiClient.post("/api/auth/forgot-password", { email });
  return response.data;
};

export const resendPasswordReset = async (email) => {
  const response = await apiClient.post("/api/auth/resend-password-reset", {
    email,
  });
  return response.data;
};

export const resetPassword = async ({ email, code, newPassword }) => {
  const response = await apiClient.post("/api/auth/reset-password", {
    email,
    code,
    newPassword,
  });
  return response.data;
};

export const loginUser = async (userData) => {
  const response = await apiClient.post("/api/auth/login", userData);
  return response.data;
};

export const getMe = async () => {
  const response = await apiClient.get("/api/auth/me");
  return response.data;
};

export const deleteMyAccount = async (password) => {
  const response = await apiClient.post("/api/auth/me/delete", { password });
  return response.data;
};