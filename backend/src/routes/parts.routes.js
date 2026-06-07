import { Router } from "express";
import { query } from "../db.js";
import { allowRoles, requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (_req, res, next) => {
  try {
    const result = await query(
      `select p.*, pr.name as provider_name
       from parts p
       left join providers pr on pr.id = p.provider_id
       order by p.name`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post("/", allowRoles("admin", "almacen"), async (req, res, next) => {
  try {
    const { code, name, description, stock, min_stock, provider_id } = req.body;
    const result = await query(
      `insert into parts (code, name, description, stock, min_stock, provider_id)
       values ($1, $2, $3, $4, $5, $6)
       returning *`,
      [code, name, description, stock || 0, min_stock || 0, provider_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", allowRoles("admin", "almacen"), async (req, res, next) => {
  try {
    const { stock, min_stock, provider_id } = req.body;
    const result = await query(
      `update parts
       set stock = coalesce($1, stock),
           min_stock = coalesce($2, min_stock),
           provider_id = coalesce($3, provider_id),
           updated_at = now()
       where id = $4
       returning *`,
      [stock, min_stock, provider_id, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
