import axios from "axios";

const BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "/api";

export const api = axios.create({
  baseURL: BASE,
  timeout: 30_000,
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const msg = err.response?.data?.detail ?? err.message ?? "Unknown error";
    return Promise.reject(new Error(msg));
  }
);
