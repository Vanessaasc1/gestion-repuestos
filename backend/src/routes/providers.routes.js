import { Router } from "express";
import { query } from "../db.js";
import { allowRoles, requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (_req, res, next) => {
  try {
    const result = await query("select * from providers order by name");
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post("/", allowRoles("admin", "almacen"), async (req, res, next) => {
  try {
    const { name, contact_name, phone, email, address } = req.body;
    const result = await query(
      `insert into providers (name, contact_name, phone, email, address)
       values ($1, $2, $3, $4, $5)
       returning *`,
      [name, contact_name, phone, email, address]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
