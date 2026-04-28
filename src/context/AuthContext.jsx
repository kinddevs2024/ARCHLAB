/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, apiMessage } from "../api/client";

const AuthContext = createContext(null);

const roleRank = {
  Owner: 4,
  Admin: 3,
  Manager: 2,
  User: 1,
};

const readStoredUser = () => {
  try {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  } catch {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    return null;
  }
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    const syncLogout = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener("auth:logout", syncLogout);
    return () => window.removeEventListener("auth:logout", syncLogout);
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get("/api/auth/me")
      .then(({ data }) => {
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const persistSession = useCallback((data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  }, []);

  const login = useCallback(async (payload) => {
    try {
      const { data } = await api.post("/api/auth/login", payload);
      persistSession(data);
      return { ok: true };
    } catch (error) {
      return { ok: false, message: apiMessage(error, "Kirishda xatolik") };
    }
  }, [persistSession]);

  const register = useCallback(async (payload) => {
    try {
      const { data } = await api.post("/api/auth/register", payload);
      persistSession(data);
      return { ok: true };
    } catch (error) {
      return { ok: false, message: apiMessage(error, "Ro'yxatdan o'tishda xatolik") };
    }
  }, [persistSession]);

  const logout = useCallback(async () => {
    try {
      if (token) await api.post("/api/auth/logout");
    } catch {
      // Session cleanup still happens locally.
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }, [token]);

  const updateUser = useCallback((nextUser) => {
    localStorage.setItem("user", JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const hasRole = useCallback(
    (minRole) => (roleRank[user?.status] || 0) >= (roleRank[minRole] || 0),
    [user?.status]
  );

  const value = useMemo(
    () => ({ token, user, loading, login, register, logout, hasRole, updateUser }),
    [token, user, loading, login, register, logout, hasRole, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
