/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, apiMessage } from "../api/client";
const AuthContext = createContext(null);
const roleRank = { Owner: 4, Admin: 3, Manager: 2, User: 1 };
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    const syncLogout = () => setUser(null);
    window.addEventListener("auth:logout", syncLogout);
    api
      .get("/api/auth/me")
      .then(({ data }) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
    return () => window.removeEventListener("auth:logout", syncLogout);
  }, []);
  const login = useCallback(async (payload) => {
    try {
      const { data } = await api.post("/api/auth/login", payload);
      setUser(data.user);
      return { ok: true };
    } catch (error) {
      return { ok: false, message: apiMessage(error, "Kirishda xatolik") };
    }
  }, []);
  const logout = useCallback(async () => {
    try {
      await api.post("/api/auth/logout");
    } finally {
      setUser(null);
    }
  }, []);
  const hasRole = useCallback(
    (minRole) => (roleRank[user?.status] || 0) >= (roleRank[minRole] || 0),
    [user?.status],
  );
  const value = useMemo(
    () => ({ user, loading, login, logout, hasRole, updateUser: setUser }),
    [user, loading, login, logout, hasRole],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
