import { Router } from "express";
import { query, pool } from "../db.js";
import { allowRoles, requireAuth } from "../middleware/auth.js";

const router = Router();

const statusList = ["pendiente", "aprobada", "rechazada", "en_proveedor", "entregada", "cerrada"];

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const { status, userId, from, to } = req.query;
    const values = [];
    const where = [];

    if (req.user.role === "tecnico") {
      values.push(req.user.id);
      where.push(`r.user_id = $${values.length}`);
    } else if (userId) {
      values.push(userId);
      where.push(`r.user_id = $${values.length}`);
    }

    if (status) {
      values.push(status);
      where.push(`r.status = $${values.length}`);
    }

    if (from) {
      values.push(from);
      where.push(`r.created_at::date >= $${values.length}`);
    }

    if (to) {
      values.push(to);
      where.push(`r.created_at::date <= $${values.length}`);
    }

    const result = await query(
      `select r.*, u.name as user_name, p.name as part_name, p.code as part_code,
              pr.name as provider_name
       from requests r
       join users u on u.id = r.user_id
       join parts p on p.id = r.part_id
       left join providers pr on pr.id = r.provider_id
       ${where.length ? `where ${where.join(" and ")}` : ""}
       order by r.created_at desc`,
      values
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get("/:id/history", async (req, res, next) => {
  try {
    const result = await query(
      `select h.*, u.name as changed_by_name
       from request_history h
       join users u on u.id = h.changed_by
       where h.request_id = $1
       order by h.created_at asc`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post("/", allowRoles("tecnico", "admin"), async (req, res, next) => {
  const client = await pool.connect();

  try {
    const { part_id, quantity, justification } = req.body;
    await client.query("begin");

    const created = await client.query(
      `insert into requests (user_id, part_id, quantity, justification, status)
       values ($1, $2, $3, $4, 'pendiente')
       returning *`,
      [req.user.id, part_id, quantity, justification]
    );

    await client.query(
      `insert into request_history (request_id, from_status, to_status, changed_by, note)
       values ($1, null, 'pendiente', $2, 'Solicitud registrada')`,
      [created.rows[0].id, req.user.id]
    );

    await client.query("commit");
    res.status(201).json(created.rows[0]);
  } catch (error) {
    await client.query("rollback");
    next(error);
  } finally {
    client.release();
  }
});

router.patch("/:id/status", allowRoles("admin", "almacen"), async (req, res, next) => {
  const client = await pool.connect();

  try {
    const { status, note, provider_id } = req.body;

    if (!statusList.includes(status)) {
      return res.status(400).json({ message: "Estado no permitido" });
    }

    await client.query("begin");

    const current = await client.query("select * from requests where id = $1 for update", [req.params.id]);
    if (!current.rows[0]) {
      await client.query("rollback");
      return res.status(404).json({ message: "Solicitud no encontrada" });
    }

    const updated = await client.query(
      `update requests
       set status = $1,
           provider_id = coalesce($2, provider_id),
           updated_at = now()
       where id = $3
       returning *`,
      [status, provider_id || null, req.params.id]
    );

    await client.query(
      `insert into request_history (request_id, from_status, to_status, changed_by, note)
       values ($1, $2, $3, $4, $5)`,
      [req.params.id, current.rows[0].status, status, req.user.id, note || "Estado actualizado"]
    );

    if (status === "entregada") {
      await client.query(
        `update parts
         set stock = greatest(stock - $1, 0), updated_at = now()
         where id = $2`,
        [current.rows[0].quantity, current.rows[0].part_id]
      );
    }

    await client.query("commit");
    res.json(updated.rows[0]);
  } catch (error) {
    await client.query("rollback");
    next(error);
  } finally {
    client.release();
  }
});

export default router;
