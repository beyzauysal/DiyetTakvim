import { createContext, useContext, useEffect, useState } from "react";
import apiClient from "../api/apiClient";
import { deleteMyAccount } from "../api/authApi";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    const tokenAtRequestStart = token;

    try {
      const response = await apiClient.get("/api/auth/me");
      if (localStorage.getItem("token") !== tokenAtRequestStart) {
        return;
      }
      setUser(response.data.user);
    } catch (error) {
      console.error("Kullanıcı bilgisi alınamadı:", error);
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        if (localStorage.getItem("token") === tokenAtRequestStart) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const login = (token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const deleteAccount = async (password) => {
    await deleteMyAccount(password);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    try {
      await apiClient.post("/api/auth/logout");
    } catch {
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, fetchMe, deleteAccount }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}