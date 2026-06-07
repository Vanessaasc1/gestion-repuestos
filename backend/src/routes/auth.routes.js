import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
  );
}

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, role = "tecnico" } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Nombre, correo y clave son obligatorios" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await query(
      `insert into users (name, email, password_hash, role)
       values ($1, $2, $3, $4)
       returning id, name, email, role, active, created_at`,
      [name, email.toLowerCase(), passwordHash, role]
    );

    const user = result.rows[0];
    res.status(201).json({ user, token: signToken(user) });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ message: "El correo ya esta registrado" });
    }
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await query(
      "select id, name, email, password_hash, role, active from users where email = $1",
      [email?.toLowerCase()]
    );

    const user = result.rows[0];
    const validPassword = user && (await bcrypt.compare(password || "", user.password_hash));

    if (!user || !validPassword || !user.active) {
      return res.status(401).json({ message: "Credenciales invalidas" });
    }

    delete user.password_hash;
    res.json({ user, token: signToken(user) });
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

export default router;
