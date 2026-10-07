// Centralized API base URL — set VITE_API_BASE_URL in your production env.
// In development, Vite's proxy (vite.config.js) routes /api and /media to localhost:8000.
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const BASE = BASE_URL;

async function request(method, path, body) {
  const headers = {};
  const isFormData = body instanceof FormData;
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const token = localStorage.getItem("admin_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });
  
  if (res.status === 204) return null; // No content for DELETE
  
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem("admin_token");
      if (window.location.pathname.startsWith("/admin")) {
        window.location.href = "/admin/login";
      }
    }
    const err = new Error(data.detail || data.message || "Request failed");
    err.data = data;
    throw err;
  }
  return data;
}

const api = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  put: (path, body) => request("PUT", path, body),
  patch: (path, body) => request("PATCH", path, body),
  delete: (path) => request("DELETE", path),
};

export default api;
