import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/users.routes.js";
import partRoutes from "./routes/parts.routes.js";
import providerRoutes from "./routes/providers.routes.js";
import requestRoutes from "./routes/requests.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "repuestos-backend" });
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

app.listen(port, () => {
  console.log(`API escuchando en http://localhost:${port}`);
});
