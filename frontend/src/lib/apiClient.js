import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://autocare-backend-fsfy.onrender.com";
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API, withCredentials: true });

// Attach dealer JWT if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("dealer_token");
  const isDealerRequest = Boolean(
    config.headers?._dealer ||
    (config.url && (config.url.includes("/dealer/") || config.url === "/dealer" || config.url.includes("/dealer/")))
  );
  if (token && isDealerRequest) {
    if (!config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  if (config.headers && "_dealer" in config.headers) {
    delete config.headers._dealer;
    if (typeof config.headers.delete === "function") {
      config.headers.delete("_dealer");
    }
  }
  return config;
});

export const dealerCfg = () => ({ headers: { _dealer: true } });
