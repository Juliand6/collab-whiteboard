import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

export function createApi(token) {
  const api = axios.create({
    baseURL: API_BASE,
  });

  api.interceptors.request.use((config) => {
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  return api;
}
