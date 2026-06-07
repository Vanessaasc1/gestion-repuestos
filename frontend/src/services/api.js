const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export function getSession() {
  const raw = localStorage.getItem("repuestos_session");
  return raw ? JSON.parse(raw) : null;
}

export function setSession(session) {
  localStorage.setItem("repuestos_session", JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem("repuestos_session");
}

export async function api(path, options = {}) {
  const session = getSession();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
      ...options.headers
    }
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "No se pudo completar la operacion");
  }

  return data;
}
