import { jest } from "@jest/globals";
import request from "supertest";
import jwt from "jsonwebtoken";

const queryMock = jest.fn();
const clientMock = {
  query: jest.fn(),
  release: jest.fn()
};
const poolMock = {
  connect: jest.fn()
};

jest.unstable_mockModule("../../src/db.js", () => ({
  query: queryMock,
  pool: poolMock
}));

const { createApp } = await import("../../src/app.js");

const app = createApp();

function token(role = "admin") {
  return jwt.sign(
    { id: 1, name: "Test User", email: "test@test.com", role },
    process.env.JWT_SECRET
  );
}

describe("route integration tests with database mock", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret";
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    queryMock.mockReset();
    clientMock.query.mockReset();
    clientMock.release.mockReset();
    poolMock.connect.mockReset();
    poolMock.connect.mockResolvedValue(clientMock);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("register creates a new user", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ id: 1, name: "Ana", email: "ana@test.com", role: "tecnico", active: true }]
    });

    const response = await request(app)
      .post("/api/auth/register")
      .send({ name: "Ana", email: "ana@test.com", password: "Clave123", role: "tecnico" });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe("ana@test.com");
    expect(response.body.token).toBeTruthy();
  });

  test("register validates required fields", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({ email: "ana@test.com" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Nombre, correo y clave son obligatorios");
  });

  test("register rejects duplicated email", async () => {
    queryMock.mockRejectedValueOnce({ code: "23505" });

    const response = await request(app)
      .post("/api/auth/register")
      .send({ name: "Ana", email: "ana@test.com", password: "Clave123" });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe("El correo ya esta registrado");
  });

  test("login returns token with valid credentials", async () => {
    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.default.hash("Clave123", 10);
    queryMock.mockResolvedValueOnce({
      rows: [{
        id: 1,
        name: "Admin",
        email: "admin@test.com",
        password_hash: passwordHash,
        role: "admin",
        active: true
      }]
    });

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@test.com", password: "Clave123" });

    expect(response.status).toBe(200);
    expect(response.body.user.password_hash).toBeUndefined();
    expect(response.body.token).toBeTruthy();
  });

  test("login rejects invalid credentials", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "no@test.com", password: "mala" });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Credenciales invalidas");
  });

  test("me returns authenticated user from token", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token("admin")}`);

    expect(response.status).toBe(200);
    expect(response.body.user.role).toBe("admin");
  });

  test("admin can list users", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ id: 1, name: "Admin", email: "admin@test.com", role: "admin", active: true }]
    });

    const response = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${token("admin")}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
  });

  test("admin can create users", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ id: 2, name: "Ana", email: "ana@test.com", role: "almacen", active: true }]
    });

    const response = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${token("admin")}`)
      .send({ name: "Ana", email: "ana@test.com", password: "Clave123", role: "almacen" });

    expect(response.status).toBe(201);
    expect(response.body.role).toBe("almacen");
  });

  test("admin can update a user role", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ id: 2, name: "Ana", email: "ana@test.com", role: "almacen", active: true }]
    });

    const response = await request(app)
      .patch("/api/users/2")
      .set("Authorization", `Bearer ${token("admin")}`)
      .send({ role: "almacen", active: true });

    expect(response.status).toBe(200);
    expect(response.body.role).toBe("almacen");
  });

  test("parts can be listed", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ id: 1, code: "RP-001", name: "Filtro", stock: 5 }]
    });

    const response = await request(app)
      .get("/api/parts")
      .set("Authorization", `Bearer ${token("tecnico")}`);

    expect(response.status).toBe(200);
    expect(response.body[0].code).toBe("RP-001");
  });

  test("warehouse can create a part", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ id: 1, code: "RP-009", name: "Sensor", stock: 3 }]
    });

    const response = await request(app)
      .post("/api/parts")
      .set("Authorization", `Bearer ${token("almacen")}`)
      .send({ code: "RP-009", name: "Sensor", stock: 3, min_stock: 1 });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe("Sensor");
  });

  test("warehouse can create a part with default values", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ id: 2, code: "RP-010", name: "Valvula", stock: 0, min_stock: 0, provider_id: null }]
    });

    const response = await request(app)
      .post("/api/parts")
      .set("Authorization", `Bearer ${token("almacen")}`)
      .send({ code: "RP-010", name: "Valvula" });

    expect(response.status).toBe(201);
    expect(response.body.stock).toBe(0);
  });

  test("warehouse can update a part", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ id: 1, code: "RP-009", name: "Sensor", stock: 8, min_stock: 2 }]
    });

    const response = await request(app)
      .patch("/api/parts/1")
      .set("Authorization", `Bearer ${token("almacen")}`)
      .send({ stock: 8, min_stock: 2 });

    expect(response.status).toBe(200);
    expect(response.body.stock).toBe(8);
  });

  test("providers can be listed", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ id: 1, name: "Proveedor Local" }]
    });

    const response = await request(app)
      .get("/api/providers")
      .set("Authorization", `Bearer ${token("admin")}`);

    expect(response.status).toBe(200);
    expect(response.body[0].name).toBe("Proveedor Local");
  });

  test("warehouse can create a provider", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ id: 1, name: "Proveedor Local", phone: "3001234567" }]
    });

    const response = await request(app)
      .post("/api/providers")
      .set("Authorization", `Bearer ${token("almacen")}`)
      .send({ name: "Proveedor Local", phone: "3001234567" });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe("Proveedor Local");
  });

  test("dashboard returns summary data", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ total: 2 }] })
      .mockResolvedValueOnce({ rows: [{ status: "pendiente", total: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, code: "RP-002", stock: 1, min_stock: 3 }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, status: "pendiente", part_name: "Correa" }] });

    const response = await request(app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${token("admin")}`);

    expect(response.status).toBe(200);
    expect(response.body.totalRequests).toBe(2);
    expect(response.body.lowStock).toHaveLength(1);
  });

  test("dashboard filters data for technician", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ total: 1 }] })
      .mockResolvedValueOnce({ rows: [{ status: "pendiente", total: 1 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 1, status: "pendiente", part_name: "Filtro" }] });

    const response = await request(app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${token("tecnico")}`);

    expect(response.status).toBe(200);
    expect(response.body.totalRequests).toBe(1);
    expect(queryMock).toHaveBeenCalledWith(expect.stringContaining("where user_id = $1"), [1]);
  });

  test("requests can be filtered by status", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ id: 1, status: "pendiente", part_name: "Filtro" }]
    });

    const response = await request(app)
      .get("/api/requests?status=pendiente")
      .set("Authorization", `Bearer ${token("admin")}`);

    expect(response.status).toBe(200);
    expect(response.body[0].status).toBe("pendiente");
  });

  test("admin can list requests without filters", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ id: 2, status: "aprobada", part_name: "Rodamiento" }]
    });

    const response = await request(app)
      .get("/api/requests")
      .set("Authorization", `Bearer ${token("admin")}`);

    expect(response.status).toBe(200);
    expect(response.body[0].status).toBe("aprobada");
  });

  test("technician only lists own requests", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ id: 1, user_id: 1, status: "pendiente", part_name: "Filtro" }]
    });

    const response = await request(app)
      .get("/api/requests?from=2026-01-01&to=2026-12-31")
      .set("Authorization", `Bearer ${token("tecnico")}`);

    expect(response.status).toBe(200);
    expect(queryMock).toHaveBeenCalledWith(expect.stringContaining("r.user_id"), expect.any(Array));
  });

  test("admin can filter requests by user", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ id: 3, user_id: 2, status: "aprobada", part_name: "Correa" }]
    });

    const response = await request(app)
      .get("/api/requests?userId=2")
      .set("Authorization", `Bearer ${token("admin")}`);

    expect(response.status).toBe(200);
    expect(response.body[0].user_id).toBe(2);
  });

  test("technician can create a request", async () => {
    clientMock.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ id: 1, status: "pendiente", part_id: 1, quantity: 2 }] })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    const response = await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${token("tecnico")}`)
      .send({ part_id: 1, quantity: 2, justification: "Mantenimiento" });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe("pendiente");
    expect(clientMock.release).toHaveBeenCalled();
  });

  test("request creation rolls back on database error", async () => {
    clientMock.query
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error("db error"))
      .mockResolvedValueOnce({});

    const response = await request(app)
      .post("/api/requests")
      .set("Authorization", `Bearer ${token("tecnico")}`)
      .send({ part_id: 1, quantity: 2, justification: "Mantenimiento" });

    expect(response.status).toBe(500);
    expect(clientMock.release).toHaveBeenCalled();
  });

  test("request history can be listed", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ id: 1, from_status: "pendiente", to_status: "aprobada", changed_by_name: "Admin" }]
    });

    const response = await request(app)
      .get("/api/requests/1/history")
      .set("Authorization", `Bearer ${token("admin")}`);

    expect(response.status).toBe(200);
    expect(response.body[0].to_status).toBe("aprobada");
  });

  test("route errors are handled by error middleware", async () => {
    queryMock.mockRejectedValueOnce(new Error("db error"));

    const response = await request(app)
      .get("/api/providers")
      .set("Authorization", `Bearer ${token("admin")}`);

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("db error");
  });

  test("warehouse can update request status", async () => {
    clientMock.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ id: 1, status: "pendiente", quantity: 2, part_id: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, status: "aprobada" }] })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    const response = await request(app)
      .patch("/api/requests/1/status")
      .set("Authorization", `Bearer ${token("almacen")}`)
      .send({ status: "aprobada", note: "Aprobada por almacen" });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("aprobada");
  });

  test("request status rejects invalid status", async () => {
    const response = await request(app)
      .patch("/api/requests/1/status")
      .set("Authorization", `Bearer ${token("almacen")}`)
      .send({ status: "estado_malo" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Estado no permitido");
  });

  test("request status returns not found", async () => {
    clientMock.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({});

    const response = await request(app)
      .patch("/api/requests/999/status")
      .set("Authorization", `Bearer ${token("almacen")}`)
      .send({ status: "aprobada" });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Solicitud no encontrada");
  });

  test("delivered status discounts stock", async () => {
    clientMock.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ id: 1, status: "aprobada", quantity: 2, part_id: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, status: "entregada" }] })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    const response = await request(app)
      .patch("/api/requests/1/status")
      .set("Authorization", `Bearer ${token("almacen")}`)
      .send({ status: "entregada", note: "Entregado" });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("entregada");
    expect(clientMock.query).toHaveBeenCalledWith(expect.stringContaining("update parts"), [2, 1]);
  });
});
