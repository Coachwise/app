export const config = {
  env: import.meta.env.VITE_ENV || "development",
  apiURL: import.meta.env.VITE_API_URL || "http://localhost:8080",
};