import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/users.routes.js";
import partRoutes from "./routes/parts.routes.js";
import providerRoutes from "./routes/providers.routes.js";
import requestRoutes from "./routes/requests.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import { swaggerDocument } from "./swagger.js";

/**
 * Crea y configura la aplicacion Express usada por la API.
 *
 * Esta funcion esta separada de `server.js` para reutilizar la misma app en
 * pruebas automatizadas sin abrir un puerto de red.
 *
 * @returns {import("express").Express} Aplicacion Express configurada.
 */
export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "repuestos-backend" });
  });

  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.get("/api/docs.json", (_req, res) => {
    res.json(swaggerDocument);
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/parts", partRoutes);
  app.use("/api/providers", providerRoutes);
  app.use("/api/requests", requestRoutes);
  app.use("/api/dashboard", dashboardRoutes);

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(err.status || 500).json({
      message: err.message || "Error interno del servidor"
    });
  });

  return app;
}
