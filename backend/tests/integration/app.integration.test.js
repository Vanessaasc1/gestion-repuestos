import request from "supertest";
import { createApp } from "../../src/app.js";

const app = createApp();

describe("API integration tests", () => {
  test("GET /api/health returns service status", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      service: "repuestos-backend"
    });
  });

  test("GET /api/docs.json returns OpenAPI document", async () => {
    const response = await request(app).get("/api/docs.json");

    expect(response.status).toBe(200);
    expect(response.body.openapi).toBe("3.0.0");
    expect(response.body.info.title).toContain("Repuestos");
  });

  test("GET /api/dashboard rejects requests without token", async () => {
    const response = await request(app).get("/api/dashboard");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Token no enviado");
  });
});
