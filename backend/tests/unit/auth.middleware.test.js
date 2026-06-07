import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import { allowRoles, requireAuth } from "../../src/middleware/auth.js";

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

describe("auth middleware", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret";
  });

  test("requireAuth rejects requests without bearer token", () => {
    const req = { headers: {} };
    const res = createResponse();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Token no enviado");
    expect(next).not.toHaveBeenCalled();
  });

  test("requireAuth accepts a valid JWT", () => {
    const token = jwt.sign({ id: 1, role: "admin" }, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createResponse();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(req.user.role).toBe("admin");
    expect(next).toHaveBeenCalledTimes(1);
  });

  test("requireAuth rejects an invalid JWT", () => {
    const req = { headers: { authorization: "Bearer token-invalido" } };
    const res = createResponse();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Sesion invalida o expirada");
    expect(next).not.toHaveBeenCalled();
  });

  test("allowRoles rejects users without permission", () => {
    const req = { user: { role: "tecnico" } };
    const res = createResponse();
    const next = jest.fn();

    allowRoles("admin")(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe("No tiene permisos para esta accion");
    expect(next).not.toHaveBeenCalled();
  });

  test("allowRoles accepts users with permission", () => {
    const req = { user: { role: "admin" } };
    const res = createResponse();
    const next = jest.fn();

    allowRoles("admin", "almacen")(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
  });
});
