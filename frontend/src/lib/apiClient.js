import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://autocare-backend-fsfy.onrender.com";
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API, withCredentials: true });

// Attach dealer JWT if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("dealer_token");
  if (token && config.headers?._dealer) {
    config.headers.Authorization = `Bearer ${token}`;
    delete config.headers._dealer;
  }
  return config;
});

export const dealerCfg = () => ({ headers: { _dealer: true } });
