import { Router } from "express";
import bcrypt from "bcryptjs";
import { query } from "../db.js";
import { allowRoles, requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth, allowRoles("admin"));

router.get("/", async (_req, res, next) => {
  try {
    const result = await query(
      "select id, name, email, role, active, created_at from users order by created_at desc"
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await query(
      `insert into users (name, email, password_hash, role)
       values ($1, $2, $3, $4)
       returning id, name, email, role, active, created_at`,
      [name, email.toLowerCase(), passwordHash, role]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const { role, active } = req.body;
    const result = await query(
      `update users
       set role = coalesce($1, role), active = coalesce($2, active)
       where id = $3
       returning id, name, email, role, active, created_at`,
      [role, active, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
