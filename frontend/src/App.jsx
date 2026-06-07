import { useEffect, useState } from "react";
import { api, clearSession, getSession, setSession } from "./services/api";

const statuses = ["pendiente", "aprobada", "rechazada", "en_proveedor", "entregada", "cerrada"];
const roleLabels = { admin: "Administrador", almacen: "Almacen", tecnico: "Tecnico" };

export default function App() {
  const [session, saveSession] = useState(getSession());
  const [view, setView] = useState("dashboard");

  function onLogin(nextSession) {
    setSession(nextSession);
    saveSession(nextSession);
  }

  function logout() {
    clearSession();
    saveSession(null);
  }

  if (!session) {
    return <AuthScreen onLogin={onLogin} />;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">Sistema</p>
          <h1>Repuestos</h1>
          <span className="role-pill">{roleLabels[session.user.role]}</span>
        </div>
        <nav>
          <button className={view === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}>Panel</button>
          <button className={view === "requests" ? "active" : ""} onClick={() => setView("requests")}>Solicitudes</button>
          <button className={view === "inventory" ? "active" : ""} onClick={() => setView("inventory")}>Inventario</button>
          {session.user.role === "admin" && (
            <button className={view === "users" ? "active" : ""} onClick={() => setView("users")}>Usuarios</button>
          )}
        </nav>
        <button className="ghost" onClick={logout}>Salir</button>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Usuario activo</p>
            <h2>{session.user.name}</h2>
          </div>
          <span>{session.user.email}</span>
        </header>

        {view === "dashboard" && <Dashboard />}
        {view === "requests" && <Requests user={session.user} />}
        {view === "inventory" && <Inventory user={session.user} />}
        {view === "users" && session.user.role === "admin" && <Users />}
      </main>
    </div>
  );
}

function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "tecnico" });
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");

    try {
      const path = mode === "login" ? "/auth/login" : "/auth/register";
      const data = await api(path, { method: "POST", body: JSON.stringify(form) });
      onLogin(data);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-panel">
        <p className="eyebrow">Gestion de solicitudes</p>
        <h1>Control de repuestos</h1>
        <form onSubmit={submit}>
          {mode === "register" && (
            <input placeholder="Nombre completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          )}
          <input placeholder="Correo" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input placeholder="Clave" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          {mode === "register" && (
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="tecnico">Tecnico</option>
              <option value="almacen">Almacen</option>
              <option value="admin">Administrador</option>
            </select>
          )}
          {error && <p className="error">{error}</p>}
          <button type="submit">{mode === "login" ? "Iniciar sesion" : "Crear usuario"}</button>
        </form>
        <button className="link-button" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "Crear cuenta" : "Ya tengo cuenta"}
        </button>
      </section>
    </main>
  );
}

function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api("/dashboard").then(setData);
  }, []);

  if (!data) return <p>Cargando panel...</p>;

  return (
    <section className="stack">
      <div className="metrics">
        <Metric title="Solicitudes" value={data.totalRequests} />
        <Metric title="Bajo stock" value={data.lowStock.length} />
        <Metric title="Estados activos" value={data.requestsByStatus.length} />
      </div>
      <div className="grid-two">
        <DataBlock title="Solicitudes por estado" rows={data.requestsByStatus.map((x) => [`${x.status}`, x.total])} />
        <DataBlock title="Repuestos bajo stock" rows={data.lowStock.map((x) => [`${x.code} - ${x.name}`, `${x.stock}/${x.min_stock}`])} />
      </div>
      <DataBlock title="Ultimas solicitudes" rows={data.recentRequests.map((x) => [`#${x.id} ${x.part_name}`, `${x.status} - ${x.user_name}`])} />
    </section>
  );
}

function Metric({ title, value }) {
  return (
    <article className="metric">
      <span>{title}</span>
      <strong>{value}</strong>
    </article>
  );
}

function DataBlock({ title, rows }) {
  return (
    <section className="panel">
      <h3>{title}</h3>
      <div className="table-list">
        {rows.length === 0 && <p className="muted">Sin datos</p>}
        {rows.map((row, index) => (
          <div className="row" key={`${title}-${index}`}>
            <span>{row[0]}</span>
            <strong>{row[1]}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function Requests({ user }) {
  const [requests, setRequests] = useState([]);
  const [parts, setParts] = useState([]);
  const [filters, setFilters] = useState({ status: "", from: "", to: "" });
  const [form, setForm] = useState({ part_id: "", quantity: 1, justification: "" });
  const [historyByRequest, setHistoryByRequest] = useState({});
  const [openHistoryId, setOpenHistoryId] = useState(null);

  const canUpdate = user.role === "admin" || user.role === "almacen";

  async function load() {
    const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value)).toString();
    const [requestData, partData] = await Promise.all([
      api(`/requests${query ? `?${query}` : ""}`),
      api("/parts")
    ]);
    setRequests(requestData);
    setParts(partData);
  }

  useEffect(() => {
    load();
  }, []);

  async function createRequest(event) {
    event.preventDefault();
    await api("/requests", { method: "POST", body: JSON.stringify(form) });
    setForm({ part_id: "", quantity: 1, justification: "" });
    load();
  }

  async function updateStatus(id, status) {
    await api(`/requests/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
    setHistoryByRequest((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    load();
  }

  async function toggleHistory(id) {
    if (openHistoryId === id) {
      setOpenHistoryId(null);
      return;
    }

    setOpenHistoryId(id);

    if (!historyByRequest[id]) {
      const history = await api(`/requests/${id}/history`);
      setHistoryByRequest((current) => ({ ...current, [id]: history }));
    }
  }

  return (
    <section className="stack">
      {(user.role === "tecnico" || user.role === "admin") && (
        <section className="panel">
          <h3>Nueva solicitud</h3>
          <form className="inline-form" onSubmit={createRequest}>
            <select required value={form.part_id} onChange={(e) => setForm({ ...form, part_id: e.target.value })}>
              <option value="">Seleccione repuesto</option>
              {parts.map((part) => <option key={part.id} value={part.id}>{part.code} - {part.name}</option>)}
            </select>
            <input required min="1" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
            <input required placeholder="Justificacion" value={form.justification} onChange={(e) => setForm({ ...form, justification: e.target.value })} />
            <button>Registrar</button>
          </form>
        </section>
      )}

      <section className="panel">
        <h3>Historial de solicitudes</h3>
        <div className="filters">
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">Todos los estados</option>
            {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
          <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
          <button onClick={load}>Filtrar</button>
        </div>
        <div className="table-list">
          {requests.map((request) => (
            <div className="request-card" key={request.id}>
              <div className="request-row">
                <div>
                  <strong>#{request.id} {request.part_name}</strong>
                  <span>{request.user_name} - Cantidad {request.quantity}</span>
                  <small>{request.justification}</small>
                </div>
                <div className="right-actions">
                  <span className={`status ${request.status}`}>{request.status}</span>
                  {request.provider_name && <small>{request.provider_name}</small>}
                  {canUpdate && (
                    <select value={request.status} onChange={(e) => updateStatus(request.id, e.target.value)}>
                      {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  )}
                  <button className="ghost compact" onClick={() => toggleHistory(request.id)}>
                    {openHistoryId === request.id ? "Ocultar trazabilidad" : "Trazabilidad"}
                  </button>
                </div>
              </div>
              {openHistoryId === request.id && (
                <HistoryPanel rows={historyByRequest[request.id] || []} />
              )}
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}

function HistoryPanel({ rows }) {
  return (
    <div className="history-panel">
      {rows.length === 0 && <p className="muted">Cargando trazabilidad...</p>}
      {rows.map((item) => (
        <div className="history-item" key={item.id}>
          <span className="history-dot" />
          <div>
            <strong>{item.from_status || "inicio"} a {item.to_status}</strong>
            <span>{item.changed_by_name} - {new Date(item.created_at).toLocaleString()}</span>
            {item.note && <small>{item.note}</small>}
          </div>
        </div>
      ))}
    </div>
  );
}

function Inventory({ user }) {
  const [parts, setParts] = useState([]);
  const [providers, setProviders] = useState([]);
  const [partForm, setPartForm] = useState({ code: "", name: "", description: "", stock: 0, min_stock: 0, provider_id: "" });
  const [providerForm, setProviderForm] = useState({ name: "", contact_name: "", phone: "", email: "", address: "" });
  const canManage = user.role === "admin" || user.role === "almacen";

  async function load() {
    const [partData, providerData] = await Promise.all([api("/parts"), api("/providers")]);
    setParts(partData);
    setProviders(providerData);
  }

  useEffect(() => {
    load();
  }, []);

  async function createProvider(event) {
    event.preventDefault();
    await api("/providers", { method: "POST", body: JSON.stringify(providerForm) });
    setProviderForm({ name: "", contact_name: "", phone: "", email: "", address: "" });
    load();
  }

  async function createPart(event) {
    event.preventDefault();
    await api("/parts", { method: "POST", body: JSON.stringify(partForm) });
    setPartForm({ code: "", name: "", description: "", stock: 0, min_stock: 0, provider_id: "" });
    load();
  }

  return (
    <section className="stack">
      {canManage && (
        <div className="grid-two">
          <section className="panel">
            <h3>Agregar repuesto</h3>
            <form className="form-grid" onSubmit={createPart}>
              <input required placeholder="Codigo" value={partForm.code} onChange={(e) => setPartForm({ ...partForm, code: e.target.value })} />
              <input required placeholder="Nombre" value={partForm.name} onChange={(e) => setPartForm({ ...partForm, name: e.target.value })} />
              <input placeholder="Descripcion" value={partForm.description} onChange={(e) => setPartForm({ ...partForm, description: e.target.value })} />
              <input type="number" placeholder="Stock" value={partForm.stock} onChange={(e) => setPartForm({ ...partForm, stock: Number(e.target.value) })} />
              <input type="number" placeholder="Stock minimo" value={partForm.min_stock} onChange={(e) => setPartForm({ ...partForm, min_stock: Number(e.target.value) })} />
              <select value={partForm.provider_id} onChange={(e) => setPartForm({ ...partForm, provider_id: e.target.value })}>
                <option value="">Proveedor</option>
                {providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}
              </select>
              <button>Guardar repuesto</button>
            </form>
          </section>

          <section className="panel">
            <h3>Agregar proveedor</h3>
            <form className="form-grid" onSubmit={createProvider}>
              <input required placeholder="Nombre" value={providerForm.name} onChange={(e) => setProviderForm({ ...providerForm, name: e.target.value })} />
              <input placeholder="Contacto" value={providerForm.contact_name} onChange={(e) => setProviderForm({ ...providerForm, contact_name: e.target.value })} />
              <input placeholder="Telefono" value={providerForm.phone} onChange={(e) => setProviderForm({ ...providerForm, phone: e.target.value })} />
              <input placeholder="Correo" value={providerForm.email} onChange={(e) => setProviderForm({ ...providerForm, email: e.target.value })} />
              <input placeholder="Direccion" value={providerForm.address} onChange={(e) => setProviderForm({ ...providerForm, address: e.target.value })} />
              <button>Guardar proveedor</button>
            </form>
          </section>
        </div>
      )}

      <DataBlock title="Inventario disponible" rows={parts.map((part) => [`${part.code} - ${part.name}`, `${part.stock} unidades | ${part.provider_name || "Sin proveedor"}`])} />
    </section>
  );
}

function Users() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "tecnico" });

  async function load() {
    try {
      setLoading(true);
      setError("");
      setUsers(await api("/users"));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function updateUser(id, role, active) {
    try {
      await api(`/users/${id}`, { method: "PATCH", body: JSON.stringify({ role, active }) });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createUser(event) {
    event.preventDefault();
    try {
      setError("");
      await api("/users", { method: "POST", body: JSON.stringify(form) });
      setForm({ name: "", email: "", password: "", role: "tecnico" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="stack">
      <section className="panel">
        <h3>Crear usuario</h3>
        <form className="inline-form users-form" onSubmit={createUser}>
          <input required placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input required placeholder="Correo" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input required placeholder="Clave" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="tecnico">Tecnico</option>
            <option value="almacen">Almacen</option>
            <option value="admin">Administrador</option>
          </select>
          <button>Guardar</button>
        </form>
      </section>

      <section className="panel">
        <h3>Gestion de usuarios y roles</h3>
        {error && <p className="error">{error}</p>}
        {loading && <p className="muted">Cargando usuarios...</p>}
        {!loading && users.length === 0 && !error && <p className="muted">No hay usuarios registrados.</p>}
        <div className="table-list">
          {users.map((user) => (
            <div className="request-row" key={user.id}>
              <div>
                <strong>{user.name}</strong>
                <span>{user.email}</span>
              </div>
              <div className="right-actions">
                <select value={user.role} onChange={(e) => updateUser(user.id, e.target.value, user.active)}>
                  <option value="tecnico">Tecnico</option>
                  <option value="almacen">Almacen</option>
                  <option value="admin">Administrador</option>
                </select>
                <button className="ghost" onClick={() => updateUser(user.id, user.role, !user.active)}>
                  {user.active ? "Desactivar" : "Activar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
