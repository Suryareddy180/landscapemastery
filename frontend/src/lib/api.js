// Minimal fetch wrapper so we avoid extra deps.
const BASE = process.env.REACT_APP_BACKEND_URL;

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
