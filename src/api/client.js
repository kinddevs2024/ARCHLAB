import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.dispatchEvent(new Event("auth:logout"));
    }
    return Promise.reject(error);
  },
);

export const apiMessage = (error, fallback = "Xatolik yuz berdi") =>
  error.response?.data?.message ||
  (error.code === "ERR_NETWORK" ? "Server bilan aloqa yo'q" : fallback);
